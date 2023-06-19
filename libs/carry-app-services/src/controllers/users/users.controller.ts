import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  Res,
  ParseIntPipe,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { IAuthJwtResults } from '../../interfaces/common.interface';
import { UsersService } from '../../services/users.service';
import { DeliveriesService } from '../../services/deliveries.service';
import { ControllerServiceResultsHandler } from '../../utils/helpers.utils';
import { UploadedFile } from 'express-fileupload';
import {
  DeliveryExistsParam,
  ExpressUploadedFile,
  JwtPayloadSlim,
  JwtPayloadAuthorized,
  UserExistsParam
} from '../../decorators/jwt-payload/jwt-payload.decorator';
import { YouAuthorized, YouAuthorizedSlim } from '../../guards/auth/auth.guard';
import { MessagesService } from '../../services/messages.service';
import { MessagingsService } from '../../services/messagings.service';
import { NotificationsService } from '../../services/notifications.service';
import { MODERN_APPS } from '../../enums/carry.enum';
import {
  UserExists
} from '../../guards/user/user.guard';
import {
  DeliveryEntity,
  UserEntity
} from '../../entities/carry.entity';
import {
  CreateSiteFeedbackDto,
  CreateUserDto,
  CreateUserNewListingsAlertDto,
  LoginUserDto,
  RedirectBodyDto,
  RegisterExpoTokenDto,
  ResetPasswordRequestDto,
  SendUserMessageDto,
  UpdateUserDto,
  UserPasswordUpdateDto
} from '../../dto/user.dto';
import {
  DeliveryExists,
  DeliveryHasNoCarrierAssigned,
  IsDeliveryCarrier
} from '../../guards/delivery/delivery.guard';
import { ValidationPipe } from '@carry/carry-app-services/pipes/class-validator.pipe';



@Controller('users')
export class UsersController {

  @Get('/healthcheck')
  get_healthcheck() {
    return UsersService.health_check();
  }

  /** Profile Context */

  // @Get('/phone/:phone')
  // get_user_by_phone(@Param('phone') phone: string) {
  //   return UsersService.get_user_by_phone(phone).then(ControllerServiceResultsHandler);
  // }

  // @Get('/random')
  // get_random_users(@Query('limit', ParseIntPipe) limit?: number) {
  //   return UsersService.get_random_users(limit).then(ControllerServiceResultsHandler);
  // }

  @Get('/check-session')
  check_session(@JwtPayloadSlim() auth: IAuthJwtResults) {
    return UsersService.check_session(auth).then(ControllerServiceResultsHandler);
  }

  @Get('/verify-email/:verification_code')
  verify_email(@Param('verification_code') verification_code: string) {
    return UsersService.verify_email(verification_code).then(ControllerServiceResultsHandler);
  }
  
  @Get('/send-sms-verification/:phone_number')
  @UseGuards(YouAuthorizedSlim)
  send_sms_verification(
    @Param('phone_number') phone_number: string,
    @JwtPayloadAuthorized() you: UserEntity
  ) {
    return UsersService.send_sms_verification(you, phone_number).then(ControllerServiceResultsHandler);
  }


  @Get('/verify-sms-code/request_id/:request_id/code/:code/phone/:phone')
  @UseGuards(YouAuthorizedSlim)
  verify_sms_code(
    @Param('request_id') request_id: string,
    @Param('code') code: string,
    @Param('phone') phone: string,
    @JwtPayloadAuthorized() you: UserEntity
  ) {
    return UsersService.verify_sms_code({ you, request_id, code, phone }).then(ControllerServiceResultsHandler);
  }


  @Get('/:you_id/account-info')
  @UseGuards(YouAuthorized)
  get_account_info(@JwtPayloadAuthorized() you: UserEntity) {
    return UsersService.get_account_info(you).then(ControllerServiceResultsHandler);
  }

  

  @Get('/:you_id/stripe-login')
  @UseGuards(YouAuthorized)
  stripe_login(@JwtPayloadAuthorized() you: UserEntity) {
    return UsersService.stripe_login(you).then(ControllerServiceResultsHandler);
  }

  @Get('/:you_id/api-key')
  @UseGuards(YouAuthorized)
  get_user_api_key(@JwtPayloadAuthorized() you: UserEntity) {
    return UsersService.get_user_api_key(you).then(ControllerServiceResultsHandler);
  }

