


/*

  In the context of this backend codebase, "Entity" classes are NOT database/ORM models, they are just plain, simple objects that mirror the fields of the actual model/ORM classes.
  This backend uses Sequelize ORM. The model classes are defined in the `carry.model.ts` file.
  The problem is that the library/framework was written in JavaScript with no TypeScript support natively; 
  the contributors/maintainers are working on TypeScript support but is still a lot of boilerplace code to setup and integrate.
  It is easier (at the moment) to use the fully stable JavaScript version and simply map the ORM results to plain class instances using `class-transformer` npm library: https://www.npmjs.com/package/class-transformer
  
  These classes are created to represent database models/relationships as raw/plain data objects (without all the methods and clutter) and to add static typing, mainly in order to implement Swagger UI.
  Much of the logic of this codebase was migrated from an older codebase written in Express.JS, which used interfaces instead of classes.
  With the use of Entity classes, there is little to no need for the interfaces for this migration as static classes serve the same purpose and with more capabilities.

  The Entity classes were created by copying and pasting the model code, using regular expressions to convert to class definitions, including the relationships.

*/


// creating common ancestor class
export abstract class BaseEntity {

}


export class UserEntity extends BaseEntity {
  id: number;
  gender: number | null; // Unknown/Other or 0, Male or 1, Female or 2
  
  firstname: string | null;
  middlename: string | null;
  lastname: string | null;

  username: string;
  displayname: string;
  email: string;
  password: string;

  paypal: string | null;
  paypal_verified: boolean;
  stripe_customer_account_id: string | null;
  stripe_account_id: string | null;
  stripe_account_verified: boolean;
  stripe_identity_verified: boolean;
  platform_subscription_id: string | null;
  temp_phone: string | null;
  phone: string | null;
  headline: string;
  bio: string;
  tags: string;
  icon_link: string | null;
  icon_id: string | null;

  id_card_front_link: string | null;
  id_card_front_id: string | null;
  id_card_back_link: string | null;
  id_card_back_id: string | null;

  photo_id_link: string | null;
  photo_id_id: string | null;
  wallpaper_link: string | null;
  wallpaper_id: string | null;
  location: string | null;

  latest_lat: number | null;
  latest_lng: number | null;
  latlng_last_updated: string;

  is_public: boolean;
  
  allow_messaging: boolean;
  allow_conversations: boolean;
  allow_watches: boolean;
  allow_text_pulse_updates: boolean;
  pulses_last_opened: string;
  checkpoints_last_opened: string;

  location_id: string | null;
  location_json: string | null;
  zipcode: string | null;
  city: string | null;
  state: string | null;
  county: string | null;
  country: string | null;
  lat: number | null;
  lng: number | null;
  public: boolean;
  online: boolean;
  premium: boolean;
  cerified: boolean;
  person_verified: boolean;
  email_verified: boolean;
  phone_verified: boolean;
  can_message: boolean;
  can_converse: boolean;
  notifications_last_opened: string;
  date_created: string;
  uuid: string;



  // relationships

