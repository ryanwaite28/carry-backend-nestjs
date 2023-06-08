import * as Sequelize from 'sequelize';

import { CARRY_ADMIN_ROLES } from '../enums/carry.enum';
import { MyModelStatic } from '../interfaces/carry.interface';
import {
  common_options,
  sequelizeInst as sequelize
} from './_def.model';






export const Users = <MyModelStatic> sequelize.define('carry_users', {
  id:                                  { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  gender:                              { type: Sequelize.INTEGER, allowNull: true }, // Unknown/Other or 0, Male or 1, Female or 2
  
  firstname:                           { type: Sequelize.STRING, allowNull: true, defaultValue: '' },
  middlename:                          { type: Sequelize.STRING, allowNull: true, defaultValue: '' },
  lastname:                            { type: Sequelize.STRING, allowNull: true, defaultValue: '' },

  username:                            { type: Sequelize.STRING, allowNull: false },
  displayname:                         { type: Sequelize.STRING, allowNull: false, defaultValue: '' },
  email:                               { type: Sequelize.STRING, allowNull: false },
  password:                            { type: Sequelize.STRING, allowNull: false },

  paypal:                              { type: Sequelize.STRING, allowNull: true },
  paypal_verified:                     { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
  stripe_customer_account_id:          { type: Sequelize.STRING, allowNull: true },
  stripe_account_id:                   { type: Sequelize.STRING, allowNull: true },
  stripe_account_verified:             { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
  stripe_identity_verified:            { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
  platform_subscription_id:            { type: Sequelize.STRING, allowNull: true, defaultValue: null },
  temp_phone:                          { type: Sequelize.STRING, allowNull: true, defaultValue: '' },
  phone:                               { type: Sequelize.STRING, allowNull: true },
  headline:                            { type: Sequelize.STRING(75), allowNull: false, defaultValue: '' },
  bio:                                 { type: Sequelize.TEXT, allowNull: false, defaultValue: '' },
  tags:                                { type: Sequelize.STRING, allowNull: false, defaultValue: '' },
  icon_link:                           { type: Sequelize.STRING, allowNull: true, defaultValue: '' },
  icon_id:                             { type: Sequelize.STRING, allowNull: true, defaultValue: '' },

  id_card_front_link:                  { type: Sequelize.STRING, allowNull: true, defaultValue: '' },
  id_card_front_id:                    { type: Sequelize.STRING, allowNull: true, defaultValue: '' },
  id_card_back_link:                   { type: Sequelize.STRING, allowNull: true, defaultValue: '' },
  id_card_back_id:                     { type: Sequelize.STRING, allowNull: true, defaultValue: '' },

  photo_id_link:                       { type: Sequelize.STRING, allowNull: true, defaultValue: '' },
  photo_id_id:                         { type: Sequelize.STRING, allowNull: true, defaultValue: '' },
  wallpaper_link:                      { type: Sequelize.STRING, allowNull: true, defaultValue: '' },
  wallpaper_id:                        { type: Sequelize.STRING, allowNull: true, defaultValue: '' },
  location:                            { type: Sequelize.STRING, allowNull: true, defaultValue: '' },

  latest_lat:                          { type: Sequelize.FLOAT, allowNull: true, defaultValue: 0 },
  latest_lng:                          { type: Sequelize.FLOAT, allowNull: true, defaultValue: 0 },
  latlng_last_updated:                 { type: Sequelize.DATE, defaultValue: Sequelize.NOW },

  is_public:                           { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
  
  allow_messaging:                     { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
  allow_conversations:                 { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
  allow_watches:                       { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
  allow_text_pulse_updates:            { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
  pulses_last_opened:                  { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  checkpoints_last_opened:             { type: Sequelize.DATE, defaultValue: Sequelize.NOW },

  location_id:                         { type: Sequelize.STRING, allowNull: true, defaultValue: '' },
  location_json:                       { type: Sequelize.JSON, allowNull: true, defaultValue: '' },
  zipcode:                             { type: Sequelize.STRING, allowNull: true, defaultValue: '' },
  city:                                { type: Sequelize.STRING, allowNull: true, defaultValue: '' },
  state:                               { type: Sequelize.STRING, allowNull: true, defaultValue: '' },
  county:                              { type: Sequelize.STRING, allowNull: true, defaultValue: '' },
  country:                             { type: Sequelize.STRING, allowNull: true, defaultValue: '' },
  lat:                                 { type: Sequelize.FLOAT, allowNull: true, defaultValue: 0 },
  lng:                                 { type: Sequelize.FLOAT, allowNull: true, defaultValue: 0 },
  public:                              { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
  online:                              { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
  premium:                             { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
  cerified:                            { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
  person_verified:                     { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
  email_verified:                      { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
  phone_verified:                      { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
  can_message:                         { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
  can_converse:                        { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
  notifications_last_opened:           { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  date_created:                        { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  uuid:                                { type: Sequelize.STRING, unique: true, defaultValue: Sequelize.UUIDV1 }
}, {
  ...common_options,
  indexes: [{ unique: true, fields: ['email', 'paypal', 'uuid']} ] 
});

export const S3Objects = <MyModelStatic> sequelize.define('carry_s3_objects', {
  id:                  { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  model_type:          { type: Sequelize.STRING, allowNull: true }, // determines if post belongs to a particular model; default (null) is user
  model_id:            { type: Sequelize.INTEGER, allowNull: true },
  name:                { type: Sequelize.STRING(500), allowNull: true },
  description:         { type: Sequelize.STRING(500), allowNull: true },
  mimetype:            { type: Sequelize.STRING(500), allowNull: true },
  
  bucket:              { type: Sequelize.STRING, allowNull: false },
  key:                 { type: Sequelize.STRING, allowNull: false },

  date_created:        { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  uuid:                { type: Sequelize.STRING, unique: true, defaultValue: Sequelize.UUIDV1 }
}, {
  ...common_options,
  indexes: [{ unique: true, fields: ['bucket', 'key'] }]
});

export const UserFields = <MyModelStatic> sequelize.define('carry_user_fields', {
  id:                   { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  user_id:              { type: Sequelize.INTEGER, allowNull: false, references: { model: Users, key: 'id' } },
  fieldname:            { type: Sequelize.STRING, allowNull: false, defaultValue: '' },
  fieldtype:            { type: Sequelize.STRING, allowNull: false, defaultValue: '' },
  fieldvalue:           { type: Sequelize.STRING, allowNull: false, defaultValue: '' },
  date_created:         { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  uuid:                 { type: Sequelize.STRING, defaultValue: Sequelize.UUIDV1 },
}, common_options);

export const UserStripeIdentityVerificationSessions = <MyModelStatic> sequelize.define('carry_user_stripe_identity_verification_sessions', {
  id:                                 { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  user_id:                            { type: Sequelize.INTEGER, allowNull: false, references: { model: Users, key: 'id' } },
  verification_session_id:            { type: Sequelize.STRING, allowNull: false },
  expired:                            { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
  verified:                           { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
  status:                             { type: Sequelize.STRING, allowNull: false, defaultValue: '' },
  date_created:         { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  uuid:                 { type: Sequelize.STRING, defaultValue: Sequelize.UUIDV1 },
}, common_options);

// UserStripeIdentityVerificationSessions.sync({ alter: true });

export const UsersEmailVerifications = <MyModelStatic> sequelize.define('carry_users_email_verifications', {
  id:                      { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  user_id:                 { type: Sequelize.INTEGER, allowNull: false, references: { model: Users, key: 'id' } },
  email:                   { type: Sequelize.STRING, allowNull: true, defaultValue: '' },
  verification_code:       { type: Sequelize.STRING, unique: true, defaultValue: Sequelize.UUIDV4 },
  verified:                { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
  date_created:            { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  uuid:                    { type: Sequelize.STRING, defaultValue: Sequelize.UUIDV1 },
}, common_options);

export const UsersPhoneVerifications = <MyModelStatic> sequelize.define('carry_users_phone_verifications', {
  id:                      { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  user_id:                 { type: Sequelize.INTEGER, allowNull: false, references: { model: Users, key: 'id' } },
  request_id:              { type: Sequelize.STRING, unique: true, allowNull: true },
  phone:                   { type: Sequelize.STRING, allowNull: true, defaultValue: '' },
  verification_code:       { type: Sequelize.STRING, allowNull: false },
  date_created:            { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  uuid:                    { type: Sequelize.STRING, defaultValue: Sequelize.UUIDV1 },
}, common_options);

export const Notifications = <MyModelStatic> sequelize.define('carry_notifications', {
  id:                  { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  from_id:             { type: Sequelize.INTEGER, allowNull: false, references: { model: Users, key: 'id' } },
  to_id:               { type: Sequelize.INTEGER, allowNull: false, references: { model: Users, key: 'id' } },
  event:               { type: Sequelize.STRING, allowNull: false, defaultValue: '' },
  target_type:         { type: Sequelize.STRING, allowNull: true, defaultValue: '' },
  target_id:           { type: Sequelize.INTEGER, allowNull: true, defaultValue: 0 },
  read:                { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
  image_link:          { type: Sequelize.TEXT, allowNull: true, defaultValue: '' },
  image_id:            { type: Sequelize.TEXT, allowNull: true, defaultValue: '' },
  date_created:        { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  uuid:                { type: Sequelize.STRING, defaultValue: Sequelize.UUIDV1 }
}, common_options);

export const UserNotificationsLastOpened = <MyModelStatic> sequelize.define('carry_user_notifications_last_opened', {
  id:                                  { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  user_id:                             { type: Sequelize.INTEGER, allowNull: false, references: { model: Users, key: 'id' } },
  notifications_last_opened:           { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  date_created:                        { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  uuid:                                { type: Sequelize.STRING, unique: true, defaultValue: Sequelize.UUIDV1 }
}, common_options);

export const UserAccountHolds = <MyModelStatic> sequelize.define('carry_user_account_holds', {
  id:                                  { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  user_id:                             { type: Sequelize.INTEGER, allowNull: false, references: { model: Users, key: 'id' } },
  status:                              { type: Sequelize.STRING, allowNull: false, defaultValue: '' },
  reason:                              { type: Sequelize.STRING, allowNull: false, defaultValue: '' },
  date_created:                        { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  uuid:                                { type: Sequelize.STRING, unique: true, defaultValue: Sequelize.UUIDV1 }
}, common_options);

export const StripeActions = <MyModelStatic> sequelize.define('carry_stripe_actions', {
  id:                                  { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  action_event:                        { type: Sequelize.STRING, allowNull: false }, // charge, refund, transfer
  action_id:                           { type: Sequelize.STRING, allowNull: false },
  action_metadata:                     { type: Sequelize.JSON, allowNull: true, defaultValue: '' },
  micro_app:                           { type: Sequelize.STRING, allowNull: true },
  target_type:                         { type: Sequelize.STRING, allowNull: true, defaultValue: '' },
  target_id:                           { type: Sequelize.INTEGER, allowNull: true, defaultValue: 0 },
  target_metadata:                     { type: Sequelize.JSON, allowNull: true, defaultValue: '' },
  status:                              { type: Sequelize.STRING, allowNull: false, defaultValue: '' },
  date_created:                        { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  uuid:                                { type: Sequelize.STRING, unique: true, defaultValue: Sequelize.UUIDV1 }
}, common_options);

export const UserExpoDevices = <MyModelStatic> sequelize.define('carry_user_expo_devices', {
  id:                   { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  user_id:              { type: Sequelize.INTEGER, allowNull: false, references: { model: Users, key: 'id' } },
  token:                { type: Sequelize.STRING, allowNull: false, defaultValue: '' },
  device_info:          { type: Sequelize.JSON, allowNull: true, defaultValue: null },
  device_id:            { type: Sequelize.STRING, allowNull: false, defaultValue: '' },
  device_type:          { type: Sequelize.STRING, allowNull: false, defaultValue: '' },
  device_platform:      { type: Sequelize.STRING, allowNull: false, defaultValue: '' },
  date_created:         { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  uuid:                 { type: Sequelize.STRING, unique: true, defaultValue: Sequelize.UUIDV1 }
}, common_options);


export const UserDevices = <MyModelStatic> sequelize.define('carry_user_devices', {
  id:                   { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  user_id:              { type: Sequelize.INTEGER, allowNull: false, references: { model: Users, key: 'id' } },
  token:                { type: Sequelize.STRING, allowNull: false, defaultValue: '' },
  device_info:          { type: Sequelize.JSON, allowNull: true, defaultValue: null },
  device_id:            { type: Sequelize.STRING, allowNull: false, defaultValue: '' },
  device_type:          { type: Sequelize.STRING, allowNull: false, defaultValue: '' },
  device_platform:      { type: Sequelize.STRING, allowNull: false, defaultValue: '' },
  date_created:         { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  uuid:                 { type: Sequelize.STRING, unique: true, defaultValue: Sequelize.UUIDV1 }
}, common_options);


export const UserPaymentIntents = <MyModelStatic> sequelize.define('carry_user_payment_intents', {
  id:                                  { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  user_id:                             { type: Sequelize.INTEGER, allowNull: false, references: { model: Users, key: 'id' } },
  payment_intent_id:                   { type: Sequelize.STRING, allowNull: false },
  payment_intent_event:                { type: Sequelize.STRING, allowNull: false },
  micro_app:                           { type: Sequelize.STRING, allowNull: true },
  target_type:                         { type: Sequelize.STRING, allowNull: true, defaultValue: '' },
  target_id:                           { type: Sequelize.INTEGER, allowNull: true, defaultValue: 0 },
  status:                              { type: Sequelize.STRING, allowNull: false, defaultValue: '' },
  date_created:                        { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  uuid:                                { type: Sequelize.STRING, unique: true, defaultValue: Sequelize.UUIDV1 }
}, common_options);

export const UserCharges = <MyModelStatic> sequelize.define('carry_user_charges', {
  id:                                  { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  user_id:                             { type: Sequelize.INTEGER, allowNull: false, references: { model: Users, key: 'id' } },
  charge_id:                           { type: Sequelize.STRING, allowNull: false },
  charge_event:                        { type: Sequelize.STRING, allowNull: false },
  micro_app:                           { type: Sequelize.STRING, allowNull: true },
  target_type:                         { type: Sequelize.STRING, allowNull: true, defaultValue: '' },
  target_id:                           { type: Sequelize.INTEGER, allowNull: true, defaultValue: 0 },
  status:                              { type: Sequelize.STRING, allowNull: false, defaultValue: '' },
  date_created:                        { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  uuid:                                { type: Sequelize.STRING, unique: true, defaultValue: Sequelize.UUIDV1 }
}, common_options);

export const UserTransfers = <MyModelStatic> sequelize.define('carry_user_transfers', {
  id:                                  { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  user_id:                             { type: Sequelize.INTEGER, allowNull: false, references: { model: Users, key: 'id' } },
  transfer_id:                         { type: Sequelize.STRING, allowNull: false },
  transfer_event:                      { type: Sequelize.STRING, allowNull: false },
  micro_app:                           { type: Sequelize.STRING, allowNull: true },
  target_type:                         { type: Sequelize.STRING, allowNull: true, defaultValue: '' },
  target_id:                           { type: Sequelize.INTEGER, allowNull: true, defaultValue: 0 },
  status:                              { type: Sequelize.STRING, allowNull: false, defaultValue: '' },
  date_created:                        { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  uuid:                                { type: Sequelize.STRING, unique: true, defaultValue: Sequelize.UUIDV1 }
}, common_options);

export const UserRefunds = <MyModelStatic> sequelize.define('carry_user_refunds', {
  id:                                  { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  user_id:                             { type: Sequelize.INTEGER, allowNull: false, references: { model: Users, key: 'id' } },
  refund_id:                           { type: Sequelize.STRING, allowNull: false },
  refund_event:                        { type: Sequelize.STRING, allowNull: false },
  micro_app:                           { type: Sequelize.STRING, allowNull: true },
  target_type:                         { type: Sequelize.STRING, allowNull: true, defaultValue: '' },
  target_id:                           { type: Sequelize.INTEGER, allowNull: true, defaultValue: 0 },
  status:                              { type: Sequelize.STRING, allowNull: false, defaultValue: '' },
  date_created:                        { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  uuid:                                { type: Sequelize.STRING, unique: true, defaultValue: Sequelize.UUIDV1 }
}, common_options);

export const UserInvoices = <MyModelStatic> sequelize.define('carry_user_invoices', {
  id:                                  { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  user_id:                             { type: Sequelize.INTEGER, allowNull: false, references: { model: Users, key: 'id' } },
  invoice_id:                          { type: Sequelize.STRING, allowNull: false },
  invoice_details:                     { type: Sequelize.STRING, allowNull: false },
  target_type:                         { type: Sequelize.STRING, allowNull: true, defaultValue: '' },
  target_id:                           { type: Sequelize.INTEGER, allowNull: true, defaultValue: 0 },
  status:                              { type: Sequelize.STRING, allowNull: false, defaultValue: '' },
  date_created:                        { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  uuid:                                { type: Sequelize.STRING, unique: true, defaultValue: Sequelize.UUIDV1 }
}, common_options);


export const Messagings = <MyModelStatic> sequelize.define('carry_messagings', {
  id:                 { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  user_id:            { type: Sequelize.INTEGER, allowNull: false, references: { model: Users, key: 'id' } },
  sender_id:          { type: Sequelize.INTEGER, allowNull: false, references: { model: Users, key: 'id' } },
  date_created:       { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  uuid:               { type: Sequelize.STRING, defaultValue: Sequelize.UUIDV1 }
}, common_options);

export const MessagingRequests = <MyModelStatic> sequelize.define('carry_messaging_requests', {
  id:                 { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  user_id:            { type: Sequelize.INTEGER, allowNull: false, references: { model: Users, key: 'id' } },
  sender_id:          { type: Sequelize.INTEGER, allowNull: false, references: { model: Users, key: 'id' } },
  date_created:       { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  uuid:               { type: Sequelize.STRING, defaultValue: Sequelize.UUIDV1 }
}, common_options);

export const Messages = <MyModelStatic> sequelize.define('carry_messages', {
  id:                 { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  from_id:            { type: Sequelize.INTEGER, allowNull: false, references: { model: Users, key: 'id' } },
  to_id:              { type: Sequelize.INTEGER, allowNull: false, references: { model: Users, key: 'id' } },
  body:               { type: Sequelize.TEXT, allowNull: true, defaultValue: '' },
  app_context:        { type: Sequelize.STRING, allowNull: true, defaultValue: '' }, // _common/hotspot.myfavors/etc
  opened:             { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
  date_created:       { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  uuid:               { type: Sequelize.STRING, defaultValue: Sequelize.UUIDV1 }
}, common_options);

export const MessagePhotos = <MyModelStatic> sequelize.define('carry_message_photos', {
  id:                  { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  message_id:          { type: Sequelize.INTEGER, allowNull: false, references: { model: Messages, key: 'id' } },
  photo_link:                       { type: Sequelize.STRING, allowNull: true, defaultValue: '' },
  photo_id:                         { type: Sequelize.STRING, allowNull: true, defaultValue: '' },
  date_created:        { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  uuid:                { type: Sequelize.STRING, defaultValue: Sequelize.UUIDV1 }
}, common_options);



export const CarryAdmins = <MyModelStatic> sequelize.define('carry_admins', {
  id:                  { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  firstname:           { type: Sequelize.STRING, allowNull: false, defaultValue: '' },
  middlename:          { type: Sequelize.STRING, allowNull: false, defaultValue: '' },
  lastname:            { type: Sequelize.STRING, allowNull: false, defaultValue: '' },
  icon_link:           { type: Sequelize.STRING, allowNull: true, defaultValue: '' },
  icon_id:             { type: Sequelize.STRING, allowNull: true, defaultValue: '' },
  email:               { type: Sequelize.STRING, allowNull: false },
  password:            { type: Sequelize.STRING, allowNull: false },
  phone:               { type: Sequelize.STRING, allowNull: true },
  role:                { type: Sequelize.STRING, allowNull: false, defaultValue: CARRY_ADMIN_ROLES.ADMINISTRATOR },
  active:              { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
  date_created:        { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  uuid:                { type: Sequelize.STRING, defaultValue: Sequelize.UUIDV1 }
}, common_options);


export const ResetPasswordRequests = <MyModelStatic> sequelize.define('carry_reset_password_requests', {
  id:                  { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  user_id:             { type: Sequelize.INTEGER, allowNull: false, references: { model: Users, key: 'id' } },
  completed:           { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
  uuid:                { type: Sequelize.STRING, unique: true, defaultValue: Sequelize.UUIDV1 },
  date_created:        { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
}, common_options);



export const Delivery = <MyModelStatic> sequelize.define('carry_deliveries', {
  id:                                   { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  owner_id:                             { type: Sequelize.INTEGER, allowNull: false, references: { model: Users, key: 'id' } },
  
  carrier_id:                           { type: Sequelize.INTEGER, allowNull: true, references: { model: Users, key: 'id' } },
  carrier_assigned_date:                { type: Sequelize.DATE, allowNull: true },
  
  carrier_latest_lat:                   { type: Sequelize.DOUBLE, allowNull: true },
  carrier_latest_lng:                   { type: Sequelize.DOUBLE, allowNull: true },
  carrier_location_requested:           { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
  carrier_location_request_completed:   { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
  carrier_shared_location:              { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },

  carrier_id_image_link:                { type: Sequelize.STRING(500), allowNull: true, defaultValue: '' },
  carrier_id_image_id:                  { type: Sequelize.STRING(500), allowNull: true, defaultValue: '' },
  carrier_sig_image_link:               { type: Sequelize.STRING(500), allowNull: true, defaultValue: '' },
  carrier_sig_image_id:                 { type: Sequelize.STRING(500), allowNull: true, defaultValue: '' },

  title:                                { type: Sequelize.STRING, allowNull: false },
  description:                          { type: Sequelize.STRING(500), allowNull: false },
  charge_id:                            { type: Sequelize.STRING(500), allowNull: false, defaultValue: '' },
  payment_intent_id:                    { type: Sequelize.STRING(500), allowNull: false, defaultValue: '' },
  payment_method_id:                    { type: Sequelize.STRING(500), allowNull: false, defaultValue: '' },
  tags:                                 { type: Sequelize.STRING(250), allowNull: false, defaultValue: '' },
  item_image_link:                      { type: Sequelize.STRING(500), allowNull: true, defaultValue: '' },
  item_image_id:                        { type: Sequelize.STRING(500), allowNull: true, defaultValue: '' },
  
  from_location:                        { type: Sequelize.STRING(500), allowNull: false },
  from_address:                         { type: Sequelize.STRING(500), allowNull: false },
  from_street:                          { type: Sequelize.STRING(500), allowNull: false },
  from_city:                            { type: Sequelize.STRING(500), allowNull: false },
  from_state:                           { type: Sequelize.STRING(500), allowNull: false },
  from_zipcode:                         { type: Sequelize.INTEGER, allowNull: false },
  from_country:                         { type: Sequelize.STRING, allowNull: false, defaultValue: '' },
  from_place_id:                        { type: Sequelize.STRING, allowNull: false },
  from_lat:                             { type: Sequelize.DOUBLE, allowNull: false },
  from_lng:                             { type: Sequelize.DOUBLE, allowNull: false },
  from_person:                          { type: Sequelize.STRING(500), allowNull: false, defaultValue: '' },
  from_person_phone:                    { type: Sequelize.STRING(500), allowNull: false, defaultValue: '' },
  from_person_email:                    { type: Sequelize.STRING(500), allowNull: false, defaultValue: '' },
  from_person_id_required:              { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
  from_person_sig_required:             { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },

  from_person_id_image_link:            { type: Sequelize.STRING(500), allowNull: true, defaultValue: '' },
  from_person_id_image_id:              { type: Sequelize.STRING(500), allowNull: true, defaultValue: '' },
  from_person_sig_image_link:           { type: Sequelize.STRING(500), allowNull: true, defaultValue: '' },
  from_person_sig_image_id:             { type: Sequelize.STRING(500), allowNull: true, defaultValue: '' },

  to_location:                          { type: Sequelize.STRING(500), allowNull: false },
  to_address:                           { type: Sequelize.STRING(500), allowNull: false },
  to_street:                            { type: Sequelize.STRING(500), allowNull: false },
  to_city:                              { type: Sequelize.STRING(500), allowNull: false },
  to_state:                             { type: Sequelize.STRING(500), allowNull: false },
  to_zipcode:                           { type: Sequelize.INTEGER, allowNull: false },
  to_country:                           { type: Sequelize.STRING, allowNull: false, defaultValue: '' },
  to_place_id:                          { type: Sequelize.STRING, allowNull: false },
  to_lat:                               { type: Sequelize.DOUBLE, allowNull: false },
  to_lng:                               { type: Sequelize.DOUBLE, allowNull: false },
  to_person:                            { type: Sequelize.STRING(500), allowNull: false, defaultValue: '' },
  to_person_phone:                      { type: Sequelize.STRING(500), allowNull: false, defaultValue: '' },
  to_person_email:                      { type: Sequelize.STRING(500), allowNull: false, defaultValue: '' },
  to_person_id_required:                { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
  to_person_sig_required:               { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },

  to_person_id_image_link:              { type: Sequelize.STRING(500), allowNull: true, defaultValue: '' },
  to_person_id_image_id:                { type: Sequelize.STRING(500), allowNull: true, defaultValue: '' },
  to_person_sig_image_link:             { type: Sequelize.STRING(500), allowNull: true, defaultValue: '' },
  to_person_sig_image_id:               { type: Sequelize.STRING(500), allowNull: true, defaultValue: '' },

  distance_miles:                       { type: Sequelize.DOUBLE, allowNull: false, defaultValue: 0 },
  
  category:                             { type: Sequelize.STRING(500), allowNull: false, defaultValue: '' },
  size:                                 { type: Sequelize.STRING(500), allowNull: false, defaultValue: '' },
  weight:                               { type: Sequelize.INTEGER, allowNull: false },
  featured:                             { type: Sequelize.STRING, allowNull: true, defaultValue: '' }, // bronze/silver/gold
  available:                            { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
  started:                              { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
  auto_accept_anyone:                   { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
  urgent:                               { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
  canceled:                             { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
  returned:                             { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
  completed:                            { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
  delivered_instructions:               { type: Sequelize.STRING(500), allowNull: true, defaultValue: '' },
  delivered_image_link:                 { type: Sequelize.STRING(500), allowNull: true, defaultValue: '' },
  delivered_image_id:                   { type: Sequelize.STRING(500), allowNull: true, defaultValue: '' },
  payment_session_id:                   { type: Sequelize.TEXT, allowNull: true, defaultValue: '' },
  payout:                               { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
  payout_invoice_id:                    { type: Sequelize.STRING(500), allowNull: true, defaultValue: '' }, // paypal
  penalty:                              { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
  penalty_invoice_id:                   { type: Sequelize.STRING(500), allowNull: true, defaultValue: '' }, // paypal

  datetime_pick_up_by:                  { type: Sequelize.DATE, allowNull: true, },
  datetime_picked_up:                   { type: Sequelize.DATE, allowNull: true, },
  datetime_picked_up_est:               { type: Sequelize.DATE, allowNull: true, },
  
  datetime_delivered:                   { type: Sequelize.DATE, allowNull: true, },
  datetime_deliver_by:                  { type: Sequelize.DATE, allowNull: true, },
  datetime_delivered_est:               { type: Sequelize.DATE, allowNull: true, },

  datetime_completed:                   { type: Sequelize.DATE, allowNull: true, },
  datetime_complete_by:                 { type: Sequelize.DATE, allowNull: true, },
  datetime_complete_est:                { type: Sequelize.DATE, allowNull: true, },

  date_created:                         { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  uuid:                                 { type: Sequelize.STRING, defaultValue: Sequelize.UUIDV1 }
}, common_options);

export const UserNewListingsAlerts = <MyModelStatic> sequelize.define('carry_user_new_listings_alerts', {
  id:                { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  user_id:           { type: Sequelize.INTEGER, allowNull: false, references: { model: Users, key: 'id' } },
  label:             { type: Sequelize.STRING, allowNull: false, defaultValue: '' },
  to_city:           { type: Sequelize.STRING(500), allowNull: false, defaultValue: '' },
  to_state:          { type: Sequelize.STRING(500), allowNull: false, defaultValue: '' },
  from_city:         { type: Sequelize.STRING(500), allowNull: false, defaultValue: '' },
  from_state:        { type: Sequelize.STRING(500), allowNull: false, defaultValue: '' },
  
  date_created:       { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  uuid:               { type: Sequelize.STRING, defaultValue: Sequelize.UUIDV1 }
}, common_options);

export const UserLastAlertedTimes = <MyModelStatic> sequelize.define('carry_user_last_alerted_times', {
  id:                { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  user_id:           { type: Sequelize.INTEGER, allowNull: false, references: { model: Users, key: 'id' } },
  
  lasted_alerted:     { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  uuid:               { type: Sequelize.STRING, defaultValue: Sequelize.UUIDV1 }
}, common_options);

export const ListingsAlertsLastPushed = <MyModelStatic> sequelize.define('carry_listings_alerts_last_pushed', {
  id:                { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  date_created:     { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  uuid:               { type: Sequelize.STRING, defaultValue: Sequelize.UUIDV1 }
}, common_options);


// UserNewListingsAlerts.sync({ alter: true }); 

export const DeliveryCarrierPickupApproachingNotifications = <MyModelStatic> sequelize.define('carry_delivery_carrier_pickup_approaching_notifications', {
  id:                 { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  delivery_id:        { type: Sequelize.INTEGER, allowNull: false, references: { model: Delivery, key: 'id' } },
  carrier_id:         { type: Sequelize.INTEGER, allowNull: false, references: { model: Users, key: 'id' } },  
  date_created:       { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  uuid:               { type: Sequelize.STRING, defaultValue: Sequelize.UUIDV1 }
}, common_options);

export const DeliveryCarrierDropoffApproachingNotifications = <MyModelStatic> sequelize.define('carry_delivery_carrier_dropoff_approaching_notifications', {
  id:                 { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  delivery_id:        { type: Sequelize.INTEGER, allowNull: false, references: { model: Delivery, key: 'id' } },
  carrier_id:         { type: Sequelize.INTEGER, allowNull: false, references: { model: Users, key: 'id' } },  
  date_created:       { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  uuid:               { type: Sequelize.STRING, defaultValue: Sequelize.UUIDV1 }
}, common_options);

export const DeliveryCarrierTrackLocationRequests = <MyModelStatic> sequelize.define('carry_delivery_carrier_track_location_requests', {
  id:                 { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  delivery_id:        { type: Sequelize.INTEGER, allowNull: false, references: { model: Delivery, key: 'id' } },
  status:             { type: Sequelize.STRING, allowNull: false },
  
  date_created:       { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  uuid:               { type: Sequelize.STRING, defaultValue: Sequelize.UUIDV1 }
}, common_options);

export const DeliveryInsurances = <MyModelStatic> sequelize.define('carry_delivery_insurances', {
  id:                 { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  delivery_id:        { type: Sequelize.INTEGER, allowNull: true, references: { model: Delivery, key: 'id' } },
  insurance_type:     { type: Sequelize.STRING, allowNull: true },
  amount_insured:     { type: Sequelize.INTEGER, allowNull: true },
  amount_paid:        { type: Sequelize.INTEGER, allowNull: false },
  
  date_created:       { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  uuid:               { type: Sequelize.STRING, defaultValue: Sequelize.UUIDV1 }
}, common_options);


// DeliveryInsurances.sync({ alter: true });

export const DeliveryCarrierTrackLocationUpdates = <MyModelStatic> sequelize.define('carry_delivery_carrier_track_location_updates', {
  id:                 { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  delivery_id:        { type: Sequelize.INTEGER, allowNull: false, references: { model: Delivery, key: 'id' } },
  lat:                { type: Sequelize.DOUBLE, allowNull: false },
  lng:                { type: Sequelize.DOUBLE, allowNull: false },
  
  date_created:       { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  uuid:               { type: Sequelize.STRING, defaultValue: Sequelize.UUIDV1 }
}, common_options);

export const DeliveryTransactions = <MyModelStatic> sequelize.define('carry_delivery_transactions', {
  id:                 { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  delivery_id:        { type: Sequelize.INTEGER, allowNull: false, references: { model: Delivery, key: 'id' } },
  action_type:        { type: Sequelize.STRING, allowNull: false },
  action_id:          { type: Sequelize.STRING, allowNull: false },
  status:             { type: Sequelize.STRING, allowNull: false },
  
  date_created:       { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  uuid:               { type: Sequelize.STRING, defaultValue: Sequelize.UUIDV1 }
}, common_options);

export const DeliveryMessages = <MyModelStatic> sequelize.define('carry_deliveries_messages', {
  id:                 { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  delivery_id:        { type: Sequelize.INTEGER, allowNull: false, references: { model: Delivery, key: 'id' } },
  user_id:            { type: Sequelize.INTEGER, allowNull: false, references: { model: Users, key: 'id' } },
  body:               { type: Sequelize.TEXT, allowNull: true, defaultValue: '' },
  opened:             { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
  date_created:       { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  uuid:               { type: Sequelize.STRING, defaultValue: Sequelize.UUIDV1 }
}, common_options);

export const DeliveryPayoutAttempts = <MyModelStatic> sequelize.define('carry_delivery_payout_attempts', {
  id:                          { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  delivery_id:                 { type: Sequelize.INTEGER, allowNull: false, references: { model: Delivery, key: 'id' } },
  transaction_id:              { type: Sequelize.STRING, allowNull: false },
  date_created:                { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  uuid:                        { type: Sequelize.STRING, defaultValue: Sequelize.UUIDV1 }
}, common_options);

export const DeliveryPenaltyAttempts = <MyModelStatic> sequelize.define('carry_delivery_penalty_attempts', {
  id:                          { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  delivery_id:                 { type: Sequelize.INTEGER, allowNull: false, references: { model: Delivery, key: 'id' } },
  transaction_id:              { type: Sequelize.STRING, allowNull: false },
  date_created:                { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  uuid:                        { type: Sequelize.STRING, defaultValue: Sequelize.UUIDV1 }
}, common_options);

export const DeliveryCarrierRequests = <MyModelStatic> sequelize.define('carry_delivery_carrier_requests', {
  id:              { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  user_id:         { type: Sequelize.INTEGER, allowNull: false, references: { model: Users, key: 'id' } },
  delivery_id:     { type: Sequelize.INTEGER, allowNull: false, references: { model: Delivery, key: 'id' } },
  message:         { type: Sequelize.STRING, allowNull: true },
  status:          { type: Sequelize.STRING, allowNull: false },
  date_created:    { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  uuid:            { type: Sequelize.STRING, unique: true, defaultValue: Sequelize.UUIDV1 }
}, common_options);

export const DeliveryDisputes = <MyModelStatic> sequelize.define('carry_delivery_disputes', {
  id:              { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  creator_id:      { type: Sequelize.INTEGER, allowNull: false, references: { model: Users, key: 'id' } },
  user_id:         { type: Sequelize.INTEGER, allowNull: false, references: { model: Users, key: 'id' } },
  delivery_id:     { type: Sequelize.INTEGER, allowNull: false, references: { model: Delivery, key: 'id' } },
  agent_id:        { type: Sequelize.INTEGER, allowNull: true, references: { model: CarryAdmins, key: 'id' } },
  title:           { type: Sequelize.STRING, allowNull: false },
  details:         { type: Sequelize.TEXT, allowNull: false },
  status:          { type: Sequelize.STRING, allowNull: false },
  image_link:      { type: Sequelize.STRING(500), allowNull: true, defaultValue: '' },
  image_id:        { type: Sequelize.STRING(500), allowNull: true, defaultValue: '' },
  compensation:    { type: Sequelize.INTEGER, allowNull: false },
  date_created:    { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  uuid:            { type: Sequelize.STRING, unique: true, defaultValue: Sequelize.UUIDV1 }
}, common_options);

export const DeliveryDisputeCustomerSupportPreviousAgents = <MyModelStatic> sequelize.define('carry_delivery_customer_support_previous_agents', {
  // keep track of all customer support agents working on the dispute
  id:              { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  dispute_id:      { type: Sequelize.INTEGER, allowNull: false, references: { model: DeliveryDisputes, key: 'id' } },
  delivery_id:     { type: Sequelize.INTEGER, allowNull: false, references: { model: Delivery, key: 'id' } },
  agent_id:        { type: Sequelize.INTEGER, allowNull: false, references: { model: CarryAdmins, key: 'id' } },
  date_created:    { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  uuid:            { type: Sequelize.STRING, unique: true, defaultValue: Sequelize.UUIDV1 }
}, common_options);

export const DeliveryDisputeLogs = <MyModelStatic> sequelize.define('carry_delivery_dispute_logs', {
  id:              { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  dispute_id:      { type: Sequelize.INTEGER, allowNull: false, references: { model: DeliveryDisputes, key: 'id' } },
  creator_id:      { type: Sequelize.INTEGER, allowNull: false, references: { model: Users, key: 'id' } },
  user_id:         { type: Sequelize.INTEGER, allowNull: false, references: { model: Users, key: 'id' } },
  agent_id:        { type: Sequelize.INTEGER, allowNull: true, references: { model: CarryAdmins, key: 'id' } },
  delivery_id:     { type: Sequelize.INTEGER, allowNull: false, references: { model: Delivery, key: 'id' } },
  body:            { type: Sequelize.TEXT, allowNull: true, defaultValue: '' },
  image_link:      { type: Sequelize.STRING(500), allowNull: true, defaultValue: '' },
  image_id:        { type: Sequelize.STRING(500), allowNull: true, defaultValue: '' },
  date_created:    { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  uuid:            { type: Sequelize.STRING, unique: true, defaultValue: Sequelize.UUIDV1 }
}, common_options);

export const DeliveryDisputeCustomerSupportMessages = <MyModelStatic> sequelize.define('carry_delivery_dispute_customer_support_messages', {
  id:              { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  dispute_id:      { type: Sequelize.INTEGER, allowNull: false, references: { model: DeliveryDisputes, key: 'id' } },
  user_id:         { type: Sequelize.INTEGER, allowNull: true, references: { model: Users, key: 'id' } },
  delivery_id:     { type: Sequelize.INTEGER, allowNull: false, references: { model: Delivery, key: 'id' } },
  is_from_cs:      { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false }, // customer support message
  agent_id:        { type: Sequelize.INTEGER, allowNull: true, references: { model: CarryAdmins, key: 'id' } },
  body:            { type: Sequelize.TEXT, allowNull: true, defaultValue: '' },
  image_link:      { type: Sequelize.STRING(500), allowNull: true, defaultValue: '' },
  image_id:        { type: Sequelize.STRING(500), allowNull: true, defaultValue: '' },
  date_created:    { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  uuid:            { type: Sequelize.STRING, unique: true, defaultValue: Sequelize.UUIDV1 }
}, common_options);


export const DeliveryDisputeSettlementOffers = <MyModelStatic> sequelize.define('carry_delivery_dispute_settlement_offers', {
  id:              { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  dispute_id:      { type: Sequelize.INTEGER, allowNull: false, references: { model: DeliveryDisputes, key: 'id' } },
  creator_id:      { type: Sequelize.INTEGER, allowNull: false, references: { model: Users, key: 'id' } },
  user_id:         { type: Sequelize.INTEGER, allowNull: false, references: { model: Users, key: 'id' } },
  agent_id:        { type: Sequelize.INTEGER, allowNull: true, references: { model: CarryAdmins, key: 'id' } },
  delivery_id:     { type: Sequelize.INTEGER, allowNull: false, references: { model: Delivery, key: 'id' } },
  status:          { type: Sequelize.STRING, allowNull: false },
  
  message:         { type: Sequelize.TEXT, allowNull: false, defaultValue: '' },
  offer_amount:    { type: Sequelize.INTEGER, allowNull: false },
  
  date_created:    { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  uuid:            { type: Sequelize.STRING, unique: true, defaultValue: Sequelize.UUIDV1 }
}, common_options);

export const DeliveryDisputeSettlementInvoices = <MyModelStatic> sequelize.define('carry_delivery_dispute_settlement_invoices', {
  id:              { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  offer_id:        { type: Sequelize.INTEGER, allowNull: false, references: { model: DeliveryDisputeSettlementOffers, key: 'id' } },
  dispute_id:      { type: Sequelize.INTEGER, allowNull: false, references: { model: DeliveryDisputes, key: 'id' } },
  user_id:         { type: Sequelize.INTEGER, allowNull: false, references: { model: Users, key: 'id' } },
  agent_id:        { type: Sequelize.INTEGER, allowNull: true, references: { model: CarryAdmins, key: 'id' } },
  delivery_id:     { type: Sequelize.INTEGER, allowNull: false, references: { model: Delivery, key: 'id' } },
  message:         { type: Sequelize.TEXT, allowNull: false, defaultValue: '' },
  invoice_amount:  { type: Sequelize.INTEGER, allowNull: false },
  status:          { type: Sequelize.STRING, allowNull: false },
  charge_id:                            { type: Sequelize.STRING(500), allowNull: false, defaultValue: '' },
  payment_intent_id:                    { type: Sequelize.STRING(500), allowNull: false, defaultValue: '' },
  payment_method_id:                    { type: Sequelize.STRING(500), allowNull: false, defaultValue: '' },
  paid:            { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
  date_due:        { type: Sequelize.DATE, allowNull: true },
  date_created:    { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  uuid:            { type: Sequelize.STRING, unique: true, defaultValue: Sequelize.UUIDV1 }
}, common_options);

export const DeliveryTrackingUpdates = <MyModelStatic> sequelize.define('carry_delivery_tracking_updates', {
  id:                { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  delivery_id:       { type: Sequelize.INTEGER, allowNull: false, references: { model: Delivery, key: 'id' } },
  user_id:           { type: Sequelize.INTEGER, allowNull: false, references: { model: Users, key: 'id' } },
  message:           { type: Sequelize.STRING(500), allowNull: false, defaultValue: '' },
  carrier_lat:       { type: Sequelize.DOUBLE, allowNull: true },
  carrier_lng:       { type: Sequelize.DOUBLE, allowNull: true },
  location:          { type: Sequelize.STRING(500), allowNull: true, defaultValue: '' },
  icon_link:         { type: Sequelize.STRING(500), allowNull: true, defaultValue: '' },
  icon_id:           { type: Sequelize.STRING(500), allowNull: true, defaultValue: '' },
  date_created:      { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  uuid:              { type: Sequelize.STRING, defaultValue: Sequelize.UUIDV1 }
}, common_options);

export const DeliveryUnpaidListings = <MyModelStatic> sequelize.define('carry_delivery_unpaid_listings', {
  id:                                  { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  user_id:                             { type: Sequelize.INTEGER, allowNull: false, references: { model: Users, key: 'id' } },
  delivery_id:                         { type: Sequelize.INTEGER, allowNull: false, references: { model: Delivery, key: 'id' } },
  paid:                                { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
  metadata:                            { type: Sequelize.TEXT, allowNull: true, defaultValue: null },
  canceled_payment_intent_id:          { type: Sequelize.STRING, allowNull: false },
  payment_intent_id:                   { type: Sequelize.STRING, allowNull: true, defaultValue: null },
  date_created:                        { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  uuid:                                { type: Sequelize.STRING, unique: true, defaultValue: Sequelize.UUIDV1 }
}, common_options);

// DeliveryUnpaidListings.sync({ force: true });


export const CarryUserProfileSettings = <MyModelStatic> sequelize.define('carry_user_profile_settings', {
  id:                  { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  user_id:             { type: Sequelize.INTEGER, allowNull: false, references: { model: Users, key: 'id' } },
  phone:               { type: Sequelize.STRING, allowNull: false, defaultValue: '' },
  email:               { type: Sequelize.STRING, allowNull: false, defaultValue: '' },
  cashapp_tag:         { type: Sequelize.STRING, allowNull: false, defaultValue: '' },
  venmo_id:            { type: Sequelize.STRING, allowNull: false, defaultValue: '' },
  paypal_me:           { type: Sequelize.STRING, allowNull: false, defaultValue: '' },
  google_pay:          { type: Sequelize.STRING, allowNull: false, defaultValue: '' },
  date_created:        { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  uuid:                { type: Sequelize.STRING, defaultValue: Sequelize.UUIDV1 }
}, common_options);

export const CarryUserRatings = <MyModelStatic> sequelize.define('carry_user_ratings', {
  id:                  { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  user_id:             { type: Sequelize.INTEGER, allowNull: false, references: { model: Users, key: 'id' } },
  writer_id:           { type: Sequelize.INTEGER, allowNull: false, references: { model: Users, key: 'id' } },
  delivery_id:         { type: Sequelize.INTEGER, allowNull: false, references: { model: Delivery, key: 'id' } },
  rating:              { type: Sequelize.INTEGER, allowNull: false, defaultValue: 5 },
  title:               { type: Sequelize.TEXT, allowNull: true, defaultValue: '' },
  summary:             { type: Sequelize.STRING, allowNull: true, defaultValue: '' },
  image_link:          { type: Sequelize.STRING(500), allowNull: true, defaultValue: '' },
  image_id:            { type: Sequelize.STRING(500), allowNull: true, defaultValue: '' },
  date_created:        { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  uuid:                { type: Sequelize.STRING, defaultValue: Sequelize.UUIDV1 },
}, common_options);

export const CarryUserCustomerRatings = <MyModelStatic> sequelize.define('carry_user_customer_ratings', {
  id:                  { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  user_id:             { type: Sequelize.INTEGER, allowNull: false, references: { model: Users, key: 'id' } },
  writer_id:           { type: Sequelize.INTEGER, allowNull: false, references: { model: Users, key: 'id' } },
  delivery_id:         { type: Sequelize.INTEGER, allowNull: false, references: { model: Delivery, key: 'id' } },
  rating:              { type: Sequelize.INTEGER, allowNull: false, defaultValue: 5 },
  title:               { type: Sequelize.TEXT, allowNull: true, defaultValue: '' },
  summary:             { type: Sequelize.STRING, allowNull: true, defaultValue: '' },
  image_link:          { type: Sequelize.STRING(500), allowNull: true, defaultValue: '' },
  image_id:            { type: Sequelize.STRING(500), allowNull: true, defaultValue: '' },
  date_created:        { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  uuid:                { type: Sequelize.STRING, defaultValue: Sequelize.UUIDV1 },
}, common_options);

export const CarryUserCarrierRatings = <MyModelStatic> sequelize.define('carry_user_carrier_ratings', {
  id:                  { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  user_id:             { type: Sequelize.INTEGER, allowNull: false, references: { model: Users, key: 'id' } },
  writer_id:           { type: Sequelize.INTEGER, allowNull: false, references: { model: Users, key: 'id' } },
  delivery_id:         { type: Sequelize.INTEGER, allowNull: false, references: { model: Delivery, key: 'id' } },
  rating:              { type: Sequelize.INTEGER, allowNull: false, defaultValue: 5 },
  title:               { type: Sequelize.TEXT, allowNull: true, defaultValue: '' },
  summary:             { type: Sequelize.STRING, allowNull: true, defaultValue: '' },
  image_link:          { type: Sequelize.STRING(500), allowNull: true, defaultValue: '' },
  image_id:            { type: Sequelize.STRING(500), allowNull: true, defaultValue: '' },
  date_created:        { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  uuid:                { type: Sequelize.STRING, defaultValue: Sequelize.UUIDV1 },
}, common_options);


export const AccountsReported = <MyModelStatic> sequelize.define('carry_accounts_reported', {
  id:                  { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  user_id:             { type: Sequelize.INTEGER, allowNull: false, references: { model: Users, key: 'id' } },
  reporting_id:        { type: Sequelize.INTEGER, allowNull: false, references: { model: Users, key: 'id' } },
  issue_type:          { type: Sequelize.STRING(250), allowNull: false },
  details:             { type: Sequelize.TEXT, allowNull: false },
  date_created:        { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  uuid:                { type: Sequelize.STRING, unique: true, defaultValue: Sequelize.UUIDV1 }
}, common_options);

export const SiteFeedbacks = <MyModelStatic> sequelize.define('carry_site_feedbacks', {
  id:                  { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  user_id:             { type: Sequelize.INTEGER, allowNull: false, references: { model: Users, key: 'id' } },
  rating:              { type: Sequelize.INTEGER, allowNull: false, defaultValue: 5 },
  title:               { type: Sequelize.TEXT, allowNull: true, defaultValue: '' },
  summary:             { type: Sequelize.TEXT, allowNull: true, defaultValue: '' },
  date_created:        { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  uuid:                { type: Sequelize.STRING, defaultValue: Sequelize.UUIDV1 },
}, common_options);

export const NewsDataCache = <MyModelStatic> sequelize.define('carry_news_data_cache', {
  id:                  { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  json_data:           { type: Sequelize.TEXT, allowNull: true, defaultValue: '' },
  date_created:        { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  uuid:                { type: Sequelize.STRING, defaultValue: Sequelize.UUIDV1 },
}, common_options);

export const ApiKeys = <MyModelStatic> sequelize.define('carry_api_keys', {
  id:                  { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  key:                 { type: Sequelize.UUID, unique: true, defaultValue: Sequelize.UUIDV1 },
  user_id:             { type: Sequelize.INTEGER, allowNull: false, references: { model: Users, key: 'id' } },
  email:               { type: Sequelize.STRING, allowNull: false, defaultValue: '' },
  phone:               { type: Sequelize.STRING, allowNull: false, defaultValue: '' },
  verified:            { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
  date_created:        { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  uuid:                { type: Sequelize.STRING, defaultValue: Sequelize.UUIDV1 },
}, common_options);

export const ApiKeyRequest = <MyModelStatic> sequelize.define('carry_api_key_requests', {
  id:                  { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  api_key_id:          { type: Sequelize.INTEGER, allowNull: false, references: { model: ApiKeys, key: 'id' } },
  url:                 { type: Sequelize.STRING, allowNull: false, defaultValue: '' },
  method:              { type: Sequelize.STRING, allowNull: true, defaultValue: '' },
  metadata:            { type: Sequelize.TEXT, allowNull: true, defaultValue: '' },
  date_created:        { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  uuid:                { type: Sequelize.STRING, defaultValue: Sequelize.UUIDV1 },
}, common_options);






Users.hasMany(UserExpoDevices, { as: 'expo_devices', foreignKey: 'user_id', sourceKey: 'id' });
UserExpoDevices.belongsTo(Users, { as: 'user', foreignKey: 'user_id', targetKey: 'id' });


Users.hasOne(CarryUserProfileSettings, { as: 'carry_settings', foreignKey: 'user_id', sourceKey: 'id' });
CarryUserProfileSettings.belongsTo(Users, { as: 'user', foreignKey: 'user_id', targetKey: 'id' });


Users.hasOne(CarryUserRatings, { as: 'carry_received_ratings', foreignKey: 'user_id', sourceKey: 'id' });
CarryUserRatings.belongsTo(Users, { as: 'user', foreignKey: 'user_id', targetKey: 'id' });
Users.hasOne(CarryUserRatings, { as: 'carry_written_ratings', foreignKey: 'writer_id', sourceKey: 'id' });
CarryUserRatings.belongsTo(Users, { as: 'writer', foreignKey: 'writer_id', targetKey: 'id' });

Users.hasMany(CarryUserCustomerRatings, { as: 'carry_received_customer_ratings', foreignKey: 'user_id', sourceKey: 'id' });
CarryUserCustomerRatings.belongsTo(Users, { as: 'user', foreignKey: 'user_id', targetKey: 'id' });
Users.hasMany(CarryUserCustomerRatings, { as: 'carry_written_customer_ratings', foreignKey: 'writer_id', sourceKey: 'id' });
CarryUserCustomerRatings.belongsTo(Users, { as: 'writer', foreignKey: 'writer_id', targetKey: 'id' });

Users.hasMany(CarryUserCarrierRatings, { as: 'carry_received_carrier_ratings', foreignKey: 'user_id', sourceKey: 'id' });
CarryUserCarrierRatings.belongsTo(Users, { as: 'user', foreignKey: 'user_id', targetKey: 'id' });
Users.hasMany(CarryUserCarrierRatings, { as: 'carry_written_carrier_ratings', foreignKey: 'writer_id', sourceKey: 'id' });
CarryUserCarrierRatings.belongsTo(Users, { as: 'writer', foreignKey: 'writer_id', targetKey: 'id' });


Delivery.hasOne(CarryUserCustomerRatings, { as: 'customer_rating', foreignKey: 'delivery_id', sourceKey: 'id' });
CarryUserCustomerRatings.belongsTo(Delivery, { as: 'delivery', foreignKey: 'delivery_id', targetKey: 'id' });
Delivery.hasOne(CarryUserCarrierRatings, { as: 'carrier_rating', foreignKey: 'delivery_id', sourceKey: 'id' });
CarryUserCarrierRatings.belongsTo(Delivery, { as: 'delivery', foreignKey: 'delivery_id', targetKey: 'id' });


Users.hasMany(Notifications, { as: 'to_notifications', foreignKey: 'to_id', sourceKey: 'id' });
Notifications.belongsTo(Users, { as: 'to', foreignKey: 'to_id', targetKey: 'id' });
Users.hasMany(Notifications, { as: 'from_notifications', foreignKey: 'from_id', sourceKey: 'id' });
Notifications.belongsTo(Users, { as: 'from', foreignKey: 'from_id', targetKey: 'id' });

Users.hasMany(Messages, { as: 'messages_sent', foreignKey: 'from_id', sourceKey: 'id' });
Messages.belongsTo(Users, { as: 'from', foreignKey: 'from_id', targetKey: 'id' });
Users.hasMany(Messages, { as: 'messages_received', foreignKey: 'to_id', sourceKey: 'id' });
Messages.belongsTo(Users, { as: 'to', foreignKey: 'to_id', targetKey: 'id' });

Users.hasMany(Delivery, { as: 'carry_deliveries', foreignKey: 'owner_id', sourceKey: 'id' });
Delivery.belongsTo(Users, { as: 'owner', foreignKey: 'owner_id', targetKey: 'id' });
Users.hasMany(Delivery, { as: 'carry_deliverings', foreignKey: 'carrier_id', sourceKey: 'id' });
Delivery.belongsTo(Users, { as: 'carrier', foreignKey: 'carrier_id', targetKey: 'id' });

Users.hasMany(DeliveryCarrierRequests, { as: 'carry_carrier_requests', foreignKey: 'user_id', sourceKey: 'id' });
DeliveryCarrierRequests.belongsTo(Users, { as: 'carrier', foreignKey: 'user_id', targetKey: 'id' });
Delivery.hasMany(DeliveryCarrierRequests, { as: 'carrier_requests', foreignKey: 'delivery_id', sourceKey: 'id' });
DeliveryCarrierRequests.belongsTo(Delivery, { as: 'delivery', foreignKey: 'delivery_id', targetKey: 'id' });

Delivery.hasMany(DeliveryTrackingUpdates, { as: 'deliverme_delivery_tracking_updates', foreignKey: 'delivery_id', sourceKey: 'id' });
DeliveryTrackingUpdates.belongsTo(Delivery, { as: 'delivery', foreignKey: 'delivery_id', targetKey: 'id' });
Users.hasMany(DeliveryTrackingUpdates, { as: 'deliverme_user_tracking_updates', foreignKey: 'user_id', sourceKey: 'id' });
DeliveryTrackingUpdates.belongsTo(Users, { as: 'user', foreignKey: 'user_id', targetKey: 'id' });

Delivery.hasOne(DeliveryInsurances, { as: 'delivery_insurance', foreignKey: 'delivery_id', sourceKey: 'id' });
DeliveryInsurances.belongsTo(Delivery, { as: 'delivery', foreignKey: 'delivery_id', targetKey: 'id' });

Delivery.hasOne(DeliveryCarrierPickupApproachingNotifications, { as: 'carrier_pickup_approaching', foreignKey: 'delivery_id', sourceKey: 'id' });
DeliveryCarrierPickupApproachingNotifications.belongsTo(Delivery, { as: 'delivery', foreignKey: 'delivery_id', targetKey: 'id' });
Delivery.hasOne(DeliveryCarrierDropoffApproachingNotifications, { as: 'carrier_dropoff_approaching', foreignKey: 'delivery_id', sourceKey: 'id' });
DeliveryCarrierDropoffApproachingNotifications.belongsTo(Delivery, { as: 'delivery', foreignKey: 'delivery_id', targetKey: 'id' });

Users.hasMany(DeliveryMessages, { as: 'delivery_messages_sent', foreignKey: 'user_id', sourceKey: 'id' });
DeliveryMessages.belongsTo(Users, { as: 'user', foreignKey: 'user_id', targetKey: 'id' });

Users.hasMany(UserNewListingsAlerts, { as: 'new_listings_alerts', foreignKey: 'user_id', sourceKey: 'id' });
UserNewListingsAlerts.belongsTo(Users, { as: 'user', foreignKey: 'user_id', targetKey: 'id' });

Delivery.hasMany(DeliveryMessages, { as: 'delivery_messages', foreignKey: 'delivery_id', sourceKey: 'id' });
DeliveryMessages.belongsTo(Delivery, { as: 'delivery', foreignKey: 'delivery_id', targetKey: 'id' });

Delivery.hasMany(DeliveryCarrierTrackLocationRequests, { as: 'delivery_carrier_track_location_requests', foreignKey: 'delivery_id', sourceKey: 'id' });
DeliveryCarrierTrackLocationRequests.belongsTo(Delivery, { as: 'delivery', foreignKey: 'delivery_id', targetKey: 'id' });

Delivery.hasMany(DeliveryCarrierTrackLocationUpdates, { as: 'carrier_location_updates', foreignKey: 'delivery_id', sourceKey: 'id' });
DeliveryCarrierTrackLocationUpdates.belongsTo(Delivery, { as: 'delivery', foreignKey: 'delivery_id', targetKey: 'id' });

Delivery.hasOne(DeliveryDisputes, { as: 'delivery_dispute', foreignKey: 'delivery_id', sourceKey: 'id' });
DeliveryDisputes.belongsTo(Delivery, { as: 'delivery', foreignKey: 'delivery_id', targetKey: 'id' });

Users.hasMany(DeliveryUnpaidListings, { as: 'unpaid_listings', foreignKey: 'user_id', sourceKey: 'id' });
DeliveryUnpaidListings.belongsTo(Users, { as: 'customer', foreignKey: 'user_id', targetKey: 'id' });
Delivery.hasOne(DeliveryUnpaidListings, { as: 'delivery_unpaid_listing', foreignKey: 'delivery_id', sourceKey: 'id' });
DeliveryUnpaidListings.belongsTo(Delivery, { as: 'delivery', foreignKey: 'delivery_id', targetKey: 'id' });

DeliveryDisputes.hasMany(DeliveryDisputeLogs, { as: 'delivery_dispute_logs', foreignKey: 'dispute_id', sourceKey: 'id' });
DeliveryDisputeLogs.belongsTo(DeliveryDisputes, { as: 'dispute', foreignKey: 'dispute_id', targetKey: 'id' });

CarryAdmins.hasMany(DeliveryDisputes, { as: 'delivery_assigned_disputes', foreignKey: 'agent_id', sourceKey: 'id' });
DeliveryDisputes.belongsTo(CarryAdmins, { as: 'agent', foreignKey: 'agent_id', targetKey: 'id' });

DeliveryDisputes.hasMany(DeliveryDisputeCustomerSupportMessages, { as: 'delivery_dispute_customer_service_messagess', foreignKey: 'dispute_id', sourceKey: 'id' });
DeliveryDisputeCustomerSupportMessages.belongsTo(DeliveryDisputes, { as: 'dispute', foreignKey: 'dispute_id', targetKey: 'id' });
Users.hasMany(DeliveryDisputeCustomerSupportMessages, { as: 'carry_delivery_dispute_customer_service_messagess', foreignKey: 'user_id', sourceKey: 'id' });
DeliveryDisputeCustomerSupportMessages.belongsTo(Users, { as: 'user', foreignKey: 'user_id', targetKey: 'id' });
CarryAdmins.hasMany(DeliveryDisputeCustomerSupportMessages, { as: 'customer_service_messagess', foreignKey: 'agent_id', sourceKey: 'id' });
DeliveryDisputeCustomerSupportMessages.belongsTo(CarryAdmins, { as: 'agent', foreignKey: 'agent_id', targetKey: 'id' });

DeliveryDisputes.hasMany(DeliveryDisputeSettlementOffers, { as: 'delivery_dispute_settlement_offers', foreignKey: 'dispute_id', sourceKey: 'id' });
DeliveryDisputeSettlementOffers.belongsTo(DeliveryDisputes, { as: 'dispute', foreignKey: 'dispute_id', targetKey: 'id' });

DeliveryDisputes.hasOne(DeliveryDisputeSettlementInvoices, { as: 'delivery_dispute_settlement_invoices', foreignKey: 'dispute_id', sourceKey: 'id' });
DeliveryDisputeSettlementInvoices.belongsTo(DeliveryDisputes, { as: 'dispute', foreignKey: 'dispute_id', targetKey: 'id' });


Users.hasMany(DeliveryDisputes, { as: 'carry_delivery_disputes_created', foreignKey: 'creator_id', sourceKey: 'id' });
DeliveryDisputes.belongsTo(Users, { as: 'creator', foreignKey: 'creator_id', targetKey: 'id' });
Users.hasMany(DeliveryDisputes, { as: 'carry_delivery_disputes_received', foreignKey: 'user_id', sourceKey: 'id' });
DeliveryDisputes.belongsTo(Users, { as: 'user', foreignKey: 'user_id', targetKey: 'id' });

Users.hasMany(DeliveryDisputeLogs, { as: 'carry_delivery_dispute_logs_created', foreignKey: 'creator_id', sourceKey: 'id' });
DeliveryDisputeLogs.belongsTo(Users, { as: 'creator', foreignKey: 'creator_id', targetKey: 'id' });
Users.hasMany(DeliveryDisputeLogs, { as: 'carry_delivery_dispute_logs_received', foreignKey: 'user_id', sourceKey: 'id' });
DeliveryDisputeLogs.belongsTo(Users, { as: 'user', foreignKey: 'user_id', targetKey: 'id' });

Users.hasMany(DeliveryDisputeSettlementOffers, { as: 'carry_delivery_dispute_settlement_offers_created', foreignKey: 'creator_id', sourceKey: 'id' });
DeliveryDisputeSettlementOffers.belongsTo(Users, { as: 'creator', foreignKey: 'creator_id', targetKey: 'id' });
Users.hasMany(DeliveryDisputeSettlementOffers, { as: 'carry_delivery_dispute_settlement_offers_received', foreignKey: 'user_id', sourceKey: 'id' });
DeliveryDisputeSettlementOffers.belongsTo(Users, { as: 'user', foreignKey: 'user_id', targetKey: 'id' });
CarryAdmins.hasMany(DeliveryDisputeSettlementOffers, { as: 'delivery_dispute_settlement_offers', foreignKey: 'agent_id', sourceKey: 'id' });
DeliveryDisputeSettlementOffers.belongsTo(CarryAdmins, { as: 'agent', foreignKey: 'agent_id', targetKey: 'id' });

// Users.hasMany(DeliveryDisputeSettlementInvoices, { as: 'carry_delivery_dispute_settlement_invoices_created', foreignKey: 'creator_id', sourceKey: 'id' });
// DeliveryDisputeSettlementInvoices.belongsTo(Users, { as: 'creator', foreignKey: 'creator_id', targetKey: 'id' });
Users.hasMany(DeliveryDisputeSettlementInvoices, { as: 'carry_delivery_dispute_settlement_invoices_received', foreignKey: 'user_id', sourceKey: 'id' });
DeliveryDisputeSettlementInvoices.belongsTo(Users, { as: 'user', foreignKey: 'user_id', targetKey: 'id' });
CarryAdmins.hasMany(DeliveryDisputeSettlementInvoices, { as: 'delivery_dispute_settlement_invoices', foreignKey: 'agent_id', sourceKey: 'id' });
DeliveryDisputeSettlementInvoices.belongsTo(CarryAdmins, { as: 'agent', foreignKey: 'agent_id', targetKey: 'id' });