  @Put('/:you_id/api-key/webhook-endpoint')
  @UseGuards(YouAuthorized)
  update_api_key_webhook_endpoint(
    @JwtPayloadAuthorized() you: UserEntity,
    @Body('webhook_endpoint') webhook_endpoint: string
  ) {
    return UsersService.update_api_key_webhook_endpoint(you, webhook_endpoint).then(ControllerServiceResultsHandler);
  }

  @Get('/:you_id/customer-cards-payment-methods')
  @UseGuards(YouAuthorized)
  get_user_customer_cards_payment_methods(@JwtPayloadAuthorized() you: UserEntity) {
    return UsersService.get_user_customer_cards_payment_methods(you.stripe_customer_account_id).then(ControllerServiceResultsHandler);
  }

  @Get('/:you_id/get-subscription')
  @UseGuards(YouAuthorized)
  get_subscription(@JwtPayloadAuthorized() you: UserEntity) {
    return UsersService.get_subscription(you).then(ControllerServiceResultsHandler);
  }

  @Get('/:you_id/is-subscription-active')
  @UseGuards(YouAuthorized)
  is_subscription_active(@JwtPayloadAuthorized() you: UserEntity) {
    return UsersService.is_subscription_active(you).then(ControllerServiceResultsHandler);
  }

  @Get('/:you_id/notifications/all')
  @UseGuards(YouAuthorized)
  get_user_notifications_all(@JwtPayloadAuthorized() you: UserEntity) {
    return NotificationsService.get_user_notifications_all(you.id).then(ControllerServiceResultsHandler);
  }

  @Get('/:you_id/notifications')
  @UseGuards(YouAuthorized)
  get_user_notifications(@JwtPayloadAuthorized() you: UserEntity) {
    return NotificationsService.get_user_notifications(you.id).then(ControllerServiceResultsHandler);
  }

  @Get('/:you_id/notifications/:notification_id')
  @UseGuards(YouAuthorized)
  get_user_notifications_paginate(
    @JwtPayloadAuthorized() you: UserEntity,
    @Param('notification_id', ParseIntPipe) notification_id: number
  ) {
    return NotificationsService.get_user_notifications(you.id, notification_id).then(ControllerServiceResultsHandler);
  }

  @Get('/:you_id/notifications-last-opened')
  @UseGuards(YouAuthorized)
  get_user_app_notification_last_opened(
    @JwtPayloadAuthorized() you: UserEntity
  ) {
    return NotificationsService.get_user_notification_last_opened(you.id).then(ControllerServiceResultsHandler);
  }
  @Get('/:you_id/notifications/app/:micro_app/app-notifications-last-opened')
  @UseGuards(YouAuthorized)
  get_user_app_notification_last_opened2(
    @JwtPayloadAuthorized() you: UserEntity
  ) {
    return NotificationsService.get_user_notification_last_opened(you.id).then(ControllerServiceResultsHandler);
  }

  @Get('/:you_id/notifications/all')
  @UseGuards(YouAuthorized)
  get_user_app_notifications_all(
    @JwtPayloadAuthorized() you: UserEntity
  ) {
    return NotificationsService.get_user_app_notifications_all(you.id, MODERN_APPS.COMMON).then(ControllerServiceResultsHandler);
  }
  @Get('/:you_id/notifications/app/:micro_app/all')
  @UseGuards(YouAuthorized)
  get_user_app_notifications_all2(
    @JwtPayloadAuthorized() you: UserEntity,
    @Param('micro_app') micro_app: string
  ) {
    return NotificationsService.get_user_app_notifications_all(you.id, micro_app).then(ControllerServiceResultsHandler);
  }

  @Get('/:you_id/notifications')
  @UseGuards(YouAuthorized)
  get_user_app_notifications(
    @JwtPayloadAuthorized() you: UserEntity
  ) {
    return NotificationsService.get_user_app_notifications(you.id, MODERN_APPS.COMMON).then(ControllerServiceResultsHandler);
  }
  @Get('/:you_id/notifications/app/:micro_app')
  @UseGuards(YouAuthorized)
  get_user_app_notifications2(
    @JwtPayloadAuthorized() you: UserEntity,
    @Param('micro_app') micro_app: string
  ) {
    return NotificationsService.get_user_app_notifications(you.id, micro_app).then(ControllerServiceResultsHandler);
  }
  