  expo_devices?: UserExpoDeviceEntity[];
  carry_settings?: CarryUserProfileSettingEntity;
  carry_received_ratings?: CarryUserRatingEntity[];
  carry_written_ratings?: CarryUserRatingEntity[];
  carry_received_customer_ratings?: CarryUserCustomerRatingEntity[];
  carry_written_customer_ratings?: CarryUserCustomerRatingEntity[];
  carry_received_carrier_ratings?: CarryUserCarrierRatingEntity[];
  carry_written_carrier_ratings?: CarryUserCarrierRatingEntity[];
  to_notifications?: NotificationEntity[];
  from_notifications?: NotificationEntity[];
  messages_sent?: MessageEntity[];
  messages_received?: MessageEntity[];
  carry_deliveries?: DeliveryEntity[];
  carry_deliverings?: DeliveryEntity[];
  carry_carrier_requests?: DeliveryCarrierRequestEntity[];
  deliverme_user_tracking_updates?: DeliveryTrackingUpdateEntity[];
  delivery_messages_sent?: DeliveryMessageEntity[];
  new_listings_alerts?: UserNewListingsAlertEntity[];
  unpaid_listings?: DeliveryUnpaidListingEntity[];
  carry_delivery_dispute_customer_service_messagess?: DeliveryDisputeCustomerSupportMessageEntity[];
  carry_delivery_disputes_created?: DeliveryDisputeEntity[];
  carry_delivery_disputes_received?: DeliveryDisputeEntity[];
  carry_delivery_dispute_logs_created?: DeliveryDisputeLogEntity[];
  carry_delivery_dispute_logs_received?: DeliveryDisputeLogEntity[];
  carry_delivery_dispute_settlement_offers_created?: DeliveryDisputeSettlementOfferEntity[];
  carry_delivery_dispute_settlement_offers_received?: DeliveryDisputeSettlementOfferEntity[];
  carry_delivery_dispute_settlement_invoices_received?: DeliveryDisputeSettlementInvoiceEntity[];
}

export class S3ObjectEntity extends BaseEntity {
  id: number;
  model_type: string | null; // determines if post belongs to a particular model; default (null) is user
  model_id: number | null;
  name: string | null;
  description: string | null;
  mimetype: string | null;
  
  bucket: string;
  key: string;

  date_created: string;
  uuid: string;
}

export class UserFieldEntity extends BaseEntity {
  id: number;
  user_id: number;
  fieldname: string;
  fieldtype: string;
  fieldvalue: string;
  date_created: string;
  uuid: string;
}

export class UserStripeIdentityVerificationSessionEntity extends BaseEntity {
  id: number;
  user_id: number;
  verification_session_id: string;
  expired: boolean;
  verified: boolean;
  status: string;
  date_created: string;
  uuid: string;
}

// UserStripeIdentityVerificationSessions.sync({ alter: true });

export class UsersEmailVerificationEntity extends BaseEntity {
  id: number;
  user_id: number;
  email: string | null;
  verification_code: string;
  verified: boolean;
  date_created: string;
  uuid: string;
}

export class UsersPhoneVerificationEntity extends BaseEntity {
  id: number;
  user_id: number;
  request_id: string | null;
  phone: string | null;
  verification_code: string;
  date_created: string;
  uuid: string;
}

export class NotificationEntity extends BaseEntity {
  id: number;
  from_id: number;
  to_id: number;
  event: string;
  target_type: string | null;
  target_id: number | null;
  read: boolean;
  image_link: string | null;
  image_id: string | null;
  date_created: string;
  uuid: string;

  from?: UserEntity;
  to?: UserEntity;
}

export class UserNotificationsLastOpenedEntity extends BaseEntity {
  id: number;
  user_id: number;
  notifications_last_opened: string;
  date_created: string;
  uuid: string;
}

export class UserAccountHoldEntity extends BaseEntity {
  id: number;
  user_id: number;
  status: string;
  reason: string;
  date_created: string;
  uuid: string;
}

export class StripeActionEntity extends BaseEntity {
  id: number;
  action_event: string; // charge, refund, transfer
  action_id: string;
  action_metadata: string | null;
  micro_app: string | null;
  target_type: string | null;
  target_id: number | null;
  target_metadata: string | null;
  status: string;
  date_created: string;
  uuid: string;
}

export class UserExpoDeviceEntity extends BaseEntity {
  id: number;
  user_id: number;
  token: string;
  device_info: string | null;
  device_id: string;
  device_type: string;
  device_platform: string;
  date_created: string;
  uuid: string;

  user?: UserEntity[];
}


export class UserDeviceEntity extends BaseEntity {
  id: number;
  user_id: number;
  token: string;
  device_info: string | null;
  device_id: string;
  device_type: string;
  device_platform: string;
  date_created: string;
  uuid: string;
}


