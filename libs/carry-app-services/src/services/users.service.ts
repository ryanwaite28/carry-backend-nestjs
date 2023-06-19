import { Request } from 'express';
import { UploadedFile } from 'express-fileupload';
import * as bcrypt from 'bcrypt-nodejs';
import {
  
} from 'sequelize';
import * as UserRepo from '../repos/users.repo';
import * as EmailVerfRepo from '../repos/email-verification.repo';
import * as PhoneVerfRepo from '../repos/phone-verification.repo';
import { TokensService } from './tokens.service';
import { AuthorizeJWT, capitalize, create_user_required_props, getUserFullName, isImageFileOrBase64, uniqueValue, validateData } from '../utils/helpers.utils';
import { ResetPasswordRequests, SiteFeedbacks, Users } from '../models/carry.model';
import { get_user_unseen_notifications_count } from '../repos/notifications.repo';
import { ExpoPushNotificationsService } from './expo-notifications.service';
import { STRIPE_SDK_API_VERSION, StripeService } from './stripe.service';
import Stripe from 'stripe';
import { create_card_payment_method_required_props } from '../utils/constants.utils';
import { validateEmail, validatePassword } from '../utils/validators.utils';
import { ServiceMethodAsyncResults, ServiceMethodResults, PlainObject, IAuthJwtResults } from '../interfaces/common.interface';
import { delete_cloudinary_image, upload_base64, upload_file } from '../utils/cloudinary-manager.utils';
import { send_verify_sms_request, cancel_verify_sms_request, check_verify_sms_request } from '../utils/sms-client.utils';
import { CommonSocketEventsHandler } from './common.socket-event-handler';
import { HandlebarsEmailsService } from './emails.service';
import { readFileSync } from 'fs';
import { HttpStatusCode } from '../enums/http-status-codes.enum';
import { API_KEY_SUBSCRIPTION_PLAN } from '../enums/common.enum';
import {
  UserEntity
} from '../entities/carry.entity';
import { AppEnvironment } from '../utils/app.enviornment';
import {
  CreateUserDto, UserSubscriptionInfoDto
} from '../dto/user.dto';
import { sendAwsEmail, sendAwsInternalEmail } from '../utils/ses.aws.utils';
import { CARRY_EVENT_TYPES } from '../enums/carry.enum';
import { LOGGER } from '../utils/logger.utils';
import { AwsS3Service } from '../utils/s3.utils';
import { verify_user_stripe_identity_verification_session_by_session_id } from '../repos/users.repo';
import { ResponseLocals } from '../decorators/common/common.decorator';
import { HttpContextHolder } from '../middlewares/http-context.middleware';
import { search_user_deliveries_by_title, search_user_past_delivering_by_title } from '../repos/deliveries.repo';
import { LEADING_SPACES_GLOBAL } from '../regex/common.regex';






export class UsersService {

  /** Request Handlers */