  @Get('/:you_id/notifications/:notification_id')
  @UseGuards(YouAuthorized)
  get_user_app_notifications_paginate(
    @JwtPayloadAuthorized() you: UserEntity,
    @Param('notification_id', ParseIntPipe) notification_id: number
  ) {
    return NotificationsService.get_user_app_notifications(you.id, MODERN_APPS.COMMON, notification_id).then(ControllerServiceResultsHandler);
  }
  @Get('/:you_id/notifications/app/:micro_app/:notification_id')
  @UseGuards(YouAuthorized)
  get_user_app_notifications_paginate2(
    @JwtPayloadAuthorized() you: UserEntity,
    @Param('micro_app') micro_app: string,
    @Param('notification_id', ParseIntPipe) notification_id: number
  ) {
    return NotificationsService.get_user_app_notifications(you.id, micro_app, notification_id).then(ControllerServiceResultsHandler);
  }

  @Get('/:you_id/messagings/all')
  @UseGuards(YouAuthorized)
  get_user_messagings_all(@JwtPayloadAuthorized() you: UserEntity) {
    return MessagingsService.get_user_messagings_all(you.id).then(ControllerServiceResultsHandler);
  }

  @Get('/:you_id/messagings')
  @UseGuards(YouAuthorized)
  get_user_messagings(@JwtPayloadAuthorized() you: UserEntity) {
    return MessagingsService.get_user_messagings(you.id).then(ControllerServiceResultsHandler);
  }

  @Get('/:you_id/messagings/:messagings_timestamp')
  @UseGuards(YouAuthorized)
  get_user_messagings_paginate(
    @JwtPayloadAuthorized() you: UserEntity,
    @Param('timestamp') timestamp: string
  ) {
    return MessagingsService.get_user_messagings(you.id, timestamp).then(ControllerServiceResultsHandler);
  }

  @Get('/:you_id/messages/:user_id')
  @UseGuards(YouAuthorized)
  get_user_messages(
    @JwtPayloadAuthorized() you: UserEntity,
    @Param('user_id', ParseIntPipe) user_id: number
  ) {
    return MessagesService.get_user_messages({ you_id: you.id, user_id }).then(ControllerServiceResultsHandler);
  }

  @Get('/:you_id/messages/:user_id/:min_id')
  @UseGuards(YouAuthorized)
  get_user_messages_paginate(
    @JwtPayloadAuthorized() you: UserEntity,
    @Param('user_id', ParseIntPipe) user_id: number,
    @Param('min_id', ParseIntPipe) min_id: number
  ) {
    return MessagesService.get_user_messages({ you_id: you.id, user_id, min_id }).then(ControllerServiceResultsHandler);
  }

  @Get('/:user_id/get-subscription-info')
  @UseGuards(UserExists)
  get_subscription_info(@UserExistsParam() user: UserEntity) {
    return UsersService.get_subscription_info(user).then(ControllerServiceResultsHandler);
  }

  @Get('/:id')
  get_user_by_id(@Param('id', ParseIntPipe) id: number) {
    return UsersService.get_user_by_id(id).then(ControllerServiceResultsHandler);
  }


  @Get('/:you_id/listings-alerts/all')
  @UseGuards(YouAuthorized)
  get_user_new_listings_alerts_all(@JwtPayloadAuthorized() you: UserEntity) {
    return UsersService.get_user_new_listings_alerts_all(you.id).then(ControllerServiceResultsHandler);
  }

  @Get('/:you_id/listings-alerts')
  @UseGuards(YouAuthorized)
  get_user_new_listings_alerts(@JwtPayloadAuthorized() you: UserEntity) {
    return UsersService.get_user_new_listings_alerts(you.id).then(ControllerServiceResultsHandler);
  }

  @Get('/:you_id/listings-alerts/:listing_alert_id')
  @UseGuards(YouAuthorized)
  get_user_new_listings_alerts_paginate(
    @JwtPayloadAuthorized() you: UserEntity,
    @Param('listing_alert_id', ParseIntPipe) listing_alert_id: number
  ) {
    return UsersService.get_user_new_listings_alerts(you.id, listing_alert_id).then(ControllerServiceResultsHandler);
  }


  @Get('/:you_id/search-deliveries')
  @UseGuards(YouAuthorized)
  search_user_deliveries_by_title(
    @JwtPayloadAuthorized() you: UserEntity,
    @Query('search_query') search_query: string
  ) {
    return UsersService.search_user_deliveries_by_title(you, search_query).then(ControllerServiceResultsHandler);
  }

  @Get('/:you_id/search-past-delivering')
  @UseGuards(YouAuthorized)
  search_user_past_delivering_by_title(
    @JwtPayloadAuthorized() you: UserEntity,
    @Query('search_query') search_query: string
  ) {
    return UsersService.search_user_past_delivering_by_title(you, search_query).then(ControllerServiceResultsHandler);
  }


