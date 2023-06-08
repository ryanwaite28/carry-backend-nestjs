import { HttpStatusCode } from '../enums/http-status-codes.enum';
import Stripe from 'stripe';



export const STRIPE_SDK_API_VERSION: '2022-11-15' = '2022-11-15';

const stripe: Stripe = new Stripe(process.env.STRIPE_SK!, {
  apiVersion: STRIPE_SDK_API_VERSION,
});



/*  
  https://stripe.com/pricing
*/



export class StripeService {
  static readonly stripe: Stripe = stripe;

  static add_on_stripe_processing_fee(amount: number, is_subscription_active: boolean, isAmountAdjusted: boolean = false) {
    const stripePercentageFeeRate = 0.0315;
    const appPercentageFeeRate = 0.0425;
    const stripeFixedFeeRate = 30; // 30 cents

    const total = isAmountAdjusted ? amount : parseInt(amount.toString() + '00');
    const stripe_processing_fee = Math.ceil(total * stripePercentageFeeRate) + stripeFixedFeeRate;
    const stripe_final_processing_fee = stripe_processing_fee + stripeFixedFeeRate;
    const app_processing_fee = Math.ceil(total * appPercentageFeeRate) + stripeFixedFeeRate;
    const app_final_processing_fee = app_processing_fee + stripeFixedFeeRate;

    let new_total = Math.round(total + stripe_processing_fee);
    const difference = new_total - total;
    let app_fee = is_subscription_active ? 0 : (parseInt((total * 0.05).toString(), 10));
    const deduction = Math.ceil(total * 0.1);
    const useTotal = is_subscription_active ? total : total - deduction;
    // app_fee = Math.round(difference + app_fee);
    const final_total = Math.round(new_total + app_fee) + stripeFixedFeeRate;
    const refund_amount = final_total - (is_subscription_active ? stripe_processing_fee : app_processing_fee);
    // new_total = new_total + app_fee;
    const data = { amount, final_total, app_fee, stripe_processing_fee, app_processing_fee, new_total, isAmountAdjusted, total: useTotal, difference, refund_amount, is_subscription_active, stripe_final_processing_fee, app_final_processing_fee };
    console.log(data);
    return data;
  }

  static async get_subscription(subscription_id: string) {
    try {
      if (!subscription_id) {
        console.warn(`subscription id arg had no value`, { subscription_id });
        return null;
      }
      return stripe.subscriptions.retrieve(subscription_id);
    }
    catch (e) {
      console.error(e);
      return null;
    }
  }

  static async is_subscription_active(subscription_id: string): Promise<boolean> {
    try {
      if (!subscription_id) {
        console.warn(`subscription id arg had no value`, { subscription_id });
        return false;
      }
      const subscription = await stripe.subscriptions.retrieve(subscription_id, {
        expand: ['latest_invoice', 'latest_invoice.payment_intent'],
      });
      const isActive = !!subscription && (
        subscription.status === `active` ||
        (subscription.status === `canceled` && (new Date(subscription.current_period_end * 1000) > new Date())) // https://www.delftstack.com/howto/javascript/javascript-convert-timestamp-to-date/
      );
      return isActive;
    }
    catch (e) {
      console.error(e);
      return false;
    }
  }

  static async create_subscription(customer_id: string, payment_method_id: string) {
    /*
      https://stripe.com/docs/billing/subscriptions/overview#integration-example
      https://stripe.com/docs/api/subscriptions/update

    */
    try {
      const subscription = await stripe.subscriptions.create({
        customer: customer_id,
        default_payment_method: payment_method_id,
        collection_method: `charge_automatically`,
        payment_behavior: `default_incomplete`,
        expand: ['latest_invoice.payment_intent'],
        off_session: true,
        items: [
          { price: process.env.STRIPE_PLATFORM_MEMBERSHIP_PRICE_ID },
        ],
      });

      const confirmation = await stripe.paymentIntents.confirm(
        ((subscription.latest_invoice! as Stripe.Invoice).payment_intent! as Stripe.PaymentIntent).id,
        {
          off_session: true
        }
      );

      console.log({ confirmation });

      return stripe.subscriptions.retrieve(subscription.id);
    }
    catch (e) {
      console.error(e);
      return null;
    }
  }

  static async cancel_subscription(subscription_id: string) {
    /*
      https://stripe.com/docs/billing/subscriptions/overview#integration-example
      https://stripe.com/docs/api/subscriptions/update

    */
    try {
      const subscription = await stripe.subscriptions.del(subscription_id);
      return subscription;
    }
    catch (e) {
      console.error(e);
      return null;
    }
  }

