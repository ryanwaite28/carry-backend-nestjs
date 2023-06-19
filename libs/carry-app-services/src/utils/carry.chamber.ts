import { cities_map } from '../assets/cities';
import { countries_by_name_map } from '../assets/countries';
import { states_map } from '../assets/states';
import { zipcodes_map } from '../assets/zipcodes';
import { IModelValidator } from '../interfaces/common.interface';
import { CARRY_EVENT_TYPES } from "../enums/carry.enum";
import { get_delivery_by_id, get_delivery_tracking_update_by_id, get_delivery_dispute_by_id } from "../repos/deliveries.repo";
import { get_user_by_id } from "../repos/users.repo";
import { getUserFullName } from "./helpers.utils";
import { genericTextValidator, stripeValidators, numberValidator, booleanValidator, validatePersonName, phoneValidator, validateEmail } from "./validators.utils";
import * as moment from 'moment';
import { DeliveryDisputeEntity, DeliveryEntity, NotificationEntity, UserEntity } from '../entities/carry.entity';
import { IMyModel } from '../interfaces/carry.interface';


export const delivery_attrs_slim = [
  "id",
  "owner_id",
  "carrier_id",
  "title",
  "desc",
  "tags",
  "item_image_link",
  "item_image_id",
];

export const sizes = ["X-SMALL", "SMALL", "MEDIUM", "LARGE", "X-LARGE"];

const payout_min = 3;

export const create_delivery_required_props: IModelValidator[] = [
  { field: "title", name: "Title", validator: genericTextValidator },
  {
    field: "description",
    name: "Description",
    validator: genericTextValidator,
  },
  {
    field: "payment_method_id",
    name: "Payment Method Id",
    validator: stripeValidators.paymentMethodId,
  },
  { field: "size", name: "Size", validator: (arg: any) => sizes.includes(arg) },
  { field: "weight", name: "Weight", validator: numberValidator },
  {
    field: "distance_miles",
    name: "Distance (Miles)",
    validator: numberValidator,
  },
  {
    field: "payout",
    name: "Payout",
    validator: (arg) => numberValidator(arg) && arg > payout_min,
  },
  { field: "penalty", name: "Penalty", validator: numberValidator },
  {
    field: "auto_accept_anyone",
    name: "Auto-Accept Anyone",
    validator: booleanValidator,
  },
  { field: "urgent", name: "Urgent", validator: booleanValidator },

  {
    field: "from_location",
    name: "From Location",
    validator: genericTextValidator,
  },
  {
    field: "from_address",
    name: "From Address",
    validator: genericTextValidator,
  },
  {
    field: "from_street",
    name: "From Street",
    validator: (arg) => /^[a-zA-Z0-9\s]+$/.test(arg),
  },
  {
    field: "from_city",
    name: "From City",
    validator: (arg) => !!arg && typeof arg === 'string' // cities_map.has(arg),
  },
  {
    field: "from_state",
    name: "From State",
    validator: (arg) => states_map.has(arg),
  },
  {
    field: "from_zipcode",
    name: "From Zipcode",
    validator: (arg) => !!arg && zipcodes_map.has(arg.toString()),
  },
  {
    field: "from_country",
    name: "From Country",
    validator: (arg) => countries_by_name_map.has(arg && arg.toLowerCase()),
  },
  {
    field: "from_place_id",
    name: "From Place ID",
    validator: genericTextValidator,
  },
  { field: "from_lat", name: "From Latitude", validator: numberValidator },
  { field: "from_lng", name: "From Longitude", validator: numberValidator },

  { field: "from_person", name: "From Person", validator: validatePersonName },
  {
    field: "from_person_phone",
    name: "From Person Phone",
    validator: (arg: any) => arg === "" || phoneValidator(arg),
  },
  {
    field: "from_person_email",
    name: "From Person Email",
    validator: (arg: any) => arg === "" || validateEmail(arg),
  },
  {
    field: "from_person_id_required",
    name: "From Person ID Required",
    validator: booleanValidator,
  },
  {
    field: "from_person_sig_required",
    name: "From Person Signature Required",
    validator: booleanValidator,
  },

  {
    field: "to_location",
    name: "To Location",
    validator: genericTextValidator,
  },
  { field: "to_address", name: "To Address", validator: genericTextValidator },
  {
    field: "to_street",
    name: "To Street",
    validator: (arg) => /^[a-zA-Z0-9\s]+$/.test(arg),
  },
  {
    field: "to_city",
    name: "To City",
    validator: (arg) => !!arg && typeof arg === 'string' // cities_map.has(arg),
  },
  {
    field: "to_state",
    name: "To State",
    validator: (arg) => states_map.has(arg),
  },
  {
    field: "to_zipcode",
    name: "To Zipcode",
    validator: (arg) => !!arg && zipcodes_map.has(arg.toString()),
  },
  {
    field: "to_country",
    name: "To Country",
    validator: (arg) => countries_by_name_map.has(arg && arg.toLowerCase()),
  },
  {
    field: "to_place_id",
    name: "To Place ID",
    validator: genericTextValidator,
  },
  { field: "to_lat", name: "To Latitude", validator: numberValidator },
  { field: "to_lng", name: "To Longitude", validator: numberValidator },

  { field: "to_person", name: "To Person", validator: validatePersonName },
  {
    field: "to_person_phone",
    name: "To Person Phone",
    validator: (arg: any) => arg === "" || phoneValidator(arg),
  },
  {
    field: "to_person_email",
    name: "To Person Email",
    validator: (arg: any) => arg === "" || validateEmail(arg),
  },
  {
    field: "to_person_id_required",
    name: "To Person ID Required",
    validator: booleanValidator,
  },
  {
    field: "to_person_sig_required",
    name: "To Person Signature Required",
    validator: booleanValidator,
  },
];