  // POST
  @Post('/')
  sign_up(@Body(new ValidationPipe()) dto: CreateUserDto) {
    return UsersService.sign_up(dto).then(ControllerServiceResultsHandler);
  }

  @Post('/password-reset')
  submit_reset_password_request(@Body() dto: ResetPasswordRequestDto) {
    return UsersService.submit_reset_password_request(dto.email).then(ControllerServiceResultsHandler);
  }

  @Post('/:you_id/feedback')
  @UseGuards(YouAuthorized)
  send_feedback(
    @JwtPayloadAuthorized() you: UserEntity,
    @Body() dto: CreateSiteFeedbackDto
  ) {
    return UsersService.send_feedback({ you, ...dto }).then(ControllerServiceResultsHandler);
  }

  @Post('/:you_id/notifications/update-last-opened')
  @UseGuards(YouAuthorized)
  update_user_last_opened(@JwtPayloadAuthorized() you: UserEntity) {
    return NotificationsService.update_user_last_opened(you.id).then(ControllerServiceResultsHandler);
  }

  @Post('/:you_id/notifications/app/:micro_app/update-app-notifications-last-opened')
  @UseGuards(YouAuthorized)
  update_user_app_notification_last_opened(
    @JwtPayloadAuthorized() you: UserEntity,
    @Param('micro_app') micro_app: string,
  ) {
    return NotificationsService.update_user_notification_last_opened(you.id).then(ControllerServiceResultsHandler);
  }

  @Post('/:you_id/send-message/:user_id')
  @UseGuards(YouAuthorized)
  send_user_message(
    @JwtPayloadAuthorized() you: UserEntity,
    @Param('user_id', ParseIntPipe) user_id: number,
    @Body() dto: SendUserMessageDto
  ) {
    return MessagesService.send_user_message({ you_id: you.id, user_id, body: dto.body }).then(ControllerServiceResultsHandler);
  }

  @Post('/:you_id/customer-cards-payment-methods/:payment_method_id')
  @UseGuards(YouAuthorized)
  add_card_payment_method_to_user_customer(
    @JwtPayloadAuthorized() you: UserEntity,
    @Param('payment_method_id') payment_method_id: string
  ) {
    return UsersService.add_card_payment_method_to_user_customer(you.stripe_customer_account_id, payment_method_id).then(ControllerServiceResultsHandler);
  }

  @Post('/:you_id/create-subscription/:payment_method_id')
  @UseGuards(YouAuthorized)
  create_subscription(
    @JwtPayloadAuthorized() you: UserEntity,
    @Param('payment_method_id') payment_method_id: string
  ) {
    return UsersService.create_subscription(you, payment_method_id).then(ControllerServiceResultsHandler);
  }

  @Post('/:you_id/cancel-subscription')
  @UseGuards(YouAuthorized)
  cancel_subscription(
    @JwtPayloadAuthorized() you: UserEntity
  ) {
    return UsersService.cancel_subscription(you).then(ControllerServiceResultsHandler);
  }

  @Post('/:you_id/listings-alerts')
  @UseGuards(YouAuthorized)
  create_user_new_listings_alert(
    @JwtPayloadAuthorized() you: UserEntity,
    @Body() dto: CreateUserNewListingsAlertDto
  ) {
    return UsersService.create_user_new_listings_alert({ user_id: you.id, ...dto }).then(ControllerServiceResultsHandler);
  }

  // PUT
  @Put('/')
  sign_in(@Body(new ValidationPipe()) dto: LoginUserDto) {
    return UsersService.sign_in(dto.email_or_username, dto.password).then(ControllerServiceResultsHandler);
  }

  @Put('/password-reset/:code')
  submit_password_reset_code(@Param('code') code: string) {
    return UsersService.submit_password_reset_code(code).then(ControllerServiceResultsHandler);
  }

  @Put('/:you_id/info')
  @UseGuards(YouAuthorized)
  update_info(
    @JwtPayloadAuthorized() you: UserEntity,
    @Body() dto: UpdateUserDto
  ) {
    return UsersService.update_info({ you, ...dto }).then(ControllerServiceResultsHandler);
  }

  @Put('/:you_id/password')
  @UseGuards(YouAuthorized)
  update_password(
    @JwtPayloadAuthorized() you: UserEntity,
    @Body() dto: UserPasswordUpdateDto
  ) {
    return UsersService.update_password({ you, ...dto }).then(ControllerServiceResultsHandler);
  }