export class UserPaymentIntentEntity extends BaseEntity {
  id: number;
  user_id: number;
  payment_intent_id: string;
  payment_intent_event: string;
  micro_app: string | null;
  target_type: string | null;
  target_id: number | null;
  status: string;
  date_created: string;
  uuid: string;
}

export class UserChargeEntity extends BaseEntity {
  id: number;
  user_id: number;
  charge_id: string;
  charge_event: string;
  micro_app: string | null;
  target_type: string | null;
  target_id: number | null;
  status: string;
  date_created: string;
  uuid: string;
}

export class UserTransferEntity extends BaseEntity {
  id: number;
  user_id: number;
  transfer_id: string;
  transfer_event: string;
  micro_app: string | null;
  target_type: string | null;
  target_id: number | null;
  status: string;
  date_created: string;
  uuid: string;
}

export class UserRefundEntity extends BaseEntity {
  id: number;
  user_id: number;
  refund_id: string;
  refund_event: string;
  micro_app: string | null;
  target_type: string | null;
  target_id: number | null;
  status: string;
  date_created: string;
  uuid: string;
}

export class UserInvoiceEntity extends BaseEntity {
  id: number;
  user_id: number;
  invoice_id: string;
  invoice_details: string;
  target_type: string | null;
  target_id: number | null;
  status: string;
  date_created: string;
  uuid: string;
}


export class MessagingEntity extends BaseEntity {
  id: number;
  user_id: number;
  sender_id: number;
  date_created: string;
  uuid: string;
}

export class MessagingRequestEntity extends BaseEntity {
  id: number;
  user_id: number;
  sender_id: number;
  date_created: string;
  uuid: string;
}

export class MessageEntity extends BaseEntity {
  id: number;
  from_id: number;
  to_id: number;
  body: string | null;
  app_context: string | null; // _common/hotspot.myfavors/etc
  opened: boolean;
  date_created: string;
  uuid: string;

  from?: UserEntity;
  to?: UserEntity;
}

export class MessagePhotoEntity extends BaseEntity {
  id: number;
  message_id: number;
  photo_link: string | null;
  photo_id: string | null;
  date_created: string;
  uuid: string;
}



export class CarryAdminEntity extends BaseEntity {
  id: number;
  firstname: string;
  middlename: string;
  lastname: string;
  icon_link: string | null;
  icon_id: string | null;
  email: string;
  password: string;
  phone: string | null;
  role: string;
  active: boolean;
  date_created: string;
  uuid: string;

  delivery_dispute_settlement_invoices?: DeliveryDisputeSettlementInvoiceEntity[];
  delivery_assigned_disputes?: DeliveryDisputeEntity[];
  delivery_dispute_settlement_offers?: DeliveryDisputeSettlementOfferEntity[];
  customer_service_messagess?: DeliveryDisputeCustomerSupportMessageEntity[];
}


export class ResetPasswordRequestEntity extends BaseEntity {
  id: number;
  user_id: number;
  completed: boolean;
  uuid: string;
  date_created: string;
}



export class DeliveryEntity extends BaseEntity {
  id: number;
  owner_id: number;
  
  carrier_id: number | null;
  carrier_assigned_date: string | null;
  
  carrier_latest_lat: number | null;
  carrier_latest_lng: number | null;
  carrier_location_requested: boolean;
  carrier_location_request_completed: boolean;
  carrier_shared_location: boolean;

  carrier_id_image_link: string | null;
  carrier_id_image_id: string | null;
  carrier_sig_image_link: string | null;
  carrier_sig_image_id: string | null;

  title: string;
  description: string;
  charge_id: string;
  payment_intent_id: string;
  payment_method_id: string;
  tags: string;
  item_image_link: string | null;
  item_image_id: string | null;
  
  from_location: string;
  from_address: string;
  from_street: string;
  from_city: string;
  from_state: string;
  from_zipcode: number;
  from_country: string;
  from_place_id: string;
  from_lat: number;
  from_lng: number;
  from_person: string;
  from_person_phone: string;
  from_person_email: string;
  from_person_id_required: boolean;
  from_person_sig_required: boolean;

