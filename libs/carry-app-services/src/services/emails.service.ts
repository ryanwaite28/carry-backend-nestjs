import { compile } from 'handlebars';
import { join } from 'path';
import { readFileSync, existsSync } from 'fs';
import { AppEnvironment } from '../utils/app.enviornment';
import { sendAwsEmail } from '../utils/ses.aws.utils';
import { getUserFullName } from '../utils/helpers.utils';
import { LOGGER } from '../utils/logger.utils';
import { UserEntity } from '../entities/carry.entity';
import { create_email_verification } from '../repos/email-verification.repo';
import { PlainObject } from '../interfaces/common.interface';
import { create_user_active_password_reset } from '../repos/users.repo';



const get_html_file_as_string = (construct: string, filename: string) => {
  let html_file_path = join(__dirname, 'assets', 'email-templates', construct, filename);
  let fileExists = existsSync(html_file_path);
  // console.log(`html_file_path:`, { html_file_path, fileExists });
  if (!fileExists) {
    console.log(`File does not exist, trying parent directory...`);
    html_file_path = join(__dirname, '../', 'assets', 'email-templates', construct, filename);
    fileExists = existsSync(html_file_path);

    // console.log(`html_file_path:`, { html_file_path, fileExists });
    if (!fileExists) {
      console.log(`File does not exist...`);
    }
  }
  const content = readFileSync(html_file_path, 'utf8').toString();
  return content;
}



export class HandlebarsEmailsService {

  // Configs

  public static readonly USERS = {
    welcome: {
      subject: `Welcome to ${AppEnvironment.APP_NAME.DISPLAY}!`,
      template: compile(get_html_file_as_string('users', 'welcome.html')),
    },
    goodbye: {
      subject: `It was nice having you here at ${AppEnvironment.APP_NAME.DISPLAY}!`,
      template: compile(get_html_file_as_string('users', 'goodbye.html')),
    },
    account_email_changed: {
      subject: `${AppEnvironment.APP_NAME.DISPLAY} - Email Changed`,
      template: compile(get_html_file_as_string('users', 'account_email_changed.html')),
    },
    password_reset: {
      subject: `${AppEnvironment.APP_NAME.DISPLAY} - Password Reset`,
      template: compile(get_html_file_as_string('users', 'password_reset.html')),
    },
    password_reset_success: {
      subject: `${AppEnvironment.APP_NAME.DISPLAY} - Password Reset Successful`,
      template: compile(get_html_file_as_string('users', 'password_reset_success.html')),
    },

    identity_verification_session_canceled: {
      subject: `${AppEnvironment.APP_NAME.DISPLAY} - Identity Verification Session Canceled`,
      template: compile(get_html_file_as_string('users', 'identity_verification_session_canceled.html')),
    },
    identity_verification_session_verified: {
      subject: `${AppEnvironment.APP_NAME.DISPLAY} - Identity Verified`,
      template: compile(get_html_file_as_string('users', 'identity_verification_session_verified.html')),
    },

    customer_unpaid_listing: {
      subject: (delivery_title: string) => `${AppEnvironment.APP_NAME.DISPLAY} - Unpaid delivery listing: ${delivery_title}`,
      template: compile(get_html_file_as_string('users', 'customer_unpaid_listing.html')),
    },
  };

  public static readonly INTERNAL = {
    new_delivery_dispute: {
      subject: (dispute_title: string) => `${AppEnvironment.APP_NAME.DISPLAY} - New Delivery Dispute Opened: ${dispute_title}`,
      template: compile(get_html_file_as_string('internal', 'new_delivery_dispute.html')),
    },
  };



  // Helpers

  static async send_signup_welcome_email(user: UserEntity) {
    /** Email Sign up and verify */
    const new_email_verf_model = await create_email_verification({
      user_id: user.id,
      email: user.email
    });
    const new_email_verf: PlainObject = new_email_verf_model;
    const verify_link = `${AppEnvironment.USE_CLIENT_DOMAIN_URL}/verify-email/${new_email_verf.verification_code}`;
    const user_name: string = `${user.firstname} ${user.lastname}`;

    return sendAwsEmail({
      to: user.email,
      subject: HandlebarsEmailsService.USERS.welcome.subject,
      html: HandlebarsEmailsService.USERS.welcome.template({
        verify_link,
        user_name,
        app_name: AppEnvironment.APP_NAME.DISPLAY,
      })
    })
    .then((results) => {
      LOGGER.info(`Sent welcome email.`);
    })
    .catch((error) => {
      LOGGER.error(`Could not send welcome email...`);
    });
  }

  static async send_account_email_changed_email(user: UserEntity) {
    /** Email Sign up and verify */
    const new_email_verf_model = await create_email_verification({
      user_id: user.id,
      email: user.email
    });
    const new_email_verf: PlainObject = new_email_verf_model;
    const verify_link = `${AppEnvironment.USE_CLIENT_DOMAIN_URL}/verify-email/${new_email_verf.verification_code}`;
    const user_name: string = `${user.firstname} ${user.lastname}`;

    return sendAwsEmail({
      to: user.email,
      subject: HandlebarsEmailsService.USERS.account_email_changed.subject,
      html: HandlebarsEmailsService.USERS.account_email_changed.template({
        verify_link,
        user_name,
        app_name: AppEnvironment.APP_NAME.DISPLAY,
      })
    })
    .then((results) => {
      LOGGER.info(`Sent account email changed email.`);
    })
    .catch((error) => {
      LOGGER.error(`Could not send account email changed email...`);
    });
  }

  static async create_and_send_user_active_password_reset(user: UserEntity) {
    const new_reset_request = await create_user_active_password_reset(user.id);
    const reset_password_url = `${AppEnvironment.USE_CLIENT_DOMAIN_URL}/verify-password-reset?verification_code=${new_reset_request.uuid}`;
    return sendAwsEmail({
      to: user.email,
      subject: HandlebarsEmailsService.USERS.password_reset.subject,
      html: HandlebarsEmailsService.USERS.password_reset.template({
        user_name: getUserFullName(user),
        reset_password_url
      })
    })
    .then((results) => {
      LOGGER.info(`Sent password reset email.`);
    })
    .catch((error) => {
      LOGGER.error(`Could not send password reset email...`);
    });
  }

  static send_identity_verification_session_canceled(user: UserEntity) {
    return sendAwsEmail({
      to: user.email,
      subject: HandlebarsEmailsService.USERS.identity_verification_session_canceled.subject,
      html: HandlebarsEmailsService.USERS.identity_verification_session_canceled.template({
        user_name: getUserFullName(user),
        app_name: AppEnvironment.APP_NAME.DISPLAY
      })
    })
    .then((results) => {
      LOGGER.info(`Sent identity verification session canceled email.`);
    })
    .catch((error) => {
      LOGGER.error(`Could not send identity verification session canceled email...`);
    });
  }

  static send_identity_verification_session_verified(user: UserEntity) {
    return sendAwsEmail({
      to: user.email,
      subject: HandlebarsEmailsService.USERS.identity_verification_session_verified.subject,
      html: HandlebarsEmailsService.USERS.identity_verification_session_verified.template({
        user_name: getUserFullName(user),
        app_name: AppEnvironment.APP_NAME.DISPLAY
      })
    })
    .then((results) => {
      LOGGER.info(`Sent identity verification session verified email.`);
    })
    .catch((error) => {
      LOGGER.error(`Could not send identity verification session verified email...`);
    });
  }

}