  @Put('/:you_id/icon')
  @UseGuards(YouAuthorized)
  update_icon(
    @JwtPayloadAuthorized() you: UserEntity,
    @ExpressUploadedFile('icon_file') icon_file: UploadedFile,
    @Body('should_delete') should_delete: string
  ) {
    return UsersService.update_icon({ you, should_delete: !!should_delete, icon_file }).then(ControllerServiceResultsHandler);
  }

  @Put('/:you_id/wallpaper')
  @UseGuards(YouAuthorized)
  update_wallpaper(
    @JwtPayloadAuthorized() you: UserEntity,
    @ExpressUploadedFile('wallpaper_file') wallpaper_file: UploadedFile,
    @Body('should_delete') should_delete: string
  ) {
    return UsersService.update_wallpaper({ you, should_delete: !!should_delete, wallpaper_file }).then(ControllerServiceResultsHandler);
  }

  @Put('/:you_id/register-expo-push-token')
  @UseGuards(YouAuthorized)
  register_expo_device_and_push_token(
    @JwtPayloadAuthorized() you: UserEntity,
    @Body() dto: RegisterExpoTokenDto
  ) {
    return UsersService.register_expo_device_and_push_token(you.id, dto).then(ControllerServiceResultsHandler);
  }

  @Put('/:you_id/create-stripe-account')
  @UseGuards(YouAuthorized)
  create_stripe_account(
    @JwtPayloadAuthorized() you: UserEntity,
    @Body() dto: RedirectBodyDto,
    @Query('redirectUrl') redirectUrl: string
  ) {
    return UsersService.create_stripe_account(you.id, dto?.redirectUrl || redirectUrl).then(ControllerServiceResultsHandler);
  }

  @Put('/:you_id/verify-stripe-account')
  @UseGuards(YouAuthorized)
  verify_stripe_account(
    @JwtPayloadAuthorized() you: UserEntity,
    @Body() dto: RedirectBodyDto,
    @Query('redirectUrl') redirectUrl: string
  ) {
    return UsersService.verify_stripe_account(you, true, dto?.redirectUrl || redirectUrl).then(ControllerServiceResultsHandler);
  }

  @Put('/:you_id/create-stripe-identity-verification-session')
  @UseGuards(YouAuthorized)
  create_stripe_identity_verification_session(
    @JwtPayloadAuthorized() you: UserEntity,
    @Body() dto: RedirectBodyDto,
    @Query('redirectUrl') redirectUrl: string
  ) {
    return UsersService.create_stripe_identity_verification_session(you, dto?.redirectUrl || redirectUrl).then(ControllerServiceResultsHandler);
  }

  @Put('/:user_uuid/verify-stripe-account-by-uuid')
  verify_stripe_account_by_uuid(
    @Param('user_uuid') user_uuid: string,
    @Body() dto: RedirectBodyDto,
    @Query('redirectUrl') redirectUrl: string
  ) {
    return UsersService.verify_stripe_account_by_uuid(user_uuid, true, dto?.redirectUrl || redirectUrl).then(ControllerServiceResultsHandler);
  }

  @Put('/:you_id/verify-customer-has-cards')
  @UseGuards(YouAuthorized)
  verify_customer_has_card_payment_method(
    @JwtPayloadAuthorized() you: UserEntity,
  ) {
    return UsersService.verify_customer_has_card_payment_method(you).then(ControllerServiceResultsHandler);
  }

  // DELETE
  @Delete('/:you_id/customer-cards-payment-methods/:payment_method_id')
  @UseGuards(YouAuthorized)
  remove_card_payment_method_to_user_customer(
    @JwtPayloadAuthorized() you: UserEntity,
    @Param('payment_method_id') payment_method_id: string
  ) {
    return UsersService.remove_card_payment_method_to_user_customer(you.stripe_customer_account_id, payment_method_id).then(ControllerServiceResultsHandler);
  }

  @Delete('/:you_id/remove-expo-push-token/:expo_token')
  @UseGuards(YouAuthorized)
  remove_expo_device_and_push_token(
    @JwtPayloadAuthorized() you: UserEntity,
    @Param('expo_token') expo_token: string
  ) {
    return UsersService.remove_expo_device_and_push_token(you.id, expo_token).then(ControllerServiceResultsHandler);
  }

  @Delete('/:you_id/listings-alerts/:listing_alert_id')
  @UseGuards(YouAuthorized)
  delete_user_new_listings_alert(
    @JwtPayloadAuthorized() you: UserEntity,
    @Param('listing_alert_id', ParseIntPipe) listing_alert_id: number
  ) {
    return UsersService.delete_user_new_listings_alert(you.id, listing_alert_id).then(ControllerServiceResultsHandler);
  }