  static async health_check() {
    console.log(`HttpContextHolder:`, { cycleId: HttpContextHolder.cycleId });

    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        message: `Users Service is Online`
      }
    };
    return serviceMethodResults;
  }

  static async check_session(auth: IAuthJwtResults): ServiceMethodAsyncResults {
    try {
      let jwt = null;
      let is_subscription_active: boolean = false;
      let is_identity_verified: boolean = false;
      let is_account_ready: boolean = false;

      LOGGER.info(`Checking request auth session:`);
      console.log({ auth });

      if (auth.you) {
        is_subscription_active = (await UsersService.is_subscription_active(auth.you)).info.data as boolean;
        const noCustomerAcct = !auth.you.stripe_customer_account_id || auth.you.stripe_customer_account_id === null;
        console.log({ noCustomerAcct });

        // if (noCustomerAcct) {
        //   console.log(`Creating stripe customer account for user ${auth.you.id}...`);
          
        //   const userDisplayName = getUserFullName(auth.you);

        //   // create stripe customer account       stripe_customer_account_id
        //   const customer = await StripeService.stripe.customers.create({
        //     name: userDisplayName,
        //     description: `Modern Apps Customer: ${userDisplayName}`,
        //     email: auth.you.email,
        //     metadata: {
        //       user_id: auth.you.id,
        //     }
        //   });

        //   const updateUserResults = await UserRepo.update_user({ stripe_customer_account_id: customer.id }, { id: auth.you.id });
        //   let new_user_model = await UserRepo.get_user_by_id(auth.you.id);
        //   let new_user = new_user_model!;
        //   auth.you = new_user;

        //   // create JWT
        //   jwt = TokensService.newUserJwtToken(auth.you);
        // }

        const stripe_acct_status = !!auth.you.stripe_account_id && await StripeService.account_is_complete(auth.you.stripe_account_id);

        /*
          Manually check the status of the user's identity verification session, in case stripe did not send the webhook event
        */
        is_identity_verified = await UsersService.handle_user_identity_verified_event(auth.you.id);
        
        is_account_ready = !stripe_acct_status.error;

        console.log({ stripe_acct_status, is_identity_verified, is_account_ready });


        // set new state
        const you_model = await UserRepo.get_user_by_id(auth.you.id);
        auth.you = you_model!;
        jwt = TokensService.newUserJwtToken(auth.you);
      }

      const serviceMethodResults: ServiceMethodResults = {
        status: auth.status,
        error: false,
        info: {
          message: auth.message,
          data: {
            ...auth,
            is_subscription_active,
            is_identity_verified,
            is_account_ready,
            token: jwt,
          },
        }
      };
      console.log(`check session:`, { serviceMethodResults });
      return serviceMethodResults;
    }
    catch (e) {
      console.log('error: ', e);
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.INTERNAL_SERVER_ERROR,
        error: true,
        info: {
          error: e,
          message: `could not check session`
        }
      };
      return serviceMethodResults;
    }
  }

  static async handle_user_identity_verified_event(user_id: number) {
    // check if this user has a verification session
    const user_verification_session = await UserRepo.check_user_stripe_identity_verification_session(user_id);
    if (!user_verification_session) {
      LOGGER.info(`No prior identity verification session by user with id:`, { user_id });
      return false;
    }
    
    // user had a session, check if verified
    if (user_verification_session.verified) {
      // it has already been handled; do nothing
      LOGGER.info(`Already verified identity verification session by user with id:`, { user_verification_session });
      return true;
    }
    
    // user verification session not verified, check verification session status via Stripe
    const verification_session: Stripe.Identity.VerificationSession = await StripeService.stripe.identity.verificationSessions.retrieve(user_verification_session.verification_session_id);
    const is_identity_verified = verification_session.status === 'verified';
    if (!is_identity_verified) {
      // still not verified (must be processing/ requires input, etc on Stripe side).
      LOGGER.info(`Not finished Stripe verified identity verification session by user with id:`, { user_id, verification_session, user_verification_session });
      return false;
    }

    /* --- stripe identity verification session verified and not handled before --- */

    // marking session as verified in database
    await verify_user_stripe_identity_verification_session_by_session_id(verification_session.id);
    LOGGER.info(`Marking verification session as verified for user id:`, { user_id, verification_session_id: verification_session.id });
    
    // mark user as identity verified in database
    await UserRepo.update_user_by_id(user_id, { stripe_identity_verified: true });
    LOGGER.info(`Marking user stripe identity as verified for user id:`, { user_id, verification_session_id: verification_session.id });
    
    // send email
    const user: UserEntity = await UserRepo.get_user_by_id(user_id);
    HandlebarsEmailsService.send_identity_verification_session_verified(user);

    // send socket event event
    CommonSocketEventsHandler.emitEventToUserSockets({
      user_id,
      event: CARRY_EVENT_TYPES.STRIPE_IDENTITY_VERIFIED,
      event_data: {},
    });

    // send push notification
    ExpoPushNotificationsService.sendUserPushNotification({
      user_id,
      message: `Stripe Identity verification process completed, you are verified!`
    });

    sendAwsInternalEmail({
      subject: `User identity verified`,
      message: `
        New User Subscription: 
        Name: ${user.firstname} ${user.lastname}
        Email: ${user.email}
      `
    });

    return true;
  }

  static async get_user_by_id(user_id: number): ServiceMethodAsyncResults {
    const user: UserEntity | null = await UserRepo.get_user_by_id(user_id);
    
    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        data: user
      }
    };
    return serviceMethodResults;
  }

  static async get_user_by_phone(phone: string): ServiceMethodAsyncResults {
    const user: UserEntity | null = await UserRepo.get_user_by_phone(phone);

    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        data: user
      }
    };
    return serviceMethodResults;
  }

  static async send_feedback(options: {
    you: UserEntity,
    rating: number,
    title?: string | null,
    summary?: string | null,
  }): ServiceMethodAsyncResults {
    let { you, rating, title, summary } = options;

    if (!rating) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.BAD_REQUEST,
        error: true,
        info: {
          message: `rating is required`
        }
      };
      return serviceMethodResults;
    }
    if (!title) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.BAD_REQUEST,
        error: true,
        info: {
          message: `title is required`
        }
      };
      return serviceMethodResults;
    }
    if (!summary) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.BAD_REQUEST,
        error: true,
        info: {
          message: `summary is required`
        }
      };
      return serviceMethodResults;
    }

    const new_feedback_model = await SiteFeedbacks.create({
      rating,
      title,
      summary,
      user_id: you.id
    });

    sendAwsInternalEmail({
      subject: `User sent site feedback`,
      message: `
        New User Subscription: 
        Name: ${you.firstname} ${you.lastname}
        Email: ${you.email},
        Rating: ${rating}
        Feedback: ${summary}
      `
    });

    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        data: {
          message: `Feedback submitted successfully`,
          feedback: new_feedback_model,
          success: true
        }
      }
    };
    return serviceMethodResults;
  }


  static async get_account_info(user: UserEntity): ServiceMethodAsyncResults {
    try {
      const account: Stripe.Response<Stripe.Account> | null = !user.stripe_account_id ? null : await StripeService.stripe.accounts.retrieve(user.stripe_account_id);
      const account_balance: Stripe.Response<Stripe.Balance> | null = !user.stripe_account_id ? null : await StripeService.stripe.balance.retrieve({ stripeAccount: user.stripe_account_id });
      const is_subscription_active = (await UsersService.is_subscription_active(user)).info.data as boolean;

      const available = account_balance?.available.reduce((acc, a) => acc + a.amount, 0);
      const instant_available = account_balance?.instant_available?.reduce((acc, a) => acc + a.amount, 0) || 0;
      const pending = account_balance?.pending?.reduce((acc, a) => acc + a.amount, 0) || 0;



      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.OK,
        error: false,
        info: {
          data: {
            account_balance,
            account,
            is_subscription_active,

            available,
            instant_available,
            pending,
          }
        }
      };
      return serviceMethodResults;
    } catch (e) {
      console.log(`get_account_info error:`, e);
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.INTERNAL_SERVER_ERROR,
        error: true,
        info: {
          error: e,
        }
      };
      return serviceMethodResults;
    }
  }

  static async stripe_login(user: UserEntity): ServiceMethodAsyncResults {
    try {
      const account_login_link = await StripeService.stripe.accounts.createLoginLink(
        user.stripe_account_id
      );

      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.OK,
        error: false,
        info: {
          data: account_login_link
        }
      };
      return serviceMethodResults;
    } catch (e) {
      console.log(`account_login_link error:`, e);
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.INTERNAL_SERVER_ERROR,
        error: true,
        info: {
          error: e,
        }
      };
      return serviceMethodResults;
    }
  }

  static async get_user_api_key(user: UserEntity): ServiceMethodAsyncResults {
    let api_key = await UserRepo.get_user_api_key(user.id);

    if (!api_key) {
      api_key = await UserRepo.create_user_api_key(user.id);
    }

    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        data: api_key
      }
    };
    return serviceMethodResults;
  }

  static async update_api_key_webhook_endpoint(user: UserEntity, webhook_endpoint: string): ServiceMethodAsyncResults {
    let api_key = await UserRepo.get_user_api_key(user.id);
    
    if (!api_key) {
      api_key = await UserRepo.create_user_api_key(user.id);
    }
    
    await UserRepo.update_api_key_webhook_endpoint(api_key.id, webhook_endpoint);
    api_key = await UserRepo.get_user_api_key(user.id);

    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        data: api_key
      }
    };
    return serviceMethodResults;
  }

  static async get_user_customer_cards_payment_methods(stripe_customer_id: string): ServiceMethodAsyncResults {
    console.log(`get_user_customer_cards_payment_methods(stripe_customer_id: string)`, { stripe_customer_id });
    const paymentMethods = await StripeService.get_customer_cards_payment_methods(stripe_customer_id);
    console.log(`get_user_customer_cards_payment_methods(stripe_customer_id: string)`, { paymentMethodsData: paymentMethods });

    const serviceMethodResults: ServiceMethodResults<Stripe.PaymentMethod[]> = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        data: paymentMethods.data || []
      }
    };
    return serviceMethodResults;
  }
  
  static async add_card_payment_method_to_user_customer(stripe_customer_account_id: string, payment_method_id: string): ServiceMethodAsyncResults {
    let payment_method: Stripe.Response<Stripe.PaymentMethod>;
    const user = await UserRepo.get_user_by_stripe_customer_account_id(stripe_customer_account_id);
    if (!user) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.BAD_REQUEST,
        error: true,
        info: {
          message: `User not found by customer id: ${stripe_customer_account_id}`,
        }
      };
      return serviceMethodResults;
    }

    try {
      payment_method = await StripeService.stripe.paymentMethods.retrieve(payment_method_id);
      if (!payment_method) {
        const serviceMethodResults: ServiceMethodResults = {
          status: HttpStatusCode.BAD_REQUEST,
          error: true,
          info: {
            message: `Could not retrieve payment method by id: ${payment_method_id}`,
          }
        };
        return serviceMethodResults;
      }
    } catch (e) {
      console.log(e);
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.BAD_REQUEST,
        error: true,
        info: {
          message: `Could not retrieve payment method by id: ${payment_method_id}`,
          data: {
            e
          }
        }
      };
      return serviceMethodResults;
    }

    if (payment_method.customer) {
      if (payment_method.customer === stripe_customer_account_id) {
        const serviceMethodResults: ServiceMethodResults = {
          status: HttpStatusCode.BAD_REQUEST,
          error: true,
          info: {
            message: `Payment method already attached to your customer account`,
          }
        };
        return serviceMethodResults;
      }
      else {
        const serviceMethodResults: ServiceMethodResults = {
          status: HttpStatusCode.BAD_REQUEST,
          error: true,
          info: {
            message: `Payment method already attached another customer account`,
          }
        };
        return serviceMethodResults;
      }
    }

    let paymentMethod = await StripeService.stripe.paymentMethods.attach(
      payment_method.id,
      { customer: stripe_customer_account_id }
    );
    paymentMethod = await StripeService.stripe.paymentMethods.update(
      payment_method.id,
      { metadata: { user_id: user.id } }
    );

    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        message: `Payment method added successfully!`,
        data: paymentMethod
      }
    };
    return serviceMethodResults;
  }

  static async remove_card_payment_method_to_user_customer(stripe_customer_account_id: string, payment_method_id: string): ServiceMethodAsyncResults {
    let payment_method: Stripe.Response<Stripe.PaymentMethod>;

    try {
      payment_method = await StripeService.stripe.paymentMethods.retrieve(payment_method_id);
      if (!payment_method) {
        const serviceMethodResults: ServiceMethodResults = {
          status: HttpStatusCode.BAD_REQUEST,
          error: true,
          info: {
            message: `Could not retrieve payment method by id: ${payment_method_id}`,
          }
        };
        return serviceMethodResults;
      }
    } catch (e) {
      console.log(e);
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.BAD_REQUEST,
        error: true,
        info: {
          message: `Could not retrieve payment method by id: ${payment_method_id}`,
          data: {
            e
          }
        }
      };
      return serviceMethodResults;
    }

    const user_payment_methods = await UsersService.get_user_customer_cards_payment_methods(stripe_customer_account_id);
    const payment_methods = user_payment_methods.info.data! as Stripe.PaymentMethod[];

    for (const pm of payment_methods) {
      if (pm.id === payment_method.id) {
        const paymentMethod = await StripeService.stripe.paymentMethods.detach(
          payment_method.id,
        );
        const serviceMethodResults: ServiceMethodResults = {
          status: HttpStatusCode.OK,
          error: false,
          info: {
            message: `Payment method removed successfully!`,
            data: paymentMethod
          }
        };
        return serviceMethodResults;
      }
    }

    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.BAD_REQUEST,
      error: true,
      info: {
        message: `Payment method not attached to customer`,
      }
    };
    return serviceMethodResults;
  }

  static async create_user_api_key(user: UserEntity): ServiceMethodAsyncResults {
    const api_key = await UserRepo.get_user_api_key(user.id);
    if (api_key) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.BAD_REQUEST,
        error: true,
        info: {
          message: `API Key already exists for user`,
          data: api_key,
        }
      };
      return serviceMethodResults;
    }

    const new_api_key = await UserRepo.create_user_api_key(user.id);

    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        message: `New API key created`,
        data: new_api_key
      }
    };
    return serviceMethodResults;
  }
  
  static async get_random_users(limit?: string | number): ServiceMethodAsyncResults {
    const limitIsValid = (/[0-9]+/).test(limit?.toString());
    const useLimit: number = limitIsValid
      ? parseInt(limit.toString(), 10)
      : 10;
    const users: UserEntity[] = await UserRepo.get_random_users(useLimit);
    
    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        data: users
      }
    };
    return serviceMethodResults;
  }

  static async sign_up(data: CreateUserDto): ServiceMethodAsyncResults {
    console.log(`signup`, data);

    const firstname = data.firstname.trim().replace(LEADING_SPACES_GLOBAL, ' ');
    const lastname = data.lastname.trim().replace(LEADING_SPACES_GLOBAL, ' ');
    const username = data.username?.trim().replace(LEADING_SPACES_GLOBAL, '');
    const email = data.email;
    const password = data.password;
    const confirmPassword = data.confirmPassword;


    const dataValidation: ServiceMethodResults = validateData({
      data: {
        firstname,
        lastname,
        email,
        password,
        confirmPassword
      },
      validators: create_user_required_props,
    });
    if (dataValidation.error) {
      return dataValidation;
    }

    if (password !== confirmPassword) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.BAD_REQUEST,
        error: true,
        info: {
          message: 'Passwords must match'
        }
      };
      return serviceMethodResults;
    }

    const check_email = await UserRepo.get_user_by_email(email);
    if (check_email) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.BAD_REQUEST,
        error: true,
        info: {
          message: 'Email already in use'
        }
      };
      return serviceMethodResults;
    }

    if (username) {
      const check_username = await UserRepo.get_user_by_email(username);
      if (check_username) {
        const serviceMethodResults: ServiceMethodResults = {
          status: HttpStatusCode.BAD_REQUEST,
          error: true,
          info: {
            message: 'Username already in use'
          }
        };
        return serviceMethodResults;
      }
    }
  
    /* Data Is Valid */
  
    const hash = bcrypt.hashSync(password);
    const createInfo = {
      firstname: capitalize(firstname),
      lastname: capitalize(lastname),
      username: (username || Date.now().toString()).toLowerCase(),
      displayname: `${capitalize(firstname)} ${capitalize(lastname)}`,
      email: email.toLowerCase(),
      password: hash,
    };
    let new_user_model: UserEntity | null = await UserRepo.create_user(createInfo);
    let new_user = new_user_model!;
    delete new_user.password;

    const userDisplayName = getUserFullName(new_user);

    // create stripe customer account       stripe_customer_account_id
    const customer = await StripeService.stripe.customers.create({
      name: userDisplayName,
      description: `Modern Apps Customer: ${userDisplayName}`,
      email: new_user.email,
      metadata: {
        user_id: new_user.id,
        ...createInfo
      }
    });

    // create user api key to use as a service/developer account
    const api_key = await UserRepo.create_user_api_key(new_user.id);
    console.log({ api_key });

    const updateUserResults = await UserRepo.update_user_by_id(new_user.id, { stripe_customer_account_id: customer.id });
    new_user_model = await UserRepo.get_user_by_id(new_user.id);
    new_user = new_user_model!;
  
    try {
      HandlebarsEmailsService.send_signup_welcome_email(new_user, api_key.uuid);
    }
    catch (e) {
      console.log(`could not sent sign up email:`, e, { new_user });
    }

    // create JWT
    const jwt = TokensService.newUserJwtToken(new_user);

    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        message: 'Signed Up!',
        data: {
          online: true,
          you: new_user,
          token: jwt,
        }
      }
    };
    return serviceMethodResults;
  }

  static async sign_in(email_or_username: string, password: string): ServiceMethodAsyncResults {
    try {
      if (email_or_username) { email_or_username = email_or_username.toLowerCase(); }
      if (!email_or_username) {
        const serviceMethodResults: ServiceMethodResults = {
          status: HttpStatusCode.BAD_REQUEST,
          error: true,
          info: {
            message: 'Email Address/Username field is required'
          }
        };
        return serviceMethodResults;
      }

      if (!password) {
        const serviceMethodResults: ServiceMethodResults = {
          status: HttpStatusCode.BAD_REQUEST,
          error: true,
          info: {
            message: 'Password field is required'
          }
        };
        return serviceMethodResults;
      }

      const check_account_model = await UserRepo.get_user_by_username_or_email(email_or_username);
      if (!check_account_model) {
        const serviceMethodResults: ServiceMethodResults = {
          status: HttpStatusCode.UNAUTHORIZED,
          error: true,
          info: {
            message: 'Invalid credentials.'
          }
        };
        return serviceMethodResults;
      }
      try {
        const checkPassword = <string> check_account_model.password;
        const badPassword = bcrypt.compareSync(password, checkPassword!) === false;
        if (badPassword) {
          const serviceMethodResults: ServiceMethodResults = {
            status: HttpStatusCode.UNAUTHORIZED,
            error: true,
            info: {
              message: 'Invalid credentials.'
            }
          };
          return serviceMethodResults;
        }
      } catch (e) {
        const serviceMethodResults: ServiceMethodResults = {
          status: HttpStatusCode.INTERNAL_SERVER_ERROR,
          error: true,
          info: {
            message: `could not process authentication/credentials, something went wrong...`,
            error: e,
          }
        };
        return serviceMethodResults;
      }

      const you = check_account_model;
      delete you.password;
      
      // create JWT
      const jwt = TokensService.newUserJwtToken(you);

      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.OK,
        error: false,
        info: {
          message: 'Signed In!',
          data: {
            online: true,
            you: you,
            token: jwt,
          }
        }
      };
      return serviceMethodResults;
    } catch (e) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.INTERNAL_SERVER_ERROR,
        error: true,
        info: {
          message: `could not sign in, something went wrong...`,
          error: e,
        }
      };
      return serviceMethodResults;
    }
  }

  static async send_sms_verification(you: UserEntity, phone: string): ServiceMethodAsyncResults {
    try {
      if (!phone) {
        const serviceMethodResults: ServiceMethodResults = {
          status: HttpStatusCode.BAD_REQUEST,
          error: true,
          info: {
            message: `Phone number is required`
          }
        };
        return serviceMethodResults;
      }

      if (phone.toLowerCase() === 'x') {
        const updates = await UserRepo.update_user({ phone: null, temp_phone: null }, { id: you.id });
        const newYouModel = await UserRepo.get_user_by_id(you.id);
        const newYou = newYouModel!;
        delete newYou.password;

        const jwt = TokensService.newUserJwtToken(newYou);

        const serviceMethodResults: ServiceMethodResults = {
          status: HttpStatusCode.OK,
          error: false,
          info: {
            message: `Phone number cleared successfully`,
            data: {
              updates,
              you: newYou,
              token: jwt,
            }
          }
        };
        return serviceMethodResults;
      }

      const phoneNumberIsOutOfRange = !(/^[0-9]{10,12}$/).test(phone);
      if (phoneNumberIsOutOfRange) {
        const serviceMethodResults: ServiceMethodResults = {
          status: HttpStatusCode.BAD_REQUEST,
          error: true,
          info: {
            data: {
              message: `Phone number is out of range; must be between 10-12 digits`,
            }
          }
        };
        return serviceMethodResults;
      }

      // check if there is abother user with phone number
      const check_phone = await UserRepo.get_user_by_phone(phone);
      if (check_phone) {
        const serviceMethodResults: ServiceMethodResults = {
          status: HttpStatusCode.FORBIDDEN,
          error: true,
          info: {
            data: {
              message: `Phone number is already in use by another user account.`,
              data: {
                phoneAlreadyInUse: true
              }
            }
          }
        };
        return serviceMethodResults;
      }

      // // check if there is a pending code
      // const check_sms_verf = await PhoneVerfRepo.query_phone_verification({ phone });
      // // if there is a result, delete it and make a new one
      // if (check_sms_verf) {
      //   await check_sms_verf.destroy();
      // }
      
      // send a new verification code
      let sms_results: PlainObject = await send_verify_sms_request(phone);
      console.log('sms_results', sms_results);
      if (sms_results.error_text) {
        try {
          console.log('canceling sms request...', sms_results);
          await cancel_verify_sms_request(sms_results.request_id);

          sms_results = await send_verify_sms_request(phone);

          const updates = await UserRepo.update_user({ temp_phone: phone }, { id: you.id });
          const serviceMethodResults: ServiceMethodResults = {
            status: HttpStatusCode.OK,
            error: false,
            info: {
              message: `SMS verification sent, check your phone!`,
              data: {
                updates,
                sms_results,
                sms_request_id: sms_results.request_id,
              }
            }
          };
          return serviceMethodResults;
        } catch (e) {
          console.log(`could not cancel...`, sms_results, e);
          const serviceMethodResults: ServiceMethodResults = {
            status: HttpStatusCode.BAD_REQUEST,
            error: true,
            info: {
              message: `Could not send sms...`,
              error: e,
              data: {
                sms_results,
              }
            }
          };
          return serviceMethodResults;
        }
      } else {
        // sms sent successfully; store it on the request session
        // (<IRequest> request).session.sms_verification = sms_results;
        // (<IRequest> request).session.sms_phone = phone;

        const updatesObj = { temp_phone: phone };
        console.log(updatesObj);
        const updates = await UserRepo.update_user(updatesObj, { id: you.id });
        const serviceMethodResults: ServiceMethodResults = {
          status: HttpStatusCode.OK,
          error: false,
          info: {
            message: `SMS verification sent, check your phone!`,
            data: {
              // updates,
              sms_results,
              sms_request_id: sms_results.request_id,
            }
          }
        };
        return serviceMethodResults;
      }
    } catch (e) {
      console.log(`send_sms_verification error; something went wrong...`, e);
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.BAD_REQUEST,
        error: true,
        info: {
          message: `send_sms_verification error; something went wrong...`,
          error: e,
        }
      };
      return serviceMethodResults;
    }
  }

  static async verify_sms_code(options: {
    you: UserEntity,
    request_id: string,
    code: string,
    phone: string,
  }): ServiceMethodAsyncResults {
    try {
      let { you, request_id, code, phone } = options;
      if (!request_id) {
        const serviceMethodResults: ServiceMethodResults = {
          status: HttpStatusCode.BAD_REQUEST,
          error: true,
          info: {
            message: `Verification request id is required`,
            data: {
              missingRequestId: true
            }
          }
        };
        return serviceMethodResults;
      }
      if (!phone) {
        const serviceMethodResults: ServiceMethodResults = {
          status: HttpStatusCode.BAD_REQUEST,
          error: true,
          info: {
            message: `Phone number is required`,
            data: {
              missingPhone: true
            }
          }
        };
        return serviceMethodResults;
      }
      const check_temp_phone = await UserRepo.get_user_by_temp_phone(phone);
      if (!check_temp_phone) {
        const serviceMethodResults: ServiceMethodResults = {
          status: HttpStatusCode.BAD_REQUEST,
          error: true,
          info: {
            message: `No user found by that temporary phone`,
            data: {
              noTempPhoneFound: true
            }
          }
        };
        return serviceMethodResults;
      }
      if (check_temp_phone.id !== you.id) {
        const serviceMethodResults: ServiceMethodResults = {
          status: HttpStatusCode.BAD_REQUEST,
          error: true,
          info: {
            message: `Temp phone does not belong to requesting user`,
            data: {
              invalidUserTempPhone: true
            }
          }
        };
        return serviceMethodResults;
      }
      if (!code) {
        const serviceMethodResults: ServiceMethodResults = {
          status: HttpStatusCode.BAD_REQUEST,
          error: true,
          info: {
            message: `Verification code is required`,
            data: {
              missingVerifyCode: true
            }
          }
        };
        return serviceMethodResults;
      }

      // try to verify phone
      const sms_verify_results: PlainObject = await check_verify_sms_request({ request_id, code });
      console.log(sms_verify_results);
      if (sms_verify_results.error_text) {
        const serviceMethodResults: ServiceMethodResults = {
          status: HttpStatusCode.BAD_REQUEST,
          error: true,
          info: {
            message: `Invalid sms verification code`,
            data: {
              invalidVerifyCode: true
            }
          }
        };
        return serviceMethodResults;
      }

      const updates = await UserRepo.update_user({ phone: you.temp_phone, temp_phone: null, phone_verified: true }, { id: you.id });
      const newYouModel = await UserRepo.get_user_by_id(you.id);
      const newYou = newYouModel!;
      delete newYou.password;

      const jwt = TokensService.newUserJwtToken(newYou);

      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.OK,
        error: false,
        info: {
          message: `Phone number verified and updated successfully`,
          data: {
            sms_verify_results,
            updates,
            you: newYou,
            token: jwt,
          }
        }
      };
      return serviceMethodResults;
    } catch (e) {
      console.log(`verify_sms_code error; something went wrong...`, e);
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.BAD_REQUEST,
        error: true,
        info: {
          message: `verify_sms_code error; something went wrong...`,
          error: e,
        }
      };
      return serviceMethodResults;
    }
  }

  static async submit_reset_password_request(email: string): ServiceMethodAsyncResults {
    if (!validateEmail(email)) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.BAD_REQUEST,
        error: true,
        info: {
          message: 'Email input is not in valid format'
        }
      };
      return serviceMethodResults;
    }
    
    const user_result = await UserRepo.get_user_by_email(email);
    if (!user_result) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.BAD_REQUEST,
        error: true,
        info: {
          message: 'No account found by that email'
        }
      };
      return serviceMethodResults;
    }

    const user = user_result!;
    const user_name = getUserFullName(user);

    const email_subject = `${AppEnvironment.APP_NAME.DISPLAY} - Password reset requested`;
    
    // check if there is an active password reset request
    const password_request_result = await UserRepo.check_user_active_password_reset(user.id);
    if (password_request_result) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.BAD_REQUEST,
        error: true,
        info: {
          message: 'An active password reset has already been requested for this email.',
        }
      };
      return serviceMethodResults;
    }
    
    // send reset request email
    try {
      HandlebarsEmailsService.create_and_send_user_active_password_reset(user);

      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.OK,
        error: false,
        info: {
          message: 'A password reset request has been sent to the provided email.',
        }
      };
      return serviceMethodResults;
    }
    catch (e) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.INTERNAL_SERVER_ERROR,
        error: true,
        info: {
          message: `Could not create password reset; something went wrong. If problem persists, please contact site owner.`
        }
      };
      return serviceMethodResults;
    }
  }

  static async submit_password_reset_code(code: string): ServiceMethodAsyncResults {
    if(!code) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.BAD_REQUEST,
        error: true,
        info: {
          message: 'reset code is required'
        }
      };
      return serviceMethodResults;
    }

    const request_result = await UserRepo.get_password_reset_request_by_code(code);
    if (!request_result) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.NOT_FOUND,
        error: true,
        info: {
          message: 'Invalid code, no reset request found by that value'
        }
      };
      return serviceMethodResults;
    }
    if (request_result.completed) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.BAD_REQUEST,
        error: true,
        info: {
          message: 'Code has already been used.'
        }
      };
      return serviceMethodResults;
    }

    const user: UserEntity = await UserRepo.get_user_by_id(request_result.user_id);
    if (!user) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.BAD_REQUEST,
        error: true,
        info: {
          message: `error loading user from reset request...`
        }
      };
      return serviceMethodResults;
    }

    const user_name = getUserFullName(user);
    const password = uniqueValue();
    const hash = bcrypt.hashSync(password);
    const update_result = await UserRepo.update_user({ password: hash }, { id: user.id });

    // send reset request email
    try {
      await sendAwsEmail({
        to: user.email,
        subject: HandlebarsEmailsService.USERS.password_reset_success.subject,
        html: HandlebarsEmailsService.USERS.password_reset_success.template({
          user_name,
          temp_password: password
        })
      });
      LOGGER.info(`Submit password reset success email sent`);
      
      await UserRepo.mark_password_reset_request_completed(request_result.id);
      LOGGER.info(`Submit password reset marked as completed`);

      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.OK,
        error: false,
        info: {
          message: 'A temporary password has been sent.',
        }
      };
      return serviceMethodResults;
    }
    catch (e) {
      LOGGER.info(`Submit password reset failed`, { error: e });
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.INTERNAL_SERVER_ERROR,
        error: true,
        info: {
          message: `Could not complete password reset; something went wrong. If problem persists, please contact site owner.`
        }
      };
      return serviceMethodResults;
    }
  }

  static async verify_email(verification_code: string): ServiceMethodAsyncResults {
    const email_verf_model = await EmailVerfRepo.query_email_verification({ verification_code });
    if (!email_verf_model) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.BAD_REQUEST,
        error: true,
        info: {
          message: `Invalid verification code.`
        }
      };
      return serviceMethodResults;
    }

    const email_verf: PlainObject = email_verf_model;
    const user_model = await UserRepo.get_user_by_id(email_verf.user_id);
    if (!user_model) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.BAD_REQUEST,
        error: true,
        info: {
          message: `Verification code corrupted: could not fetch user from code`
        }
      };
      return serviceMethodResults;
    }

    const user = user_model!;
    if (user.email_verified) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.OK,
        error: false,
        info: {
          message: `Already verified!`
        }
      };
      return serviceMethodResults;
    }

    const updates = await UserRepo.update_user(
      { email_verified: true },
      { id: email_verf.user_id }
    );
    const email_verf_updates = await EmailVerfRepo.update_email_verification(
      { verified: true },
      { verification_code }
    );

    user.email_verified = true;
    const jwt = TokensService.newUserJwtToken(user);

    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        message: `Email successfully verified!`,
        data: {
          updates,
          email_verf_updates,
          token: jwt
        }
      }
    };
    return serviceMethodResults;
  }

  static async update_info(options: {
    you: UserEntity,

    username?: string,
    displayname?: string,
    api_webhook?: string,
    email?: string,
    headline?: string,
    bio?: string,
  }): ServiceMethodAsyncResults {
    let {
      you,
      email,
      username,
      displayname,
      bio,
      headline,
    } = options;

    let email_changed = false;

    const updatesObj: { [key:string]: any; } = {
      bio: bio || '',
      headline: headline || '',
      displayname: displayname || '',
    };

    // check request data

    if (email) {
      const emailIsDifferent = you.email !== email;
      if (emailIsDifferent) {
        const check_email = await UserRepo.get_user_by_email(email);
        if (check_email) {
          const serviceMethodResults: ServiceMethodResults = {
            status: HttpStatusCode.FORBIDDEN,
            error: true,
            info: {
              message: `Email is taken`
            }
          };
          return serviceMethodResults;
        }
        else {
          updatesObj.email = email;
          updatesObj.email_verified = false;
          email_changed = true;
        }
      }
    }

    if (username) {
      const usernameIsDifferent = you.username !== username;
      if (usernameIsDifferent) {
        const check_username = await UserRepo.get_user_by_email(username);
        if (check_username) {
          const serviceMethodResults: ServiceMethodResults = {
            status: HttpStatusCode.FORBIDDEN,
            error: true,
            info: {
              message: 'Username already in use'
            }
          };
          return serviceMethodResults;
        }
        else {
          updatesObj.username = username;
        }
      }
    } else if (username === '') {
      updatesObj.username = '';
    }

    const updates = await UserRepo.update_user(updatesObj, { id: you.id });
    const newYouModel = await UserRepo.get_user_by_id(you.id);
    const newYou = newYouModel!;
    delete newYou.password;

    // check if phone/email changed

    if (email_changed) {
      HandlebarsEmailsService.send_account_email_changed_email(you);
    }

    const jwt = TokensService.newUserJwtToken(newYou);
    
    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        message: `Info updated successfully`,
        data: {
          you: newYou,
          updates,
          token: jwt,
          email_changed,
        }
      }
    };
    return serviceMethodResults;
  }

  static async update_phone(options: {
    you: UserEntity,
    request_id: string,
    code: string,
    phone: string,
    sms_results: PlainObject,
  }): ServiceMethodAsyncResults {
    try {
      let { you, request_id, code, phone, sms_results } = options;

      if (!sms_results) {
        const serviceMethodResults: ServiceMethodResults = {
          status: HttpStatusCode.BAD_REQUEST,
          error: true,
          info: {
            message: `no sms verification in progress...`
          }
        };
        return serviceMethodResults;
      }
      if (sms_results.request_id !== request_id) {
        const serviceMethodResults: ServiceMethodResults = {
          status: HttpStatusCode.BAD_REQUEST,
          error: true,
          info: {
            message: `sms request_id is invalid...`
          }
        };
        return serviceMethodResults;
      }

      // try to verify phone
      const sms_verify_results: PlainObject = await check_verify_sms_request({ request_id, code });
      console.log(sms_verify_results);
      if (sms_verify_results.error_text) {
        const serviceMethodResults: ServiceMethodResults = {
          status: HttpStatusCode.BAD_REQUEST,
          error: true,
          info: {
            message: `Invalid sms verification code`,
            data: {
              sms_verify_results
            }
          }
        };
        return serviceMethodResults;
      }

      const updates = await UserRepo.update_user({ phone }, { id: you.id });
      const newYouModel = await UserRepo.get_user_by_id(you.id);
      const newYou = newYouModel!;
      delete newYou.password;

      const jwt = TokensService.newUserJwtToken(newYou);

      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.OK,
        error: false,
        info: {
          message: `Phone number updated successfully`,
          data: {
            sms_verify_results,
            updates,
            you: newYou,
            token: jwt,
          }
        }
      };
      return serviceMethodResults;
    } catch (e) {
      console.log('error:', e);
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.INTERNAL_SERVER_ERROR,
        error: true,
        info: {
          message: 'Could not update phone...',
          error: e,
        }
      };
      return serviceMethodResults;
    }
  }

  static async update_password(options: {
    you: UserEntity,
    password: string,
    confirmPassword: string,
  }): ServiceMethodAsyncResults {
    try {
      let { you, password, confirmPassword } = options;
      if (!password) {
        const serviceMethodResults: ServiceMethodResults = {
          status: HttpStatusCode.BAD_REQUEST,
          error: true,
          info: {
            message: `Password field is required.`
          }
        };
        return serviceMethodResults;
      }
      if (!confirmPassword) {
        const serviceMethodResults: ServiceMethodResults = {
          status: HttpStatusCode.BAD_REQUEST,
          error: true,
          info: {
            message: `Confirm Password field is required.`
          }
        };
        return serviceMethodResults;
      }
      if (!validatePassword(password)) {
        const serviceMethodResults: ServiceMethodResults = {
          status: HttpStatusCode.BAD_REQUEST,
          error: true,
          info: {
            message: 'Password must be: at least 7 characters, upper and/or lower case alphanumeric'
          }
        };
        return serviceMethodResults;
      }
      if (password !== confirmPassword) {
        const serviceMethodResults: ServiceMethodResults = {
          status: HttpStatusCode.BAD_REQUEST,
          error: true,
          info: {
            message: 'Passwords must match'
          }
        };
        return serviceMethodResults;
      }
      // const checkOldPassword = bcrypt.compareSync(oldPassword, youModel!.get('password'));
      // const currentPasswordIsBad = checkOldPassword === false;
      // if (currentPasswordIsBad) {
      //   return response.status(HttpStatusCode.UNAUTHORIZED).json({
      //     error: true,
      //     message: 'Old password is incorrect.'
      //   });
      // }
  
      const hash = bcrypt.hashSync(password);
      const updatesObj = { password: hash };
      const updates = await UserRepo.update_user(updatesObj, { id: you.id });
      Object.assign(you, updatesObj);

      const jwt = TokensService.newUserJwtToken(you);

      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.OK,
        error: false,
        info: {
          message: 'Password updated successfully',
          data: {
            updates,
            you,
            token: jwt,
          }
        }
      };
      return serviceMethodResults;
    } catch (e) {
      console.log('error:', e);
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.INTERNAL_SERVER_ERROR,
        error: true,
        info: {
          message: 'Could not update password...',
          error: e,
        }
      };
      return serviceMethodResults;
    }
  }

  // static async update_icon_via_aws_s3(options: {
  //   you: UserEntity,
  //   icon_file: UploadedFile | undefined,
  //   should_delete: boolean,
  // }): ServiceMethodAsyncResults {

  // }

  static async update_icon(options: {
    you: UserEntity,
    icon_file: UploadedFile | undefined,
    should_delete: boolean,
  }): ServiceMethodAsyncResults {
    const { you, icon_file, should_delete } = options;
    const isAwsS3Image = !!you.icon_id && you.icon_id.split('|')[0] === AppEnvironment.AWS.S3.BUCKET;
    const updatesObj = {
      icon_id: '',
      icon_link: ''
    };

    // input guards
    if (!icon_file) {
      if (!should_delete) {
        const serviceMethodResults: ServiceMethodResults = {
          status: HttpStatusCode.BAD_REQUEST,
          error: true,
          info: {
            message: `Picture file is required`,
          }
        };
        return serviceMethodResults;
      }
      
      const whereClause = { id: you.id };
      const updates = await UserRepo.update_user(updatesObj, whereClause);
      if (isAwsS3Image) {
        const [Bucket, Key] = you.icon_id.split('|');
        AwsS3Service.deleteObject({ Bucket, Key })
        .then(() => {
          LOGGER.error(`S3 delete object for user icon:`, { you });
        })
        .catch((error) => {
          LOGGER.error(`S3 delete object failed for user icon:`, { you, error });
        });
      }
      else {
        delete_cloudinary_image(you.icon_id)
        .then(() => {
          LOGGER.error(`Cloudinary delete image for user icon:`, { you });
        })
        .catch((error) => {
          LOGGER.error(`Cloudinary delete image failed for user icon:`, { you, error });
        });
      }
    }

    let filepath: string = '';
    let filetype: string = '';
    let filename: string = '';
    if (typeof icon_file === 'string') {
      // base64 string provided; attempt parsing...
      const filedata = await upload_base64(icon_file);
      filepath = filedata.file_path;
      filetype = filedata.filetype;
      filename = filedata.filename;
    }
    else {
      const filedata = await upload_file(icon_file);
      filetype = (<UploadedFile> icon_file).mimetype;
      filepath = filedata.file_path;
      filename = filedata.filename;
    }

    try {
      const Key = `static/uploads/${filename}`;
      const icon_id = `${AppEnvironment.AWS.S3.BUCKET}|${Key}`;
      const icon_link = `${AppEnvironment.AWS.S3.SERVE_ORIGIN}/uploads/${filename}`;
      updatesObj.icon_id = icon_id;
      updatesObj.icon_link = icon_link;
      const Body: Buffer = readFileSync(filepath);
      await AwsS3Service.createObject({
        Bucket: AppEnvironment.AWS.S3.BUCKET,
        Key,
        Body,
        ContentType: filetype
      });
      LOGGER.info(`Uploaded user icon available via cdn: ${icon_link}`, { icon_link, icon_id });

      const updates = await UserRepo.update_user(updatesObj, { id: you.id });
    
      const user = { ...you, ...updatesObj };
      // console.log({ updates, results, user });
      delete user.password;
      const jwt = TokensService.newUserJwtToken(user);

      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.OK,
        error: false,
        info: {
          message: 'Icon updated successfully.' ,
          data: {
            updates,
            you: user,
            token: jwt,
          }
        }
      };
      return serviceMethodResults;
    }
    catch (e) {
      console.log('error:', e);
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.INTERNAL_SERVER_ERROR,
        error: true,
        info: {
          message: 'Could not update icon...' ,
        }
      };
      return serviceMethodResults;
    }
  }

  static async update_wallpaper(options: {
    you: UserEntity,
    wallpaper_file: UploadedFile | undefined,
    should_delete: boolean,
  }): ServiceMethodAsyncResults {
    try {
      const { you, wallpaper_file, should_delete } = options;
      const updatesObj = {
        wallpaper_id: '',
        wallpaper_link: ''
      };

      if (!wallpaper_file) {
        // clear wallpaper
        if (!should_delete) {
          const serviceMethodResults: ServiceMethodResults = {
            status: HttpStatusCode.BAD_REQUEST,
            error: true,
            info: {
              message: `Picture file is required`
            }
          };
          return serviceMethodResults;
        }

        const whereClause = { id: you.id };
        const updates = await UserRepo.update_user(updatesObj, whereClause);
        delete_cloudinary_image(you.wallpaper_id);
    
        Object.assign(you, updatesObj);
        const user = { ...you };
        delete user.password;
        const jwt = TokensService.newUserJwtToken(user);

        const serviceMethodResults: ServiceMethodResults = {
          status: HttpStatusCode.OK,
          error: false,
          info: {
            message: 'Wallpaper cleared successfully.',
            data: {
              updates,
              you: user,
              token: jwt,
            }
          }
        };
        return serviceMethodResults;
      }

      const imageValidation = await AwsS3Service.uploadFile(wallpaper_file, {
        treatNotFoundAsError: true,
        mutateObj: updatesObj,
        validateAsImage: true,
        id_prop: 'wallpaper_id',
        link_prop: 'wallpaper_link',
      });
      if (imageValidation.error) {
        return imageValidation;
      }

      
      
      const whereClause = { id: you.id };
      const updates = await UserRepo.update_user(updatesObj, whereClause);
  
      Object.assign(you, updatesObj);
      const user = { ...you };
      delete user.password;
      const jwt = TokensService.newUserJwtToken(user);

      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.BAD_REQUEST,
        error: true,
        info: {
          message: 'Wallpaper updated successfully.',
          data: {
            updates,
            you: user,
            token: jwt,
          }
        }
      };
      return serviceMethodResults;
    } catch (e) {
      console.log('error:', e);
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.INTERNAL_SERVER_ERROR,
        error: true,
        info: {
          message: 'Could not update wallpaper...',
          error: e,
        }
      };
      return serviceMethodResults;
    }
  }

  static async send_push_notification_to_user_expo_devices(params: {
    user_id: number,
    message: string,
  }) {
    const user_expo_devices = await UserRepo.get_user_expo_devices(params.user_id);

    let sent_count: number = 0;
    for (const expo_device of user_expo_devices) {
      //
    }

    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        message: `Push notification sent!`,
        data: {
          user_expo_devices,
          sent_count
        }
      }
    };
    return serviceMethodResults;
  }

  static async register_expo_device_and_push_token(you_id: number, data: PlainObject) {
    if (!data.expo_token) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.BAD_REQUEST,
        error: true,
        info: {
          message: `Could not register device; no push token given`,
        }
      };
      return serviceMethodResults;
    }

    const check_registered = await UserRepo.get_user_expo_device_by_token(data.expo_token, );
    if (check_registered) {
      if (check_registered.user_id === you_id) {
        // device already registered to user
        const serviceMethodResults: ServiceMethodResults = {
          status: HttpStatusCode.BAD_REQUEST,
          error: true,
          info: {
            message: `Push token already registered`,
            data: {
              registered: true,
            }
          }
        };
        return serviceMethodResults;
      }
      else {
        // token registered to another user; delete previous user and assign to this user
        await UserRepo.remove_expo_device_from_user(data.expo_token);
      }
    }

    const new_push_token_registration = await UserRepo.register_expo_device_and_push_token(you_id, data.expo_token);

    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        message: `Push notifications registered!`,
        data: new_push_token_registration
      }
    };
    return serviceMethodResults;
  }

  static async remove_expo_device_and_push_token(you_id: number, expo_token: string) {
    if (!expo_token) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.BAD_REQUEST,
        error: true,
        info: {
          message: `Could not register device; no push token given`,
        }
      };
      return serviceMethodResults;
    }

    const check_registered = await UserRepo.get_user_expo_device_by_token(expo_token);
    if (!check_registered) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.BAD_REQUEST,
        error: true,
        info: {
          message: `Push token not found`,
          data: {
            registered: true,
          }
        }
      };
      return serviceMethodResults;
    }

    const removed = await UserRepo.remove_expo_device_from_user(
      expo_token,
    );
    LOGGER.info(`Removed Expo Device from user:`, { you_id, expo_token });

    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        message: `Device removed`,
        data: removed
      }
    };
    return serviceMethodResults;
  }

  static async create_stripe_identity_verification_session(user: UserEntity, redirectUrl: string): ServiceMethodAsyncResults {
    let verification_session_id: string;
    let verification_session_client_secret: string;
    
    const useReturnUrl = `${AppEnvironment.USE_CLIENT_DOMAIN_URL}/stripe-identity-verification-return?appDeepLinkRedirectURL=${redirectUrl}`;

    // check if user has started a session before
    const check_user_verification_session = await UserRepo.check_user_stripe_identity_verification_session(user.id);
    if (check_user_verification_session) {
      if (check_user_verification_session.verified) {
        const serviceMethodResults: ServiceMethodResults = {
          status: HttpStatusCode.BAD_REQUEST,
          error: false,
          info: {
            message: `Identity already verified`,
            data: check_user_verification_session
          }
        };
        return serviceMethodResults;
      }


      verification_session_id = check_user_verification_session.verification_session_id;

      const verification_session: Stripe.Identity.VerificationSession = await StripeService.stripe.identity.verificationSessions.retrieve(verification_session_id);

      verification_session_client_secret = verification_session.client_secret;
      
    }
    else {
      
      const verification_session: Stripe.Identity.VerificationSession = await StripeService.stripe.identity.verificationSessions.create({
        type: 'document',
        return_url: useReturnUrl,
        metadata: {
          timestamp: Date.now(),
          user_id: user.id,
          user_email: user.email,
          user_stripe_account_id: user.stripe_account_id,
          user_firstname: user.firstname,
          user_last: user.lastname,
        },
      });
      
      verification_session_id = verification_session.id;
      verification_session_client_secret = verification_session.client_secret;
      
      await UserRepo.create_user_stripe_identity_verification_session({
        user_id: user.id,
        verification_session_id: verification_session.id
      });

      sendAwsInternalEmail({
        subject: `User started identity verification session`,
        message: `
          New User identity verification session: 
          Name: ${user.firstname} ${user.lastname}
          Email: ${user.email},
          Identity Verification Session ID: ${verification_session_id}
        `
      });

    }

    // const ephemeral_key: Stripe.EphemeralKey = await StripeService.stripe.ephemeralKeys.create(
    //   { verification_session: verification_session_id },
    //   { apiVersion: '2020-08-27' }
    // );

    const useUploadUrl = `${AppEnvironment.USE_CLIENT_DOMAIN_URL}/stripe-identity-verification-upload?stripe_pk=${AppEnvironment.API_KEYS.STRIPE_PK}&verification_session_client_secret=${verification_session_client_secret}&return_url=${useReturnUrl}`;

    const data = {
      stripe_pk: AppEnvironment.API_KEYS.STRIPE_PK,
      useUploadUrl,
      useReturnUrl,
      redirectUrl,
      verification_session_id,
      verification_session_client_secret,
      // ephemeral_key_secret: ephemeral_key.secret,
      // ephemeral_key,
    };

    console.log({ user, data });
    LOGGER.info(`Stripe identity verification session params`, { user, data });

    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        data,
      }
    };
    return serviceMethodResults;
  }

  static async create_stripe_account(you_id: number, redirectUrl?: string): ServiceMethodAsyncResults {
    console.log(`UsersService.create_stripe_account:`, { you_id, redirectUrl });
    const you_model: UserEntity | null = await UserRepo.get_user_by_id(you_id);
    if (!you_model) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.NOT_FOUND,
        error: true,
        info: {
          message: `User not found`,
        }
      };
      return serviceMethodResults;
    }

    const you = you_model!;

    
    // fallback options
    const refresh_url = `${AppEnvironment.USE_CLIENT_DOMAIN_URL}/users/${you.id}/settings?stripeOnboardingRefresh=true`;
    const useReturnUrl = `${AppEnvironment.USE_CLIENT_DOMAIN_URL}/stripe-connect-onboarding-return?appDeepLinkRedirectURL=${redirectUrl}`;
    
    const check_verified = await UsersService.verify_stripe_account(you, false, redirectUrl);
    if (check_verified.status === HttpStatusCode.OK) {
      return check_verified;
    }

    let account, updates;

    if (!you.stripe_account_id) {
      account = await StripeService.stripe.accounts.create({
        type: 'express',
        business_type: 'individual',
        // email: you.email,
        capabilities: {
          transfers: { requested: true },
        },
        business_profile: {
          product_description: `Modern Apps: ${process.env['APP_NAME']} - Service Provider`
        },
        metadata: {
          user_id: you.id
        }
      });
      updates = await UserRepo.update_user({ stripe_account_id: account.id }, { id: you.id });

      sendAwsInternalEmail({
        subject: `User Stripe Connect Setup started`,
        message: `
          New User signed up: 
          Name: ${you.firstname} ${you.lastname}
          Email: ${you.email},
          Stripe Connected Account ID: ${account.id}
        `
      });
    } else {
      account = await StripeService.stripe.accounts.retrieve(you.stripe_account_id, { expand: ['individual', 'individual.verification'] });
    }

    // https://stripe.com/docs/connect/collect-then-transfer-guide
    const createOpts = {
      account: account.id,
      refresh_url,
      return_url: useReturnUrl,
      type: 'account_onboarding',
    } as Stripe.AccountLinkCreateParams;
    LOGGER.info(`UsersService.create_stripe_account - create params:`, { createOpts });
    const accountLinks = await StripeService.stripe.accountLinks.create(createOpts);

    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        data: {
          onboarding_url: accountLinks.url,
        }
      }
    };
    return serviceMethodResults;
  }

  static async verify_stripe_account(user: UserEntity, createLinks: boolean, redirectUrl?: string): ServiceMethodAsyncResults {
    let you: UserEntity = { ...user };

    if (!you.stripe_account_id) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.PRECONDITION_FAILED,
        error: true,
        info: {
          message: `You must create a stripe account first and connect it with Modern Apps.`,
        }
      };
      return serviceMethodResults;
    }

    if (you.stripe_account_verified) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.OK,
        error: false,
        info: {
          message: `Your stripe account is verified and valid!`
        }
      };
      return serviceMethodResults;
    }

    const results = await StripeService.account_is_complete(you.stripe_account_id);
    console.log({ results });

    let accountLinks: PlainObject = {};

    // const useUrl = `${AppEnvironment.USE_CLIENT_DOMAIN_URL}/verify-stripe-account/${you.uuid}`;
    const refresh_url = `${AppEnvironment.USE_CLIENT_DOMAIN_URL}/users/${you.id}/settings?stripeOnboardingRefresh=true`;
    const useReturnUrl = `${AppEnvironment.USE_CLIENT_DOMAIN_URL}/stripe-connect-onboarding-return?appDeepLinkRedirectURL=${redirectUrl}`;

    // const useUrl = `carry://settings/`;

    if (!results.error) {
      await UserRepo.update_user({ stripe_account_verified: true }, { id: you.id });
      const you_updated = await UserRepo.get_user_by_id(you.id);
      you = you_updated!;
      // create JWT
      const jwt = TokensService.newUserJwtToken(you);
      (<any> results).token = jwt;
      (<any> results).you = you;

      const message: string = `Your stripe account has been verified! If you don't see changes, log out and log back in.`;
      ExpoPushNotificationsService.sendUserPushNotification({
        user_id: you.id,
        message
      });
      CommonSocketEventsHandler.emitEventToUserSockets({
        user_id: you.id,
        event: CARRY_EVENT_TYPES.STRIPE_ACCOUNT_VERIFIED,
        event_data: {
          message,
        },
      });
    }
    else if (createLinks) {
      const createOpts = {
        account: you.stripe_account_id,
        refresh_url,
        return_url: useReturnUrl,
        type: 'account_onboarding',
      } as Stripe.AccountLinkCreateParams;
      LOGGER.info(`UsersService.create_stripe_account - create params:`, { createOpts });
      accountLinks = await StripeService.stripe.accountLinks.create(createOpts);

      console.log({ accountLinks });
    }


    const serviceMethodResults: ServiceMethodResults = {
      status: results.status,
      error: results.error,
      info: {
        message: results.message,
        data: {
          ...results,
          ...accountLinks,
          onboarding_url: accountLinks.url,
        }
      }
    };
    return serviceMethodResults;
  }

  static async verify_stripe_account_by_uuid(user_uuid: string, createLinks?: boolean, redirectUrl?: string): ServiceMethodAsyncResults {
    if (!user_uuid) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.BAD_REQUEST,
        error: true,
        info: {
          message: `Verification code not given`,
        }
      };
      return serviceMethodResults;
    }

    const check_you: UserEntity | null = await UserRepo.get_user_by_uuid(user_uuid);
    if (!check_you) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.BAD_REQUEST,
        error: true,
        info: {
          message: `Verification code invalid`,
        }
      };
      return serviceMethodResults;
    }
    
    let you: UserEntity = { ...check_you };

    if (!you.stripe_account_id) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.PRECONDITION_FAILED,
        error: true,
        info: {
          message: `You must create a stripe account first and connect it with Modern Apps.`,
        }
      };
      return serviceMethodResults;
    }

    if (you.stripe_account_verified) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.OK,
        error: false,
        info: {
          message: `Your stripe account is verified and valid!`,
          data: {
            verified: true,
          }
        }
      };
      return serviceMethodResults;
    }

    const results = await StripeService.account_is_complete(you.stripe_account_id);
    console.log({ results });

    let accountLinks: PlainObject = {};
    const refresh_url = `${AppEnvironment.USE_CLIENT_DOMAIN_URL}/users/${you.id}/settings?stripeOnboardingRefresh=true`;
    const useReturnUrl = `${AppEnvironment.USE_CLIENT_DOMAIN_URL}/stripe-connect-onboarding-return?appDeepLinkRedirectURL=${redirectUrl}`;
    
    if (!results.error) {
      await UserRepo.update_user({ stripe_account_verified: true }, { id: you.id });
      const you_updated = await UserRepo.get_user_by_id(you.id);
      you = you_updated!;
      // create JWT
      const jwt = TokensService.newUserJwtToken(you);
      (<any> results).token = jwt;
      (<any> results).you = you;

      ExpoPushNotificationsService.sendUserPushNotification({
        user_id: you.id,
        message: `Your stripe account has been verified! To see changes, sign out and log back in.`,
      });
    }
    else if (createLinks) {
      const createOpts = {
        account: you.stripe_account_id,
        refresh_url,
        return_url: useReturnUrl,
        type: 'account_onboarding',
      } as Stripe.AccountLinkCreateParams;
      LOGGER.info(`UsersService.create_stripe_account - create params:`, { createOpts });
      const accountLinks = await StripeService.stripe.accountLinks.create(createOpts);

      console.log({ accountLinks });
    }


    const serviceMethodResults: ServiceMethodResults = {
      status: results.status,
      error: results.error,
      info: {
        message: results.message,
        data: {
          ...results,
          ...accountLinks,
          onboarding_url: accountLinks.url,
        }
      }
    };
    return serviceMethodResults;
  }

  static async verify_customer_has_card_payment_method(user: UserEntity): ServiceMethodAsyncResults {
    const results = await StripeService.customer_account_has_card_payment_method(user.stripe_customer_account_id);
    console.log({ results });

    const serviceMethodResults: ServiceMethodResults = {
      status: results.status,
      error: results.error,
      info: {
        data: results
      }
    };
    return serviceMethodResults;
  }

  static async is_subscription_active(user: UserEntity): ServiceMethodAsyncResults<boolean> {
    const is_subscription_active = await StripeService.is_subscription_active(user.platform_subscription_id);

    const serviceMethodResults: ServiceMethodResults<boolean> = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        data: is_subscription_active
      }
    };
    return serviceMethodResults;
  }

  static async get_subscription(user: UserEntity): ServiceMethodAsyncResults {
    const subscription = await StripeService.get_subscription(user.platform_subscription_id);

    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        data: subscription
      }
    };
    return serviceMethodResults;
  }

  static async get_subscription_info(user: UserEntity): ServiceMethodAsyncResults {
    const subscription = await StripeService.get_subscription(user.platform_subscription_id);
    const data: UserSubscriptionInfoDto | null = subscription && {
      status: subscription.status,
      active: (await UsersService.is_subscription_active(user)).info.data as boolean,
      current_period_start: subscription.current_period_start,
      current_period_end: subscription.current_period_end,
    }

    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        data,
      }
    };
    return serviceMethodResults;
  }

  static async create_subscription(
    you: UserEntity,
    payment_method_id: string
  ): ServiceMethodAsyncResults {

    if (you.platform_subscription_id) {
      const is_subscription_active = (await UsersService.is_subscription_active(you)).info.data as boolean;
      if (is_subscription_active) {
        const serviceMethodResults: ServiceMethodResults = {
          status: HttpStatusCode.BAD_REQUEST,
          error: true,
          info: {
            message: `User already has active subscription`
          }
        };
        return serviceMethodResults;
      }

    }

    const user_payment_methods = await UsersService.get_user_customer_cards_payment_methods(you.stripe_customer_account_id);
    const payment_methods = user_payment_methods.info.data! as Stripe.PaymentMethod[];
    let isValid = false;

    for (const pm of payment_methods) {
      if (pm.id === payment_method_id) {
        isValid = true;
        break;
      }
    }
    if (!isValid) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.BAD_REQUEST,
        error: true,
        info: {
          message: `Payment method does not belong to user's customer account`
        }
      };
      return serviceMethodResults;
    }
    
    const new_subscription = await StripeService.create_subscription(you.stripe_customer_account_id, payment_method_id);
    if (!new_subscription) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.BAD_REQUEST,
        error: true,
        info: {
          message: `Could not create subscription...`
        }
      };
      return serviceMethodResults;
    }

    const updates = await UserRepo.update_user({ platform_subscription_id: new_subscription.id }, { id: you.id });
  
    const newUYou = { ...you, platform_subscription_id: new_subscription.id };
    // console.log({ updates, results, user });
    delete newUYou.password;
    const jwt = TokensService.newUserJwtToken(newUYou);

    sendAwsInternalEmail({
      subject: `User Subscribed`,
      message: `
        New User Subscription: 
        Name: ${you.firstname} ${you.lastname}
        Email: ${you.email},
        Stripe Subscription ID: ${new_subscription.id}
      `
    });

    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        data: {
          token: jwt,
          subscription: new_subscription,
          you: newUYou
        }
      }
    };
    return serviceMethodResults;
  }

  static async cancel_subscription(
    user: UserEntity,
  ): ServiceMethodAsyncResults {

    if (!user.platform_subscription_id) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.BAD_REQUEST,
        error: true,
        info: {
          message: `User does not have subscription`
        }
      };
      return serviceMethodResults;
    }
    
    const subscription = await StripeService.cancel_subscription(user.platform_subscription_id);

    sendAwsInternalEmail({
      subject: `User canceled subscription`,
      message: `
        New User Subscription: 
        Name: ${user.firstname} ${user.lastname}
        Email: ${user.email},
        Stripe Subscription ID: ${user.platform_subscription_id}
      `
    });

    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        data: subscription
      }
    };
    return serviceMethodResults;
  }

  static async get_user_new_listings_alerts_by_id(id: number) {
    const results = await UserRepo.get_user_new_listings_alerts_by_id(id);
    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        data: results
      }
    };
    return serviceMethodResults;
  }

  static async create_user_new_listings_alert(params: {
    user_id: number,
    label?: string
    to_city?: string,
    to_state?: string,
    from_city?: string,
    from_state?: string,
  }) {
    // check if user already has an alert by given params
    const check = await UserRepo.check_user_new_listings_alert(params);
    if (check) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.BAD_REQUEST,
        error: true,
        info: {
          message: `User already has alert by given params`
        }
      };
      return serviceMethodResults;
    }

    const isValid = (
      (!!params.from_city && !!params.from_state) ||
      (!!params.to_city && !!params.to_state)
    );

    if (!isValid) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.BAD_REQUEST,
        error: true,
        info: {
          message: `Must have pickup city and state, dropoff city and state or both`
        }
      };
      return serviceMethodResults;
    }

    const new_alert = await UserRepo.create_user_new_listings_alert(params);
    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        data: new_alert
      }
    };
    return serviceMethodResults;
  }

  static async delete_user_new_listings_alert(you_id: number, alert_id: number) {
    const results = await UserRepo.get_user_new_listings_alerts_by_id(alert_id);
    if (!results) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.NOT_FOUND,
        error: true,
        info: {
          message: `No alert found`
        }
      };
      return serviceMethodResults;
    }
    if (results.user_id !== you_id) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.BAD_REQUEST,
        error: true,
        info: {
          message: `Alert does not belong to user`
        }
      };
      return serviceMethodResults;
    }

    await UserRepo.delete_user_new_listings_alert(results.id);

    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        message: `Delete alert`
      }
    };
    return serviceMethodResults;
  }

  static async check_user_new_listings_alert(params: {
    user_id: number,
    label: string
    to_city: string,
    to_state: string,
    from_city: string,
    from_state: string,
  }) {
    // check if user already has an alert by given params
    const results = await UserRepo.check_user_new_listings_alert(params);

    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        data: results
      }
    };
    return serviceMethodResults;
  }

  static async get_user_new_listings_alerts_all(user_id: number) {
    const resultsList = await UserRepo.get_user_new_listings_alerts_all(user_id);
    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        data: resultsList,
      },
    };
    return serviceMethodResults;
  }

  static async get_user_new_listings_alerts(user_id: number, alert_id?: number) {
    const resultsList = await UserRepo.get_user_new_listings_alerts(user_id, alert_id);
    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        data: resultsList,
      },
    };
    return serviceMethodResults;
  }

  static async search_user_deliveries_by_title(user: UserEntity, search_query: string) {
    const resultsList = await search_user_deliveries_by_title(user.id, search_query?.toLowerCase() || '');
    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        data: resultsList,
      },
    };
    return serviceMethodResults;
  }

  static async search_user_past_delivering_by_title(user: UserEntity, search_query: string) {
    const resultsList = await search_user_past_delivering_by_title(user.id, search_query?.toLowerCase() || '');
    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        data: resultsList,
      },
    };
    return serviceMethodResults;
  }
}