  from_person_id_image_link: string | null;
  from_person_id_image_id: string | null;
  from_person_sig_image_link: string | null;
  from_person_sig_image_id: string | null;

  to_location: string;
  to_address: string;
  to_street: string;
  to_city: string;
  to_state: string;
  to_zipcode: number;
  to_country: string;
  to_place_id: string;
  to_lat: number;
  to_lng: number;
  to_person: string;
  to_person_phone: string;
  to_person_email: string;
  to_person_id_required: boolean;
  to_person_sig_required: boolean;

  to_person_id_image_link: string | null;
  to_person_id_image_id: string | null;
  to_person_sig_image_link: string | null;
  to_person_sig_image_id: string | null;

  distance_miles: number;
  
  category: string;
  size: string;
  weight: number;
  featured: string | null; // bronze/silver/gold
  available: boolean;
  started: boolean;
  auto_accept_anyone: boolean;
  urgent: boolean;
  canceled: boolean;
  returned: boolean;
  completed: boolean;
  delivered_instructions: string | null;
  delivered_image_link: string | null;
  delivered_image_id: string | null;
  payment_session_id: string | null;
  payout: number;
  payout_invoice_id: string | null; // paypal
  penalty: number;
  penalty_invoice_id: string | null; // paypal

  datetime_pick_up_by: string | null;
  datetime_picked_up: string | null;
  datetime_picked_up_est: string | null;
  
  datetime_delivered: string | null;
  datetime_deliver_by: string | null;
  datetime_delivered_est: string | null;

  datetime_completed: string | null;
  datetime_complete_by: string | null;
  datetime_complete_est: string | null;

  date_created: string;
  uuid: string;



  // relationships

  owner?: UserEntity;
  carrier?: UserEntity;
  customer_rating?: CarryUserCustomerRatingEntity;
  carrier_rating?: CarryUserCarrierRatingEntity;
  carrier_requests?: DeliveryCarrierRequestEntity[];
  deliverme_delivery_tracking_updates?: DeliveryTrackingUpdateEntity[];
  delivery_insurance?: DeliveryInsuranceEntity;
  carrier_pickup_approaching?: DeliveryCarrierPickupApproachingNotificationEntity[];
  carrier_dropoff_approaching?: DeliveryCarrierDropoffApproachingNotificationEntity[];
  delivery_messages?: DeliveryMessageEntity[];
  delivery_carrier_track_location_requests?: DeliveryCarrierTrackLocationRequestEntity[];
  carrier_location_updates?: DeliveryCarrierTrackLocationUpdateEntity[];
  delivery_dispute?: DeliveryDisputeEntity;
  delivery_unpaid_listing?: DeliveryUnpaidListingEntity;
}

export class UserNewListingsAlertEntity extends BaseEntity {
  id: number;
  user_id: number;
  label: string;
  to_city: string;
  to_state: string;
  from_city: string;
  from_state: string;
  
  date_created: string;
  uuid: string;

  user?: UserEntity;
}

export class UserLastAlertedTimeEntity extends BaseEntity {
  id: number;
  user_id: number;
  
  lasted_alerted: string;
  uuid: string;
}

export class ListingsAlertsLastPushedEntity extends BaseEntity {
  id: number;
  date_created: string;
  uuid: string;
}


// UserNewListingsAlerts.sync({ alter: true }); 

export class DeliveryCarrierPickupApproachingNotificationEntity extends BaseEntity {
  id: number;
  delivery_id: number;
  carrier_id: number;  
  date_created: string;
  uuid: string;

  delivery?: DeliveryEntity;
}

export class DeliveryCarrierDropoffApproachingNotificationEntity extends BaseEntity {
  id: number;
  delivery_id: number;
  carrier_id: number;  
  date_created: string;
  uuid: string;

  delivery?: DeliveryEntity;
}

export class DeliveryCarrierTrackLocationRequestEntity extends BaseEntity {
  id: number;
  delivery_id: number;
  status: string;
  
  date_created: string;
  uuid: string;

