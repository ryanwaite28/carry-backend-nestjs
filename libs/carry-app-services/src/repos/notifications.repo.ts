import {
  fn,
  Op,
  WhereOptions,
  FindOptions,
  Includeable,
  Model,
  FindAttributeOptions,
  GroupOption,
  Order
} from 'sequelize';
import { PlainObject } from '../interfaces/common.interface';
import { validatePhone } from '../utils/validators.utils';
import { CommonSocketEventsHandler } from '../services/common.socket-event-handler';
import { populate_carry_notification_obj } from '../utils/carry.chamber';
import { ExpoPushNotificationsService } from '../services/expo-notifications.service';
import { Notifications } from '../models/carry.model';
import { send_sms } from '../utils/sms-client.utils';
import { HttpContextHolder } from '../middlewares/http-context.middleware';
import { create_api_key_webhook_event } from './users.repo';
import { ApiKeyEntity } from '../entities/carry.entity';
import * as Axios from 'axios';
import { LOGGER } from '../utils/logger.utils';
const axios = Axios.default;


export async function create_notification(
  params: {
    from_id: number;
    to_id: number;
    event: string;
    target_type: string;
    target_id: number;
  }
) {
  const new_notification_model = await Notifications.create(<any> params);
  return new_notification_model;
}

export async function create_notification_and_send(
  params: {
    from_id: number;
    to_id: number;
    event: string;
    target_type: string;
    target_id: number;
    to_phone?: string,
    send_mobile_push: boolean,
    extras_data?: PlainObject,
  }
) {
  return Notifications.create(<any> {
    from_id: params.from_id,
    to_id: params.to_id,
    event: params.event,
    target_type: params.target_type,
    target_id: params.target_id,
  })
  .then(async (notification_model) => {
    const notification = await populate_carry_notification_obj(notification_model);

    const event_data: any = {
      from_id: params.from_id,
      to_id: params.to_id,
      event: params.event,
      target_type: params.target_type,
      target_id: params.target_id,

      message: notification.message,
      notification,
    };
    
    if (params.extras_data) {
      Object.assign(event_data, params.extras_data);
    }
    
    CommonSocketEventsHandler.emitEventToUserSockets({
      user_id: params.to_id,
      event: params.event,
      event_data,
    });

    if (!!params.to_phone && validatePhone(params.to_phone)) {
      send_sms({
        to_phone_number: params.to_phone,
        message: notification.message,
      });
    }

    if (params.send_mobile_push) {
      ExpoPushNotificationsService.sendUserPushNotification({
        user_id: notification.to_id,
        message: notification.message!,
      });
    }

    const isApiRequest = HttpContextHolder.response?.locals['IS_API_REQUEST'];
    if (isApiRequest) {
      // send event to the api key's webhook
      const api_key: ApiKeyEntity | undefined = HttpContextHolder.response?.locals['API_KEY'];
      const webhook = !!api_key && api_key.webhook_endpoint;
      if (webhook) {
        LOGGER.info(`Sending webhook event...`, params);
        axios.post(webhook, {
          api_key: api_key.uuid,
          params
        })
        .then((response) => {
          LOGGER.info(`Webhook send successful:`, params);
          create_api_key_webhook_event({
            api_key_id: api_key.id,
            event: params.event,
            response_code: response.status,
            metadata: JSON.stringify(params)
          })
        })
        .catch((error: Axios.AxiosError) => {
          LOGGER.info(`Webhook send failed:`, params);
          create_api_key_webhook_event({
            api_key_id: api_key.id,
            event: params.event,
            response_code: error.status || -1,
            metadata: JSON.stringify(params)
          })
        })
      }
    }

    return notification;
  });
}

export async function get_user_unseen_notifications_count(you_id: number, last_seen: string | Date) {
  const count = await Notifications.count({
    where: { to_id: you_id, date_created: { [Op.gt]: last_seen } },
  });

  return count;
}