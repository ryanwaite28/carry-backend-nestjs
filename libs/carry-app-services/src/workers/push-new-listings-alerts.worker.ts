import { isMainThread, parentPort } from 'worker_threads';

import * as moment from 'moment';
import { sequelizeInst } from '../models/_def.model';
import { QueryTypes } from 'sequelize';
import { ExpoPushNotificationsService } from '../services/expo-notifications.service';
import { LOGGER } from '../utils/logger.utils';
import { ListingsAlertsLastPushed } from '../models/carry.model';
import { dateTimeTransform } from '../utils/carry.chamber';



// GET all the listings alerts for deliveries WHERE created some time ago AND matches alert locations
const useQuery = `
SELECT 
  carry_user_new_listings_alerts.user_id, carry_user_new_listings_alerts.label, 
  carry_deliveries.to_city, carry_deliveries.to_state, 
  carry_deliveries.from_city, carry_deliveries.from_state,            
  carry_users.firstname, carry_users.lastname,
  Count(*) as new_deliveries   
FROM
  carry_user_new_listings_alerts
JOIN
  carry_deliveries
ON 
  carry_user_new_listings_alerts.from_city LIKE CONCAT('%', carry_deliveries.from_city, '%') AND          
  carry_user_new_listings_alerts.from_state LIKE CONCAT('%', carry_deliveries.from_state, '%')  AND           
  carry_user_new_listings_alerts.to_city LIKE CONCAT('%', carry_deliveries.to_city, '%') AND      
  carry_user_new_listings_alerts.to_state LIKE CONCAT('%', carry_deliveries.to_state, '%')
JOIN 
  carry_users
ON 
  carry_user_new_listings_alerts.user_id = carry_users.id
WHERE
  carry_deliveries.created_at >= :date
GROUP BY
  carry_user_new_listings_alerts.user_id, carry_user_new_listings_alerts.label, 
  carry_deliveries.to_city, carry_deliveries.to_state, 
  carry_deliveries.from_city, carry_deliveries.from_state,            
  carry_users.firstname, carry_users.lastname
`;


if (!isMainThread) {
  const hourMS = 1000 * 60 * 60 * 1;
  const minutes20 = 1000 * 60 * 20;
  
  let runCount = 1;
  
  const runFn = async () => {
    const start = Date.now();
    parentPort.postMessage(`running job to push alerts; run ${runCount}, start ${start}, time ${dateTimeTransform(new Date())}`);
    
    const lastRuns = await ListingsAlertsLastPushed.findAll({ order: [['id', 'DESC']], limit: 1 });
    const lastRun = lastRuns[0];
    if (lastRun && Math.abs(moment(new Date()).diff(lastRun.dataValues.created_at, 'hours')) < 1) {
      parentPort.postMessage(`last job ran within 1 hour ago (at ${lastRun.dataValues.created_at}); trying again in 20 minutes...`);
      return setTimeout(runFn, minutes20);
    }

    const past20MinutesAgo = moment(new Date()).subtract(20, 'minutes').toDate();
    const useQueryFormatted = useQuery.replace(/[\n\s\t]+/g, ' ');

    const results: any[] = await sequelizeInst.query(useQueryFormatted, { replacements: { date: past20MinutesAgo }, type: QueryTypes.SELECT });
    parentPort.postMessage({ message: `results for alerts to push: ${results.length}`, results });

    for (const alert of results) {
      const pushMessageObj = {
        user_id: alert.user_id,
        message: `Hi ${alert.firstname}, New delivery listings were created from ${alert.from_city}, ${alert.from_state} going to ${alert.to_city}, ${alert.to_state}. Log in and claim these jobs!`,
      };
      LOGGER.info(`pushing alert:`, { pushMessageObj });
      parentPort.postMessage(pushMessageObj);
      ExpoPushNotificationsService.sendUserPushNotification(pushMessageObj);
    }

    const end = Date.now();
    const duration = (end - start) / 1000;
    parentPort.postMessage(`notifications pushed; recording last run timestamp; ${end}, ${duration}`);

    // record activity timestamp
    const newLatestRunModel = await ListingsAlertsLastPushed.create({});
    parentPort.postMessage(newLatestRunModel.dataValues);

    parentPort.postMessage(`recorded last run, starting next batch in 1 hour...`);
    runCount++;
    setTimeout(runFn, hourMS);

  };

  runFn();

}