  delivery?: DeliveryEntity;
}

export class DeliveryInsuranceEntity extends BaseEntity {
  id: number;
  delivery_id: number | null;
  insurance_type: string | null;
  amount_insured: number | null;
  amount_paid: number;
  
  date_created: string;
  uuid: string;

  delivery?: DeliveryEntity;
}


// DeliveryInsurances.sync({ alter: true });

export class DeliveryCarrierTrackLocationUpdateEntity extends BaseEntity {
  id: number;
  delivery_id: number;
  lat: number;
  lng: number;
  
  date_created: string;
  uuid: string;

  delivery?: DeliveryEntity;
}

export class DeliveryTransactionEntity extends BaseEntity {
  id: number;
  delivery_id: number;
  action_type: string;
  action_id: string;
  status: string;
  
  date_created: string;
  uuid: string;
}

export class DeliveryMessageEntity extends BaseEntity {
  id: number;
  delivery_id: number;
  user_id: number;
  body: string | null;
  opened: boolean;
  date_created: string;
  uuid: string;

  user?: UserEntity;
  delivery?: DeliveryEntity;
}

export class DeliveryPayoutAttemptEntity extends BaseEntity {
  id: number;
  delivery_id: number;
  transaction_id: string;
  date_created: string;
  uuid: string;
}

export class DeliveryPenaltyAttemptEntity extends BaseEntity {
  id: number;
  delivery_id: number;
  transaction_id: string;
  date_created: string;
  uuid: string;
}

export class DeliveryCarrierRequestEntity extends BaseEntity {
  id: number;
  user_id: number;
  delivery_id: number;
  message: string | null;
  status: string;
  date_created: string;
  uuid: string;

  carrier?: UserEntity;
  delivery?: DeliveryEntity;
}

export class DeliveryDisputeEntity extends BaseEntity {
  id: number;
  creator_id: number;
  user_id: number;
  delivery_id: number;
  agent_id: number | null;
  title: string;
  details: string;
  status: string;
  image_link: string | null;
  image_id: string | null;
  compensation: number;
  date_created: string;
  uuid: string;

  delivery?: DeliveryEntity;
  creator?: UserEntity;
  user?: UserEntity;
  delivery_dispute_logs?: DeliveryDisputeLogEntity[];
  delivery_dispute_settlement_offers?: DeliveryDisputeSettlementOfferEntity[];
  delivery_dispute_customer_service_messagess?: DeliveryDisputeCustomerSupportMessageEntity[];
  delivery_dispute_settlement_invoices?: DeliveryDisputeSettlementInvoiceEntity;
}

export class DeliveryDisputeCustomerSupportPreviousAgentEntity extends BaseEntity {
  // keep track of all customer support agents working on the dispute
  id: number;
  dispute_id: number;
  delivery_id: number;
  agent_id: number;
  date_created: string;
  uuid: string;
}

export class DeliveryDisputeLogEntity extends BaseEntity {
  id: number;
  dispute_id: number;
  creator_id: number;
  user_id: number;
  agent_id: number | null;
  delivery_id: number;
  body: string | null;
  image_link: string | null;
  image_id: string | null;
  date_created: string;
  uuid: string;

  dispute?: DeliveryDisputeEntity;
  creator?: UserEntity;
  user?: UserEntity;
}

export class DeliveryDisputeCustomerSupportMessageEntity extends BaseEntity {
  id: number;
  dispute_id: number;
  user_id: number | null;
  delivery_id: number;
  is_from_cs: boolean; // customer support message
  agent_id: number | null;
  body: string | null;
  image_link: string | null;
  image_id: string | null;
  date_created: string;
  uuid: string;

  dispute?: DeliveryDisputeEntity;
  user?: UserEntity;
  agent?: CarryAdminEntity;
}


export class DeliveryDisputeSettlementOfferEntity extends BaseEntity {
  id: number;
  dispute_id: number;
  creator_id: number;
  user_id: number;
  agent_id: number | null;
  delivery_id: number;
  status: string;
  