export const update_delivery_required_props: IModelValidator[] = [
  { field: "title", name: "Title", validator: genericTextValidator },
  {
    field: "description",
    name: "Description",
    validator: genericTextValidator,
  },
  { field: "size", name: "Size", validator: (arg: any) => sizes.includes(arg) },
  { field: "weight", name: "Weight", validator: numberValidator },
  {
    field: "distance_miles",
    name: "Distance (Miles)",
    validator: numberValidator,
  },
  // {
  //   field: "auto_accept_anyone",
  //   name: "Auto-Accept Anyone",
  //   validator: booleanValidator,
  // },
  // { field: "urgent", name: "Urgent", validator: booleanValidator },
  {
    field: "payout",
    name: "Payout",
    validator: (arg) => numberValidator(arg) && arg > payout_min,
  },
  { field: "penalty", name: "Penalty", validator: numberValidator },

  {
    field: "from_location",
    name: "From Location",
    validator: genericTextValidator,
  },
  {
    field: "from_address",
    name: "From Address",
    validator: genericTextValidator,
  },
  {
    field: "from_street",
    name: "From Street",
    validator: (arg) => /^[a-zA-Z0-9\s]+$/.test(arg),
  },
  {
    field: "from_city",
    name: "From City",
    validator: (arg) => cities_map.has(arg),
  },
  {
    field: "from_state",
    name: "From State",
    validator: (arg) => states_map.has(arg),
  },
  {
    field: "from_zipcode",
    name: "From Zipcode",
    validator: (arg) => !!arg && zipcodes_map.has(arg.toString()),
  },
  {
    field: "from_country",
    name: "From Country",
    validator: (arg) => countries_by_name_map.has(arg && arg.toLowerCase()),
  },
  {
    field: "from_place_id",
    name: "From Place ID",
    validator: genericTextValidator,
  },
  { field: "from_lat", name: "From Latitude", validator: numberValidator },
  { field: "from_lng", name: "From Longitude", validator: numberValidator },
  { field: "from_person", name: "From Person", validator: validatePersonName },
  {
    field: "from_person_phone",
    name: "From Person Phone",
    validator: (arg: any) => arg === "" || phoneValidator(arg),
  },
  {
    field: "from_person_email",
    name: "From Person Email",
    validator: (arg: any) => arg === "" || validateEmail(arg),
  },
  {
    field: "from_person_id_required",
    name: "From Person ID Required",
    validator: booleanValidator,
  },
  {
    field: "from_person_sig_required",
    name: "From Person Signature Required",
    validator: booleanValidator,
  },

  {
    field: "to_location",
    name: "To Location",
    validator: genericTextValidator,
  },
  { field: "to_address", name: "To Address", validator: genericTextValidator },
  {
    field: "to_street",
    name: "To Street",
    validator: (arg) => /^[a-zA-Z0-9\s]+$/.test(arg),
  },
  {
    field: "to_city",
    name: "To City",
    validator: (arg) => cities_map.has(arg),
  },
  {
    field: "to_state",
    name: "To State",
    validator: (arg) => states_map.has(arg),
  },
  {
    field: "to_zipcode",
    name: "To Zipcode",
    validator: (arg) => !!arg && zipcodes_map.has(arg.toString()),
  },
  {
    field: "to_country",
    name: "To Country",
    validator: (arg) => countries_by_name_map.has(arg && arg.toLowerCase()),
  },
  {
    field: "to_place_id",
    name: "To Place ID",
    validator: genericTextValidator,
  },
  { field: "to_lat", name: "To Latitude", validator: numberValidator },
  { field: "to_lng", name: "To Longitude", validator: numberValidator },
  { field: "to_person", name: "To Person", validator: validatePersonName },
  {
    field: "to_person_phone",
    name: "To Person Phone",
    validator: (arg: any) => arg === "" || phoneValidator(arg),
  },
  {
    field: "to_person_email",
    name: "To Person Email",
    validator: (arg: any) => arg === "" || validateEmail(arg),
  },
  {
    field: "to_person_id_required",
    name: "To Person ID Required",
    validator: booleanValidator,
  },
  {
    field: "to_person_sig_required",
    name: "To Person Signature Required",
    validator: booleanValidator,
  },
];