  static async account_is_complete(account_id: any) {
    const stripe_account: Stripe.Account = await StripeService.stripe.accounts.retrieve(account_id, { expand: ['individual', 'individual.verification'] });

    console.log({ stripe_account: JSON.stringify(stripe_account) });

    // console.log({
    //   charges_enabled: stripe_account.charges_enabled,
    //   details_submitted: stripe_account.details_submitted,
    //   capabilities: stripe_account.capabilities,
    //   payouts_enabled: stripe_account.payouts_enabled,
    // });


    if (!stripe_account.details_submitted) {
      return {
        stripe_account,
        error: true,
        status: HttpStatusCode.PRECONDITION_FAILED,
        message: `You must complete your stripe account onboarding: all required details must be submitted`
      };
    }

    const accountCanAcceptTransfers = (
      (stripe_account.capabilities?.transfers && stripe_account.capabilities.transfers === 'active')
      && stripe_account.payouts_enabled
    );
    // const individualProvidedIdentity = !!stripe_account.individual && (
    //   !!stripe_account.individual.first_name
    //   && (!!stripe_account.individual.last_name || !!stripe_account.individual.maiden_name)
    //   && !!stripe_account.individual.ssn_last_4_provided
    //   && !!stripe_account.individual.dob
    //   && (
    //     !!stripe_account.individual.dob.day
    //     && !!stripe_account.individual.dob.month
    //     && !!stripe_account.individual.dob.year
    //   )
    // );
    // const individualVerified = !!stripe_account.individual && (
    //   stripe_account.individual.verification.status === 'verified'
    //   && stripe_account.individual.verification.document 
    //   && (
    //     stripe_account.individual.verification.document.front
    //     && stripe_account.individual.verification.document.back
    //   )
    // );

    const allRequirementsMet = (
      stripe_account.details_submitted
      && stripe_account.requirements.currently_due.length === 0
      && stripe_account.requirements.eventually_due.length === 0
      && stripe_account.requirements.past_due.length === 0
      && stripe_account.requirements.pending_verification.length === 0
    );

    const hasNeededCapabilities = (
      accountCanAcceptTransfers
      && allRequirementsMet
      // && individualProvidedIdentity
      // && individualVerified
    );

    console.log({
      accountCanAcceptTransfers,
      allRequirementsMet,
      hasNeededCapabilities
      // individualProvidedIdentity,
      // individualVerified,
    });

    if (!hasNeededCapabilities) {
      return {
        stripe_account,
        error: true,
        status: HttpStatusCode.PRECONDITION_FAILED,
        message: `You must complete your stripe account onboarding: transfers must be enabled, identity must be provided and verified (name, last 4 of social, ID/passport/document/etc)`
      };
    }

    return {
      stripe_account,
      error: false,
      status: HttpStatusCode.OK,
      message: `Stripe account connected and valid!`
    };
  }

  // static async account_is_complete(account_id: any) {
  //   const stripe_account: Stripe.Account = await StripeService.stripe.accounts.retrieve(account_id);

  //   console.log({ stripe_account });
  //   console.log({
  //     ...stripe_account.settings,
  //     externa_accounts: stripe_account.external_accounts?.data,
  //   });

  //   console.log({
  //     charges_enabled: stripe_account.charges_enabled,
  //     details_submitted: stripe_account.details_submitted,
  //     capabilities: stripe_account.capabilities,
  //     payouts_enabled: stripe_account.payouts_enabled,
  //   });

  //   // if (!stripe_account.charges_enabled) {
  //   //   return {
  //   //     stripe_account,
  //   //     error: true,
  //   //     status: HttpStatusCode.PRECONDITION_FAILED,
  //   //     message: `You must complete your stripe account onboarding: charges must be enabled`
  //   //   };
  //   // }

  //   if (!stripe_account.details_submitted) {
  //     return {
  //       stripe_account,
  //       error: true,
  //       status: HttpStatusCode.PRECONDITION_FAILED,
  //       message: `You must complete your stripe account onboarding: all required details must be submitted`
  //     };
  //   }

  //   const hasNeededCapabilities = (
  //     // (stripe_account.capabilities?.card_payments && stripe_account.capabilities.card_payments === 'active') &&
  //     (stripe_account.capabilities?.transfers && stripe_account.capabilities.transfers === 'active')
  //   );
  //   if (!hasNeededCapabilities) {
  //     return {
  //       stripe_account,
  //       error: true,
  //       status: HttpStatusCode.PRECONDITION_FAILED,
  //       message: `You must complete your stripe account onboarding: transfers must be enabled`
  //     };
  //   }

  //   return {
  //     stripe_account,
  //     error: false,
  //     status: HttpStatusCode.OK,
  //     message: `Stripe account connected and valid!`
  //   };
  // }

  static async get_connected_account_cards_payment_methods(stripe_customer_id: string) {
    const paymentMethods = await StripeService.stripe.accounts

    return paymentMethods;
  }



  static async get_customer_cards_payment_methods(stripe_customer_id: string) {
    const paymentMethods = await StripeService.stripe.paymentMethods.list({
      customer: stripe_customer_id,
      type: 'card',
    });

    return paymentMethods;
  }

  static async customer_account_has_card_payment_method(customer_id: string) {
    const user_payment_methods = await StripeService.get_customer_cards_payment_methods(customer_id);
    const payment_methods = user_payment_methods.data;

    console.log({
      payment_methods,
    });

    if (payment_methods.length === 0) {
      return {
        error: true,
        status: HttpStatusCode.PRECONDITION_FAILED,
        message: `User has no cards; add a debit/credit card to your customer account`
      };
    }

    return {
      error: false,
      status: HttpStatusCode.OK,
      message: `Stripe customer account has card(s) payment methods!`
    };
  }

  static async payment_method_belongs_to_customer(customer_id: string, payment_intent_id: string) {
    const user_payment_methods = await StripeService.get_customer_cards_payment_methods(customer_id);
    const payment_methods = user_payment_methods.data;

    console.log({
      payment_methods,
    });

    if (payment_methods.length === 0) {
      return {
        error: true,
        status: HttpStatusCode.PRECONDITION_FAILED,
        message: `User has no cards; add a debit/credit card to your customer account`
      };
    }

    for (const pm of payment_methods) {
      if (pm.id === payment_intent_id) {
        return {
          error: false,
          status: HttpStatusCode.OK,
          message: `Payment method belongs customer account`
        };
      }
    }

    return {
      error: true,
      status: HttpStatusCode.BAD_REQUEST,
      message: `Payment method does not belongs customer account`
    };
  }
}