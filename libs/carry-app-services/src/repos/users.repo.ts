import { fn, Op, WhereOptions } from "sequelize";
import {
  IMyModel,
} from "../interfaces/carry.interface";
import { PlainObject } from "../interfaces/common.interface";
import {
  Users,
  ResetPasswordRequests,
  UserExpoDevices,
  ApiKeys,
  UserNewListingsAlerts,
  UserStripeIdentityVerificationSessions,
  ApiKeyRequests,
  ApiKeyWebhookEvents,
} from "../models/carry.model";
import { user_attrs_slim } from "../utils/constants.utils";
import {
  sequelize_model_class_crud_to_entity_class,
} from "../utils/helpers.utils";
import {
  ApiKeyEntity,
  ApiKeyRequestEntity,
  ApiKeyWebhookEventEntity,
  ResetPasswordRequestEntity,
  UserEntity,
  UserExpoDeviceEntity,
  UserNewListingsAlertEntity,
  UserStripeIdentityVerificationSessionEntity
} from "../entities/carry.entity";





const users_crud = sequelize_model_class_crud_to_entity_class<UserEntity>(Users, UserEntity);
const user_password_resets_crud = sequelize_model_class_crud_to_entity_class<ResetPasswordRequestEntity>(Users, ResetPasswordRequestEntity);
const user_expo_devices_crud = sequelize_model_class_crud_to_entity_class<UserExpoDeviceEntity>(UserExpoDevices, UserExpoDeviceEntity);
const api_keys_crud = sequelize_model_class_crud_to_entity_class<ApiKeyEntity>(ApiKeys, ApiKeyEntity);
const api_key_requests_crud = sequelize_model_class_crud_to_entity_class<ApiKeyRequestEntity>(ApiKeyRequests, ApiKeyRequestEntity);
const api_key_webHook_events_crud = sequelize_model_class_crud_to_entity_class<ApiKeyWebhookEventEntity>(ApiKeyWebhookEvents, ApiKeyWebhookEventEntity);



const user_password_reset_request_crud = sequelize_model_class_crud_to_entity_class<ResetPasswordRequestEntity>(ResetPasswordRequests, ResetPasswordRequestEntity);
const user_new_listings_alerts_crud = sequelize_model_class_crud_to_entity_class<UserNewListingsAlertEntity>(UserNewListingsAlerts, UserNewListingsAlertEntity);
const user_stripe_identity_verification_session_crud = sequelize_model_class_crud_to_entity_class<UserStripeIdentityVerificationSessionEntity>(UserStripeIdentityVerificationSessions, UserStripeIdentityVerificationSessionEntity);







export function get_user_by_where(
  whereClause: WhereOptions
) {
  return users_crud.findOne({
    where: whereClause,
    attributes: user_attrs_slim
  });
}

export function get_user_by_username_or_email(email_or_username: string) {
  return users_crud.findOne({
    where: {
      [Op.or]: [
        { email: email_or_username },
        { username: email_or_username }
      ]
    }
  });
}

export async function create_user(
  params: {
    firstname: string;
    middlename?: string | null;
    lastname: string;
    // gender?: number;
    username: string;
    displayname: string;
    email: string;
    password: string;
  }
) {
  const new_user_model = await users_crud.create(<any> params);
  const user = await get_user_by_id(new_user_model.id);
  return user!;
}

export async function get_random_users(
  limit: number
) {
  const users = await users_crud.findAll({
    limit,
    order: [fn( 'RANDOM' )],
    include: [{
      model: UserExpoDevices,
      as: `expo_devices`,
    }],
    attributes: [
      'id',
      'firstname',
      'lastname',
      'username',
      'icon_link',
      'uuid',
      'created_at',
      'updated_at',
      'deleted_at',
    ]
  })
  return users;
}

export async function get_user_by_email(
  email: string
) {
  try {
    const userModel = await users_crud.findOne({
      where: { email },
      attributes: user_attrs_slim
    });
    return userModel;
  } catch (e) {
    console.log(`get_user_by_email error - `, e);
    return null;
  }
}

export async function get_user_by_paypal(
  paypal: string
) {
  try {
    const userModel = await users_crud.findOne({
      where: { paypal },
      attributes: user_attrs_slim
    })
    return userModel;
  } catch (e) {
    console.log(`get_user_by_paypal error - `, e);
    return null;
  }
}