export const create_delivery_tracking_update_required_props: IModelValidator[] =
  [
    { field: "message", name: "Message", validator: genericTextValidator },
    {
      field: "location",
      optional: true,
      name: "Location",
      validator: genericTextValidator,
    },
    {
      field: "carrier_lat",
      name: "Carrier's Latitude",
      validator: numberValidator,
    },
    {
      field: "carrier_lng",
      name: "Carrier's Longitude",
      validator: numberValidator,
    },
  ];

export const deliveryme_user_settings_required_props: {
  field: string;
  name: string;
  validator: (arg: any) => boolean;
}[] = [
  {
    field: "phone",
    name: "Phone",
    validator: (arg: any) => arg === "" || phoneValidator(arg),
  },
  {
    field: "email",
    name: "Email",
    validator: (arg: any) => arg === "" || validateEmail(arg),
  },
  {
    field: "cashapp_tag",
    name: "$CashApp Tag",
    validator: (arg: any) => arg === "" || genericTextValidator(arg),
  },
  {
    field: "venmo_id",
    name: "Venmo @",
    validator: (arg: any) => arg === "" || genericTextValidator(arg),
  },
  {
    field: "paypal_me",
    name: "Paypal.Me Link",
    validator: (arg: any) => arg === "" || genericTextValidator(arg),
  },
  {
    field: "google_pay",
    name: "Google Pay (name/phone/id/etc)",
    validator: (arg: any) => arg === "" || genericTextValidator(arg),
  },
];

export const delivery_carrier_review_required_props: {
  field: string;
  name: string;
  validator: (arg: any) => boolean;
}[] = [
  {
    field: "rating",
    name: "Rating",
    validator: (arg) => numberValidator(arg) && [1,2,3,4,5].includes(arg),
  },
  {
    field: "title",
    name: "Title",
    validator: (arg: any) => !arg || genericTextValidator(arg),
  },
  {
    field: "summary",
    name: "Summary",
    validator: (arg: any) => !arg || genericTextValidator(arg),
  },
];

export const create_delivery_dispute_required_props: {
  field: string;
  name: string;
  validator: (arg: any) => boolean;
}[] = [
  {
    field: "title",
    name: "Title",
    validator: (arg: any) => genericTextValidator(arg),
  },
  {
    field: "details",
    name: "Details",
    validator: (arg: any) => genericTextValidator(arg),
  },
  {
    field: "compensation",
    name: "Compentation",
    validator: (arg) => numberValidator(arg) && arg >= 1,
  },
];

export const create_delivery_dispute_log_required_props: {
  field: string;
  name: string;
  validator: (arg: any) => boolean;
}[] = [
  {
    field: "body",
    name: "Body",
    validator: (arg: any) => genericTextValidator(arg),
  },
];

