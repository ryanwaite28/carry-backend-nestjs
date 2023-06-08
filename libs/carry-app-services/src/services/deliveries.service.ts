import { fn } from 'sequelize';
import {
  CARRY_EVENT_TYPES,
  CARRY_NOTIFICATION_TARGET_TYPES,
  DeliveryDisputeSettlementOfferStatus,
  DeliveryDisputeStatus,
} from '../enums/carry.enum';

import {
  StripeActions,
  DeliveryDisputes,
  CarryUserProfileSettings,
  UserPaymentIntents,
  CarryUserRatings,
} from '../models/carry.model';
import {
  find_available_delivery_by_to_city_and_state,
  find_available_delivery_by_from_city_and_state,
  find_available_delivery,
  search_deliveries,
  browse_recent_deliveries,
  browse_featured_deliveries,
  browse_map_deliveries,
  get_delivery_by_id,
  create_delivery,
  delete_delivery,
  create_delivery_tracking_update,
  create_delivery_message,
  update_delivery,
  get_user_deliveries_count,
  get_user_delivering_completed_count,
  get_user_delivering_inprogress_count,
  set_delivery_carrier_location_requested,
  set_delivery_carrier_shared_location,
  set_delivery_carrier_lat_lng_location,
  get_delivery_carrier_location_request_pending,
  create_delivery_carrier_location_request,
  create_delivery_carrier_lat_lng_location_update,
  leave_delivery_customer_review,
  leave_delivery_carrier_review,
  get_user_delivering,
  get_user_deliverings_slim,
  get_user_deliverings_all_slim,
  get_user_deliveries_slim,
  get_user_deliverings,
  get_user_deliveries_all,
  get_user_deliveries,
  get_user_deliverings_all,
  reset_delivery,
  get_delivery_dispute_info_by_delivery_id,
  create_delivery_dispute,
  create_delivery_dispute_log,
  create_delivery_dispute_settlement_offer,
  update_delivery_dispute_settlement_offer_status,
  create_delivery_dispute_customer_service_message,
  get_user_dispute_messages_by_user_id_and_dispute_id,
  update_delivery_dispute,
  check_carrier_delivery_request,
  create_carrier_delivery_request,
  get_delivery_owner_by_delivery_id,
  get_carrier_delivery_requests_all,
  check_carrier_delivery_request_pending,
  update_carrier_delivery_request_status,
  get_carrier_requests_all,
  get_carrier_requests,
  get_carrier_delivery_requests,
  get_customer_ratings_stats,
  get_carrier_ratings_stats,
  get_customer_ratings_all,
  get_customer_ratings,
  get_carrier_ratings_all,
  get_carrier_ratings,
  check_delivery_carrier_was_near_pickup,
  check_delivery_carrier_was_near_dropoff,
  create_delivery_carrier_was_near_pickup,
  create_delivery_carrier_was_near_dropoff,
} from '../repos/deliveries.repo';
import {
  create_notification,
  create_notification_and_send,
} from '../repos/notifications.repo';
import {
  create_delivery_dispute_customer_support_message_required_props,
  create_delivery_dispute_log_required_props,
  create_delivery_dispute_required_props,
  create_delivery_dispute_settlement_required_props,
  create_delivery_required_props,
  create_delivery_tracking_update_required_props,
  deliveryme_user_settings_required_props,
  delivery_carrier_review_required_props,
  populate_carry_notification_obj,
  update_delivery_required_props,
} from '../utils/carry.chamber';
import { CommonSocketEventsHandler } from './common.socket-event-handler';
import { ExpoPushNotificationsService } from './expo-notifications.service';
import { GoogleService } from './google.service';
import { StripeService } from './stripe.service';
import { UtilsService } from './utils.service';
import { UploadedFile } from 'express-fileupload';
import {
  validateData,
  validateAndUploadImageFile,
  get_distance_haversine_distance,
} from '../utils/helpers.utils';
import { UsersService } from './users.service';
import Stripe from 'stripe';
import {  } from '../repos/_common.repo';
import * as moment from 'moment';
import { PlainObject, ServiceMethodAsyncResults, ServiceMethodResults } from '../interfaces/common.interface';
import { HttpStatusCode } from '../enums/http-status-codes.enum';
import { validatePhone } from '../utils/validators.utils';
import { send_sms } from '../utils/sms-client.utils';
import { STATUSES, STRIPE_ACTION_EVENTS, TRANSACTION_STATUS } from '../enums/common.enum';
import { AwsS3Service } from '../utils/s3.utils';
import { get_user_new_listings_alerts_by_where } from '../repos/users.repo';
import { LOGGER } from '../utils/logger.utils';
import { sendAwsEmail, sendAwsInternalEmail } from '../utils/ses.aws.utils';
import { HandlebarsEmailsService } from './emails.service';
import { minutesPast } from '../utils/date.utils';
import {
  DeliveryCarrierRequestEntity,
  DeliveryDisputeEntity,
  DeliveryDisputeSettlementOfferEntity,
  DeliveryEntity, UserEntity
} from '../entities/carry.entity';
import { CreateDeliveryDto, CreateDeliveryTrackingUpdateDto } from '../dto/deliveries.dto';




// enum of insurance amounts by as-of dates
enum DeliveryInsuranceAmounts {
  MAY_2023 = 10,
}

enum DeliveryUrgentAmounts {
  JUNE_2023 = 5,
}



export class DeliveriesService {

