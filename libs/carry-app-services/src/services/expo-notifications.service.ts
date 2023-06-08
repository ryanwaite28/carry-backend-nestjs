// https://github.com/expo/expo-server-sdk-node

import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';
import { PlainObject } from '../interfaces/common.interface';
import { get_user_expo_devices } from '../repos/users.repo';
import { UserExpoDeviceEntity } from '../entities/carry.entity';

// Create a new Expo SDK client
// optionally providing an access token if you have enabled push security
const EXPO = new Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN });



export class ExpoPushNotificationsService {

  static async sendUserPushNotification(params: {
    user_id: number,
    message: string,
    data?: PlainObject,
  }) {
    try {
      const { user_id, message, data } = params;

      const expo_push_messages: ExpoPushMessage[] = [];

      const user_expo_devices: UserExpoDeviceEntity[] = await get_user_expo_devices(user_id);
      const expo_tokens: string[] = user_expo_devices.map(device => device.token);

      console.log({ user_id, expo_tokens });

      for (const expo_token of expo_tokens) {
        // Each push token looks like ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]

        // Check that all your push tokens appear to be valid Expo push tokens
        if (!Expo.isExpoPushToken(expo_token)) {
          console.error(`Push token ${expo_token} is not a valid Expo push token; user_id: ${user_id}`);
          continue;
        }

        // Construct a message (see https://docs.expo.io/push-notifications/sending-notifications/)
        const expo_push_message: ExpoPushMessage = {
          to: expo_token,
          sound: 'default',
          body: message,
          data: data || {},
        };
        expo_push_messages.push(expo_push_message);
      }

      const chunks: ExpoPushMessage[][] = EXPO.chunkPushNotifications(expo_push_messages);
      const tickets: ExpoPushTicket[] = [];
      // Send the chunks to the Expo push notification service. There are
      // different strategies you could use. A simple one is to send one chunk at a
      // time, which nicely spreads the load out over time:
      for (const chunk of chunks) {
        try {
          const ticketChunk: ExpoPushTicket[] = await EXPO.sendPushNotificationsAsync(chunk);
          console.log(ticketChunk);
          tickets.push(...ticketChunk);
          // NOTE: If a ticket contains an error code in ticket.details.error, you
          // must handle it appropriately. The error codes are listed in the Expo
          // documentation:
          // https://docs.expo.io/push-notifications/sending-notifications/#individual-errors
        }
        catch (error) {
          console.error(error);
        }
      }

      console.log(`push notes sent:`, { user_id, tickets, expo_push_messages, chunks });
    }
    catch (error) {
      console.log(`sendUserPushNotification error`);
      console.log(error);
    }
  }

}