  message: string;
  offer_amount: number;
  
  date_created: string;
  uuid: string;

  agent?: CarryAdminEntity[];
  user?: UserEntity;
  creator?: UserEntity;
  dispute?: DeliveryDisputeEntity;
}

export class DeliveryDisputeSettlementInvoiceEntity extends BaseEntity {
  id: number;
  offer_id: number;
  dispute_id: number;
  user_id: number;
  agent_id: number | null;
  delivery_id: number;
  message: string;
  invoice_amount: number;
  status: string;
  charge_id: string;
  payment_intent_id: string;
  payment_method_id: string;
  paid: boolean;
  date_due: string | null;
  date_created: string;
  uuid: string;

  agent?: CarryAdminEntity[];
  user?: UserEntity;
  dispute?: DeliveryDisputeEntity;
}

export class DeliveryTrackingUpdateEntity extends BaseEntity {
  id: number;
  delivery_id: number;
  user_id: number;
  message: string;
  carrier_lat: number | null;
  carrier_lng: number | null;
  location: string | null;
  icon_link: string | null;
  icon_id: string | null;
  date_created: string;
  uuid: string;

  delivery?: DeliveryEntity;
  user?: UserEntity;
}

export class DeliveryUnpaidListingEntity extends BaseEntity {
  id: number;
  user_id: number;
  delivery_id: number;
  paid: boolean;
  metadata: string | null;
  canceled_payment_intent_id: string;
  payment_intent_id: string | null;
  date_created: string;
  uuid: string;

  customer?: UserEntity;
  delivery?: DeliveryEntity;
}


export class CarryUserProfileSettingEntity extends BaseEntity {
  id: number;
  user_id: number;
  phone: string;
  email: string;
  cashapp_tag: string;
  venmo_id: string;
  paypal_me: string;
  google_pay: string;
  date_created: string;
  uuid: string;

  user?: UserEntity;
}

export class CarryUserRatingEntity extends BaseEntity {
  id: number;
  user_id: number;
  writer_id: number;
  delivery_id: number;
  rating: number;
  title: string | null;
  summary: string | null;
  image_link: string | null;
  image_id: string | null;
  date_created: string;
  uuid: string;

  user?: UserEntity;
  writer?: UserEntity;
  delivery?: DeliveryEntity;
}

export class CarryUserCustomerRatingEntity extends BaseEntity {
  id: number;
  user_id: number;
  writer_id: number;
  delivery_id: number;
  rating: number;
  title: string | null;
  summary: string | null;
  image_link: string | null;
  image_id: string | null;
  date_created: string;
  uuid: string;

  user?: UserEntity;
  writer?: UserEntity;
  delivery?: DeliveryEntity;
}

export class CarryUserCarrierRatingEntity extends BaseEntity {
  id: number;
  user_id: number;
  writer_id: number;
  delivery_id: number;
  rating: number;
  title: string | null;
  summary: string | null;
  image_link: string | null;
  image_id: string | null;
  date_created: string;
  uuid: string;

  user?: UserEntity;
  writer?: UserEntity;
  delivery?: DeliveryEntity;
}


export class AccountsReportedEntity extends BaseEntity {
  id: number;
  user_id: number;
  reporting_id: number;
  issue_type: string;
  details: string;
  date_created: string;
  uuid: string;

  user?: UserEntity;
}

export class SiteFeedbackEntity extends BaseEntity {
  id: number;
  user_id: number;
  rating: number;
  title: string | null;
  summary: string | null;
  date_created: string;
  uuid: string;

  user?: UserEntity;
}

export class NewsDataCacheEntity extends BaseEntity {
  id: number;
  json_data: string | null;
  date_created: string;
  uuid: string;
}

export class ApiKeyEntity extends BaseEntity {
  id: number;
  key: string;
  firstname: string;
  middlename: string | null;
  lastname: string;
  email: string;
  phone: string;
  website: string;
  verified: boolean;
  date_created: string;
  requests_count: number;
}