import {
  Op,
} from 'sequelize';
import { Messages, Messagings } from '../models/carry.model';
import { PlainObject } from '../interfaces/common.interface';

export async function get_user_unread_personal_messages_count(you_id: number) {
  const messagings_models = await Messagings.findAll({
    where: {
      [Op.or]: [
        { user_id: you_id },
        { sender_id: you_id },
      ]
    }
  });

  let count = 0;

  for (const messaging of messagings_models) {
    const messagingObj: PlainObject = messaging.toJSON();
    const other_user_id = messagingObj.sender_id === you_id
      ? messagingObj.user_id
      : messagingObj.sender_id;
    const unread_messages_count = await Messages.count({
      where: {
        from_id: other_user_id,
        to_id: you_id,
        opened: false
      }
    });
    count = count + unread_messages_count;
  }

  return count;
}