  static async find_available_delivery_by_from_city_and_state(
    city: string,
    state: string,
  ): ServiceMethodAsyncResults<DeliveryEntity> {
    const result: DeliveryEntity = await find_available_delivery_by_from_city_and_state(
      city,
      state,
    );

    const serviceMethodResults: ServiceMethodResults<DeliveryEntity> = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        data: result,
      },
    };
    return serviceMethodResults;
  }

  static async find_available_delivery_by_to_city_and_state(
    city: string,
    state: string,
  ): ServiceMethodAsyncResults<DeliveryEntity> {
    const result: DeliveryEntity = await find_available_delivery_by_to_city_and_state(
      city,
      state,
    );

    const serviceMethodResults: ServiceMethodResults<DeliveryEntity> = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        data: result,
      },
    };
    return serviceMethodResults;
  }

  static async find_available_delivery(options: {
    you_id: number;
    criteria: string;
    city: string;
    state: string;
  }): ServiceMethodAsyncResults<DeliveryEntity> {
    try {
      const { you_id, criteria, city, state } = options;
      const searchCriterias = [
        { label: 'From City', value: 'from-city' },
        { label: 'To City', value: 'to-city' },

        { label: 'From State', value: 'from-state' },
        { label: 'To State', value: 'to-state' },

        { label: 'From City in State', value: 'from-city-state' },
        { label: 'To City in State', value: 'to-city-state' },

        // { label: 'County in State', value: 'county-state' },
      ];
      const useWhere: any = {};

      switch (criteria) {
        case searchCriterias[0].value: {
          // from city
          useWhere.from_city = city;
          break;
        }
        case searchCriterias[1].value: {
          // to city
          useWhere.to_city = city;
          break;
        }

        case searchCriterias[2].value: {
          // from state
          useWhere.from_state = state;
          break;
        }
        case searchCriterias[3].value: {
          // to state
          useWhere.to_state = state;
          break;
        }

        case searchCriterias[4].value: {
          // from city-state
          useWhere.from_city = city;
          useWhere.from_state = state;
          break;
        }
        case searchCriterias[5].value: {
          // to city-state
          useWhere.to_city = city;
          useWhere.to_state = state;
          break;
        }

        default: {
          const serviceMethodResults: ServiceMethodResults = {
            status: HttpStatusCode.BAD_REQUEST,
            error: true,
            info: {
              message: `Unknown/Invalid criteria: ${criteria}`,
            },
          };
          return serviceMethodResults;
        }
      }

      const result = await find_available_delivery({
        you_id,
        where: useWhere,
      });

      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.OK,
        error: false,
        info: {
          data: result,
        },
      };
      return serviceMethodResults;
    }
    catch (e) {
      console.log(e);
      const serviceMethodResults: ServiceMethodResults<DeliveryEntity> = {
        status: HttpStatusCode.BAD_REQUEST,
        error: true,
        info: {
          message: `Could not find available delivery...`,
          data: e,
        },
      };
      return serviceMethodResults;
    }
  }

  static async search_deliveries(options: {
    you_id: number;
    from_city?: string;
    from_state?: string;
    to_city?: string;
    to_state?: string;
  }): ServiceMethodAsyncResults<DeliveryEntity[]> {
    const results = await search_deliveries(options);
    let serviceMethodResults: ServiceMethodResults;

    if (results) {
      serviceMethodResults = {
        status: HttpStatusCode.OK,
        error: false,
        info: {
          data: results,
        },
      };
    } else {
      serviceMethodResults = {
        status: HttpStatusCode.BAD_REQUEST,
        error: true,
        info: {
          message: `Could not parse search query.`,
        },
      };
    }

    return serviceMethodResults;
  }

  static async browse_recent_deliveries(params: {
    you_id: number;
    delivery_id?: number;
  }): ServiceMethodAsyncResults<DeliveryEntity[]> {
    const deliveries = await browse_recent_deliveries(
      params.you_id,
      params.delivery_id,
    );

    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        data: deliveries,
      },
    };
    return serviceMethodResults;
  }

  static async browse_featured_deliveries(params: {
    you_id: number;
    delivery_id?: number;
  }): ServiceMethodAsyncResults<DeliveryEntity[]> {
    const deliveries = await browse_featured_deliveries(
      params.you_id,
      params.delivery_id,
    );

    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        data: deliveries,
      },
    };
    return serviceMethodResults;
  }

  static async browse_map_deliveries(params: {
    you_id: number;
    swLat: number;
    swLng: number;
    neLat: number;
    neLng: number;
  }): ServiceMethodAsyncResults<DeliveryEntity[]> {
    if (!params) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.BAD_REQUEST,
        error: true,
        info: {
          message: `Query data/params not given.`,
          data: {},
        },
      };
      return serviceMethodResults;
    }

    if (!params.swLat) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.BAD_REQUEST,
        error: true,
        info: {
          message: `SouthWest Latitude not given.`,
          data: {},
        },
      };
      return serviceMethodResults;
    }
    if (!params.swLng) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.BAD_REQUEST,
        error: true,
        info: {
          message: `SouthWest Longitude not given.`,
          data: {},
        },
      };
      return serviceMethodResults;
    }
    if (!params.neLat) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.BAD_REQUEST,
        error: true,
        info: {
          message: `NorthEast Latitude not given.`,
          data: {},
        },
      };
      return serviceMethodResults;
    }
    if (!params.neLng) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.BAD_REQUEST,
        error: true,
        info: {
          message: `NorthEast Longitude not given.`,
          data: {},
        },
      };
      return serviceMethodResults;
    }

    const deliveries = await browse_map_deliveries(params);

    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        data: deliveries,
      },
    };
    return serviceMethodResults;
  }

  static async send_delivery_message(options: {
    you_id: number;
    delivery: DeliveryEntity;
    body: string;
    ignoreNotification?: boolean;
  }) {
    const { you_id, delivery, body, ignoreNotification } = options;

    const delivery_id = delivery.id;
    const owner_id = delivery.owner_id;
    const carrier_id = delivery.carrier_id!;

    if (you_id !== owner_id && you_id !== carrier_id) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.BAD_REQUEST,
        error: true,
        info: {
          message: `User is not involved with this delivery`,
        },
      };
      return serviceMethodResults;
    }

    if (!body || !body.trim()) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.BAD_REQUEST,
        error: true,
        info: {
          message: `Body cannot be empty`,
        },
      };
      return serviceMethodResults;
    }

    // create the new message
    const new_message = await create_delivery_message({
      body,
      delivery_id,
      user_id: you_id,
    });

    const message_response = `New message for delivery "${delivery.title}": ${body}`;

    if (!ignoreNotification) {
      const to_id = you_id === owner_id ? carrier_id : owner_id;

      ExpoPushNotificationsService.sendUserPushNotification({
        user_id: to_id,
        message: message_response,
        data: { delivery_id },
      });

      create_notification({
        from_id: you_id,
        to_id: to_id,
        event: CARRY_EVENT_TYPES.DELIVERY_NEW_MESSAGE,
        target_type: CARRY_NOTIFICATION_TARGET_TYPES.DELIVERY,
        target_id: delivery_id,
      }).then(async (notification_model) => {
        const notification = await populate_carry_notification_obj(
          notification_model,
        );

        const eventData = {
          delivery_id,
          event: CARRY_EVENT_TYPES.DELIVERY_NEW_MESSAGE,
          message: message_response,
          data: new_message,
          user_id: you_id,
          notification,
        };
        // const TO_ROOM = `${CARRY_EVENT_TYPES.TO_DELIVERY}:${delivery_id}`;
        // console.log({ TO_ROOM, eventData });
        // SocketsService.get_io().to(TO_ROOM).emit(TO_ROOM, eventData);

        CommonSocketEventsHandler.emitEventToUserSockets({
          user_id: to_id,
          event: CARRY_EVENT_TYPES.DELIVERY_NEW_MESSAGE,
          event_data: eventData,
        });

        const to_phone_number =
          to_id === delivery.owner_id
            ? delivery.owner?.phone
            : delivery.carrier?.phone;
        if (!!to_phone_number && validatePhone(to_phone_number)) {
          send_sms({
            to_phone_number,
            message: eventData.message,
          });
        }
      });
    }

    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        message: `Message sent successfully!`,
        data: new_message,
      },
    };
    return serviceMethodResults;
  }

  static async get_delivery_by_id(id: number) {
    const delivery = await get_delivery_by_id(id);

    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        data: delivery,
      },
    };
    return serviceMethodResults;
  }

  static async get_user_deliveries_all(user_id: number) {
    const resultsList = await get_user_deliveries_all(user_id);
    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        data: resultsList,
      },
    };
    return serviceMethodResults;
  }

  static async get_user_deliveries(user_id: number, delivery_id?: number) {
    const resultsList = await get_user_deliveries(user_id, delivery_id);
    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        data: resultsList,
      },
    };
    return serviceMethodResults;
  }

  static async get_user_deliverings_all(user_id: number) {
    const resultsList = await get_user_deliverings_all(user_id);
    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        data: resultsList,
      },
    };
    return serviceMethodResults;
  }

  static async get_user_deliverings(user_id: number, delivery_id?: number) {
    const resultsList = await get_user_deliverings(user_id, delivery_id);
    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        data: resultsList,
      },
    };
    return serviceMethodResults;
  }

  static async get_carrier_requests_all(user_id: number) {
    const resultsList = await get_carrier_requests_all(user_id);
    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        data: resultsList,
      },
    };
    return serviceMethodResults;
  }

  static async get_carrier_requests(user_id: number, carrier_request_id?: number) {
    const resultsList = await get_carrier_requests(user_id, carrier_request_id);
    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        data: resultsList,
      },
    };
    return serviceMethodResults;
  }

  static async get_user_deliveries_all_slim(user_id: number) {
    const resultsList = await get_user_deliveries_slim(user_id);
    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        data: resultsList,
      },
    };
    return serviceMethodResults;
  }

  static async get_user_deliveries_slim(user_id: number, delivery_id?: number) {
    const resultsList = await get_user_deliveries_slim(user_id, delivery_id);
    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        data: resultsList,
      },
    };
    return serviceMethodResults;
  }

  static async get_user_deliverings_all_slim(user_id: number) {
    const resultsList = await get_user_deliverings_all_slim(user_id);
    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        data: resultsList,
      },
    };
    return serviceMethodResults;
  }

  static async get_user_deliverings_slim(
    user_id: number,
    delivery_id?: number,
  ) {
    const resultsList = await get_user_deliverings_slim(user_id, delivery_id);
    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        data: resultsList,
      },
    };
    return serviceMethodResults;
  }

  static async get_user_delivering(you_id: number) {
    const resultsList = await get_user_delivering(you_id);
    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        data: resultsList,
      },
    };
    return serviceMethodResults;
  }

  static async create_delivery_and_charge(options: {
    you: UserEntity;
    data: any;
    insured: boolean,
    delivery_image?: UploadedFile;
  }) {
    console.log(`create delivery options:`, options);
    try {
      const { you, data, delivery_image } = options;
      const createObj: PlainObject = {
        owner_id: you.id,
      };

      // validate form
      const dataValidation = validateData({
        data,
        validators: create_delivery_required_props,
        mutateObj: createObj,
      });
      if (dataValidation.error) {
        return dataValidation;
      }

      // validate image
      const imageValidation = await AwsS3Service.uploadFile(delivery_image, {
        treatNotFoundAsError: false,
        mutateObj: createObj,
        validateAsImage: true,
        id_prop: 'item_image_id',
        link_prop: 'item_image_link',
      });
      if (imageValidation.error) {
        return imageValidation;
      }

      // make sure payment method belongs to user
      const userPaymentMethodsResults = await StripeService.payment_method_belongs_to_customer(
        you.stripe_customer_account_id,
        data.payment_method_id,
      );
      if (userPaymentMethodsResults.error) {
        const serviceMethodResults: ServiceMethodResults = {
          status: userPaymentMethodsResults.status,
          error: userPaymentMethodsResults.error,
          info: {
            message: userPaymentMethodsResults.message,
          },
        };
        return serviceMethodResults;
      }

      // all inputs validated
      console.log(`delivery createObj`, createObj);


      // try placing hold on customer's payment method for delivery listing
      let payment_intent: Stripe.PaymentIntent;

      const is_subscription_active: boolean = (
        await UsersService.is_subscription_active(you)
      ).info.data as boolean;
      const chargeFeeData = StripeService.add_on_stripe_processing_fee(
        createObj.payout + (options.insured ? DeliveryInsuranceAmounts.MAY_2023 : 0) + (createObj.urgent ? DeliveryUrgentAmounts.JUNE_2023 : 0),
        is_subscription_active,
      );

      try {
        // https://stripe.com/docs/payments/save-during-payment
        // https://stripe.com/docs/payments/place-a-hold-on-a-payment-method
        // https://stripe.com/docs/api/payment_intents/update
        payment_intent = await StripeService.stripe.paymentIntents.create({
          description: `${process.env.APP_NAME} - New delivery listing: ${createObj.title}`,
          amount: chargeFeeData.final_total,
          currency: 'usd',
          customer: you.stripe_customer_account_id,
          payment_method: data.payment_method_id,
          capture_method: 'manual', // place hold for now, will collect when listing is fulfilled
          off_session: true,
          confirm: true,
          receipt_email: you.email,
          metadata: {
            user_id: you.id,
            stripe_customer_account: you.stripe_customer_account_id,
          }
        });
      }
      catch (e) {
        console.log(e);
        const serviceMethodResults: ServiceMethodResults = {
          status: HttpStatusCode.BAD_REQUEST,
          error: true,
          info: {
            message: `Could not place hold on payment method`,
            error: e,
          },
        };
        return serviceMethodResults;
      }

      // hold was successful; create the delivery listing

      createObj.payment_intent_id = payment_intent.id;
      const new_delivery_model = await create_delivery(createObj as CreateDeliveryDto, DeliveryInsuranceAmounts.MAY_2023);

      // record the charge
      const payment_intent_action = await StripeActions.create({
        action_event: STRIPE_ACTION_EVENTS.PAYMENT_INTENT,
        action_id: payment_intent.id,
        action_metadata: null,
        target_type: CARRY_NOTIFICATION_TARGET_TYPES.DELIVERY,
        target_id: new_delivery_model.id,
        target_metadata: null,
        status: TRANSACTION_STATUS.COMPLETED,
      });

      // const charge_action = await StripeActions.create({
      //   action_event:                        STRIPE_ACTION_EVENTS.CHARGE,
      //   action_id:                           charge.id,
      //   action_metadata:                     null,
      //   micro_app:                           MODERN_APP_NAMES.CARRY,
      //   target_type:                         CARRY_NOTIFICATION_TARGET_TYPES.DELIVERY,
      //   target_id:                           new_delivery_model.id,
      //   target_metadata:                     null,
      //   status:                              TRANSACTION_STATUS.COMPLETED,
      // });

      // update payment intent metadata with delivery id
      payment_intent = await StripeService.stripe.paymentIntents.update(
        payment_intent.id,
        {
          metadata: {
            delivery_id: new_delivery_model.id,
            delivery_payout: new_delivery_model.payout,
            insured_amount: (options.insured ? DeliveryInsuranceAmounts.MAY_2023 : 0),
            urgent_amount: (createObj.urgent ? DeliveryUrgentAmounts.JUNE_2023 : 0),
            was_subscribed: is_subscription_active ? 'true' : 'false',
            insured: (!!options.insured).toString(),
            urgent: (createObj.urgent).toString(),
            timestamp: Date.now(),
          },
        },
      );

      // charge = await StripeService.stripe.charges.update(
      //   charge.id,
      //   { metadata: { delivery_id: new_delivery_model.id, was_subscribed: is_subscription_active ? 'true' : 'false' } }
      // );

      console.log(
        `Delivery created successfully. Delivery ID:`,
        new_delivery_model.id,
        {
          chargeFeeData,

          payment_intent,
          payment_intent_action: payment_intent_action.toJSON(),

          // charge,
          // charge_action: charge_action.toJSON(),
        },
      );

      // if urgent, sent out notification now
      if (createObj.urgent) {
        get_user_new_listings_alerts_by_where({
          from_city: createObj.from_city,
          from_state: createObj.from_state,
          to_city: createObj.to_city,
          to_state: createObj.to_state,
        })
        .then((alerts) => {
          alerts.forEach((alert) => {
            const pushMessageObj = {
              user_id: alert.user_id,
              message: `New URGENT delivery listing was created from ${alert.from_city}, ${alert.from_state} going to ${alert.to_city}, ${alert.to_state}. Log in and claim this job!`,
            };
            LOGGER.info(`pushing alert:`, { pushMessageObj });
            ExpoPushNotificationsService.sendUserPushNotification(pushMessageObj);
          });
        });
      }

      // return delivery object
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.OK,
        error: false,
        info: {
          message: `New Delivery Created!`,
          data: new_delivery_model,
        },
      };
      return serviceMethodResults;
    } 
    catch (e) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.INTERNAL_SERVER_ERROR,
        error: true,
        info: {
          message: `Could not create new delivery`,
          error: e,
        },
      };
      return serviceMethodResults;
    }
  }

  /**
   * @deprecated
   * @param options
   * @returns
   */
  static async create_delivery(options: {
    you: UserEntity;
    data: any;
    delivery_image?: UploadedFile;
  }) {
    try {
      const { you, data, delivery_image } = options;
      const createObj: PlainObject = {
        owner_id: you.id,
      };

      // validate inputs
      const dataValidation = validateData({
        data,
        validators: create_delivery_required_props,
        mutateObj: createObj,
      });
      if (dataValidation.error) {
        return dataValidation;
      }

      const imageValidation = await AwsS3Service.uploadFile(delivery_image, {
        treatNotFoundAsError: false,
        mutateObj: createObj,
        validateAsImage: true,
        id_prop: 'item_image_id',
        link_prop: 'item_image_link',
      });
      if (imageValidation.error) {
        return imageValidation;
      }

      // make sure payment method belongs to user
      const userPaymentMethodsResults =
        await StripeService.payment_method_belongs_to_customer(
          you.stripe_customer_account_id,
          data.payment_method_id,
        );
      if (userPaymentMethodsResults.error) {
        const serviceMethodResults: ServiceMethodResults = {
          status: userPaymentMethodsResults.status,
          error: userPaymentMethodsResults.error,
          info: {
            message: userPaymentMethodsResults.message,
          },
        };
        return serviceMethodResults;
      }

      // all inputs validated
      console.log(`createObj`, createObj);

      const new_delivery_model = await create_delivery(
        createObj as CreateDeliveryDto,
      );

      // return delivery object
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.OK,
        error: false,
        info: {
          message: `New Delivery Created!`,
          data: new_delivery_model,
        },
      };
      return serviceMethodResults;
    }
    catch (e) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.INTERNAL_SERVER_ERROR,
        error: true,
        info: {
          message: `Could not create new delivery`,
          error: e,
        },
      };
      return serviceMethodResults;
    }
  }

  static async update_delivery(options: {
    you: UserEntity;
    delivery: DeliveryEntity;
    data: any;
    delivery_image?: UploadedFile;
  }) {
    const { delivery, data, you, delivery_image } = options;

    if (delivery.carrier_id) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.BAD_REQUEST,
        error: true,
        info: {
          message: `Delivery cannot be updated while it is assigned to a carrier.`,
        },
      };
      return serviceMethodResults;
    }

    const updateObj: PlainObject = {};
    const dataValidation = validateData({
      data,
      validators: update_delivery_required_props,
      mutateObj: updateObj,
    });
    if (dataValidation.error) {
      return dataValidation;
    }

    const updates = await update_delivery(delivery.id, updateObj);

    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        message: `Delivery Updated!`,
        data: updates,
      },
    };
    return serviceMethodResults;
  }

  static async delete_delivery_and_refund(delivery: DeliveryEntity) {
    // const delivery_model = await get_delivery_by_id(delivery_id);

    if (!delivery) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.NOT_FOUND,
        error: true,
        info: {
          message: `Delivery not found.`,
        },
      };
      return serviceMethodResults;
    }

    if (!!delivery.carrier_id) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.BAD_REQUEST,
        error: true,
        info: {
          message: `Delivery cannot be deleted while it is in progress.`,
        },
      };
      return serviceMethodResults;
    }

    // try to release hold
    if (delivery.payment_intent_id) {
      const payment_intent = await StripeService.stripe.paymentIntents.retrieve(
        delivery.payment_intent_id,
      );

      console.log(`Releasing hold on:`, { delivery });
      try {
        const paymentIntentCancelResults = await StripeService.stripe.paymentIntents.cancel(payment_intent.id);
      } 
      catch (e) {
        console.log(e);
        const serviceMethodResults: ServiceMethodResults = {
          status: HttpStatusCode.INTERNAL_SERVER_ERROR,
          error: true,
          info: {
            message: `Could not release hold`,
            error: e,
          },
        };
        return serviceMethodResults;
      }
    }

    // for legacy logic/implementation
    else if (delivery.charge_id) {
      const charge = await StripeService.stripe.charges.retrieve(
        delivery.charge_id,
      );
      let refund: Stripe.Refund;

      const was_subscribed: boolean = charge.metadata['was_subscribed'] === 'true' ? true : false;

      const chargeFeeData = StripeService.add_on_stripe_processing_fee(
        delivery.payout,
        was_subscribed,
      );

      try {
        refund = await StripeService.stripe.refunds.create({
          charge: delivery.charge_id,
          amount: chargeFeeData.refund_amount,
        });

        // record the refund
        const refund_action = await StripeActions.create({
          action_event: STRIPE_ACTION_EVENTS.REFUND,
          action_id: refund.id,
          action_metadata: null,
          target_type: CARRY_NOTIFICATION_TARGET_TYPES.DELIVERY,
          target_id: delivery.id,
          target_metadata: null,
          status: TRANSACTION_STATUS.COMPLETED,
        });

        console.log(`refund issued and recorded successfully`, {
          refund_amount: chargeFeeData.refund_amount,
          refund_id: refund.id,
          refund_action_id: refund_action.get('id'),
        });
      } catch (e) {
        console.log(e);
        const serviceMethodResults: ServiceMethodResults = {
          status: HttpStatusCode.INTERNAL_SERVER_ERROR,
          error: true,
          info: {
            message: `Could not issue refund`,
            error: e,
          },
        };
        return serviceMethodResults;
      }
    }

    const deletes = await delete_delivery(delivery.id);
    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        message: `Delivery Deleted! Released hold on provided payment method.`,
        data: deletes,
      },
    };
    return serviceMethodResults;
  }

  /**
   * @deprecated
   * @param delivery
   * @returns
   */
  static async delete_delivery(delivery: DeliveryEntity) {
    // const delivery_model = await get_delivery_by_id(delivery_id);

    if (!delivery) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.NOT_FOUND,
        error: true,
        info: {
          message: `Delivery not found`,
        },
      };
      return serviceMethodResults;
    }

    if (!!delivery.carrier_id) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.BAD_REQUEST,
        error: true,
        info: {
          message: `Delivery is in progress`,
        },
      };
      return serviceMethodResults;
    }

    const deletes = await delete_delivery(delivery.id);
    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        message: `Delivery Deleted!`,
        data: deletes,
      },
    };
    return serviceMethodResults;
  }

  static async assign_delivery(options: {
    you: UserEntity;
    delivery: DeliveryEntity;
    ignoreNotification?: boolean;
  }) {
    const { you, delivery, ignoreNotification } = options;

    const delivery_id = delivery.id;
    const owner_id = delivery.owner_id;
    const carrier_id = delivery.carrier_id;

    if (!!carrier_id) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.BAD_REQUEST,
        error: true,
        info: {
          message:
            carrier_id === you.id
              ? `Delivery already assigned to you`
              : `Delivery already assigned to another carrier`,
        },
      };
      return serviceMethodResults;
    }

    if (!you.stripe_account_verified || !you.stripe_account_id) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.BAD_REQUEST,
        error: true,
        info: {
          message: `Your stripe account is not setup`,
        },
      };
      return serviceMethodResults;
    }

    const delivering_inprogress_count = await get_user_delivering_inprogress_count(you.id);

    if (delivering_inprogress_count === 3) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.FORBIDDEN,
        error: true,
        info: {
          message: `Users can only claim at most 3 deliveries at a time.`,
        },
      };
      return serviceMethodResults;
    }

    const updatesobj: PlainObject = {};
    updatesobj.carrier_id = you.id;
    updatesobj.carrier_assigned_date = fn('NOW');
    updatesobj.returned = false;
    const updates = await update_delivery(delivery_id, updatesobj);

    console.log(`assigned delivery ==========`);

    if (!ignoreNotification) {
      create_notification({
        from_id: you.id,
        to_id: owner_id,
        event: CARRY_EVENT_TYPES.CARRIER_ASSIGNED,
        target_type: CARRY_NOTIFICATION_TARGET_TYPES.DELIVERY,
        target_id: delivery_id,
      }).then(async (notification_model) => {
        console.log(`CARRIER_ASSIGNED notification created ==========`);

        const notification = await populate_carry_notification_obj(
          notification_model,
        );
        ExpoPushNotificationsService.sendUserPushNotification({
          user_id: notification.to_id,
          message: notification.message!,
          data: { delivery_id },
        });
        CommonSocketEventsHandler.emitEventToUserSockets({
          user_id: owner_id,
          event: CARRY_EVENT_TYPES.CARRIER_ASSIGNED,
          event_data: {
            delivery_id,
            data: updates,
            message: `Delivery assigned to user!`,
            user_id: you.id,
            notification,
          },
        });

        const to_phone_number =
          delivery.owner?.carry_settings?.phone || delivery.owner?.phone;
        if (!!to_phone_number && validatePhone(to_phone_number)) {
          send_sms({
            to_phone_number,
            message: notification.message,
          });
        }
      });
    }

    await StripeService.stripe.paymentIntents.update(
      delivery.payment_intent_id,
      {
        metadata: {
          carrier_id: you.id,
          carrier_stripe_account_id: you.stripe_account_id,
        },
      },
    ).catch((error) => {
      LOGGER.error(`Could not updata payment intent metadata`, { error });
    });

    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        message: `Delivery assigned to user!`,
        data: updates,
      },
    };
    return serviceMethodResults;
  }

  static async unassign_delivery(options: {
    you_id: number;
    delivery: DeliveryEntity;
    ignoreNotification?: boolean;
  }) {
    const { you_id, delivery, ignoreNotification } = options;

    const delivery_id = delivery.id;
    const owner_id = delivery.owner_id;
    const carrier_id = delivery.carrier_id;

    if (carrier_id !== you_id) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.BAD_REQUEST,
        error: true,
        info: {
          message: `You are not the carrier of this delivery.`,
        },
      };
      return serviceMethodResults;
    }

    const updates = await reset_delivery(delivery);

    if (!ignoreNotification) {
      create_notification({
        from_id: you_id,
        to_id: owner_id,
        event: CARRY_EVENT_TYPES.CARRIER_UNASSIGNED,
        target_type: CARRY_NOTIFICATION_TARGET_TYPES.DELIVERY,
        target_id: delivery_id,
      }).then(async (notification_model) => {
        const notification = await populate_carry_notification_obj(
          notification_model,
        );
        ExpoPushNotificationsService.sendUserPushNotification({
          user_id: notification.to_id,
          message: notification.message!,
          data: { delivery_id },
        });
        CommonSocketEventsHandler.emitEventToUserSockets({
          user_id: owner_id,
          event: CARRY_EVENT_TYPES.CARRIER_UNASSIGNED,
          event_data: {
            delivery_id,
            data: updates,
            message: `Delivery unassigned by carrier!`,
            user_id: you_id,
            notification,
          },
        });

        const to_phone_number =
          delivery.owner?.carry_settings?.phone || delivery.owner?.phone;
        if (!!to_phone_number && validatePhone(to_phone_number)) {
          send_sms({
            to_phone_number,
            message: notification.message,
          });
        }
      });
    }

    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        message: `Delivery unassigned by carrier!`,
        data: updates,
      },
    };
    return serviceMethodResults;
  }

  static async create_tracking_update(options: {
    you_id: number;
    delivery: DeliveryEntity;
    data: any;
    tracking_update_image?: UploadedFile;
    ignoreNotification?: boolean;
  }) {
    const {
      you_id,
      delivery,
      data,
      tracking_update_image,
      ignoreNotification,
    } = options;

    const delivery_id = delivery.id;
    const owner_id = delivery.owner_id;
    const carrier_id = delivery.carrier_id;

    if (carrier_id !== you_id) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.BAD_REQUEST,
        error: true,
        info: {
          message: `You are not the carrier of this delivery.`,
        },
      };
      return serviceMethodResults;
    }

    const createObj: any = {
      user_id: you_id,
      delivery_id,
    };

    const dataValidation = validateData({
      data,
      validators: create_delivery_tracking_update_required_props,
      mutateObj: createObj,
    });
    if (dataValidation.error) {
      return dataValidation;
    }

    const imageValidation = await AwsS3Service.uploadFile(
      tracking_update_image,
      {
        treatNotFoundAsError: false,
        mutateObj: createObj,
        validateAsImage: true,
        id_prop: 'icon_id',
        link_prop: 'icon_link',
      },
    );
    if (imageValidation.error) {
      return imageValidation;
    }

    if (!createObj.location) {
      console.log(`finding location of tracking update...`);
      const position_stack_data =
        await UtilsService.get_location_via_coordinates(
          createObj.carrier_lat,
          createObj.carrier_lng,
        );
      if (position_stack_data.error) {
        console.log({
          position_stack_data: JSON.stringify(position_stack_data),
        });
        createObj.location = `Unknown location...`;
      } else {
        createObj.location = position_stack_data.info.data!.label;
      }
    }

    const new_delivery_tracking_update = await create_delivery_tracking_update(
      createObj as CreateDeliveryTrackingUpdateDto
    );

    if (!ignoreNotification) {
      create_notification({
        from_id: you_id,
        to_id: owner_id,
        event: CARRY_EVENT_TYPES.DELIVERY_NEW_TRACKING_UPDATE,
        target_type: CARRY_NOTIFICATION_TARGET_TYPES.DELIVERY_TRACKING_UPDATE,
        target_id: new_delivery_tracking_update.id,
      }).then(async (notification_model) => {
        const notification = await populate_carry_notification_obj(
          notification_model,
        );
        ExpoPushNotificationsService.sendUserPushNotification({
          user_id: notification.to_id,
          message: notification.message!,
          data: { delivery_id },
        });
        CommonSocketEventsHandler.emitEventToUserSockets({
          user_id: owner_id,
          event: CARRY_EVENT_TYPES.DELIVERY_NEW_TRACKING_UPDATE,
          event_data: {
            delivery_id,
            data: new_delivery_tracking_update,
            message: `Delivery new tracking update!`,
            user_id: you_id,
            notification,
          },
        });

        const owner_phone =
          delivery.owner?.carry_settings?.phone || delivery.owner?.phone;
        if (!!owner_phone && validatePhone(owner_phone)) {
          GoogleService.getLocationFromCoordinates(
            createObj.carrier_lat,
            createObj.carrier_lng,
          )
            .then((placeData) => {
              const msg =
                `${process.env.APP_NAME} - Delivery: new tracking update for delivery "${delivery.title}"\n\n` +
                `${createObj.message}\n\n` +
                `Carrier's Location: ${placeData.city}, ${placeData.state} ` +
                `${placeData.county ? '(' + placeData.county + ')' : ''} ${
                  placeData.zipcode
                }`;
              console.log(`sending:`, msg);

              send_sms({
                to_phone_number: owner_phone,
                message: msg,
              });
            })
            .catch((error) => {
              console.log(`Can't send sms with location; sending without...`);
              const msg =
                `${process.env.APP_NAME} - Delivery: new tracking update for delivery "${delivery.title}"\n\n` +
                `${createObj.message}`;
              console.log(`sending:`, msg);

              send_sms({
                to_phone_number: owner_phone,
                message: msg,
              });
            });
        }
      });
    }

    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        message: `Delivery new tracking update!`,
        data: new_delivery_tracking_update,
      },
    };
    return serviceMethodResults;
  }

  static async add_delivered_picture(options: {
    you_id: number;
    delivery: DeliveryEntity;
    delivered_image?: UploadedFile;
    ignoreNotification?: boolean;
  }) {
    const { you_id, delivery, delivered_image, ignoreNotification } = options;
    console.log(`===== add_delivered_picture`, options);

    const delivery_id = delivery.id;
    const owner_id = delivery.owner_id;
    const carrier_id = delivery.carrier_id;

    if (carrier_id !== you_id) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.BAD_REQUEST,
        error: true,
        info: {
          message: `You are not the carrier of this delivery.`,
        },
      };
      return serviceMethodResults;
    }
    if (
      !delivery.completed &&
      !!delivery.datetime_picked_up &&
      !!delivery.delivered_image_id
    ) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.BAD_REQUEST,
        error: true,
        info: {
          message: `Delivery delivered image already added`,
        },
      };
      return serviceMethodResults;
    }

    const updatesobj: PlainObject = {};
    const imageValidation = await AwsS3Service.uploadFile(delivered_image, {
      treatNotFoundAsError: true,
      validateAsImage: true,
      mutateObj: updatesobj,
      id_prop: 'delivered_image_id',
      link_prop: 'delivered_image_link',
    });
    if (imageValidation.error) {
      return imageValidation;
    }

    const updates = await update_delivery(delivery_id, updatesobj);

    if (!ignoreNotification) {
      create_notification({
        from_id: you_id,
        to_id: owner_id,
        event: CARRY_EVENT_TYPES.DELIVERY_ADD_COMPLETED_PICTURE,
        target_type: CARRY_NOTIFICATION_TARGET_TYPES.DELIVERY,
        target_id: delivery_id,
      }).then(async (notification_model) => {
        const notification = await populate_carry_notification_obj(
          notification_model,
        );
        ExpoPushNotificationsService.sendUserPushNotification({
          user_id: notification.to_id,
          message: notification.message!,
          data: { delivery_id },
        });
        CommonSocketEventsHandler.emitEventToUserSockets({
          user_id: owner_id,
          event: CARRY_EVENT_TYPES.DELIVERY_ADD_COMPLETED_PICTURE,
          event_data: {
            delivery_id,
            data: updates,
            message: `Delivery added delivered picture!`,
            user_id: you_id,
            notification,
            ...imageValidation.info.data,
          },
        });

        const to_phone_number =
          delivery.owner?.carry_settings?.phone || delivery.owner?.phone;
        if (!!to_phone_number && validatePhone(to_phone_number)) {
          send_sms({
            to_phone_number,
            message: notification.message,
          });
        }
      });
    }

    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        message: `Delivery added delivered picture!`,
        data: {
          ...updates,
          ...imageValidation.info.data,
        },
      },
    };
    return serviceMethodResults;
  }

  static async add_from_person_id_picture(options: {
    you_id: number;
    delivery: DeliveryEntity;
    image?: UploadedFile;
    ignoreNotification?: boolean;
  }) {
    const { you_id, delivery, image, ignoreNotification } = options;
    console.log(`===== add_from_person_id_picture`, options);

    const delivery_id = delivery.id;
    const owner_id = delivery.owner_id;
    const carrier_id = delivery.carrier_id;

    if (carrier_id !== you_id) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.BAD_REQUEST,
        error: true,
        info: {
          message: `You are not the carrier of this delivery.`,
        },
      };
      return serviceMethodResults;
    }
    if (!!delivery.datetime_picked_up) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.BAD_REQUEST,
        error: true,
        info: {
          message: `Delivery already picked up.`,
        },
      };
      return serviceMethodResults;
    }
    if (!!delivery.from_person_id_image_id) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.BAD_REQUEST,
        error: true,
        info: {
          message: `Pickup person id already uploaded.`,
        },
      };
      return serviceMethodResults;
    }

    const updatesobj: PlainObject = {};
    const imageValidation = await AwsS3Service.uploadFile(image, {
      treatNotFoundAsError: true,
      validateAsImage: true,
      mutateObj: updatesobj,
      id_prop: 'from_person_id_image_id',
      link_prop: 'from_person_id_image_link',
    });
    if (imageValidation.error) {
      return imageValidation;
    }

    const updates = await update_delivery(delivery_id, updatesobj);

    const message = `Delivery added from person id picture!`;

    if (!ignoreNotification) {
      create_notification({
        from_id: you_id,
        to_id: owner_id,
        event: CARRY_EVENT_TYPES.DELIVERY_FROM_PERSON_ID_PICTURE_ADDED,
        target_type: CARRY_NOTIFICATION_TARGET_TYPES.DELIVERY,
        target_id: delivery_id,
      }).then(async (notification_model) => {
        const notification = await populate_carry_notification_obj(
          notification_model,
        );
        ExpoPushNotificationsService.sendUserPushNotification({
          user_id: notification.to_id,
          message: notification.message!,
          data: { delivery_id },
        });
        CommonSocketEventsHandler.emitEventToUserSockets({
          user_id: owner_id,
          event: CARRY_EVENT_TYPES.DELIVERY_FROM_PERSON_ID_PICTURE_ADDED,
          event_data: {
            delivery_id,
            data: updates,
            message,
            user_id: you_id,
            notification,
            ...imageValidation.info.data,
          },
        });

        const to_phone_number =
          delivery.owner?.carry_settings?.phone || delivery.owner?.phone;
        if (!!to_phone_number && validatePhone(to_phone_number)) {
          send_sms({
            to_phone_number,
            message: notification.message,
          });
        }
      });
    }

    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        message,
        data: {
          ...updates,
          ...imageValidation.info.data,
        },
      },
    };
    return serviceMethodResults;
  }

  static async add_from_person_sig_picture(options: {
    you_id: number;
    delivery: DeliveryEntity;
    image?: UploadedFile;
    ignoreNotification?: boolean;
  }) {
    const { you_id, delivery, image, ignoreNotification } = options;
    console.log(`===== add_from_person_sig_picture`, options);

    const delivery_id = delivery.id;
    const owner_id = delivery.owner_id;
    const carrier_id = delivery.carrier_id;

    if (carrier_id !== you_id) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.BAD_REQUEST,
        error: true,
        info: {
          message: `You are not the carrier of this delivery.`,
        },
      };
      return serviceMethodResults;
    }

    if (!!delivery.datetime_picked_up) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.BAD_REQUEST,
        error: true,
        info: {
          message: `Delivery already picked up.`,
        },
      };
      return serviceMethodResults;
    }
    if (!!delivery.from_person_sig_image_id) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.BAD_REQUEST,
        error: true,
        info: {
          message: `Pickup person sig already uploaded.`,
        },
      };
      return serviceMethodResults;
    }

    const updatesobj: PlainObject = {};
    const imageValidation = await AwsS3Service.uploadFile(image, {
      treatNotFoundAsError: true,
      validateAsImage: true,
      mutateObj: updatesobj,
      id_prop: 'from_person_sig_image_id',
      link_prop: 'from_person_sig_image_link',
    });
    if (imageValidation.error) {
      return imageValidation;
    }

    const updates = await update_delivery(delivery_id, updatesobj);

    const message = `Delivery added from person sig picture!`;

    if (!ignoreNotification) {
      create_notification({
        from_id: you_id,
        to_id: owner_id,
        event: CARRY_EVENT_TYPES.DELIVERY_FROM_PERSON_ID_PICTURE_ADDED,
        target_type: CARRY_NOTIFICATION_TARGET_TYPES.DELIVERY,
        target_id: delivery_id,
      }).then(async (notification_model) => {
        const notification = await populate_carry_notification_obj(
          notification_model,
        );
        ExpoPushNotificationsService.sendUserPushNotification({
          user_id: notification.to_id,
          message: notification.message!,
          data: { delivery_id },
        });
        CommonSocketEventsHandler.emitEventToUserSockets({
          user_id: owner_id,
          event: CARRY_EVENT_TYPES.DELIVERY_FROM_PERSON_ID_PICTURE_ADDED,
          event_data: {
            delivery_id,
            data: updates,
            message,
            user_id: you_id,
            notification,
            ...imageValidation.info.data,
          },
        });

        const to_phone_number =
          delivery.owner?.carry_settings?.phone || delivery.owner?.phone;
        if (!!to_phone_number && validatePhone(to_phone_number)) {
          send_sms({
            to_phone_number,
            message: notification.message,
          });
        }
      });
    }

    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        message,
        data: {
          ...updates,
          ...imageValidation.info.data,
        },
      },
    };
    return serviceMethodResults;
  }

  static async add_to_person_id_picture(options: {
    you_id: number;
    delivery: DeliveryEntity;
    image?: UploadedFile;
    ignoreNotification?: boolean;
  }) {
    const { you_id, delivery, image, ignoreNotification } = options;
    console.log(`===== add_to_person_id_picture`, options);

    const delivery_id = delivery.id;
    const owner_id = delivery.owner_id;
    const carrier_id = delivery.carrier_id;

    if (carrier_id !== you_id) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.BAD_REQUEST,
        error: true,
        info: {
          message: `You are not the carrier of this delivery.`,
        },
      };
      return serviceMethodResults;
    }
    if (
      !delivery.completed &&
      !!delivery.datetime_picked_up &&
      !!delivery.to_person_id_image_id
    ) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.BAD_REQUEST,
        error: true,
        info: {
          message: `Dropoff person id already added.`,
        },
      };
      return serviceMethodResults;
    }

    const updatesobj: PlainObject = {};
    const imageValidation = await AwsS3Service.uploadFile(image, {
      treatNotFoundAsError: true,
      validateAsImage: true,
      mutateObj: updatesobj,
      id_prop: 'to_person_id_image_id',
      link_prop: 'to_person_id_image_link',
    });
    if (imageValidation.error) {
      return imageValidation;
    }
    
    const updates = await update_delivery(delivery_id, updatesobj);

    const message = `Delivery added to person id picture!`;

    if (!ignoreNotification) {
      create_notification({
        from_id: you_id,
        to_id: owner_id,
        event: CARRY_EVENT_TYPES.DELIVERY_TO_PERSON_ID_PICTURE_ADDED,
        target_type: CARRY_NOTIFICATION_TARGET_TYPES.DELIVERY,
        target_id: delivery_id,
      }).then(async (notification_model) => {
        const notification = await populate_carry_notification_obj(
          notification_model,
        );
        ExpoPushNotificationsService.sendUserPushNotification({
          user_id: notification.to_id,
          message: notification.message!,
          data: { delivery_id },
        });
        CommonSocketEventsHandler.emitEventToUserSockets({
          user_id: owner_id,
          event: CARRY_EVENT_TYPES.DELIVERY_TO_PERSON_ID_PICTURE_ADDED,
          event_data: {
            delivery_id,
            data: updates,
            message,
            user_id: you_id,
            notification,
            ...imageValidation.info.data,
          },
        });

        const to_phone_number =
          delivery.owner?.carry_settings?.phone || delivery.owner?.phone;
        if (!!to_phone_number && validatePhone(to_phone_number)) {
          send_sms({
            to_phone_number,
            message: notification.message,
          });
        }
      });
    }

    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        message,
        data: {
          ...updates,
          ...imageValidation.info.data,
        },
      },
    };
    return serviceMethodResults;
  }

  static async add_to_person_sig_picture(options: {
    you_id: number;
    delivery: DeliveryEntity;
    image?: UploadedFile;
    ignoreNotification?: boolean;
  }) {
    const { you_id, delivery, image, ignoreNotification } = options;
    console.log(`===== add_to_person_sig_picture`, options);

    const delivery_id = delivery.id;
    const owner_id = delivery.owner_id;
    const carrier_id = delivery.carrier_id;

    if (carrier_id !== you_id) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.BAD_REQUEST,
        error: true,
        info: {
          message: `You are not the carrier of this delivery.`,
        },
      };
      return serviceMethodResults;
    }
    if (
      !delivery.completed &&
      !!delivery.datetime_picked_up &&
      !!delivery.to_person_sig_image_id
    ) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.BAD_REQUEST,
        error: true,
        info: {
          message: `Dropoff person signature already added.`,
        },
      };
      return serviceMethodResults;
    }

    const updatesobj: PlainObject = {};
    const imageValidation = await AwsS3Service.uploadFile(image, {
      treatNotFoundAsError: true,
      validateAsImage: true,
      mutateObj: updatesobj,
      id_prop: 'to_person_sig_image_id',
      link_prop: 'to_person_sig_image_link',
    });
    if (imageValidation.error) {
      return imageValidation;
    }

    const updates = await update_delivery(delivery_id, updatesobj);

    const message = `Delivery added to person sig picture!`;

    if (!ignoreNotification) {
      create_notification({
        from_id: you_id,
        to_id: owner_id,
        event: CARRY_EVENT_TYPES.DELIVERY_TO_PERSON_ID_PICTURE_ADDED,
        target_type: CARRY_NOTIFICATION_TARGET_TYPES.DELIVERY,
        target_id: delivery_id,
      }).then(async (notification_model) => {
        const notification = await populate_carry_notification_obj(
          notification_model,
        );
        ExpoPushNotificationsService.sendUserPushNotification({
          user_id: notification.to_id,
          message: notification.message!,
          data: { delivery_id },
        });
        CommonSocketEventsHandler.emitEventToUserSockets({
          user_id: owner_id,
          event: CARRY_EVENT_TYPES.DELIVERY_TO_PERSON_ID_PICTURE_ADDED,
          event_data: {
            delivery_id,
            data: updates,
            message,
            user_id: you_id,
            notification,
            ...imageValidation.info.data,
          },
        });

        const to_phone_number =
          delivery.owner?.carry_settings?.phone || delivery.owner?.phone;
        if (!!to_phone_number && validatePhone(to_phone_number)) {
          send_sms({
            to_phone_number,
            message: notification.message,
          });
        }
      });
    }

    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        message,
        data: {
          ...updates,
          ...imageValidation.info.data,
        },
      },
    };
    return serviceMethodResults;
  }

  static async mark_delivery_as_picked_up(options: {
    you_id: number;
    delivery: DeliveryEntity;
    ignoreNotification?: boolean;
  }) {
    const { you_id, delivery, ignoreNotification } = options;

    const delivery_id = delivery.id;
    const owner_id = delivery.owner_id;
    const carrier_id = delivery.carrier_id;

    if (carrier_id !== you_id) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.BAD_REQUEST,
        error: true,
        info: {
          message: `You are not the carrier of this delivery.`,
        },
      };
      return serviceMethodResults;
    }

    const updatesobj: PlainObject = {};
    updatesobj.datetime_picked_up = fn('NOW');
    const updates = await update_delivery(delivery_id, updatesobj);

    if (!ignoreNotification) {
      create_notification({
        from_id: you_id,
        to_id: owner_id,
        event: CARRY_EVENT_TYPES.CARRIER_MARKED_AS_PICKED_UP,
        target_type: CARRY_NOTIFICATION_TARGET_TYPES.DELIVERY,
        target_id: delivery_id,
      }).then(async (notification_model) => {
        const notification = await populate_carry_notification_obj(
          notification_model,
        );
        ExpoPushNotificationsService.sendUserPushNotification({
          user_id: notification.to_id,
          message: notification.message!,
          data: { delivery_id },
        });
        CommonSocketEventsHandler.emitEventToUserSockets({
          user_id: owner_id,
          event: CARRY_EVENT_TYPES.CARRIER_MARKED_AS_PICKED_UP,
          event_data: {
            delivery_id,
            data: updates,
            message: `Delivery picked up by carrier!`,
            user_id: you_id,
            notification,
          },
        });

        const to_phone_number =
          delivery.owner?.carry_settings?.phone || delivery.owner?.phone;
        if (!!to_phone_number && validatePhone(to_phone_number)) {
          send_sms({
            to_phone_number,
            message: notification.message,
          });
        }
      });
    }

    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        message: `Delivery picked up by carrier!`,
        data: updates,
      },
    };
    return serviceMethodResults;
  }

  static async mark_delivery_as_dropped_off(options: {
    you_id: number;
    delivery: DeliveryEntity;
    ignoreNotification?: boolean;
  }) {
    const { you_id, delivery, ignoreNotification } = options;

    const delivery_id = delivery.id;
    const owner_id = delivery.owner_id;
    const carrier_id = delivery.carrier_id;

    if (carrier_id !== you_id) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.BAD_REQUEST,
        error: true,
        info: {
          message: `You are not the carrier of this delivery.`,
        },
      };
      return serviceMethodResults;
    }

    const updatesobj: PlainObject = {};
    updatesobj.datetime_delivered = fn('NOW');
    const updates = await update_delivery(delivery_id, updatesobj);

    if (!ignoreNotification) {
      create_notification({
        from_id: you_id,
        to_id: owner_id,
        event: CARRY_EVENT_TYPES.CARRIER_MARKED_AS_DROPPED_OFF,
        target_type: CARRY_NOTIFICATION_TARGET_TYPES.DELIVERY,
        target_id: delivery_id,
      }).then(async (notification_model) => {
        const notification = await populate_carry_notification_obj(
          notification_model,
        );
        ExpoPushNotificationsService.sendUserPushNotification({
          user_id: notification.to_id,
          message: notification.message!,
          data: { delivery_id },
        });
        CommonSocketEventsHandler.emitEventToUserSockets({
          user_id: owner_id,
          event: CARRY_EVENT_TYPES.CARRIER_MARKED_AS_DROPPED_OFF,
          event_data: {
            delivery_id,
            data: updates,
            message: `Delivery dropped off by carrier!`,
            user_id: you_id,
            notification,
          },
        });

        const to_phone_number =
          delivery.owner?.carry_settings?.phone || delivery.owner?.phone;
        if (!!to_phone_number && validatePhone(to_phone_number)) {
          send_sms({
            to_phone_number,
            message: notification.message,
          });
        }
      });
    }

    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        message: `Delivery dropped off by carrier!`,
        data: updates,
      },
    };
    return serviceMethodResults;
  }

  static async mark_delivery_as_completed(options: {
    you_id: number;
    delivery: DeliveryEntity;
    ignoreNotification?: boolean;
  }) {
    const { you_id, delivery, ignoreNotification } = options;

    if (delivery.owner_id !== you_id) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.BAD_REQUEST,
        error: true,
        info: {
          message: `You are not the owner of this delivery.`,
        },
      };
      return serviceMethodResults;
    }

    if (delivery.completed) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.BAD_REQUEST,
        error: true,
        info: {
          message: `Delivery is already completed.`,
        },
      };
      return serviceMethodResults;
    }

    const updatesobj: PlainObject = {};
    updatesobj.completed = true;
    updatesobj.datetime_completed = fn('NOW');
    const updates = await update_delivery(delivery.id, updatesobj);

    if (!ignoreNotification) {
      create_notification({
        from_id: you_id,
        to_id: delivery.carrier_id!,
        event: CARRY_EVENT_TYPES.DELIVERY_COMPLETED,
        target_type: CARRY_NOTIFICATION_TARGET_TYPES.DELIVERY,
        target_id: delivery.id,
      }).then(async (notification_model) => {
        const notification = await populate_carry_notification_obj(
          notification_model,
        );
        ExpoPushNotificationsService.sendUserPushNotification({
          user_id: notification.to_id,
          message: notification.message!,
          data: { delivery_id: delivery.id },
        });
        CommonSocketEventsHandler.emitEventToUserSockets({
          user_id: delivery.carrier_id!,
          event: CARRY_EVENT_TYPES.DELIVERY_COMPLETED,
          event_data: {
            delivery_id: delivery.id,
            data: updates,
            message: `Delivery completed!`,
            user_id: you_id,
            notification,
          },
        });

        const to_phone_number = delivery.carrier?.carry_settings?.phone || delivery.carrier?.phone;
        if (!!to_phone_number && validatePhone(to_phone_number)) {
          send_sms({
            to_phone_number,
            message: notification.message,
          });
        }
      });
    }

    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        message: `Delivery completed!`,
        data: updates,
      },
    };
    return serviceMethodResults;
  }

  static async mark_delivery_as_returned(options: {
    you_id: number;
    delivery: DeliveryEntity;
    ignoreNotification?: boolean;
  }) {
    const { you_id, delivery, ignoreNotification } = options;

    const delivery_id = delivery.id;
    const owner_id = delivery.owner_id;
    const carrier_id = delivery.carrier_id;

    if (carrier_id !== you_id) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.BAD_REQUEST,
        error: true,
        info: {
          message: `You are not the carrier of this delivery.`,
        },
      };
      return serviceMethodResults;
    }

    if (delivery.returned) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.BAD_REQUEST,
        error: true,
        info: {
          message: `Delivery is already returned.`,
        },
      };
      return serviceMethodResults;
    }

    const updates = await reset_delivery(delivery);

    if (!ignoreNotification) {
      create_notification({
        from_id: carrier_id,
        to_id: owner_id,
        event: CARRY_EVENT_TYPES.DELIVERY_RETURNED,
        target_type: CARRY_NOTIFICATION_TARGET_TYPES.DELIVERY,
        target_id: delivery_id,
      }).then(async (notification_model) => {
        const notification = await populate_carry_notification_obj(
          notification_model,
        );
        ExpoPushNotificationsService.sendUserPushNotification({
          user_id: notification.to_id,
          message: notification.message!,
          data: { delivery_id },
        });
        CommonSocketEventsHandler.emitEventToUserSockets({
          user_id: owner_id,
          event: CARRY_EVENT_TYPES.DELIVERY_RETURNED,
          event_data: {
            delivery_id,
            event: CARRY_EVENT_TYPES.DELIVERY_RETURNED,
            data: updates,
            message: `Delivery returned`,
            user_id: you_id,
            notification,
          },
        });

        const to_phone_number =
          delivery.owner?.carry_settings?.phone || delivery.owner?.phone;
        if (!!to_phone_number && validatePhone(to_phone_number)) {
          send_sms({
            to_phone_number,
            message: notification.message,
          });
        }
      });
    }

    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        message: `Delivery returned`,
        data: updates,
      },
    };
    return serviceMethodResults;
  }

  static async get_settings(you_id: number) {
    let settings = await CarryUserProfileSettings.findOne({
      where: { user_id: you_id },
    });
    if (!settings) {
      settings = await CarryUserProfileSettings.create({
        user_id: you_id,
      });
    }

    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        data: settings,
      },
    };
    return serviceMethodResults;
  }

  static async update_settings(you_id: number, data: any) {
    const updatesObj: any = {};

    let settings = await CarryUserProfileSettings.findOne({
      where: { user_id: you_id },
    });
    if (!settings) {
      settings = await CarryUserProfileSettings.create({
        user_id: you_id,
      });
    }

    const dataValidation = validateData({
      data,
      validators: deliveryme_user_settings_required_props,
      mutateObj: updatesObj,
    });
    if (dataValidation.error) {
      return dataValidation;
    }

    const updates = await settings.update(updatesObj);

    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        message: `Updated settings successfully!`,
        data: updates,
      },
    };
    return serviceMethodResults;
  }



  static async payment_success(options: {
    you_id: number;
    delivery: DeliveryEntity;
    session_id: string;
    ignoreNotification?: boolean;
  }) {
    const { you_id, delivery, session_id, ignoreNotification } = options;

    const delivery_id = delivery.id;
    const owner_id = delivery.owner_id;
    const carrier_id = delivery.carrier_id!;

    if (!session_id) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.BAD_REQUEST,
        error: true,
        info: {
          message: `Payment session_id was not added as query param on request`,
        },
      };
      return serviceMethodResults;
    }

    if (session_id !== delivery.payment_session_id) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.BAD_REQUEST,
        error: true,
        info: {
          message: `Payment session_id does not match with delivery`,
        },
      };
      return serviceMethodResults;
    }

    if (delivery.completed) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.BAD_REQUEST,
        error: true,
        info: {
          message: `Delivery already completed`,
        },
      };
      return serviceMethodResults;
    }

    // pay carrier

    const updatesobj: PlainObject = {};
    updatesobj.completed = true;
    const updates = await update_delivery(delivery_id, updatesobj);

    if (!ignoreNotification) {
      create_notification({
        from_id: you_id,
        to_id: carrier_id,
        event: CARRY_EVENT_TYPES.DELIVERY_COMPLETED,
        target_type: CARRY_NOTIFICATION_TARGET_TYPES.DELIVERY,
        target_id: delivery_id,
      }).then(async (notification_model) => {
        const notification = await populate_carry_notification_obj(
          notification_model,
        );
        ExpoPushNotificationsService.sendUserPushNotification({
          user_id: notification.to_id,
          message: notification.message!,
          data: { delivery_id },
        });
        CommonSocketEventsHandler.emitEventToUserSockets({
          user_id: carrier_id,
          event: CARRY_EVENT_TYPES.DELIVERY_COMPLETED,
          event_data: {
            data: updates,
            message: `Delivery completed!`,
            user: you_id,
            notification,
          },
        });

        const to_phone_number =
          delivery.carrier?.carry_settings?.phone || delivery.carrier?.phone;
        if (!!to_phone_number && validatePhone(to_phone_number)) {
          send_sms({
            to_phone_number,
            message: notification.message,
          });
        }
      });
    }

    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        message: `Payment session completed`,
        data: updates,
      },
    };
    return serviceMethodResults;
  }

  static async payment_cancel(options: {
    you_id: number;
    delivery: DeliveryEntity;
    session_id: string;
  }) {
    const { you_id, delivery, session_id } = options;

    if (!session_id) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.BAD_REQUEST,
        error: true,
        info: {
          message: `Payment session_id was not added as query param on request`,
        },
      };
      return serviceMethodResults;
    }

    if (session_id !== delivery.payment_session_id) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.BAD_REQUEST,
        error: true,
        info: {
          message: `Payment session_id does not match with delivery`,
        },
      };
      return serviceMethodResults;
    }

    const updatesobj: PlainObject = {};
    updatesobj.payment_session_id = '';
    const updates = await update_delivery(delivery.id, updatesobj);

    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        message: `Payment session canceled`,
        data: updates,
      },
    };
    return serviceMethodResults;
  }

  static async get_user_stats(user_id: number) {
    // const ratings_stats = await get_user_ratings_stats_via_model(
    //   CarryUserRatings,
    //   user_id,
    // );
    const deliveries_count = await get_user_deliveries_count(user_id);
    const delivering_completed_count =
      await get_user_delivering_completed_count(user_id);
    const delivering_inprogress_count =
      await get_user_delivering_inprogress_count(user_id);

    const data = {
      // ...ratings_stats,
      deliveries_count,
      delivering_completed_count,
      delivering_inprogress_count,
    };

    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        message: `User ratings status`,
        data,
      },
    };
    return serviceMethodResults;
  }

  static async pay_carrier(options: { you: UserEntity; delivery: DeliveryEntity }) {
    const { you, delivery } = options;

    if (delivery.owner_id !== you.id) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.BAD_REQUEST,
        error: true,
        info: {
          message: `You are not the owner of this delivery.`,
        },
      };
      return serviceMethodResults;
    }

    if (delivery.completed) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.BAD_REQUEST,
        error: true,
        info: {
          message: `Delivery is already completed`,
        },
      };
      return serviceMethodResults;
    }

    if (
      !delivery.owner?.stripe_account_verified ||
      !delivery.owner?.stripe_account_id
    ) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.BAD_REQUEST,
        error: true,
        info: {
          message: `Owner's stripe account is not setup`,
        },
      };
      return serviceMethodResults;
    }

    if (
      !delivery.carrier?.stripe_account_verified ||
      !delivery.carrier?.stripe_account_id
    ) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.BAD_REQUEST,
        error: true,
        info: {
          message: `Carrier's stripe account is not setup`,
        },
      };
      return serviceMethodResults;
    }

    // capture the hold from the listing
    const captureResults = await StripeService.stripe.paymentIntents.capture(delivery.payment_intent_id);

    // funds now in platform; try charging customer for delivery listing
    let payment_intent: Stripe.PaymentIntent;
    const is_subscription_active: boolean = (
      await UsersService.is_subscription_active(delivery.owner!)
    ).info.data as boolean;
    const chargeFeeData = StripeService.add_on_stripe_processing_fee(
      delivery.payout,
      is_subscription_active,
    );

    try {
      // https://stripe.com/docs/payments/save-during-payment
      const paymentIntentCreateData: Stripe.PaymentIntentCreateParams = {
        description: `${process.env.APP_NAME} - payment for delivery listing: ${delivery.title}`,
        amount: chargeFeeData.final_total,
        currency: 'usd',

        customer: you.stripe_customer_account_id,
        payment_method: delivery.payment_method_id,
        application_fee_amount: chargeFeeData.app_fee,
        transfer_data: {
          destination: delivery.carrier!.stripe_account_id,
        },

        off_session: true,
        confirm: true,
        metadata: {
          delivery_id: delivery.id,
          payment_intent_event: CARRY_EVENT_TYPES.DELIVERY_COMPLETED,
          target_type: CARRY_NOTIFICATION_TARGET_TYPES.DELIVERY,
          target_id: delivery.id,
        },
      };

      console.log({ paymentIntentCreateData });

      payment_intent = await StripeService.stripe.paymentIntents.create(
        paymentIntentCreateData,
      );
    } catch (e) {
      console.log(e);
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.BAD_REQUEST,
        error: true,
        info: {
          message: `Could not charge payment method`,
          error: e,
        },
      };
      return serviceMethodResults;
    }

    // record the transaction
    const payment_intent_action = await StripeActions.create({
      action_event: STRIPE_ACTION_EVENTS.PAYMENT_INTENT,
      action_id: payment_intent.id,
      action_metadata: null,
      target_type: CARRY_NOTIFICATION_TARGET_TYPES.DELIVERY,
      target_id: delivery.id,
      target_metadata: null,
      status: TRANSACTION_STATUS.COMPLETED,
    });

    console.log(`Delivery paid successfully. Delivery ID:`, delivery.id, {
      chargeFeeData,
      payment_intent,
      payment_intent_action: payment_intent_action.toJSON(),
    });

    const deliveryCompletedResults =
      await DeliveriesService.mark_delivery_as_completed({
        you_id: you.id,
        delivery,
      });

    deliveryCompletedResults.info.message &&
      console.log(deliveryCompletedResults.info.message);

    if (deliveryCompletedResults.error) {
      return deliveryCompletedResults;
    }

    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        message: `Payment successful!`,
        data: deliveryCompletedResults.info.data,
      },
    };
    return serviceMethodResults;
  }

  static async leave_delivery_owner_review(options: {
    you: UserEntity;
    delivery: DeliveryEntity;
    data: any;
    image?: UploadedFile | string;
  }) {
    // you = carrier

    const { you, data, delivery, image } = options;

    const createObj: any = {
      writer_id: you.id,
      user_id: delivery.owner_id,
      delivery_id: delivery.id,
    };

    // validate inputs
    const dataValidation = validateData({
      data,
      validators: delivery_carrier_review_required_props,
      mutateObj: createObj,
    });
    if (dataValidation.error) {
      return dataValidation;
    }

    if (image) {
      const imageValidation = await AwsS3Service.uploadFile(image, {
        treatNotFoundAsError: true,
        mutateObj: createObj,
        validateAsImage: true,
        id_prop: 'image_id',
        link_prop: 'image_link',
      });
      if (imageValidation.error) {
        return imageValidation;
      }
    }

    const new_review = await leave_delivery_customer_review(createObj);

    create_notification_and_send({
      from_id: you.id,
      to_id: delivery.owner_id!,
      event: CARRY_EVENT_TYPES.NEW_DELIVERY_OWNER_REVIEW,
      target_type: CARRY_NOTIFICATION_TARGET_TYPES.DELIVERY,
      target_id: delivery.id,

      to_phone: delivery.owner?.carry_settings?.phone || delivery.owner?.phone,
      send_mobile_push: true,

      extras_data: {
        delivery_id: delivery.id,
        data: new_review,
        user_id: you.id,
        user: delivery.carrier,
      },
    });

    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        message: `Rating created!`,
        data: new_review,
      },
    };
    return serviceMethodResults;
  }

  static async leave_delivery_carrier_review(options: {
    you: UserEntity;
    delivery: DeliveryEntity;
    data: any;
    image?: UploadedFile | string;
  }) {
    // you = owner

    const { you, data, delivery, image } = options;

    const createObj: any = {
      writer_id: you.id,
      user_id: delivery.carrier_id,
      delivery_id: delivery.id,
    };

    // validate inputs
    const dataValidation = validateData({
      data,
      validators: delivery_carrier_review_required_props,
      mutateObj: createObj,
    });
    if (dataValidation.error) {
      return dataValidation;
    }

    if (image) {
      const imageValidation = await AwsS3Service.uploadFile(image, {
        treatNotFoundAsError: true,
        mutateObj: createObj,
        validateAsImage: true,
        id_prop: 'image_id',
        link_prop: 'image_link',
      });
      if (imageValidation.error) {
        return imageValidation;
      }
    }

    const new_review = await leave_delivery_carrier_review(createObj);

    create_notification_and_send({
      from_id: you.id,
      to_id: delivery.carrier_id!,
      event: CARRY_EVENT_TYPES.NEW_DELIVERY_CARRIER_REVIEW,
      target_type: CARRY_NOTIFICATION_TARGET_TYPES.DELIVERY,
      target_id: delivery.id,

      to_phone: delivery.carrier?.carry_settings?.phone || delivery.carrier?.phone,
      send_mobile_push: true,

      extras_data: {
        delivery_id: delivery.id,
        data: new_review,
        user_id: you.id,
        user: delivery.owner,
      },
    });

    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        message: `Rating created!`,
        data: new_review,
      },
    };
    return serviceMethodResults;
  }

  static async remove_carrier(options: {
    you: UserEntity;
    delivery: DeliveryEntity;
    ignoreNotification?: boolean
  }) {
    const { you, delivery, ignoreNotification } = options;

    const delivery_id = delivery.id;
    const owner_id = delivery.owner_id;
    const carrier_id = delivery.carrier_id;

    const MIN_WAIT_BEFORE_REMOVING_CARRIER: number = 20;

    const carrierNotPickedUpIn20MinutesSinceListingCreated = !!delivery.carrier_id && !delivery.datetime_picked_up && (minutesPast(delivery.carrier_assigned_date!) >= MIN_WAIT_BEFORE_REMOVING_CARRIER);
    if (carrierNotPickedUpIn20MinutesSinceListingCreated) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.BAD_REQUEST,
        error: true,
        info: {
          message: `Has not been ${MIN_WAIT_BEFORE_REMOVING_CARRIER} since carrier was assigned`
        },
      };
      return serviceMethodResults;
    }

    const updates = await reset_delivery(delivery);

    create_notification_and_send({
      from_id: you.id,
      to_id: carrier_id,
      event: CARRY_EVENT_TYPES.CARRIER_REMOVED,
      target_type: CARRY_NOTIFICATION_TARGET_TYPES.DELIVERY,
      target_id: delivery_id,

      to_phone: delivery.carrier?.phone,
      send_mobile_push: true,

      extras_data: {
        delivery_id,
      },
    });

    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        message: `Delivery unassigned by owner!`,
        data: updates,
      },
    };
    return serviceMethodResults;
  }

  static async pay_carrier_via_transfer(options: {
    you: UserEntity;
    delivery: DeliveryEntity;
    ignoreNotification?: boolean
  }) {
    const { you, delivery, ignoreNotification } = options;

    if (delivery.owner_id !== you.id) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.BAD_REQUEST,
        error: true,
        info: {
          message: `You are not the owner of this delivery.`,
        },
      };
      return serviceMethodResults;
    }

    if (delivery.completed) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.BAD_REQUEST,
        error: true,
        info: {
          message: `Delivery is already completed`,
        },
      };
      return serviceMethodResults;
    }

    if (
      !delivery.owner?.stripe_account_verified ||
      !delivery.owner?.stripe_account_id
    ) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.BAD_REQUEST,
        error: true,
        info: {
          message: `Owner's stripe account is not setup`,
        },
      };
      return serviceMethodResults;
    }

    if (
      !delivery.carrier?.stripe_account_verified ||
      !delivery.carrier?.stripe_account_id
    ) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.BAD_REQUEST,
        error: true,
        info: {
          message: `Carrier's stripe account is not setup`,
        },
      };
      return serviceMethodResults;
    }

    // capture the hold from the listing
    const captureResults = await StripeService.stripe.paymentIntents.capture(delivery.payment_intent_id);

    // funds now in platform; try charging customer for delivery listing
    const payment_intent = await StripeService.stripe.paymentIntents.retrieve(
      delivery.payment_intent_id,
      { expand: ['charges'] },
    );
    console.log({ payment_intent }, JSON.stringify({ payment_intent }));
    const charge = await StripeService.stripe.charges.retrieve(payment_intent.latest_charge as string);
    // const was_subscribed: boolean = payment_intent.metadata['was_subscribed'] === 'true' ? true : false;
    // const chargeFeeData = StripeService.add_on_stripe_processing_fee(delivery.payout, was_subscribed);
    console.log({ charge }, JSON.stringify({ charge }));
    const charge_id = payment_intent['charges']?.data[0]?.id || charge.id;

    const transferAmount = delivery.payout * 100;
    const carrierHasMembershipResults =
      await UsersService.is_subscription_active(delivery.carrier! as UserEntity);
    const deduction = Math.ceil(transferAmount * 0.1);
    const useTransferAmount = carrierHasMembershipResults.info.data
      ? transferAmount
      : transferAmount - deduction;
    console.log({
      payment_intent_id: payment_intent.id,
      charge_id,
      transferAmount,
      deduction,
      useTransferAmount,
    });

    // try transferring
    let transfer: Stripe.Transfer;
    try {
      const transferCreateData: Stripe.TransferCreateParams = {
        description: `${process.env.APP_NAME} - payment for delivery listing: ${delivery.title}`,
        amount: useTransferAmount,
        currency: 'usd',
        destination: delivery.carrier!.stripe_account_id,
        source_transaction: charge_id,

        metadata: {
          delivery_id: delivery.id,
          transfer_event: CARRY_EVENT_TYPES.DELIVERY_COMPLETED,
          target_type: CARRY_NOTIFICATION_TARGET_TYPES.DELIVERY,
          target_id: delivery.id,
        },
      };

      console.log({ transferCreateData });

      transfer = await StripeService.stripe.transfers.create(
        transferCreateData,
      );
    } catch (e) {
      console.log(e);
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.BAD_REQUEST,
        error: true,
        info: {
          message: `Could not transfer...`,
          error: e,
        },
      };
      return serviceMethodResults;
    }

    // record the transaction
    const transfer_action = await StripeActions.create({
      action_event: STRIPE_ACTION_EVENTS.TRANSFER,
      action_id: transfer.id,
      action_metadata: null,
      target_type: CARRY_NOTIFICATION_TARGET_TYPES.DELIVERY,
      target_id: delivery.id,
      target_metadata: null,
      status: TRANSACTION_STATUS.COMPLETED,
    });

    console.log(
      `Delivery paid successfully via transfer. Delivery ID:`,
      delivery.id,
      {
        transfer,
        transfer_action: transfer_action.toJSON(),
      },
    );

    const deliveryCompletedResults =
      await DeliveriesService.mark_delivery_as_completed({
        you_id: you.id,
        delivery,
        ignoreNotification
      });

    deliveryCompletedResults.info.message &&
      console.log(deliveryCompletedResults.info.message);

    if (deliveryCompletedResults.error) {
      return deliveryCompletedResults;
    }

    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        message: `Payment successful!`,
        data: deliveryCompletedResults.info.data,
      },
    };
    return serviceMethodResults;
  }

  static async carrier_self_pay(options: { you: UserEntity; delivery: DeliveryEntity }) {
    const { you, delivery } = options;
    /*
      after a certain amount of time after delivering, carrier can receive funds if the delivery owner does not dispute
    */

    if (delivery.carrier_id !== options.you.id) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.BAD_REQUEST,
        error: true,
        info: {
          message: `You are not the carrier of this delivery.`,
        },
      };
      return serviceMethodResults;
    }

    if (!delivery.datetime_delivered) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.BAD_REQUEST,
        error: true,
        info: {
          message: `Not delivered yet.`,
        },
      };
      return serviceMethodResults;
    }

    // check how long it has been since delivery marked as delivered
    const momentNow = moment(new Date());
    const momentDelivered = moment(delivery.datetime_delivered);
    const momentDiff = momentDelivered.diff(momentNow);
    const hoursSinceDelivered = Math.abs(moment.duration(momentDiff).asHours());
    const minimumTimePast = hoursSinceDelivered >= 24;

    if (!minimumTimePast) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.OK,
        error: false,
        info: {
          message: `Not 24 hours since delivering to self pay`,
        },
      };
      return serviceMethodResults;
    }

    const dispute = await DeliveryDisputes.findOne({
      where: { delivery_id: delivery.id },
    });
    if (!!dispute) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.OK,
        error: false,
        info: {
          message: `Cannot self pay during active dispute`,
        },
      };
      return serviceMethodResults;
    }

    const results = await DeliveriesService.pay_carrier_via_transfer({
      you: delivery.owner!,
      delivery,
      ignoreNotification: true
    });

    create_notification({
      from_id: you.id,
      to_id: delivery.owner_id!,
      event: CARRY_EVENT_TYPES.CARRIER_PAYOUT_CLAIMED,
      target_type: CARRY_NOTIFICATION_TARGET_TYPES.DELIVERY,
      target_id: delivery.id,
    }).then(async (notification_model) => {
      const notification = await populate_carry_notification_obj(
        notification_model,
      );
      ExpoPushNotificationsService.sendUserPushNotification({
        user_id: notification.to_id,
        message: notification.message!,
        data: { delivery_id: delivery.id },
      });
      CommonSocketEventsHandler.emitEventToUserSockets({
        user_id: delivery.carrier_id!,
        event: CARRY_EVENT_TYPES.CARRIER_PAYOUT_CLAIMED,
        event_data: {
          delivery_id: delivery.id,
          data: notification.delivery,
          user_id: notification.to_id,
          message: notification.message!,
          notification,
        },
      });

      const to_phone_number = delivery.owner?.carry_settings?.phone || delivery.owner?.phone;
      if (!!to_phone_number && validatePhone(to_phone_number)) {
        send_sms({
          to_phone_number,
          message: notification.message,
        });
      }
    });

    return results;
  }

  static async request_carrier_location(options: {
    you: UserEntity;
    delivery: DeliveryEntity;
  }) {
    const { you, delivery } = options;

    if (delivery.carrier_shared_location) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.BAD_REQUEST,
        error: true,
        info: {
          message: `Carrier already shared location`,
        },
      };
      return serviceMethodResults;
    }

    let carrier_tracking_request =
      await get_delivery_carrier_location_request_pending(delivery.id);
    if (carrier_tracking_request) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.BAD_REQUEST,
        error: true,
        info: {
          message: `Carrier location already requested`,
          data: carrier_tracking_request,
        },
      };
      return serviceMethodResults;
    }

    const updates = await set_delivery_carrier_location_requested(
      delivery.id,
      true,
    );
    carrier_tracking_request = await create_delivery_carrier_location_request(
      delivery.id,
    );

    create_notification({
      from_id: you.id,
      to_id: delivery.carrier_id!,
      event: CARRY_EVENT_TYPES.CARRIER_LOCATION_REQUESTED,
      target_type: CARRY_NOTIFICATION_TARGET_TYPES.DELIVERY,
      target_id: delivery.id,
    }).then(async (notification_model) => {
      const notification = await populate_carry_notification_obj(
        notification_model,
      );
      ExpoPushNotificationsService.sendUserPushNotification({
        user_id: notification.to_id,
        message: notification.message!,
        data: { delivery_id: delivery.id },
      });
      CommonSocketEventsHandler.emitEventToUserSockets({
        user_id: delivery.carrier_id!,
        event: CARRY_EVENT_TYPES.CARRIER_LOCATION_REQUESTED,
        event_data: {
          data: {
            delivery_id: delivery.id,
            updates,
            carrier_tracking_request,
          },
          message: notification.message || `Carrier location requested!`,
          user: you.id,
          notification,
        },
      });

      const to_phone_number =
        delivery.carrier?.carry_settings?.phone || delivery.carrier?.phone;
      if (!!to_phone_number && validatePhone(to_phone_number)) {
        send_sms({
          to_phone_number,
          message: notification.message,
        });
      }
    });

    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        message: `Carrier location requested`,
        data: carrier_tracking_request,
      },
    };
    return serviceMethodResults;
  }

  static async cancel_request_carrier_location(options: {
    you: UserEntity;
    delivery: DeliveryEntity;
  }) {
    const { you, delivery } = options;

    if (delivery.carrier_shared_location) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.BAD_REQUEST,
        error: true,
        info: {
          message: `Carrier already shared location`,
        },
      };
      return serviceMethodResults;
    }

    let carrier_tracking_request =
      await get_delivery_carrier_location_request_pending(delivery.id);
    if (!carrier_tracking_request) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.BAD_REQUEST,
        error: true,
        info: {
          message: `Carrier location not requested`,
          data: carrier_tracking_request,
        },
      };
      return serviceMethodResults;
    }

    const updates = await set_delivery_carrier_location_requested(
      delivery.id,
      false,
    );
    await carrier_tracking_request.update(
      { status: STATUSES.CANCELED },
      { fields: [`status`] },
    );

    create_notification({
      from_id: you.id,
      to_id: delivery.carrier_id!,
      event: CARRY_EVENT_TYPES.CARRIER_LOCATION_REQUEST_CANCELED,
      target_type: CARRY_NOTIFICATION_TARGET_TYPES.DELIVERY,
      target_id: delivery.id,
    }).then(async (notification_model) => {
      const notification = await populate_carry_notification_obj(
        notification_model,
      );
      ExpoPushNotificationsService.sendUserPushNotification({
        user_id: notification.to_id,
        message: notification.message!,
        data: { delivery_id: delivery.id },
      });
      CommonSocketEventsHandler.emitEventToUserSockets({
        user_id: delivery.carrier_id!,
        event: CARRY_EVENT_TYPES.CARRIER_LOCATION_REQUEST_CANCELED,
        event_data: {
          data: carrier_tracking_request,
          message: notification.message || `Carrier location request canceled!`,
          user: you,
          notification,
        },
      });

      const to_phone_number =
        delivery.carrier?.carry_settings?.phone || delivery.carrier?.phone;
      if (!!to_phone_number && validatePhone(to_phone_number)) {
        send_sms({
          to_phone_number,
          message: notification.message,
        });
      }
    });

    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        message: `Carrier location request canceled`,
        data: carrier_tracking_request,
      },
    };
    return serviceMethodResults;
  }

  static async accept_request_carrier_location(options: {
    you: UserEntity;
    delivery: DeliveryEntity;
  }) {
    const { you, delivery } = options;

    if (delivery.carrier_shared_location) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.BAD_REQUEST,
        error: true,
        info: {
          message: `Carrier already shared location`,
        },
      };
      return serviceMethodResults;
    }

    let carrier_tracking_request =
      await get_delivery_carrier_location_request_pending(delivery.id);
    if (!carrier_tracking_request) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.BAD_REQUEST,
        error: true,
        info: {
          message: `Carrier location not requested`,
          data: carrier_tracking_request,
        },
      };
      return serviceMethodResults;
    }

    const updates = await set_delivery_carrier_shared_location(
      delivery.id,
      true,
    );
    await carrier_tracking_request.update(
      { status: STATUSES.ACCEPTED },
      { fields: [`status`] },
    );

    create_notification({
      from_id: you.id,
      to_id: delivery.owner_id,
      event: CARRY_EVENT_TYPES.CARRIER_LOCATION_REQUEST_ACCEPTED,
      target_type: CARRY_NOTIFICATION_TARGET_TYPES.DELIVERY,
      target_id: delivery.id,
    }).then(async (notification_model) => {
      const notification = await populate_carry_notification_obj(
        notification_model,
      );
      ExpoPushNotificationsService.sendUserPushNotification({
        user_id: notification.to_id,
        message: notification.message!,
        data: { delivery_id: delivery.id },
      });
      CommonSocketEventsHandler.emitEventToUserSockets({
        user_id: delivery.owner_id,
        event: CARRY_EVENT_TYPES.CARRIER_LOCATION_REQUEST_ACCEPTED,
        event_data: {
          data: {
            delivery_id: delivery.id,
            updates,
            carrier_tracking_request,
          },
          message: notification.message || `Carrier location request accepted!`,
          user: you,
          notification,
        },
      });

      const to_phone_number =
        delivery.owner?.carry_settings?.phone || delivery.owner?.phone;
      if (!!to_phone_number && validatePhone(to_phone_number)) {
        send_sms({
          to_phone_number,
          message: notification.message,
        });
      }
    });

    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        message: `Carrier location request accepted`,
        data: carrier_tracking_request,
      },
    };
    return serviceMethodResults;
  }

  static async decline_request_carrier_location(options: {
    you: UserEntity;
    delivery: DeliveryEntity;
  }) {
    const { you, delivery } = options;

    if (delivery.carrier_shared_location) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.BAD_REQUEST,
        error: true,
        info: {
          message: `Carrier already shared location`,
        },
      };
      return serviceMethodResults;
    }

    let carrier_tracking_request =
      await get_delivery_carrier_location_request_pending(delivery.id);
    if (!carrier_tracking_request) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.BAD_REQUEST,
        error: true,
        info: {
          message: `Carrier location not requested`,
          data: carrier_tracking_request,
        },
      };
      return serviceMethodResults;
    }

    const updates = await set_delivery_carrier_shared_location(
      delivery.id,
      false,
    );
    await carrier_tracking_request.update(
      { status: STATUSES.DECLINED },
      { fields: [`status`] },
    );

    create_notification({ 
      from_id: you.id,
      to_id: delivery.owner_id,
      event: CARRY_EVENT_TYPES.CARRIER_LOCATION_REQUEST_DECLINED,
      target_type: CARRY_NOTIFICATION_TARGET_TYPES.DELIVERY,
      target_id: delivery.id,
    }).then(async (notification_model) => {
      const notification = await populate_carry_notification_obj(
        notification_model,
      );
      ExpoPushNotificationsService.sendUserPushNotification({
        user_id: notification.to_id,
        message: notification.message!,
        data: { delivery_id: delivery.id },
      });
      CommonSocketEventsHandler.emitEventToUserSockets({
        user_id: delivery.owner_id,
        event: CARRY_EVENT_TYPES.CARRIER_LOCATION_REQUEST_DECLINED,
        event_data: {
          data: {
            delivery_id: delivery.id,
            updates,
            carrier_tracking_request,
          },
          message: notification.message || `Carrier location request declined!`,
          user: you,
          notification,
        },
      });

      const to_phone_number =
        delivery.owner?.carry_settings?.phone || delivery.owner?.phone;
      if (!!to_phone_number && validatePhone(to_phone_number)) {
        send_sms({
          to_phone_number,
          message: notification.message,
        });
      }
    });

    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        message: `Carrier location request declined`,
        data: updates,
      },
    };
    return serviceMethodResults;
  }

  static async carrier_share_location(options: {
    you: UserEntity;
    delivery: DeliveryEntity;
  }) {
    const { you, delivery } = options;

    if (delivery.carrier_shared_location) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.BAD_REQUEST,
        error: true,
        info: {
          message: `Carrier already shared location`,
        },
      };
      return serviceMethodResults;
    }

    const updates = await set_delivery_carrier_shared_location(
      delivery.id,
      true,
    );

    create_notification({
      from_id: you.id,
      to_id: delivery.owner_id,
      event: CARRY_EVENT_TYPES.CARRIER_LOCATION_SHARED,
      target_type: CARRY_NOTIFICATION_TARGET_TYPES.DELIVERY,
      target_id: delivery.id,
    }).then(async (notification_model) => {
      const notification = await populate_carry_notification_obj(
        notification_model,
      );
      ExpoPushNotificationsService.sendUserPushNotification({
        user_id: notification.to_id,
        message: notification.message!,
        data: { delivery_id: delivery.id },
      });
      CommonSocketEventsHandler.emitEventToUserSockets({
        user_id: delivery.owner_id,
        event: CARRY_EVENT_TYPES.CARRIER_LOCATION_SHARED,
        event_data: {
          data: {
            delivery_id: delivery.id,
            updates,
          },
          message: notification.message || `Carrier location shared!`,
          user: you,
          notification,
        },
      });

      const to_phone_number =
        delivery.owner?.carry_settings?.phone || delivery.owner?.phone;
      if (!!to_phone_number && validatePhone(to_phone_number)) {
        send_sms({
          to_phone_number,
          message: notification.message,
        });
      }
    });

    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        message: `Carrier location shared`,
        data: updates,
      },
    };
    return serviceMethodResults;
  }

  static async carrier_unshare_location(options: {
    you: UserEntity;
    delivery: DeliveryEntity;
  }) {
    const { you, delivery } = options;

    if (!delivery.carrier_shared_location) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.BAD_REQUEST,
        error: true,
        info: {
          message: `Carrier not sharing location`,
        },
      };
      return serviceMethodResults;
    }

    const updates = await set_delivery_carrier_shared_location(
      delivery.id,
      false,
    );

    create_notification({
      from_id: you.id,
      to_id: delivery.owner_id,
      event: CARRY_EVENT_TYPES.CARRIER_LOCATION_UNSHARED,
      target_type: CARRY_NOTIFICATION_TARGET_TYPES.DELIVERY,
      target_id: delivery.id,
    }).then(async (notification_model) => {
      const notification = await populate_carry_notification_obj(
        notification_model,
      );
      ExpoPushNotificationsService.sendUserPushNotification({
        user_id: notification.to_id,
        message: notification.message!,
        data: { delivery_id: delivery.id },
      });
      CommonSocketEventsHandler.emitEventToUserSockets({
        user_id: delivery.owner_id,
        event: CARRY_EVENT_TYPES.CARRIER_LOCATION_UNSHARED,
        event_data: {
          data: {
            delivery_id: delivery.id,
            updates,
          },
          message: notification.message || `Carrier location unshared!`,
          user: you,
          notification,
        },
      });

      const to_phone_number =
        delivery.owner?.carry_settings?.phone || delivery.owner?.phone;
      if (!!to_phone_number && validatePhone(to_phone_number)) {
        send_sms({
          to_phone_number,
          message: notification.message,
        });
      }
    });

    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        message: `Carrier location unshared`,
        data: updates,
      },
    };
    return serviceMethodResults;
  }

  static async carrier_update_location(options: {
    you: UserEntity;
    delivery: DeliveryEntity;
    carrier_latest_lat: number;
    carrier_latest_lng: number;
  }) {
    const { you, delivery, carrier_latest_lat, carrier_latest_lng } = options;

    const updates = await set_delivery_carrier_lat_lng_location({
      id: delivery.id,
      carrier_latest_lat: carrier_latest_lat,
      carrier_latest_lng: carrier_latest_lng,
    });

    const new_tracking_location_update = await create_delivery_carrier_lat_lng_location_update({
      delivery_id: delivery.id,
      lat: carrier_latest_lat,
      lng: carrier_latest_lng,
    });

    /* 
      check if carrier is near pickup/dropoff and if not notified delivery owner before before
    */
    const carrier_distance_from_pickup = get_distance_haversine_distance({
      from_lat: carrier_latest_lat,
      from_lng: carrier_latest_lng,
      to_lat: delivery.from_lat,
      to_lng: delivery.from_lng,
    });
    const carrier_distance_from_dropoff = get_distance_haversine_distance({
      from_lat: carrier_latest_lat,
      from_lng: carrier_latest_lng,
      to_lat: delivery.to_lat,
      to_lng: delivery.to_lng,
    });

    const isWithinHalfMileOfPickup = carrier_distance_from_pickup <= 0.5;
    const isWithinHalfMileOfDropoff = carrier_distance_from_dropoff <= 0.5;

    const check_near_pickup_notified = await check_delivery_carrier_was_near_pickup(delivery.id);
    const check_near_dropoff_notified = await check_delivery_carrier_was_near_dropoff(delivery.id);
    
    if (!check_near_pickup_notified && isWithinHalfMileOfPickup) {
      // notify owner that carrier is near pickup
      create_notification_and_send({
        from_id: you.id,
        to_id: delivery.owner_id,
        event: CARRY_EVENT_TYPES.CARRIER_APPROACHING_PICKUP_LOCATION,
        target_type: CARRY_NOTIFICATION_TARGET_TYPES.DELIVERY,
        target_id: delivery.id,
  
        to_phone: delivery.owner.phone,
        send_mobile_push: true,
  
        extras_data: {
          delivery_id: delivery.id,
          user_id: you.id,
        },
      })
      .then((notification) => {
        // record this push notification
        LOGGER.info(`created event notification`, { notification });
        return create_delivery_carrier_was_near_pickup(delivery.id, you.id);
      })
      .then((pickup_notification) => {
        LOGGER.info(`created pickup approaching notification`, { pickup_notification });
      });
    }
    else if (!check_near_dropoff_notified && isWithinHalfMileOfDropoff) {
      // notify owner that carrier is near dropoff
      create_notification_and_send({
        from_id: you.id,
        to_id: delivery.owner_id,
        event: CARRY_EVENT_TYPES.CARRIER_APPROACHING_DROPOFF_LOCATION,
        target_type: CARRY_NOTIFICATION_TARGET_TYPES.DELIVERY,
        target_id: delivery.id,
  
        to_phone: delivery.owner.phone,
        send_mobile_push: true,
  
        extras_data: {
          delivery_id: delivery.id,
          user_id: you.id,
        },
      })
      .then((notification) => {
        // record this push notification
        LOGGER.info(`created event notification`, { notification });
        return create_delivery_carrier_was_near_dropoff(delivery.id, you.id);
      })
      .then((dropoff_notification) => {
        LOGGER.info(`created dropoff approaching notification`, { dropoff_notification });
      });
    }


    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        message: `Carrier location recorded`,
        data: new_tracking_location_update,
      },
    };
    return serviceMethodResults;
  }

  static async create_delivery_dispute(options: {
    you: UserEntity;
    delivery: DeliveryEntity;
    data: any;
    image: UploadedFile | string;
  }) {
    const { you, data, delivery, image } = options;

    const delivery_id = delivery.id;
    const creator_id = you.id;
    const user_id = (
      you.id === delivery.owner_id ? delivery.carrier_id : delivery.owner_id
    )!;

    const createObj: any = {
      creator_id,
      user_id,
      delivery_id,
      status: DeliveryDisputeStatus.OPEN,
    };

    // validate inputs
    const dataValidation = validateData({
      data,
      validators: create_delivery_dispute_required_props,
      mutateObj: createObj,
    });
    if (dataValidation.error) {
      return dataValidation;
    }

    const imageValidation = await AwsS3Service.uploadFile(image, {
      treatNotFoundAsError: false,
      mutateObj: createObj,
      validateAsImage: true,
      id_prop: 'image_id',
      link_prop: 'image_link',
    });
    if (imageValidation.error) {
      return imageValidation;
    }

    const new_dispute = await create_delivery_dispute(createObj);
    const to_phone =
      you.id === delivery.owner_id
        ? delivery.carrier?.carry_settings?.phone || delivery.carrier?.phone
        : delivery.owner?.carry_settings?.phone || delivery.owner?.phone;

    create_notification_and_send({
      from_id: you.id,
      to_id: user_id,
      event: CARRY_EVENT_TYPES.NEW_DELIVERY_DISPUTE,
      target_type: CARRY_NOTIFICATION_TARGET_TYPES.DELIVERY,
      target_id: delivery.id,

      to_phone,
      send_mobile_push: true,
      extras_data: {
        delivery_id: delivery.id,
        data: new_dispute,
        user_id: you.id,
        user: delivery.owner,
      },
    });

    // send internal email about new dispute
    try {
      sendAwsInternalEmail({
        subject: HandlebarsEmailsService.INTERNAL.new_delivery_dispute.subject(new_dispute.title),
        html: HandlebarsEmailsService.INTERNAL.new_delivery_dispute.template({ dispute: new_dispute }),
      })
      .catch((error) => {
        LOGGER.error(`Could not send internal email...`, error);
      });
    }
    catch (error) {
      LOGGER.error(`Could not send internal email; something went wrong...`, error);
    }

    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        message: `Dispute created!`,
        data: new_dispute,
      },
    };
    return serviceMethodResults;
  }

  static async create_delivery_dispute_log(options: {
    you: UserEntity;
    delivery: DeliveryEntity;
    delivery_dispute: DeliveryDisputeEntity;
    data: any;
    image: UploadedFile | string;
  }) {
    const { you, data, delivery, image, delivery_dispute } = options;

    const delivery_id = delivery.id;
    const creator_id = you.id;
    const user_id = (
      you.id === delivery.owner_id ? delivery.carrier_id : delivery.owner_id
    )!;

    const createObj: any = {
      creator_id,
      user_id,
      delivery_id,
      dispute_id: delivery_dispute.id,
    };

    // validate inputs
    const dataValidation = validateData({
      data,
      validators: create_delivery_dispute_log_required_props,
      mutateObj: createObj,
    });
    if (dataValidation.error) {
      return dataValidation;
    }

    const imageValidation = await AwsS3Service.uploadFile(image, {
      treatNotFoundAsError: false,
      mutateObj: createObj,
      validateAsImage: true,
      id_prop: 'image_id',
      link_prop: 'image_link',
    });
    if (imageValidation.error) {
      return imageValidation;
    }

    const new_dispute_log = await create_delivery_dispute_log(createObj);
    const to_phone =
      you.id === delivery.owner_id
        ? delivery.carrier?.carry_settings?.phone || delivery.carrier?.phone
        : delivery.owner?.carry_settings?.phone || delivery.owner?.phone;

    create_notification_and_send({
      from_id: you.id,
      to_id: user_id,
      event: CARRY_EVENT_TYPES.NEW_DELIVERY_DISPUTE_LOG,
      target_type: CARRY_NOTIFICATION_TARGET_TYPES.DELIVERY_DISPUTE,
      target_id: delivery_dispute.id,

      to_phone,
      send_mobile_push: true,

      extras_data: {
        delivery_id: delivery.id,
        dispute_id: delivery_dispute.id,
        data: new_dispute_log,
        user_id: you.id,
        user: delivery.owner,
      },
    });

    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        message: `Dispute log created!`,
        data: new_dispute_log,
      },
    };
    return serviceMethodResults;
  }

  static async create_delivery_dispute_customer_service_message(options: {
    you: UserEntity;
    delivery: DeliveryEntity;
    delivery_dispute: DeliveryDisputeEntity;
    data: any;
    image: UploadedFile | string;
  }) {
    const { you, data, delivery, image, delivery_dispute } = options;

    const delivery_id = delivery.id;
    const user_id = you.id;
    const createObj: any = {
      user_id,
      delivery_id,
      dispute_id: delivery_dispute.id,
    };

    data['is_from_cs'] = false;

    // validate inputs
    const dataValidation = validateData({
      data,
      validators:
        create_delivery_dispute_customer_support_message_required_props,
      mutateObj: createObj,
    });
    if (dataValidation.error) {
      return dataValidation;
    }

    const imageValidation = await AwsS3Service.uploadFile(image, {
      treatNotFoundAsError: false,
      mutateObj: createObj,
      validateAsImage: true,
      id_prop: 'image_id',
      link_prop: 'image_link',
    });
    if (imageValidation.error) {
      return imageValidation;
    }

    const new_dispute_message =
      await create_delivery_dispute_customer_service_message(createObj);
    const to_phone = undefined;

    // create_notification_and_send({
    //   from_id: you.id,
    //   to_id: user_id,
    //   event: CARRY_EVENT_TYPES.NEW_DELIVERY_DISPUTE_LOG,
    //       //   target_type: CARRY_NOTIFICATION_TARGET_TYPES.DELIVERY_DISPUTE,
    //   target_id: delivery_dispute.id,

    //
    //   to_phone,
    //   send_mobile_push: true,

    //   extras_data: {
    //     delivery_id: delivery.id,
    //     dispute_id: delivery_dispute.id,
    //     data: new_dispute_log,
    //     user_id: you.id,
    //     user: delivery.owner,
    //   },
    // });

    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        message: `Dispute Message Created!`,
        data: new_dispute_message,
      },
    };
    return serviceMethodResults;
  }

  static async make_delivery_dispute_settlement_offer(options: {
    you: UserEntity;
    delivery: DeliveryEntity;
    delivery_dispute: DeliveryDisputeEntity;
    data: any;
  }) {
    const { you, data, delivery, delivery_dispute } = options;

    const delivery_id = delivery.id;
    const creator_id = you.id;
    const user_id = (
      you.id === delivery.owner_id ? delivery.carrier_id : delivery.owner_id
    )!;

    const createObj: any = {
      creator_id,
      user_id,
      delivery_id,
      dispute_id: delivery_dispute.id,
      status: DeliveryDisputeSettlementOfferStatus.PENDING,
    };

    // validate inputs
    const dataValidation = validateData({
      data,
      validators: create_delivery_dispute_settlement_required_props,
      mutateObj: createObj,
    });
    if (dataValidation.error) {
      return dataValidation;
    }

    const new_offer = await create_delivery_dispute_settlement_offer(createObj);
    const to_phone =
      you.id === delivery.owner_id
        ? delivery.carrier?.carry_settings?.phone || delivery.carrier?.phone
        : delivery.owner?.carry_settings?.phone || delivery.owner?.phone;

    create_notification_and_send({
      from_id: you.id,
      to_id: user_id,
      event: CARRY_EVENT_TYPES.DELIVERY_DISPUTE_SETTLEMENT_OFFER,
      target_type: CARRY_NOTIFICATION_TARGET_TYPES.DELIVERY_DISPUTE,
      target_id: delivery_dispute.id,

      to_phone,
      send_mobile_push: true,

      extras_data: {
        delivery_id: delivery.id,
        dispute_id: delivery_dispute.id,
        data: new_offer,
        user_id: you.id,
        user: delivery.owner,
      },
    });

    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        message: `Dispute Settlement Offer created!`,
        data: new_offer,
      },
    };
    return serviceMethodResults;
  }

  static async cancel_delivery_dispute_settlement_offer(options: {
    you: UserEntity;
    delivery: DeliveryEntity;
    delivery_dispute: DeliveryDisputeEntity;
    settlement_offer: DeliveryDisputeSettlementOfferEntity;
  }) {
    const { you, delivery, delivery_dispute, settlement_offer } = options;

    const delivery_id = delivery.id;
    const creator_id = you.id;
    const user_id = (
      you.id === delivery.owner_id ? delivery.carrier_id : delivery.owner_id
    )!;

    const updates = await update_delivery_dispute_settlement_offer_status(
      settlement_offer.id,
      DeliveryDisputeSettlementOfferStatus.CANCELED,
    );
    const to_phone =
      you.id === delivery.owner_id
        ? delivery.carrier?.carry_settings?.phone || delivery.carrier?.phone
        : delivery.owner?.carry_settings?.phone || delivery.owner?.phone;

    create_notification_and_send({
      from_id: you.id,
      to_id: user_id,
      event: CARRY_EVENT_TYPES.DELIVERY_DISPUTE_SETTLEMENT_OFFER_CANCELED,
      target_type: CARRY_NOTIFICATION_TARGET_TYPES.DELIVERY_DISPUTE,
      target_id: delivery_dispute.id,

      to_phone,
      send_mobile_push: true,

      extras_data: {
        delivery_id: delivery.id,
        dispute_id: delivery_dispute.id,
        data: updates,
        user_id: you.id,
        user: delivery.owner,
      },
    });

    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        message: `Dispute Settlement Offer canceled`,
        data: updates,
      },
    };
    return serviceMethodResults;
  }

  static async accept_delivery_dispute_settlement_offer(options: {
    you: UserEntity;
    delivery: DeliveryEntity;
    delivery_dispute: DeliveryDisputeEntity;
    settlement_offer: DeliveryDisputeSettlementOfferEntity;
    payment_method_id: string;
  }) {
    // verify needed data/inputs
    const {
      you,
      delivery,
      delivery_dispute,
      settlement_offer,
      payment_method_id,
    } = options;
    const delivery_id = delivery.id;
    const creator_id = you.id;
    const user_id = (
      you.id === delivery.owner_id ? delivery.carrier_id : delivery.owner_id
    )!;
    const user = (
      you.id === delivery.owner_id ? delivery.carrier : delivery.owner
    )!;
    if (!user) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.BAD_REQUEST,
        error: true,
        info: {
          message: `Settlement creator's user info not found`,
        },
      };
      return serviceMethodResults;
    }

    // verify payment method belongs to user
    const user_payment_methods =
      await UsersService.get_user_customer_cards_payment_methods(
        you.stripe_customer_account_id,
      );
    const payment_methods = user_payment_methods.info
      .data! as Stripe.PaymentMethod[];
    const pm = payment_methods.find((p) => p.id === payment_method_id);
    if (!pm) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.BAD_REQUEST,
        error: true,
        info: {
          message: `Payment method not attached to user's stripe account`,
        },
      };
      return serviceMethodResults;
    }

    // charge the payment method
    const is_subscription_active = (
      await UsersService.is_subscription_active(you)
    ).info.data as boolean;
    const chargeFeeData = StripeService.add_on_stripe_processing_fee(
      settlement_offer.offer_amount,
      is_subscription_active,
    );
    const new_payment_intent: Stripe.PaymentIntent =
      await StripeService.stripe.paymentIntents.create({
        description: `${process.env.APP_NAME} - dispute settlement for delivery: ${delivery.title}`,
        amount: chargeFeeData.final_total,
        currency: 'usd',
        customer: you.stripe_customer_account_id,
        payment_method: payment_method_id,
        off_session: true,
        confirm: true,
        metadata: {
          delivery_id,
          dispuute_id: delivery_dispute.id,
          settlement_offer_id: settlement_offer.id,
        },
      });
    const payment_intent = await StripeService.stripe.paymentIntents.retrieve(
      new_payment_intent.id,
      { expand: ['charges'] },
    );
    // record the transaction
    const payment_action = await StripeActions.create({
      action_event: STRIPE_ACTION_EVENTS.PAYMENT_INTENT,
      action_id: payment_intent.id,

      action_metadata: null,
      target_type:
        CARRY_NOTIFICATION_TARGET_TYPES.DELIVERY_DISPUTE_SETTLEMENT_OFFER,
      target_id: settlement_offer.id,
      target_metadata: null,
      status: TRANSACTION_STATUS.COMPLETED,
    });

    const charge = await StripeService.stripe.charges.retrieve(payment_intent.latest_charge as string);
    // const was_subscribed: boolean = payment_intent.metadata['was_subscribed'] === 'true' ? true : false;
    // const chargeFeeData = StripeService.add_on_stripe_processing_fee(delivery.payout, was_subscribed);
    console.log({ charge }, JSON.stringify({ charge }));

    // payment went throough successfully, transfer to recipient stripe account
    const transferAmount = settlement_offer.offer_amount * 100;
    const transfer = await StripeService.stripe.transfers.create({
      description: `${process.env.APP_NAME} - dispute settlement for delivery: ${delivery.title}`,
      amount: transferAmount,
      currency: 'usd',
      destination: user.stripe_account_id,
      source_transaction: charge.id,

      metadata: {
        delivery_id,
        dispuute_id: delivery_dispute.id,
        settlement_offer_id: settlement_offer.id,
        transfer_event:
          CARRY_EVENT_TYPES.DELIVERY_DISPUTE_SETTLEMENT_OFFER_ACCEPTED,
        target_type:
          CARRY_NOTIFICATION_TARGET_TYPES.DELIVERY_DISPUTE_SETTLEMENT_OFFER,
      },
    });
    // record the transfer
    const transfer_action = await StripeActions.create({
      action_event: STRIPE_ACTION_EVENTS.TRANSFER,
      action_id: transfer.id,

      action_metadata: null,
      target_type: CARRY_NOTIFICATION_TARGET_TYPES.DELIVERY_DISPUTE,
      target_id: delivery_dispute.id,
      target_metadata: null,
      status: TRANSACTION_STATUS.COMPLETED,
    });

    // charge and transfer completed, mark settlement as accepted
    const new_offer = await update_delivery_dispute_settlement_offer_status(
      settlement_offer.id,
      DeliveryDisputeSettlementOfferStatus.ACCEPTED,
    );

    const to_phone =
      you.id === delivery.owner_id
        ? delivery.carrier?.carry_settings?.phone || delivery.carrier?.phone
        : delivery.owner?.carry_settings?.phone || delivery.owner?.phone;

    // mark dispute as as resolved
    const dispute_updated = await update_delivery_dispute(delivery_dispute.id, {
      status: DeliveryDisputeStatus.RESOLVED,
    });

    // mark delivery as completed
    const delivery_completed =
      await DeliveriesService.mark_delivery_as_completed({
        you_id: delivery.owner_id,
        delivery,
      });

    if (delivery_completed.error) {
      return delivery_completed;
    }

    // notify other user
    create_notification_and_send({
      from_id: you.id,
      to_id: user_id,
      event: CARRY_EVENT_TYPES.DELIVERY_DISPUTE_SETTLEMENT_OFFER_ACCEPTED,
      target_type: CARRY_NOTIFICATION_TARGET_TYPES.DELIVERY_DISPUTE,
      target_id: delivery_dispute.id,

      to_phone,
      send_mobile_push: true,

      extras_data: {
        delivery_id: delivery.id,
        dispute_id: delivery_dispute.id,
        settlement_offer_id: settlement_offer.id,
        data: new_offer,
        user_id: you.id,
        user: delivery.owner,
      },
    });

    // return response
    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        message: `Dispute Settlement Offer Accepted!`,
        data: new_offer,
      },
    };
    return serviceMethodResults;
  }

  static async decline_delivery_dispute_settlement_offer(options: {
    you: UserEntity;
    delivery: DeliveryEntity;
    delivery_dispute: DeliveryDisputeEntity;
    settlement_offer: DeliveryDisputeSettlementOfferEntity;
  }) {
    const { you, delivery, delivery_dispute, settlement_offer } = options;

    const delivery_id = delivery.id;
    const creator_id = you.id;
    const user_id = (
      you.id === delivery.owner_id ? delivery.carrier_id : delivery.owner_id
    )!;

    const new_offer = await update_delivery_dispute_settlement_offer_status(
      settlement_offer.id,
      DeliveryDisputeSettlementOfferStatus.DECLINED,
    );
    const to_phone =
      you.id === delivery.owner_id
        ? delivery.carrier?.carry_settings?.phone || delivery.carrier?.phone
        : delivery.owner?.carry_settings?.phone || delivery.owner?.phone;

    create_notification_and_send({
      from_id: you.id,
      to_id: user_id,
      event: CARRY_EVENT_TYPES.DELIVERY_DISPUTE_SETTLEMENT_OFFER_DECLINED,
      target_type: CARRY_NOTIFICATION_TARGET_TYPES.DELIVERY_DISPUTE,
      target_id: delivery_dispute.id,

      to_phone,
      send_mobile_push: true,

      extras_data: {
        delivery_id: delivery.id,
        dispute_id: delivery_dispute.id,
        data: new_offer,
        user_id: you.id,
        user: delivery.owner,
      },
    });

    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        message: `Dispute Settlement Offer declined`,
        data: new_offer,
      },
    };
    return serviceMethodResults;
  }

  static async make_delivery_dispute_settlement_invoice(
    you: UserEntity,
    delivery: DeliveryEntity,
    data: any,
  ) {}

  static async get_delivery_dispute_info_by_delivery_id(dispute_id: number) {
    const results = await get_delivery_dispute_info_by_delivery_id(dispute_id);

    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        data: results,
      },
    };
    return serviceMethodResults;
  }

  static async get_user_dispute_messages_by_user_id_and_dispute_id(
    dispute_id: number,
    user_id: number,
  ) {
    const results = await get_user_dispute_messages_by_user_id_and_dispute_id(
      dispute_id,
      user_id,
    );

    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        data: results,
      },
    };
    return serviceMethodResults;
  }

  static async get_customer_ratings_stats(user_id: number) {
    const results = await get_customer_ratings_stats(user_id);

    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        data: results,
      },
    };
    return serviceMethodResults;
  }

  static async get_customer_ratings_all(user_id: number) {
    const resultsList = await get_customer_ratings_all(user_id);
    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        data: resultsList,
      },
    };
    return serviceMethodResults;
  }

  static async get_customer_ratings(user_id: number, min_id?: number) {
    const resultsList = await get_customer_ratings(user_id, min_id);
    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        data: resultsList,
      },
    };
    return serviceMethodResults;
  }

  static async get_carrier_ratings_stats(user_id: number) {
    const results = await get_carrier_ratings_stats(user_id);

    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        data: results,
      },
    };
    return serviceMethodResults;
  }

  static async get_carrier_ratings_all(user_id: number) {
    const resultsList = await get_carrier_ratings_all(user_id);
    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        data: resultsList,
      },
    };
    return serviceMethodResults;
  }

  static async get_carrier_ratings(user_id: number, min_id?: number) {
    const resultsList = await get_carrier_ratings(user_id, min_id);
    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        data: resultsList,
      },
    };
    return serviceMethodResults;
  }

  static async get_carrier_delivery_requests_all(delivery_id: number) {
    const results = await get_carrier_delivery_requests_all(delivery_id);

    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        data: results,
      },
    };
    return serviceMethodResults;
  }

  static async get_carrier_delivery_requests(delivery_id: number, carrier_request_id?: number) {
    const results = await get_carrier_delivery_requests(delivery_id);

    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        data: results,
      },
    };
    return serviceMethodResults;
  }

  static async check_carrier_delivery_request(delivery_id: number, user_id: number) {
    const results = await check_carrier_delivery_request(delivery_id, user_id);

    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        data: results,
      },
    };
    return serviceMethodResults;
  }

  static async check_carrier_delivery_request_pending(delivery_id: number, user_id: number) {
    const results = await check_carrier_delivery_request_pending(delivery_id, user_id);

    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        data: results,
      },
    };
    return serviceMethodResults;
  }

  static async create_carrier_delivery_request(delivery_id: number, you_id: number) {
    // assume route guards checked for validations

    const new_request = await create_carrier_delivery_request(delivery_id, you_id);
    
    get_delivery_owner_by_delivery_id(delivery_id).then((owner) => {
      create_notification_and_send({
        from_id: you_id,
        to_id: owner.id,
        event: CARRY_EVENT_TYPES.CARRIER_DELIVERY_REQUEST,
        target_type: CARRY_NOTIFICATION_TARGET_TYPES.DELIVERY,
        target_id: delivery_id,
  
        to_phone: owner.phone,
        send_mobile_push: true,
  
        extras_data: {
          delivery_id: delivery_id,
          data: new_request,
          user_id: you_id,
        },
      });
    });

    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        message: `Request sent!`,
        data: new_request,
      },
    };
    return serviceMethodResults;
  }

  static async cancel_carrier_delivery_request(carrier_request: DeliveryCarrierRequestEntity, you_id: number) {
    // assume route guards checked for validations

    const updates = await update_carrier_delivery_request_status(carrier_request.id, STATUSES.CANCELED);
    
    create_notification_and_send({
      from_id: you_id,
      to_id: carrier_request.delivery!.owner_id,
      event: CARRY_EVENT_TYPES.CARRIER_DELIVERY_REQUEST_CANCELED,
      target_type: CARRY_NOTIFICATION_TARGET_TYPES.DELIVERY,
      target_id: carrier_request.delivery_id,

      to_phone: carrier_request.delivery!.owner!.phone,
      send_mobile_push: true,

      extras_data: {
        delivery_id: carrier_request.delivery_id,
        carrier_request_id: carrier_request.id,
        user_id: you_id,
      },
    });

    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        message: `Request canceled`,
        data: updates.model,
      },
    };
    return serviceMethodResults;
  }

  static async accept_carrier_delivery_request(carrier_request: DeliveryCarrierRequestEntity, you_id: number) {
    // assume route guards checked for validations

    // mark request as accepted
    const updates = await update_carrier_delivery_request_status(carrier_request.id, STATUSES.ACCEPTED);
    
    // get all carrier requests for the delivery
    const carrier_requests: DeliveryCarrierRequestEntity[] = await get_carrier_delivery_requests_all(carrier_request.delivery_id);
    // filter for pending requests that is NOT this one
    const use_carrier_requests = carrier_requests.filter(r => r.id !== carrier_request.id && r.status === STATUSES.PENDING);
    // for each carrier request:
    for (const request of use_carrier_requests) {
      DeliveriesService.decline_carrier_delivery_request(request, you_id);
    }
    
    
    // assign the delivery to requested carrier
    DeliveriesService.assign_delivery({
      you: carrier_request.carrier!,
      delivery: carrier_request.delivery
    })
    .then((results) => {
      LOGGER.info(`assigned delivery to accepted carrier`, results);
    });
    
    // send accepted notification
    create_notification_and_send({
      from_id: you_id,
      to_id: carrier_request.user_id,
      event: CARRY_EVENT_TYPES.CARRIER_DELIVERY_REQUEST_ACCEPTED,
      target_type: CARRY_NOTIFICATION_TARGET_TYPES.DELIVERY,
      target_id: carrier_request.delivery_id,

      to_phone: carrier_request.carrier!.phone,
      send_mobile_push: true,

      extras_data: {
        delivery_id: carrier_request.delivery_id,
      },
    });

    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        data: updates.model,
      },
    };
    return serviceMethodResults;
  }

  static async decline_carrier_delivery_request(carrier_request: DeliveryCarrierRequestEntity, you_id: number) {
    // assume route guards checked for validations

    const updates = await update_carrier_delivery_request_status(carrier_request.id, STATUSES.DECLINED);
    
    create_notification_and_send({
      from_id: you_id,
      to_id: carrier_request.user_id,
      event: CARRY_EVENT_TYPES.CARRIER_DELIVERY_REQUEST_DECLINED,
      target_type: CARRY_NOTIFICATION_TARGET_TYPES.DELIVERY,
      target_id: carrier_request.delivery_id,

      to_phone: carrier_request.carrier!.phone,
      send_mobile_push: true,

      extras_data: {
        delivery_id: carrier_request.delivery_id,
        carrier_request_id: carrier_request.id,
      },
    });

    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        data: updates.model,
      },
    };
    return serviceMethodResults;
  }
}