  /** Deliveries Context */

  @Get('/:user_id/stats')
  get_user_stats(
    @Param('user_id', ParseIntPipe) user_id: number
  ) {
    return DeliveriesService.get_user_stats(user_id).then(ControllerServiceResultsHandler);
  }

  @Get('/:user_id/get-customer-ratings/stats')
  get_customer_ratings_stats(
    @Param('user_id', ParseIntPipe) user_id: number
  ) {
    return DeliveriesService.get_customer_ratings_stats(user_id).then(ControllerServiceResultsHandler);
  }
  
  @Get('/:user_id/get-customer-ratings/all')
  get_customer_ratings_all(
    @Param('user_id', ParseIntPipe) user_id: number
  ) {
    return DeliveriesService.get_customer_ratings_all(user_id).then(ControllerServiceResultsHandler);
  }

  @Get('/:user_id/get-customer-ratings')
  get_customer_ratings(
    @Param('user_id', ParseIntPipe) user_id: number
  ) {
    return DeliveriesService.get_customer_ratings(user_id).then(ControllerServiceResultsHandler);
  }

  @Get('/:user_id/get-customer-ratings/:rating_id')
  get_customer_ratings_paginate(
    @Param('user_id', ParseIntPipe) user_id: number,
    @Param('rating_id', ParseIntPipe) rating_id: number
  ) {
    return DeliveriesService.get_customer_ratings(user_id, rating_id).then(ControllerServiceResultsHandler);
  }

  @Get('/:user_id/get-carrier-ratings/stats')
  get_carrier_ratings_stats(
    @Param('user_id', ParseIntPipe) user_id: number
  ) {
    return DeliveriesService.get_carrier_ratings_stats(user_id).then(ControllerServiceResultsHandler);
  }

  @Get('/:user_id/get-carrier-ratings/all')
  get_carrier_ratings_all(
    @Param('user_id', ParseIntPipe) user_id: number
  ) {
    return DeliveriesService.get_carrier_ratings_all(user_id).then(ControllerServiceResultsHandler);
  }

  @Get('/:user_id/get-carrier-ratings')
  get_carrier_ratings(
    @Param('user_id', ParseIntPipe) user_id: number
  ) {
    return DeliveriesService.get_carrier_ratings(user_id).then(ControllerServiceResultsHandler);
  }

  @Get('/:user_id/get-carrier-ratings/:rating_id')
  get_carrier_ratings_paginate(
    @Param('user_id', ParseIntPipe) user_id: number,
    @Param('rating_id', ParseIntPipe) rating_id: number
  ) {
    return DeliveriesService.get_carrier_ratings(user_id, rating_id).then(ControllerServiceResultsHandler);
  }

  @Get('/:user_id/get-deliveries/all')
  get_user_deliveries_all(
    @Param('user_id', ParseIntPipe) user_id: number
  ) {
    return DeliveriesService.get_user_deliveries_all(user_id).then(ControllerServiceResultsHandler);
  }

  @Get('/:user_id/get-deliveries')
  get_user_deliveries(
    @Param('user_id', ParseIntPipe) user_id: number
  ) {
    return DeliveriesService.get_user_deliveries(user_id).then(ControllerServiceResultsHandler);
  }
  
  @Get('/:user_id/get-deliveries/:delivery_id')
  get_user_deliveries_paginate(
    @Param('user_id', ParseIntPipe) user_id: number,
    @Param('delivery_id', ParseIntPipe) delivery_id: number
  ) {
    return DeliveriesService.get_user_deliveries(user_id, delivery_id).then(ControllerServiceResultsHandler);
  }

  @Get('/:user_id/get-deliverings/all')
  get_user_deliverings_all(
    @Param('user_id', ParseIntPipe) user_id: number
  ) {
    return DeliveriesService.get_user_deliverings_all(user_id).then(ControllerServiceResultsHandler);
  }

  @Get('/:user_id/get-deliverings')
  get_user_deliverings(
    @Param('user_id', ParseIntPipe) user_id: number
  ) {
    return DeliveriesService.get_user_deliverings(user_id).then(ControllerServiceResultsHandler);
  }

  @Get('/:user_id/get-deliverings/:delivery_id')
  get_user_deliverings_paginate(
    @Param('user_id', ParseIntPipe) user_id: number,
    @Param('delivery_id', ParseIntPipe) delivery_id: number
  ) {
    return DeliveriesService.get_user_deliverings(user_id, delivery_id).then(ControllerServiceResultsHandler);
  }