export async function get_user_by_phone(
  phone: string
) {
  try {
    const userModel = await users_crud.findOne({
      where: { phone },
      attributes: user_attrs_slim,
      include: [{
        model: UserExpoDevices,
        as: `expo_devices`,
      }],
    });
    return userModel;
  } catch (e) {
    console.log(`get_user_by_phone error - `, e);
    return null;
  }
}

export function update_user_by_id(id: number, updatesObj: any) {
  return users_crud.updateById(id, updatesObj);
}

export async function get_user_by_temp_phone(
  temp_phone: string
) {
  try {
    const userModel = await users_crud.findOne({
      where: { temp_phone },
      attributes: user_attrs_slim,
      include: [{
        model: UserExpoDevices,
        as: `expo_devices`,
      }],
    })
    return userModel;
  } catch (e) {
    console.log(`get_user_by_temp_phone error - `, e);
    return null;
  }
}



export async function get_user_by_id(id: number) {
  console.log(`get_user_by_id:`, { id });
  const user_model = await users_crud.findOne({
    where: { id },
    include: [{
      model: UserExpoDevices,
      as: `expo_devices`,
    }],
    attributes: {
      exclude: ['password']
    }
  })
  return user_model;
}

export async function get_user_by_stripe_customer_account_id(stripe_customer_account_id: string) {
  const user_model = await users_crud.findOne({
    where: { stripe_customer_account_id },
    include: [{
      model: UserExpoDevices,
      as: `expo_devices`,
    }],
    attributes: user_attrs_slim
  })
  .catch((err) => {
    console.log(`could not get user by stripe_customer_account_id`, { stripe_customer_account_id }, err);
    throw err;
  })
  return user_model;
}

export async function get_user_by_stripe_connected_account_id(stripe_account_id: string) {
  const user_model = await users_crud.findOne({
    where: { stripe_account_id },
    include: [{
      model: UserExpoDevices,
      as: `expo_devices`,
    }],
    attributes: user_attrs_slim
  })
  .catch((err) => {
    console.log(`could not get user by stripe_account_id`, { stripe_account_id }, err);
    throw err;
  })
  return user_model;
}

export async function get_user_by_username(
  username: string
) {
  const user_model = await users_crud.findOne({
    where: { username },
    attributes: { exclude: ['password'] },
    include: [{
      model: UserExpoDevices,
      as: `expo_devices`,
    }],
  })
  return user_model;
}

export async function get_user_by_uuid(
  uuid: string
) {
  try {
    const user_model = await users_crud.findOne({
      where: { uuid },
      attributes: { exclude: ['password'] },
      include: [{
        model: UserExpoDevices,
        as: `expo_devices`,
      }],
    })
    return user_model;
  } catch (e) {
    console.log({
      errorMessage: `get_user_by_uuid error - `,
      e,
      uuid
    });
    return null;
  }
}

export async function update_user(
  newState: Partial<{
    email: string;
    paypal: string;
    username: string;
    phone: string | null;
    temp_phone: string | null;
    bio: string;
    location: string;
    password: string;
    icon_link: string;
    icon_id: string;
    wallpaper_link: string;
    wallpaper_id: string;
    email_verified: boolean;
    phone_verified: boolean;
    stripe_account_verified: boolean;
    stripe_account_id: string;
    stripe_customer_account_id: string;
    platform_subscription_id: string,
  }>,
  whereClause: WhereOptions
) {
  try {
    const user_model_update = await users_crud.update(
      newState as any,
      { where: whereClause }
    );
    return user_model_update;
  } catch (e) {
    console.log({
      errorMessage: `update_user error - `,
      e,
      newState,
      whereClause
    });
    throw e;
  }
}

export function get_api_key(uuid: string) {
  return ApiKeys.findOne({
    where: { uuid },
    include: [{
      model: Users,
      as: 'user',
      attributes: user_attrs_slim
    }]
  })
  .then(model => !model ? null : model.toJSON() as ApiKeyEntity);
}

export function get_user_api_key(user_id: number) {
  return ApiKeys.findOne({
    where: { user_id },
    include: [{
      model: Users,
      as: 'user',
      attributes: user_attrs_slim
    }]
  })
  .then(model => !model ? null : model.toJSON() as ApiKeyEntity);
}

export async function create_user_api_key(user_id: number) {
  const new_key = await ApiKeys.create({ user_id });
  return get_api_key(new_key.dataValues.uuid);
}


export function get_user_expo_device_by_token(token: string) {
  return user_expo_devices_crud.findOne({
    where: { token,  }
  });
}

export function get_user_expo_devices(user_id: number) {
  return user_expo_devices_crud.findAll({
    where: { user_id }
  });
}

