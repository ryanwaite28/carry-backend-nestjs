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

    return notification;
  });
}

export async function get_user_unseen_notifications_count(you_id: number, last_seen: string | Date) {
  const count = await Notifications.count({
    where: { to_id: you_id, date_created: { [Op.gt]: last_seen } },
  });

  return count;
}