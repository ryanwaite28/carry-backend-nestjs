import { Request, Response } from "express";
import {
  delete_user_stripe_identity_verification_session_by_session_id,
  get_user_by_id,
  get_user_by_stripe_connected_account_id,
  update_user_by_id,
  verify_user_stripe_identity_verification_session_by_session_id,
} from "../repos/users.repo";
import Stripe from "stripe";
import { HttpStatusCode } from "../enums/http-status-codes.enum";
import { UsersService } from "./users.service";
import {
  create_delivery_unpaid_listing,
  delete_delivery,
  get_delivery_by_payment_intent_id,
  get_delivery_dispute_by_delivery_id,
} from "../repos/deliveries.repo";
import { LOGGER } from "../utils/logger.utils";
import { sendAwsEmail } from "../utils/ses.aws.utils";
import { HandlebarsEmailsService } from "./emails.service";
import { AppEnvironment } from "../utils/app.enviornment";
import { ExpoPushNotificationsService } from "./expo-notifications.service";
import { UserEntity } from "../entities/carry.entity";
import { CommonSocketEventsHandler } from "./common.socket-event-handler";
import { CARRY_EVENT_TYPES } from "../enums/carry.enum";




export class StripeWebhookEventsRequestHandler {
  /**
   * @description
   * Main stripe webhook atrium method.
   * 
   * Sends event to proper micro app delegate. The order:
   * event.type > micro app > target type
   * 
   * @param event 
   * @param request 
   * @param response 
   * @returns 
   */
  static async handleEvent(event: any, request: Request, response: Response) {
    switch (event.type) {
      case 'account.updated': {
        const account: Stripe.Account = event.data.object;
        // Then define and call a function to handle the event account.updated
        console.log(`Searching for user by stripe connected account id:`, account.id);
        const check_user = await get_user_by_stripe_connected_account_id(account.id);
        console.log({ check_user });
        if (check_user) {
          console.log(`Verifying stripe account for ${account.id}`);
          UsersService.verify_stripe_account(check_user, false);
        }
        break;
      }
      case 'account.application.authorized':
        var account = event.data.object;
        // Then define and call a function to handle the event account.application.authorized
        break;
      case 'account.application.deauthorized':
        var account = event.data.object;
        // Then define and call a function to handle the event account.application.deauthorized
        break;
      case 'account.external_account.created': {
        const accountExternalAccount = event.data.object;
        // Then define and call a function to handle the event account.external_account.created
        break;
      }
      case 'account.external_account.deleted':
        var accountExternalAccount = event.data.object;
        // Then define and call a function to handle the event account.external_account.deleted
        break;
      case 'account.external_account.updated':
        var accountExternalAccount = event.data.object;
        // Then define and call a function to handle the event account.external_account.updated
        break;
      case 'application_fee.created':
        var applicationFee = event.data.object;
        // Then define and call a function to handle the event application_fee.created
        break;
      case 'application_fee.refunded':
        var applicationFee = event.data.object;
        // Then define and call a function to handle the event application_fee.refunded
        break;
      case 'application_fee.refund.updated':
        var applicationFeeApplication = event.data.object;
        // Then define and call a function to handle the event application_fee.refund.updated
        break;
      case 'balance.available':
        var balance = event.data.object;
        // Then define and call a function to handle the event balance.available
        break;
      case 'billing_portal.configuration.created':
        var billingPortalBilling = event.data.object;
        // Then define and call a function to handle the event billing_portal.configuration.created
        break;
      case 'billing_portal.configuration.updated':
        var billingPortalBilling = event.data.object;
        // Then define and call a function to handle the event billing_portal.configuration.updated
        break;
      case 'capability.updated': {
        var capability: Stripe.Capability = event.data.object;
        // Then define and call a function to handle the event capability.updated
        if (typeof capability.account !== 'string') {
          const account: Stripe.Account = capability.account;
          // Then define and call a function to handle the event account.updated
          console.log(`Searching for user by stripe connected account id:`, account.id);
          const check_user = await get_user_by_stripe_connected_account_id(account.id);
          console.log({ check_user });
          if (check_user) {
            console.log(`Verifying stripe account for ${account.id}`);
            UsersService.verify_stripe_account(check_user, false);
          }
        }
        break;
      }
      case 'charge.captured':
        var charge = event.data.object;
        // Then define and call a function to handle the event charge.captured
        break;
      case 'charge.expired':
        var charge = event.data.object;
        // Then define and call a function to handle the event charge.expired
        break;
      case 'charge.failed':
        var charge = event.data.object;
        // Then define and call a function to handle the event charge.failed
        break;
      case 'charge.pending':
        var charge = event.data.object;
        // Then define and call a function to handle the event charge.pending
        break;
      case 'charge.refunded':
        var charge = event.data.object;
        // Then define and call a function to handle the event charge.refunded
        break;
      case 'charge.succeeded':
        var charge = event.data.object;
        // Then define and call a function to handle the event charge.succeeded
        break;
      case 'charge.updated':
        var charge = event.data.object;
        // Then define and call a function to handle the event charge.updated
        break;
      case 'charge.dispute.closed':
        var charge = event.data.object;
        // Then define and call a function to handle the event charge.dispute.closed
        break;
      case 'charge.dispute.created':
        var charge = event.data.object;
        // Then define and call a function to handle the event charge.dispute.created
        break;
      case 'charge.dispute.funds_reinstated':
        var charge = event.data.object;
        // Then define and call a function to handle the event charge.dispute.funds_reinstated
        break;
      case 'charge.dispute.funds_withdrawn':
        var charge = event.data.object;
        // Then define and call a function to handle the event charge.dispute.funds_withdrawn
        break;
      case 'charge.dispute.updated':
        var charge = event.data.object;
        // Then define and call a function to handle the event charge.dispute.updated
        break;
      case 'charge.refund.updated':
        var charge = event.data.object;
        // Then define and call a function to handle the event charge.refund.updated
        break;
      case 'checkout.session.async_payment_failed':
        var checkout = event.data.object;
        // Then define and call a function to handle the event checkout.session.async_payment_failed
        break;
      case 'checkout.session.async_payment_succeeded':
        var checkout = event.data.object;
        // Then define and call a function to handle the event checkout.session.async_payment_succeeded
        break;
      case 'checkout.session.completed':
        var checkout = event.data.object;
        // Then define and call a function to handle the event checkout.session.completed
        break;
      case 'checkout.session.expired':
        var checkout = event.data.object;
        // Then define and call a function to handle the event checkout.session.expired
        break;
      case 'coupon.created':
        var coupon = event.data.object;
        // Then define and call a function to handle the event coupon.created
        break;
      case 'coupon.deleted':
        var coupon = event.data.object;
        // Then define and call a function to handle the event coupon.deleted
        break;
      case 'coupon.updated':
        var coupon = event.data.object;
        // Then define and call a function to handle the event coupon.updated
        break;
      case 'credit_note.created':
        var creditNote = event.data.object;
        // Then define and call a function to handle the event credit_note.created
        break;
      case 'credit_note.updated':
        var creditNote = event.data.object;
        // Then define and call a function to handle the event credit_note.updated
        break;
      case 'credit_note.voided':
        var creditNote = event.data.object;
        // Then define and call a function to handle the event credit_note.voided
        break;
      case 'customer.created':
        var customer = event.data.object;
        // Then define and call a function to handle the event customer.created
        break;
      case 'customer.deleted':
        var customer = event.data.object;
        // Then define and call a function to handle the event customer.deleted
        break;
      case 'customer.updated':
        var customer = event.data.object;
        // Then define and call a function to handle the event customer.updated
        break;
      case 'customer.discount.created':
        var customer = event.data.object;
        // Then define and call a function to handle the event customer.discount.created
        break;
      case 'customer.discount.deleted':
        var customer = event.data.object;
        // Then define and call a function to handle the event customer.discount.deleted
        break;
      case 'customer.discount.updated':
        var customer = event.data.object;
        // Then define and call a function to handle the event customer.discount.updated
        break;
      case 'customer.source.created':
        var customer = event.data.object;
        // Then define and call a function to handle the event customer.source.created
        break;
      case 'customer.source.deleted':
        var customer = event.data.object;
        // Then define and call a function to handle the event customer.source.deleted
        break;
      case 'customer.source.expiring':
        var customer = event.data.object;
        // Then define and call a function to handle the event customer.source.expiring
        break;
      case 'customer.source.updated':
        var customer = event.data.object;
        // Then define and call a function to handle the event customer.source.updated
        break;
      case 'customer.subscription.created':
        var customer = event.data.object;
        // Then define and call a function to handle the event customer.subscription.created
        break;
      case 'customer.subscription.deleted':
        var customer = event.data.object;
        // Then define and call a function to handle the event customer.subscription.deleted
        break;
      case 'customer.subscription.pending_update_applied':
        var customer = event.data.object;
        // Then define and call a function to handle the event customer.subscription.pending_update_applied
        break;
      case 'customer.subscription.pending_update_expired':
        var customer = event.data.object;
        // Then define and call a function to handle the event customer.subscription.pending_update_expired
        break;
      case 'customer.subscription.trial_will_end':
        var customer = event.data.object;
        // Then define and call a function to handle the event customer.subscription.trial_will_end
        break;
      case 'customer.subscription.updated':
        var customer = event.data.object;
        // Then define and call a function to handle the event customer.subscription.updated
        break;
      case 'customer.tax_id.created':
        var customerTaxId = event.data.object;
        // Then define and call a function to handle the event customer.tax_id.created
        break;
      case 'customer.tax_id.deleted':
        var customerTaxId = event.data.object;
        // Then define and call a function to handle the event customer.tax_id.deleted
        break;
      case 'customer.tax_id.updated':
        var customerTaxId = event.data.object;
        // Then define and call a function to handle the event customer.tax_id.updated
        break;
      case 'file.created':
        var file = event.data.object;
        // Then define and call a function to handle the event file.created
        break;
      case 'identity.verification_session.canceled': {
        // Then define and call a function to handle the event identity.verification_session.canceled
        const identityVerificationSession: Stripe.Identity.VerificationSession = event.data.object;
        // delete database reference
        delete_user_stripe_identity_verification_session_by_session_id(identityVerificationSession.id)
        .then(async () => {
          if (!identityVerificationSession.metadata['user_id']) {
            LOGGER.error(`User ID was not attached to identity verification session's metadata; should have been set upon creation...`, { identityVerificationSession });
            return;
          }
          const user_id = parseInt(identityVerificationSession.metadata['user_id']);
          const user: UserEntity = await get_user_by_id(user_id);
          if (!user) {
            LOGGER.error(`User not found by ID from identity verification session's metadata...`, { user_id, identityVerificationSession });
            return;
          }
          // send email
          HandlebarsEmailsService.send_identity_verification_session_canceled(user);
          
          // send socket event
          CommonSocketEventsHandler.emitEventToUserSockets({
            user_id,
            event: CARRY_EVENT_TYPES.STRIPE_IDENTITY_VERIFICATION_SESSION_CANCELED,
            event_data: {},
          });

          // send push notification
          ExpoPushNotificationsService.sendUserPushNotification({
            user_id,
            message: `Stripe Identity verification process was canceled. Please go to settings and complete identity verification.`
          });
        })
        .catch((error) => {
          LOGGER.error(`Could not notify user of identity verification session canceled...`, { error, identityVerificationSession });
        });
        break;
      }
      case 'identity.verification_session.created':
        var identityVerificationSession = event.data.object;
        // Then define and call a function to handle the event identity.verification_session.created
        break;
      case 'identity.verification_session.processing':
        var identityVerificationSession = event.data.object;
        // Then define and call a function to handle the event identity.verification_session.processing
        break;
      case 'identity.verification_session.redacted':
        var identityVerificationSession = event.data.object;
        // Then define and call a function to handle the event identity.verification_session.redacted
        break;
      case 'identity.verification_session.requires_input':
        var identityVerificationSession = event.data.object;
        // Then define and call a function to handle the event identity.verification_session.requires_input
        break;
      case 'identity.verification_session.verified': {
        // Then define and call a function to handle the event identity.verification_session.verified
        const identityVerificationSession: Stripe.Identity.VerificationSession = event.data.object;
        UsersService.handle_user_identity_verified_event(parseInt(identityVerificationSession.metadata['user_id'], 10));
        break;
      }
      case 'invoice.created':
        var invoice = event.data.object;
        // Then define and call a function to handle the event invoice.created
        break;
      case 'invoice.deleted':
        var invoice = event.data.object;
        // Then define and call a function to handle the event invoice.deleted
        break;
      case 'invoice.finalization_failed':
        var invoice = event.data.object;
        // Then define and call a function to handle the event invoice.finalization_failed
        break;
      case 'invoice.finalized':
        var invoice = event.data.object;
        // Then define and call a function to handle the event invoice.finalized
        break;
      case 'invoice.marked_uncollectible':
        var invoice = event.data.object;
        // Then define and call a function to handle the event invoice.marked_uncollectible
        break;
      case 'invoice.paid':
        var invoice = event.data.object;
        // Then define and call a function to handle the event invoice.paid
        break;
      case 'invoice.payment_action_required':
        var invoice = event.data.object;
        // Then define and call a function to handle the event invoice.payment_action_required
        break;
      case 'invoice.payment_failed':
        var invoice = event.data.object;
        // Then define and call a function to handle the event invoice.payment_failed
        break;
      case 'invoice.payment_succeeded':
        var invoice = event.data.object;
        // Then define and call a function to handle the event invoice.payment_succeeded
        break;
      case 'invoice.sent':
        var invoice = event.data.object;
        // Then define and call a function to handle the event invoice.sent
        break;
      case 'invoice.upcoming':
        var invoice = event.data.object;
        // Then define and call a function to handle the event invoice.upcoming
        break;
      case 'invoice.updated':
        var invoice = event.data.object;
        // Then define and call a function to handle the event invoice.updated
        break;
      case 'invoice.voided':
        var invoice = event.data.object;
        // Then define and call a function to handle the event invoice.voided
        break;
      case 'invoiceitem.created':
        var invoiceitem = event.data.object;
        // Then define and call a function to handle the event invoiceitem.created
        break;
      case 'invoiceitem.deleted':
        var invoiceitem = event.data.object;
        // Then define and call a function to handle the event invoiceitem.deleted
        break;
      case 'invoiceitem.updated':
        var invoiceitem = event.data.object;
        // Then define and call a function to handle the event invoiceitem.updated
        break;
      case 'issuing_authorization.created':
        var issuingAuthorization = event.data.object;
        // Then define and call a function to handle the event issuing_authorization.created
        break;
      case 'issuing_authorization.request':
        var issuingAuthorization = event.data.object;
        // Then define and call a function to handle the event issuing_authorization.request
        break;
      case 'issuing_authorization.updated':
        var issuingAuthorization = event.data.object;
        // Then define and call a function to handle the event issuing_authorization.updated
        break;
      case 'issuing_card.created':
        var issuingCard = event.data.object;
        // Then define and call a function to handle the event issuing_card.created
        break;
      case 'issuing_card.updated':
        var issuingCard = event.data.object;
        // Then define and call a function to handle the event issuing_card.updated
        break;
      case 'issuing_cardholder.created':
        var issuingCardholder = event.data.object;
        // Then define and call a function to handle the event issuing_cardholder.created
        break;
      case 'issuing_cardholder.updated':
        var issuingCardholder = event.data.object;
        // Then define and call a function to handle the event issuing_cardholder.updated
        break;
      case 'issuing_dispute.closed':
        var issuingDispute = event.data.object;
        // Then define and call a function to handle the event issuing_dispute.closed
        break;
      case 'issuing_dispute.created':
        var issuingDispute = event.data.object;
        // Then define and call a function to handle the event issuing_dispute.created
        break;
      case 'issuing_dispute.funds_reinstated':
        var issuingDispute = event.data.object;
        // Then define and call a function to handle the event issuing_dispute.funds_reinstated
        break;
      case 'issuing_dispute.submitted':
        var issuingDispute = event.data.object;
        // Then define and call a function to handle the event issuing_dispute.submitted
        break;
      case 'issuing_dispute.updated':
        var issuingDispute = event.data.object;
        // Then define and call a function to handle the event issuing_dispute.updated
        break;
      case 'issuing_transaction.created':
        var issuingTransaction = event.data.object;
        // Then define and call a function to handle the event issuing_transaction.created
        break;
      case 'issuing_transaction.updated':
        var issuingTransaction = event.data.object;
        // Then define and call a function to handle the event issuing_transaction.updated
        break;
      case 'mandate.updated':
        var mandate = event.data.object;
        // Then define and call a function to handle the event mandate.updated
        break;
      case 'order.created':
        var order = event.data.object;
        // Then define and call a function to handle the event order.created
        break;
      case 'order.payment_failed':
        var order = event.data.object;
        // Then define and call a function to handle the event order.payment_failed
        break;
      case 'order.payment_succeeded':
        var order = event.data.object;
        // Then define and call a function to handle the event order.payment_succeeded
        break;
      case 'order.updated':
        var order = event.data.object;
        // Then define and call a function to handle the event order.updated
        break;
      case 'order_return.created':
        var orderReturn = event.data.object;
        // Then define and call a function to handle the event order_return.created
        break;
      case 'payment.created': {
        var payment = event.data.object;
        break;
      }
      case 'payment_intent.amount_capturable_updated':
        var paymentIntent = event.data.object;
        // Then define and call a function to handle the event payment_intent.amount_capturable_updated
        break;
      case 'payment_intent.canceled': {
        // Then define and call a function to handle the event payment_intent.canceled
        const paymentIntent: Stripe.PaymentIntent = event.data.object;
        /* 
          Check if the metadata has a delivery id attached. If so, then only two things are possible:
          - delivery was not taken and completed within 7 days
          - the delivery listing was deleted
        */

        // check if the delivery listing is deleted;
        const delivery = await get_delivery_by_payment_intent_id(paymentIntent.id);
        if (!!delivery && !delivery.carrier_id) {
          // no one took this listing job, delete and notify
          await delete_delivery(delivery.id);
          ExpoPushNotificationsService.sendUserPushNotification({
            user_id: delivery.owner_id,
            message: `Deleted expired delivery listing: ${delivery.title}. The hold on your payment has been released and should return in a few business days.`,
            data: { delivery_id: delivery.id },
          });
          return;
        }

        if (!delivery) {
          // the owner must have canceled the listing and the hold was already released upon that delete request; no further actions needed
          LOGGER.info(`payment_intent.canceled - No delivery found by payment intent: ${paymentIntent.id}; owner must have canceled listing.`);
          break;
        }
        else {
          /*
            delivery not deleted/still exists. 
            since payment intent was canceled, delivery should not be in a completed state if payout was not issued/triggered from either carrier or customer.
          */
          if (delivery.completed) {
            LOGGER.error(`payment_intent.canceled - Corrupted state on delivery: cannot be completed without issuing payout, something went wrong...`, { payment_intent_id: paymentIntent.id, delivery_id: delivery.id });
          }
          
          // check if there is an open dispute; if so, payout will be settled via dispute
          const dispute = await get_delivery_dispute_by_delivery_id(delivery.id);
          if (dispute) {
            LOGGER.info(`payment_intent.canceled - delivery currently in a dispute:`, { dispute_id: dispute.id });
          }
          /*
            check if delivery was dropped off
          */
          else if (!delivery.completed && !!delivery.datetime_delivered) {
            /*
              delivery was marked as dropped off and neither customer issued nor carrier claimed the payout.
            */
            LOGGER.info(`payment_intent.canceled - delivery was dropped off and no disputes; assume service was done successfully. issue an invoice`);
            /*
              assume service was completed normally and payout was simply forgotten about.
              create an unpaid listing record on the customer's user account; they cannot create another listing until this one is paid
            */
            const unpaid_listing = await create_delivery_unpaid_listing({
              user_id: delivery.owner_id,
              delivery_id: delivery.id,
              canceled_payment_intent_id: paymentIntent.id
            });
            LOGGER.info(`payment_intent.calceled - created unpaid delivery listing record; notifying customer`, { unpaid_listing });
            /*
              send out push notification and email of unpaid status
            */
            const user_name: string = `${delivery.owner!.firstname} ${delivery.owner!.lastname}`;
            sendAwsEmail({
              to: delivery.owner!.email,
              subject: HandlebarsEmailsService.USERS.customer_unpaid_listing.subject(delivery.title),
              html: HandlebarsEmailsService.USERS.customer_unpaid_listing.template({
                user_name,
                app_name: AppEnvironment.APP_NAME.DISPLAY,
                delivery_title: delivery.title
              })
            });
            ExpoPushNotificationsService.sendUserPushNotification({
              user_id: delivery.owner_id,
              message: `Unpaid delivery listing: ${delivery.title}. Please pay in order to continue the platform.`,
              data: { delivery_id: delivery.id },
            });
          }
        }

        break;
      }
      case 'payment_intent.created':
        var paymentIntent = event.data.object;
        // Then define and call a function to handle the event payment_intent.created
        break;
      case 'payment_intent.payment_failed':
        var paymentIntent = event.data.object;
        // Then define and call a function to handle the event payment_intent.payment_failed
        break;
      case 'payment_intent.processing':
        var paymentIntent = event.data.object;
        // Then define and call a function to handle the event payment_intent.processing
        break;
      case 'payment_intent.requires_action':
        var paymentIntent = event.data.object;
        // Then define and call a function to handle the event payment_intent.requires_action
        break;
      case 'payment_intent.succeeded': {
        const stripePaymentIntent = event.data.object;
        // Then define and call a function to handle the event payment_intent.succeeded
        
        break;
      }
      case 'payment_method.attached':
        var paymentMethod = event.data.object;
        // Then define and call a function to handle the event payment_method.attached
        break;
      case 'payment_method.automatically_updated':
        var paymentMethod = event.data.object;
        // Then define and call a function to handle the event payment_method.automatically_updated
        break;
      case 'payment_method.detached':
        var paymentMethod = event.data.object;
        // Then define and call a function to handle the event payment_method.detached
        break;
      case 'payment_method.updated':
        var paymentMethod = event.data.object;
        // Then define and call a function to handle the event payment_method.updated
        break;
      case 'payout.canceled':
        var payout = event.data.object;
        // Then define and call a function to handle the event payout.canceled
        break;
      case 'payout.created':
        var payout = event.data.object;
        // Then define and call a function to handle the event payout.created
        break;
      case 'payout.failed':
        var payout = event.data.object;
        // Then define and call a function to handle the event payout.failed
        break;
      case 'payout.paid':
        var payout = event.data.object;
        // Then define and call a function to handle the event payout.paid
        break;
      case 'payout.updated':
        var payout = event.data.object;
        // Then define and call a function to handle the event payout.updated
        break;
      case 'person.created':
        var person = event.data.object;
        // Then define and call a function to handle the event person.created
        break;
      case 'person.deleted':
        var person = event.data.object;
        // Then define and call a function to handle the event person.deleted
        break;
      case 'person.updated':
        var person = event.data.object;
        // Then define and call a function to handle the event person.updated
        break;
      case 'plan.created':
        var plan = event.data.object;
        // Then define and call a function to handle the event plan.created
        break;
      case 'plan.deleted':
        var plan = event.data.object;
        // Then define and call a function to handle the event plan.deleted
        break;
      case 'plan.updated':
        var plan = event.data.object;
        // Then define and call a function to handle the event plan.updated
        break;
      case 'price.created':
        var price = event.data.object;
        // Then define and call a function to handle the event price.created
        break;
      case 'price.deleted':
        var price = event.data.object;
        // Then define and call a function to handle the event price.deleted
        break;
      case 'price.updated':
        var price = event.data.object;
        // Then define and call a function to handle the event price.updated
        break;
      case 'product.created':
        var product = event.data.object;
        // Then define and call a function to handle the event product.created
        break;
      case 'product.deleted':
        var product = event.data.object;
        // Then define and call a function to handle the event product.deleted
        break;
      case 'product.updated':
        var product = event.data.object;
        // Then define and call a function to handle the event product.updated
        break;
      case 'promotion_code.created':
        var promotionCode = event.data.object;
        // Then define and call a function to handle the event promotion_code.created
        break;
      case 'promotion_code.updated':
        var promotionCode = event.data.object;
        // Then define and call a function to handle the event promotion_code.updated
        break;
      case 'quote.accepted':
        var quote = event.data.object;
        // Then define and call a function to handle the event quote.accepted
        break;
      case 'quote.canceled':
        var quote = event.data.object;
        // Then define and call a function to handle the event quote.canceled
        break;
      case 'quote.created':
        var quote = event.data.object;
        // Then define and call a function to handle the event quote.created
        break;
      case 'quote.finalized':
        var quote = event.data.object;
        // Then define and call a function to handle the event quote.finalized
        break;
      case 'radar.early_fraud_warning.created':
        var radarEarlyFraudWarning = event.data.object;
        // Then define and call a function to handle the event radar.early_fraud_warning.created
        break;
      case 'radar.early_fraud_warning.updated':
        var radarEarlyFraudWarning = event.data.object;
        // Then define and call a function to handle the event radar.early_fraud_warning.updated
        break;
      case 'recipient.created':
        var recipient = event.data.object;
        // Then define and call a function to handle the event recipient.created
        break;
      case 'recipient.deleted':
        var recipient = event.data.object;
        // Then define and call a function to handle the event recipient.deleted
        break;
      case 'recipient.updated':
        var recipient = event.data.object;
        // Then define and call a function to handle the event recipient.updated
        break;
      case 'reporting.report_run.failed':
        var reportingReportRun = event.data.object;
        // Then define and call a function to handle the event reporting.report_run.failed
        break;
      case 'reporting.report_run.succeeded':
        var reportingReportRun = event.data.object;
        // Then define and call a function to handle the event reporting.report_run.succeeded
        break;
      case 'reporting.report_type.updated':
        var reportingReportType = event.data.object;
        // Then define and call a function to handle the event reporting.report_type.updated
        break;
      case 'review.closed':
        var review = event.data.object;
        // Then define and call a function to handle the event review.closed
        break;
      case 'review.opened':
        var review = event.data.object;
        // Then define and call a function to handle the event review.opened
        break;
      case 'setup_intent.canceled':
        var setupIntent = event.data.object;
        // Then define and call a function to handle the event setup_intent.canceled
        break;
      case 'setup_intent.created':
        var setupIntent = event.data.object;
        // Then define and call a function to handle the event setup_intent.created
        break;
      case 'setup_intent.requires_action':
        var setupIntent = event.data.object;
        // Then define and call a function to handle the event setup_intent.requires_action
        break;
      case 'setup_intent.setup_failed':
        var setupIntent = event.data.object;
        // Then define and call a function to handle the event setup_intent.setup_failed
        break;
      case 'setup_intent.succeeded':
        var setupIntent = event.data.object;
        // Then define and call a function to handle the event setup_intent.succeeded
        break;
      case 'sigma.scheduled_query_run.created':
        var sigmaScheduledQueryRun = event.data.object;
        // Then define and call a function to handle the event sigma.scheduled_query_run.created
        break;
      case 'sku.created':
        var sku = event.data.object;
        // Then define and call a function to handle the event sku.created
        break;
      case 'sku.deleted':
        var sku = event.data.object;
        // Then define and call a function to handle the event sku.deleted
        break;
      case 'sku.updated':
        var sku = event.data.object;
        // Then define and call a function to handle the event sku.updated
        break;
      case 'source.canceled':
        var source = event.data.object;
        // Then define and call a function to handle the event source.canceled
        break;
      case 'source.chargeable':
        var source = event.data.object;
        // Then define and call a function to handle the event source.chargeable
        break;
      case 'source.failed':
        var source = event.data.object;
        // Then define and call a function to handle the event source.failed
        break;
      case 'source.mandate_notification':
        var source = event.data.object;
        // Then define and call a function to handle the event source.mandate_notification
        break;
      case 'source.refund_attributes_required':
        var source = event.data.object;
        // Then define and call a function to handle the event source.refund_attributes_required
        break;
      case 'source.transaction.created':
        var source = event.data.object;
        // Then define and call a function to handle the event source.transaction.created
        break;
      case 'source.transaction.updated':
        var source = event.data.object;
        // Then define and call a function to handle the event source.transaction.updated
        break;
      case 'subscription_schedule.aborted':
        var subscriptionSchedule = event.data.object;
        // Then define and call a function to handle the event subscription_schedule.aborted
        break;
      case 'subscription_schedule.canceled':
        var subscriptionSchedule = event.data.object;
        // Then define and call a function to handle the event subscription_schedule.canceled
        break;
      case 'subscription_schedule.completed':
        var subscriptionSchedule = event.data.object;
        // Then define and call a function to handle the event subscription_schedule.completed
        break;
      case 'subscription_schedule.created':
        var subscriptionSchedule = event.data.object;
        // Then define and call a function to handle the event subscription_schedule.created
        break;
      case 'subscription_schedule.expiring':
        var subscriptionSchedule = event.data.object;
        // Then define and call a function to handle the event subscription_schedule.expiring
        break;
      case 'subscription_schedule.released':
        var subscriptionSchedule = event.data.object;
        // Then define and call a function to handle the event subscription_schedule.released
        break;
      case 'subscription_schedule.updated':
        var subscriptionSchedule = event.data.object;
        // Then define and call a function to handle the event subscription_schedule.updated
        break;
      case 'tax_rate.created':
        var taxRate = event.data.object;
        // Then define and call a function to handle the event tax_rate.created
        break;
      case 'tax_rate.updated':
        var taxRate = event.data.object;
        // Then define and call a function to handle the event tax_rate.updated
        break;
      case 'topup.canceled':
        var topup = event.data.object;
        // Then define and call a function to handle the event topup.canceled
        break;
      case 'topup.created':
        var topup = event.data.object;
        // Then define and call a function to handle the event topup.created
        break;
      case 'topup.failed':
        var topup = event.data.object;
        // Then define and call a function to handle the event topup.failed
        break;
      case 'topup.reversed':
        var topup = event.data.object;
        // Then define and call a function to handle the event topup.reversed
        break;
      case 'topup.succeeded':
        var topup = event.data.object;
        // Then define and call a function to handle the event topup.succeeded
        break;
      case 'transfer.created':
        var transfer = event.data.object;
        // Then define and call a function to handle the event transfer.created
        break;
      case 'transfer.failed':
        var transfer = event.data.object;
        // Then define and call a function to handle the event transfer.failed
        break;
      case 'transfer.paid':
        var transfer = event.data.object;
        // Then define and call a function to handle the event transfer.paid
        break;
      case 'transfer.reversed':
        var transfer = event.data.object;
        // Then define and call a function to handle the event transfer.reversed
        break;
      case 'transfer.updated':
        var transfer = event.data.object;
        // Then define and call a function to handle the event transfer.updated
        break;
      // ... handle other event types
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return response.status(HttpStatusCode.OK).json({ received: true });
  }
}