  @Get('/:user_id/get-deliveries-slim/all')
  get_user_deliveries_all_slim(
    @Param('user_id', ParseIntPipe) user_id: number
  ) {
    return DeliveriesService.get_user_deliveries_all_slim(user_id).then(ControllerServiceResultsHandler);
  }

  @Get('/:user_id/get-deliveries-slim')
  get_user_deliveries_slim(
    @Param('user_id', ParseIntPipe) user_id: number
  ) {
    return DeliveriesService.get_user_deliveries_slim(user_id).then(ControllerServiceResultsHandler);
  }

  @Get('/:user_id/get-deliveries-slim/:delivery_id')
  get_user_deliveries_slim_paginate(
    @Param('user_id', ParseIntPipe) user_id: number,
    @Param('delivery_id', ParseIntPipe) delivery_id: number
  ) {
    return DeliveriesService.get_user_deliveries_slim(user_id, delivery_id).then(ControllerServiceResultsHandler);
  }

  @Get('/:user_id/get-deliverings-slim/all')
  get_user_deliverings_all_slim(
    @Param('user_id', ParseIntPipe) user_id: number
  ) {
    return DeliveriesService.get_user_deliverings_all_slim(user_id).then(ControllerServiceResultsHandler);
  }

  @Get('/:user_id/get-deliverings-slim')
  get_user_deliverings_slim(
    @Param('user_id', ParseIntPipe) user_id: number
  ) {
    return DeliveriesService.get_user_deliverings_slim(user_id).then(ControllerServiceResultsHandler);
  }

  @Get('/:user_id/get-deliverings-slim/:delivery_id')
  get_user_deliverings_slim_paginate(
    @Param('user_id', ParseIntPipe) user_id: number,
    @Param('delivery_id', ParseIntPipe) delivery_id: number
  ) {
    return DeliveriesService.get_user_deliverings_slim(user_id, delivery_id).then(ControllerServiceResultsHandler);
  }



  @Get('/:you_id/delivering')
  @UseGuards(YouAuthorized)
  get_user_delivering(
    @JwtPayloadAuthorized() you: UserEntity,
  ) {
    return DeliveriesService.get_user_delivering(you.id).then(ControllerServiceResultsHandler);
  }

  @Get('/:you_id/delivery-carrier-requests/all')
  @UseGuards(YouAuthorized)
  get_carrier_requests_all(
    @JwtPayloadAuthorized() you: UserEntity,
  ) {
    return DeliveriesService.get_carrier_requests_all(you.id).then(ControllerServiceResultsHandler);
  }

  @Get('/:you_id/delivery-carrier-requests')
  @UseGuards(YouAuthorized)
  get_carrier_requests(
    @JwtPayloadAuthorized() you: UserEntity,
  ) {
    return DeliveriesService.get_carrier_requests(you.id).then(ControllerServiceResultsHandler);
  }

  @Get('/:you_id/delivery-carrier-requests/:carrier_request_id')
  @UseGuards(YouAuthorized)
  get_carrier_requests_paginate(
    @JwtPayloadAuthorized() you: UserEntity,
    @Param('carrier_request_id', ParseIntPipe) carrier_request_id: number
  ) {
    return DeliveriesService.get_carrier_requests(you.id, carrier_request_id).then(ControllerServiceResultsHandler);
  }


  @Post('/:you_id/assign-delivery/:delivery_id')
  @UseGuards(YouAuthorized, DeliveryExists, DeliveryHasNoCarrierAssigned)
  assign_delivery(
    @JwtPayloadAuthorized() you: UserEntity,
    @DeliveryExistsParam() delivery: DeliveryEntity,
  ) {
    return DeliveriesService.assign_delivery({ you, delivery }).then(ControllerServiceResultsHandler);
  }

  @Post('/:you_id/unassign-delivery/:delivery_id')
  @UseGuards(YouAuthorized, DeliveryExists, IsDeliveryCarrier)
  unassign_delivery(
    @JwtPayloadAuthorized() you: UserEntity,
    @DeliveryExistsParam() delivery: DeliveryEntity,
  ) {
    return DeliveriesService.unassign_delivery({ you_id: you.id, delivery }).then(ControllerServiceResultsHandler);
  }

  @Post('/:you_id/mark-delivery-as-picked-up/:delivery_id')
  @UseGuards(YouAuthorized, DeliveryExists, IsDeliveryCarrier)
  mark_delivery_as_picked_up(
    @JwtPayloadAuthorized() you: UserEntity,
    @DeliveryExistsParam() delivery: DeliveryEntity,
  ) {
    return DeliveriesService.mark_delivery_as_picked_up({ you_id: you.id, delivery }).then(ControllerServiceResultsHandler);
  }