export function register_expo_device_and_push_token(user_id: number, token: string, device_info: PlainObject | null = null) {
  const params = {
    user_id,
    token,
    device_info: device_info && JSON.stringify(device_info)
  };
  console.log(`register_expo_device_and_push_token:`, { params });
  return user_expo_devices_crud.create(params);
}

export function remove_expo_device_from_user(token: string) {
  return user_expo_devices_crud.destroy({
    where: {
      token,
    }
  });
}

export function remove_expo_device_and_push_token(user_id: number, token: string) {
  return user_expo_devices_crud.destroy({
    where: {
      user_id,
      token,
    }
  });
}

export function check_user_active_password_reset(user_id: number) {
  return user_password_reset_request_crud.findOne({
    where: {
      user_id,
      completed: false,
    } 
  });
}

export function create_user_active_password_reset(user_id: number) {
  return user_password_reset_request_crud.create({ user_id });
}

export function get_password_reset_request_by_code(uuid: string) {
  return user_password_reset_request_crud.findOne({ where: { uuid } });
}

export function mark_password_reset_request_completed(id: number) {
  return user_password_reset_request_crud.updateById(id, { completed: true });
}



export function get_user_new_listings_alerts_by_where(where: any) {
  return user_new_listings_alerts_crud.findAll({ where });
}

export function get_user_new_listings_alerts_by_id(id: number) {
  return user_new_listings_alerts_crud.findOne({ where: { id } });
}

export function get_user_new_listings_alerts_by_id_and_user_id(id: number, user_id: number) {
  return user_new_listings_alerts_crud.findOne({ where: { id, user_id } });
}

export function create_user_new_listings_alert(params: {
  user_id: number,
  label?: string
  to_city?: string,
  to_state?: string,
  from_city?: string,
  from_state?: string,
}) {
  return user_new_listings_alerts_crud.create(params);
}

export function delete_user_new_listings_alert(id: number) {
  return user_new_listings_alerts_crud.deleteById(id);
}

export function check_user_new_listings_alert(params: {
  user_id: number,
  to_city?: string,
  to_state?: string,
  from_city?: string,
  from_state?: string,
}) {
  return user_new_listings_alerts_crud.findOne({
    where: {
      user_id: params.user_id,
      from_city: { [Op.like]: `%${params.from_city || ''}%` },
      from_state: { [Op.like]: `%${params.from_state || ''}%` },
      to_city: { [Op.like]: `%${params.to_city || ''}%` },
      to_state: { [Op.like]: `%${params.to_state || ''}%` },
    }
  });
}

export function get_user_new_listings_alerts_all(user_id: number) {
  return user_new_listings_alerts_crud.findAll({
    where: { user_id },
    order: [['id', 'DESC']]
  });
}

export function get_user_new_listings_alerts(user_id: number, listing_alert_id?: number) {
  return user_new_listings_alerts_crud.paginate({
    user_id_field: 'user_id',
    user_id,
    min_id: listing_alert_id,
    orderBy: [['id', 'DESC']]
  });
}



export function check_user_stripe_identity_verification_session(user_id: number) {
  return user_stripe_identity_verification_session_crud.findOne({ where: { user_id } });
}

export function create_user_stripe_identity_verification_session(params: {
  user_id:                     number,
  verification_session_id:     string,
}) {
  return user_stripe_identity_verification_session_crud.create(params);
}

export function get_user_stripe_identity_verification_session_by_session_id(verification_session_id: string) {
  return user_stripe_identity_verification_session_crud.findOne({ where: { verification_session_id } });
}

export function verify_user_stripe_identity_verification_session_by_session_id(verification_session_id: string) {
  return user_stripe_identity_verification_session_crud.update({ verified: true }, { where: { verification_session_id } });
}

export function delete_user_stripe_identity_verification_session_by_session_id(verification_session_id: string) {
  return user_stripe_identity_verification_session_crud.destroy({ where: { verification_session_id } });
}


export function update_api_key_webhook_endpoint(api_key_id: number, webhook_endpoint) {
  return api_keys_crud.updateById(api_key_id, { webhook_endpoint })
}

export function create_api_key_request(params: {
  api_key_id: number;
  url: string;
  method: string;
  metadata?: string;
}) {
  return api_key_requests_crud.create(params)
}



export function create_api_key_webhook_event(params: {
  api_key_id: number;
  event: string;
  response_code: number;
  metadata?: string;
}) {
  return api_key_webHook_events_crud.create(params)
}