export const create_delivery_dispute_customer_support_message_required_props: {
  field: string;
  name: string;
  validator: (arg: any) => boolean;
}[] = [
  {
    field: "body",
    name: "Body",
    validator: (arg: any) => genericTextValidator(arg),
  },
  {
    field: "is_from_cs",
    name: "Is From Customer Support Flag",
    validator: (arg: any) => booleanValidator(arg),
  },
];

export const create_delivery_dispute_settlement_required_props: {
  field: string;
  name: string;
  validator: (arg: any) => boolean;
}[] = [
  {
    field: "message",
    name: "Message",
    validator: (arg: any) => genericTextValidator(arg),
  },
  {
    field: "offer_amount",
    name: "Offer Amount",
    validator: (arg) => numberValidator(arg) && arg >= 1,
  },
];

export const populate_carry_notification_obj = async (
  notification_model: IMyModel
) => {
  console.log(`populate_deliverme_notification_obj attempt ==========`);

  const notificationObj = notification_model.toJSON() as NotificationEntity | any;
  const user_model = await get_user_by_id(notificationObj.from_id);
  const full_name = getUserFullName(<UserEntity> user_model!);
  let message = "";
  let mount_prop_key = "";
  let mount_value = null;

  switch (notificationObj.event) {
    case CARRY_EVENT_TYPES.CARRIER_DELIVERY_REQUEST: {
      const delivery: DeliveryEntity | null = await get_delivery_by_id(
        notificationObj.target_id
      );
      message = `${full_name} is requesting to fulfill your delivery: ${delivery!.title}`;
      mount_prop_key = "delivery";
      mount_value = delivery!;
      break;
    }
    case CARRY_EVENT_TYPES.CARRIER_DELIVERY_REQUEST_CANCELED: {
      const delivery: DeliveryEntity | null = await get_delivery_by_id(
        notificationObj.target_id
      );
      message = `${full_name} canceled their request to fulfill your delivery: ${delivery!.title}`;
      mount_prop_key = "delivery";
      mount_value = delivery!;
      break;
    }
    case CARRY_EVENT_TYPES.CARRIER_DELIVERY_REQUEST_ACCEPTED: {
      const delivery: DeliveryEntity | null = await get_delivery_by_id(
        notificationObj.target_id
      );
      message = `${full_name} accepted your request to fulfill their delivery: ${delivery!.title}`;
      mount_prop_key = "delivery";
      mount_value = delivery!;
      break;
    }
    case CARRY_EVENT_TYPES.CARRIER_DELIVERY_REQUEST_DECLINED: {
      const delivery: DeliveryEntity | null = await get_delivery_by_id(
        notificationObj.target_id
      );
      message = `${full_name} declined your request to fulfill their delivery: ${delivery!.title}`;
      mount_prop_key = "delivery";
      mount_value = delivery!;
      break;
    }
    case CARRY_EVENT_TYPES.CARRIER_ASSIGNED: {
      const delivery: DeliveryEntity | null = await get_delivery_by_id(
        notificationObj.target_id
      );
      message = `${full_name} is now handling your delivery: ${
        delivery!.title
      }`;
      mount_prop_key = "delivery";
      mount_value = delivery!;
      break;
    }
    case CARRY_EVENT_TYPES.CARRIER_UNASSIGNED: {
      const delivery: DeliveryEntity | null = await get_delivery_by_id(
        notificationObj.target_id
      );
      message = `${full_name} canceled your delivery: ${delivery!.title}`;
      mount_prop_key = "delivery";
      mount_value = delivery!;
      break;
    }
    case CARRY_EVENT_TYPES.CARRIER_MARKED_AS_PICKED_UP: {
      const delivery: DeliveryEntity | null = await get_delivery_by_id(
        notificationObj.target_id
      );
      message = `${full_name} picked up your delivery: ${delivery!.title}`;
      mount_prop_key = "delivery";
      mount_value = delivery!;
      break;
    }
    case CARRY_EVENT_TYPES.CARRIER_MARKED_AS_DROPPED_OFF: {
      const delivery: DeliveryEntity | null = await get_delivery_by_id(
        notificationObj.target_id
      );
      message = `${full_name} dropped off your delivery: ${
        delivery!.title
      }. Please confirm and pay the carrier.`;
      mount_prop_key = "delivery";
      mount_value = delivery!;
      break;
    }
    case CARRY_EVENT_TYPES.DELIVERY_ADD_COMPLETED_PICTURE: {
      const delivery: DeliveryEntity | null = await get_delivery_by_id(
        notificationObj.target_id
      );
      message = `${full_name} added a picture to complete delivery: ${
        delivery!.title
      }`;
      mount_prop_key = "delivery";
      mount_value = delivery!;
      break;
    }
    case CARRY_EVENT_TYPES.DELIVERY_COMPLETED: {
      const delivery: DeliveryEntity | null = await get_delivery_by_id(
        notificationObj.target_id
      );
      message = `${full_name} completed the delivery: ${
        delivery!.title
      }.`;
      mount_prop_key = "delivery";
      mount_value = delivery!;
      break;
    }
    case CARRY_EVENT_TYPES.DELIVERY_RETURNED: {
      const delivery: DeliveryEntity | null = await get_delivery_by_id(
        notificationObj.target_id
      );
      message = `${full_name} returned the delivery: ${delivery!.title}`;
      mount_prop_key = "delivery";
      mount_value = delivery!;
      break;
    }
    case CARRY_EVENT_TYPES.DELIVERY_NEW_MESSAGE: {
      const delivery: DeliveryEntity | null = await get_delivery_by_id(
        notificationObj.target_id
      );
      message = `${full_name} added a message to the delivery: ${
        delivery!.title
      }`;
      mount_prop_key = "delivery";
      mount_value = delivery!;
      break;
    }

    case CARRY_EVENT_TYPES.CARRIER_LOCATION_REQUESTED: {
      const delivery: DeliveryEntity | null = await get_delivery_by_id(
        notificationObj.target_id
      );
      message = `${full_name} requested to track your location for delivery: ${
        delivery!.title
      }`;
      mount_prop_key = "delivery";
      mount_value = delivery!;
      break;
    }
    case CARRY_EVENT_TYPES.CARRIER_LOCATION_REQUEST_CANCELED: {
      const delivery: DeliveryEntity | null = await get_delivery_by_id(
        notificationObj.target_id
      );
      message = `${full_name} canceled the request to track your location for delivery: ${
        delivery!.title
      }`;
      mount_prop_key = "delivery";
      mount_value = delivery!;
      break;
    }
    case CARRY_EVENT_TYPES.CARRIER_LOCATION_REQUEST_ACCEPTED: {
      const delivery: DeliveryEntity | null = await get_delivery_by_id(
        notificationObj.target_id
      );
      message = `${full_name} accepted the request to track their location for delivery: ${
        delivery!.title
      }`;
      mount_prop_key = "delivery";
      mount_value = delivery!;
      break;
    }
    case CARRY_EVENT_TYPES.CARRIER_LOCATION_REQUEST_DECLINED: {
      const delivery: DeliveryEntity | null = await get_delivery_by_id(
        notificationObj.target_id
      );
      message = `${full_name} declined the request to track their location for delivery: ${
        delivery!.title
      }`;
      mount_prop_key = "delivery";
      mount_value = delivery!;
      break;
    }
    case CARRY_EVENT_TYPES.CARRIER_LOCATION_SHARED: {
      const delivery: DeliveryEntity | null = await get_delivery_by_id(
        notificationObj.target_id
      );
      message = `${full_name} shared their location for delivery: ${
        delivery!.title
      }`;
      mount_prop_key = "delivery";
      mount_value = delivery!;
      break;
    }
    case CARRY_EVENT_TYPES.CARRIER_LOCATION_UNSHARED: {
      const delivery: DeliveryEntity | null = await get_delivery_by_id(
        notificationObj.target_id
      );
      message = `${full_name} stopped sharing their location for delivery: ${
        delivery!.title
      }`;
      mount_prop_key = "delivery";
      mount_value = delivery!;
      break;
    }

    case CARRY_EVENT_TYPES.DELIVERY_NEW_TRACKING_UPDATE: {
      const tracking_update = await get_delivery_tracking_update_by_id(
        notificationObj.target_id
      );
      if (!tracking_update) {
        message = `${full_name} added a new tracking update to your delivery: [EXPIRED]`;
        mount_prop_key = "delivery";
        mount_value = {};
      } else {
        const delivery: DeliveryEntity | null = await get_delivery_by_id(
          tracking_update.delivery_id
        );
        message = `${full_name} added a new tracking update to your delivery: ${delivery!.title} - ${tracking_update.message}`;
        mount_prop_key = "delivery";
        mount_value = delivery;

        notificationObj.tracking_update = tracking_update;
      }
      break;
    }

    case CARRY_EVENT_TYPES.DELIVERY_ADD_COMPLETED_PICTURE: {
      const delivery: DeliveryEntity | null = await get_delivery_by_id(
        notificationObj.target_id
      );
      message = `${full_name} added delivered picture to your delivery: ${
        delivery!.title
      }`;
      mount_prop_key = "delivery";
      mount_value = delivery;

      notificationObj.delivery = delivery;
      break;
    }

    case CARRY_EVENT_TYPES.DELIVERY_FROM_PERSON_ID_PICTURE_ADDED: {
      const delivery: DeliveryEntity | null = await get_delivery_by_id(
        notificationObj.target_id
      );
      message = `${full_name} added pickup person id picture to your delivery: ${
        delivery!.title
      }`;
      mount_prop_key = "delivery";
      mount_value = delivery;

      notificationObj.delivery = delivery;
      break;
    }

    case CARRY_EVENT_TYPES.DELIVERY_FROM_PERSON_SIG_PICTURE_ADDED: {
      const delivery: DeliveryEntity | null = await get_delivery_by_id(
        notificationObj.target_id
      );
      message = `${full_name} added pickup person signature picture to your delivery: ${
        delivery!.title
      }`;
      mount_prop_key = "delivery";
      mount_value = delivery;

      notificationObj.delivery = delivery;
      break;
    }

    case CARRY_EVENT_TYPES.DELIVERY_TO_PERSON_ID_PICTURE_ADDED: {
      const delivery: DeliveryEntity | null = await get_delivery_by_id(
        notificationObj.target_id
      );
      message = `${full_name} added dropoff person id picture to your delivery: ${
        delivery!.title
      }`;
      mount_prop_key = "delivery";
      mount_value = delivery;

      notificationObj.delivery = delivery;
      break;
    }

    case CARRY_EVENT_TYPES.DELIVERY_TO_PERSON_SIG_PICTURE_ADDED: {
      const delivery: DeliveryEntity | null = await get_delivery_by_id(
        notificationObj.target_id
      );
      message = `${full_name} added dropoff person signature picture to your delivery: ${
        delivery!.title
      }`;
      mount_prop_key = "delivery";
      mount_value = delivery;

      notificationObj.delivery = delivery;
      break;
    }

    case CARRY_EVENT_TYPES.NEW_DELIVERY_OWNER_REVIEW: {
      const delivery: DeliveryEntity | null = await get_delivery_by_id(
        notificationObj.target_id
      );
      message = `${full_name} left an owner's rating for your delivery: ${
        delivery!.title
      }`;
      mount_prop_key = "delivery";
      mount_value = delivery;

      notificationObj.delivery = delivery;
      break;
    }

    case CARRY_EVENT_TYPES.CARRIER_APPROACHING_PICKUP_LOCATION: {
      const delivery: DeliveryEntity | null = await get_delivery_by_id(
        notificationObj.target_id
      );
      message = `${full_name} is approaching the pickup location of your delivery: ${
        delivery!.title
      }`;
      mount_prop_key = "delivery";
      mount_value = delivery;

      notificationObj.delivery = delivery;
      break;
    }
    case CARRY_EVENT_TYPES.CARRIER_APPROACHING_DROPOFF_LOCATION: {
      const delivery: DeliveryEntity | null = await get_delivery_by_id(
        notificationObj.target_id
      );
      message = `${full_name} is approaching the dropoff location of your delivery: ${
        delivery!.title
      }`;
      mount_prop_key = "delivery";
      mount_value = delivery;

      notificationObj.delivery = delivery;
      break;
    }

    case CARRY_EVENT_TYPES.CARRIER_REMOVED: {
      const delivery: DeliveryEntity | null = await get_delivery_by_id(
        notificationObj.target_id
      );
      message = `${full_name} removed you as the carrier from their delivery: ${
        delivery!.title
      }`;
      mount_prop_key = "delivery";
      mount_value = delivery;

      notificationObj.delivery = delivery;
      break;
    }

    case CARRY_EVENT_TYPES.NEW_DELIVERY_CARRIER_REVIEW: {
      const delivery: DeliveryEntity | null = await get_delivery_by_id(
        notificationObj.target_id
      );
      message = `${full_name} left a carrier's rating for your delivery: ${
        delivery!.title
      }`;
      mount_prop_key = "delivery";
      mount_value = delivery;

      notificationObj.delivery = delivery;
      break;
    }

    case CARRY_EVENT_TYPES.NEW_DELIVERY_DISPUTE: {
      const delivery: DeliveryEntity | null = await get_delivery_by_id(
        notificationObj.target_id
      );
      message = `${full_name} opened a dispute for the delivery: ${
        delivery!.title
      }`;
      mount_prop_key = "delivery";
      mount_value = delivery;

      notificationObj.delivery = delivery;
      break;
    }

    case CARRY_EVENT_TYPES.NEW_DELIVERY_DISPUTE_LOG: {
      const dispute: DeliveryDisputeEntity | null = await get_delivery_dispute_by_id(
        notificationObj.target_id
      );
      message = `${full_name} added a log message to the dispute: ${
        dispute!.title
      }`;
      mount_prop_key = "dispute";
      mount_value = dispute;

      notificationObj.dispute = dispute;
      break;
    }

    case CARRY_EVENT_TYPES.DELIVERY_DISPUTE_SETTLEMENT_OFFER: {
      const dispute: DeliveryDisputeEntity | null = await get_delivery_dispute_by_id(
        notificationObj.target_id
      );
      message = `${full_name} made a settlement offer for the dispute: ${
        dispute!.title
      }`;
      mount_prop_key = "dispute";
      mount_value = dispute;

      notificationObj.dispute = dispute;
      break;
    }

    case CARRY_EVENT_TYPES.DELIVERY_DISPUTE_SETTLEMENT_OFFER_CANCELED: {
      const dispute: DeliveryDisputeEntity | null = await get_delivery_dispute_by_id(
        notificationObj.target_id
      );
      message = `${full_name} canceled the settlement offer for the dispute: ${
        dispute!.title
      }`;
      mount_prop_key = "dispute";
      mount_value = dispute;

      notificationObj.dispute = dispute;
      break;
    }

    case CARRY_EVENT_TYPES.DELIVERY_DISPUTE_SETTLEMENT_OFFER_ACCEPTED: {
      const dispute: DeliveryDisputeEntity | null = await get_delivery_dispute_by_id(
        notificationObj.target_id
      );
      message = `${full_name} accepted the settlement offer for the dispute: ${
        dispute!.title
      }`;
      mount_prop_key = "dispute";
      mount_value = dispute;

      notificationObj.dispute = dispute;
      break;
    }

    case CARRY_EVENT_TYPES.DELIVERY_DISPUTE_SETTLEMENT_OFFER_DECLINED: {
      const dispute: DeliveryDisputeEntity | null = await get_delivery_dispute_by_id(
        notificationObj.target_id
      );
      message = `${full_name} declined the settlement offer for the dispute: ${
        dispute!.title
      }`;
      mount_prop_key = "dispute";
      mount_value = dispute;

      notificationObj.dispute = dispute;
      break;
    }

    case CARRY_EVENT_TYPES.CARRIER_PAYOUT_CLAIMED: {
      const delivery: DeliveryEntity | null = await get_delivery_by_id(
        notificationObj.target_id
      );
      message = `${full_name} claimed the payout for delivery: ${
        delivery!.title
      }`;
      mount_prop_key = "delivery";
      mount_value = delivery;

      notificationObj.delivery = delivery;
      break;
    }
  }

  notificationObj.from = user_model!;
  notificationObj.message = message;
  notificationObj[mount_prop_key] = mount_value;

  return notificationObj;
};

export const delivery_search_attrs = [
  "id",
  "owner_id",

  "created_at",
  "size",
  "weight",
  "distance_miles",
  "payout",
  "penalty",

  "title",
  // 'description',

  "from_city",
  "from_state",
  "from_zipcode",

  "to_city",
  "to_state",
  "to_zipcode",
];

export enum MomentFormats {
  FULL = `MMM DD YYYY - h:mm:ss a`,
}

export const dateTimeTransform = (value: string | Date | number, format: string = MomentFormats.FULL): string => {
  const datetime = moment(value).format(format);
  return datetime;
};