  @Post('/:you_id/mark-delivery-as-dropped-off/:delivery_id')
  @UseGuards(YouAuthorized, DeliveryExists, IsDeliveryCarrier)
  mark_delivery_as_dropped_off(
    @JwtPayloadAuthorized() you: UserEntity,
    @DeliveryExistsParam() delivery: DeliveryEntity,
  ) {
    return DeliveriesService.mark_delivery_as_dropped_off({ you_id: you.id, delivery }).then(ControllerServiceResultsHandler);
  }

  @Post('/:you_id/mark-delivery-as-returned/:delivery_id')
  @UseGuards(YouAuthorized, DeliveryExists, IsDeliveryCarrier)
  mark_delivery_as_returned(
    @JwtPayloadAuthorized() you: UserEntity,
    @DeliveryExistsParam() delivery: DeliveryEntity,
  ) {
    return DeliveriesService.mark_delivery_as_returned({ you_id: you.id, delivery }).then(ControllerServiceResultsHandler);
  }

  @Post('/:you_id/create-tracking-update/:delivery_id')
  @UseGuards(YouAuthorized, DeliveryExists, IsDeliveryCarrier)
  create_tracking_update(
    @JwtPayloadAuthorized() you: UserEntity,
    @DeliveryExistsParam() delivery: DeliveryEntity,
    @ExpressUploadedFile('tracking_update_image') tracking_update_image: UploadedFile,
    @Body('payload') data: any
  ) {
    return DeliveriesService.create_tracking_update({ you_id: you.id, delivery, data: JSON.parse(data), tracking_update_image }).then(ControllerServiceResultsHandler);
  }

  @Post('/:you_id/add-delivered-picture/:delivery_id')
  @UseGuards(YouAuthorized, DeliveryExists, IsDeliveryCarrier)
  add_delivered_picture(
    @JwtPayloadAuthorized() you: UserEntity,
    @DeliveryExistsParam() delivery: DeliveryEntity,
    @ExpressUploadedFile('image') delivered_image: UploadedFile
  ) {
    return DeliveriesService.add_delivered_picture({ you_id: you.id, delivery, delivered_image }).then(ControllerServiceResultsHandler);
  } 

  @Post('/:you_id/add-from-person-id-picture/:delivery_id')
  @UseGuards(YouAuthorized, DeliveryExists, IsDeliveryCarrier)
  add_from_person_id_picture(
    @JwtPayloadAuthorized() you: UserEntity,
    @DeliveryExistsParam() delivery: DeliveryEntity,
    @ExpressUploadedFile('image') image: UploadedFile
  ) {
    return DeliveriesService.add_from_person_id_picture({ you_id: you.id, delivery, image }).then(ControllerServiceResultsHandler);
  }

  @Post('/:you_id/add-from-person-sig-picture/:delivery_id')
  @UseGuards(YouAuthorized, DeliveryExists, IsDeliveryCarrier)
  add_from_person_sig_picture(
    @JwtPayloadAuthorized() you: UserEntity,
    @DeliveryExistsParam() delivery: DeliveryEntity,
    @ExpressUploadedFile('image') image: UploadedFile
  ) {
    return DeliveriesService.add_from_person_sig_picture({ you_id: you.id, delivery, image }).then(ControllerServiceResultsHandler);
  }

  @Post('/:you_id/add-to-person-id-picture/:delivery_id')
  @UseGuards(YouAuthorized, DeliveryExists, IsDeliveryCarrier)
  add_to_person_id_picture(
    @JwtPayloadAuthorized() you: UserEntity,
    @DeliveryExistsParam() delivery: DeliveryEntity,
    @ExpressUploadedFile('image') image: UploadedFile
  ) {
    return DeliveriesService.add_to_person_id_picture({ you_id: you.id, delivery, image }).then(ControllerServiceResultsHandler);
  } 

  
  @Post('/:you_id/add-to-person-sig-picture/:delivery_id')
  @UseGuards(YouAuthorized, DeliveryExists, IsDeliveryCarrier)
  add_to_person_sig_picture(
    @JwtPayloadAuthorized() you: UserEntity,
    @DeliveryExistsParam() delivery: DeliveryEntity,
    @ExpressUploadedFile('image') image: UploadedFile
  ) {
    return DeliveriesService.add_to_person_sig_picture({ you_id: you.id, delivery, image }).then(ControllerServiceResultsHandler);
  } 

}