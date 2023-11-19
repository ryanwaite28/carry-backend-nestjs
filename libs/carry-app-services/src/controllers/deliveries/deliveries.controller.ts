import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  ParseFloatPipe,
  ValidationPipe,
} from '@nestjs/common';
import { DeliveriesService } from '../../services/deliveries.service';
import { ControllerServiceResultsHandler } from '../../utils/helpers.utils';
import { UploadedFile } from 'express-fileupload';
import {
  ExpressUploadedFile,
  JwtPayloadAuthorized,
} from '../../decorators/jwt-payload/jwt-payload.decorator';
import { YouAuthorizedSlim } from '../../guards/auth/auth.guard';
import {
  YouAuthorizedSlimWeak,
} from '../../guards/user/user.guard';
import {
  DeliveryCarrierRequestEntity,
  DeliveryDisputeEntity,
  DeliveryDisputeSettlementOfferEntity,
  DeliveryEntity,
  UserEntity
} from '../../entities/carry.entity';
import {
  CarrierHasNoPendingDeliveryRequest,
  CarrierIsBelowCarryingLimit,
  CarrierIsBelowPendingRequestsLimit,
  DeliveryCarrierRequestExistsAndIsPending,
  DeliveryExists,
  DeliveryExistsSlim,
  DeliveryHasAssignedCarrier,
  DeliveryHasNoAcceptedRequests,
  DeliveryHasNoAssignedCarrier,
  DeliveryHasNoCarrierAssigned,
  DeliveryIsCompleted,
  DeliveryNotCompleted,
  IsDeliveryCarrier,
  IsDeliveryCarrierLocationRequestCompleted,
  IsDeliveryOwner,
  IsDeliveryOwnerOfDeliveryCarrierRequest,
  IsDeliveryOwnerOrCarrier,
  IsNotDeliveryCarrierLocationRequestCompleted,
  IsRequestingCarrier,
  NoCarrierRating,
  NoCustomerRating,
  UserDoesNotHaveAnUnpaidListing,
} from '../../guards/delivery/delivery.guard';
import {
  DeliveryDisputeExists,
  DeliveryDisputeInfoExists,
  DeliveryDisputeNotExistsSlim,
  DeliveryDisputeExistsSlim,
  DeliveryDisputeStatusOpen,
  DeliveryDisputeOpenSettlementNotExists,
  DeliveryDisputeOpenSettlementExists,
  IsSettlementOfferCreator,
  SettlementStatusIsPending,
  IsNotSettlementOfferCreator,
} from '../../guards/delivery/delivery-dispute.guard';
import {
  CreateCarrierupdateLocationDto,
  CreateDisputeSettlementOfferDto,
  FindAvailableDeliveryDto,
  SearchDeliveriesDto,
  SendDeliveryMessageDto
} from '@carry/carry-app-services/dto/deliveries.dto';
import { ResponseLocals } from '@carry/carry-app-services/decorators/common/common.decorator';


@Controller('deliveries')
export class DeliveriesController {

    
  /** GET */


  // dispute
  @Get('/:delivery_id/dispute')
  @UseGuards(DeliveryDisputeExists)
  get_delivery_dispute_by_delivery_id(
    @ResponseLocals('delivery_dispute_model') dispute: DeliveryDisputeEntity
  ) {
    return Promise.resolve(dispute).then((data) => ({ data }));
  }

  @Get('/:delivery_id/dispute-info')
  @UseGuards(DeliveryDisputeInfoExists)
  get_delivery_dispute_info_by_delivery_id(
    @ResponseLocals('delivery_dispute_model') dispute: DeliveryDisputeEntity
  ) {
    return Promise.resolve(dispute).then((data) => ({ data }));
  }

  @Get('/:delivery_id/dispute-messages')
  @UseGuards(YouAuthorizedSlim, DeliveryDisputeExists)
  get_user_dispute_messages_by_user_id_and_dispute_id(
    @JwtPayloadAuthorized() you: UserEntity,
    @ResponseLocals('delivery_dispute_model') dispute: DeliveryDisputeEntity
  ) {
    return DeliveriesService.get_user_dispute_messages_by_user_id_and_dispute_id(dispute.id, you.id).then(ControllerServiceResultsHandler);
  }


  // search
  @Get('/find-available-from/city/:city/state/:state')
  @UseGuards(YouAuthorizedSlim)
  find_available_delivery_by_from_city_and_state(
    @Param('city') city: string,
    @Param('state') state: string
  ) {
    return DeliveriesService.find_available_delivery_by_from_city_and_state(city, state).then(ControllerServiceResultsHandler);
  }

  @Get('/find-available-to/city/:city/state/:state')
  @UseGuards(YouAuthorizedSlim)
  find_available_delivery_by_to_city_and_state(
    @Param('city') city: string,
    @Param('state') state: string
  ) {
    return DeliveriesService.find_available_delivery_by_to_city_and_state(city, state).then(ControllerServiceResultsHandler);
  }


  @Get('/:delivery_id')
  @UseGuards(DeliveryExists)
  get_delivery_by_id(@ResponseLocals('delivery_model') delivery: DeliveryEntity) {
    return Promise.resolve(delivery).then((data) => ({ data }));;
  }




  /*
    Delivery Carrier Requests
  */
  @Get('/:delivery_id/carrier-requests/all')
  @UseGuards(DeliveryExistsSlim)
  get_carrier_delivery_requests_all(@Param('delivery_id', ParseIntPipe) delivery_id: number) {
    return DeliveriesService.get_carrier_delivery_requests_all(delivery_id).then(ControllerServiceResultsHandler);
  }

  @Get('/:delivery_id/carrier-requests')
  @UseGuards(DeliveryExistsSlim)
  get_carrier_delivery_requests(@Param('delivery_id', ParseIntPipe) delivery_id: number) {
    return DeliveriesService.get_carrier_delivery_requests(delivery_id).then(ControllerServiceResultsHandler);
  }

  @Get('/:delivery_id/carrier-requests/:carrier_request_id')
  @UseGuards(DeliveryExistsSlim)
  get_carrier_delivery_requests_paginate(
    @Param('delivery_id', ParseIntPipe) delivery_id: number,
    @Param('carrier_request_id', ParseIntPipe) carrier_request_id: number
  ) {
    return DeliveriesService.get_carrier_delivery_requests(delivery_id, carrier_request_id).then(ControllerServiceResultsHandler);
  }


  @Get('/:delivery_id/carrier-requests/check-user/:user_id')
  @UseGuards(DeliveryExistsSlim)
  check_carrier_delivery_request(
    @Param('delivery_id', ParseIntPipe) delivery_id: number,
    @Param('user_id', ParseIntPipe) user_id: number
  ) {
    return DeliveriesService.check_carrier_delivery_request(delivery_id, user_id).then(ControllerServiceResultsHandler);
  }

  @Get('/:delivery_id/carrier-requests-pending/check-user/:user_id')
  @UseGuards(DeliveryExistsSlim)
  check_carrier_delivery_request_pending(
    @Param('delivery_id', ParseIntPipe) delivery_id: number,
    @Param('user_id', ParseIntPipe) user_id: number
  ) {
    return DeliveriesService.check_carrier_delivery_request_pending(delivery_id, user_id).then(ControllerServiceResultsHandler);
  }


  @Post('/:delivery_id/carrier-requests/:user_id')
  @UseGuards(YouAuthorizedSlim, DeliveryExists, DeliveryHasNoAssignedCarrier, DeliveryHasNoAcceptedRequests, CarrierHasNoPendingDeliveryRequest, CarrierIsBelowCarryingLimit, CarrierIsBelowPendingRequestsLimit)
  create_carrier_delivery_request(
    @ResponseLocals('delivery_model') delivery: DeliveryEntity,
    @JwtPayloadAuthorized() you: UserEntity,
  ) {
    return DeliveriesService.create_carrier_delivery_request(delivery.id, you.id).then(ControllerServiceResultsHandler);
  }


  @Put('/:delivery_id/carrier-requests/:carrier_request_id/cancel')
  @UseGuards(YouAuthorizedSlim, DeliveryExists, DeliveryHasNoAssignedCarrier, DeliveryCarrierRequestExistsAndIsPending, IsRequestingCarrier)
  cancel_carrier_delivery_request(
    @ResponseLocals('delivery_carrier_request') delivery_carrier_request: DeliveryCarrierRequestEntity,
    @JwtPayloadAuthorized() you: UserEntity,
  ) {
    return DeliveriesService.cancel_carrier_delivery_request(delivery_carrier_request, you.id).then(ControllerServiceResultsHandler);
  }

  @Put('/:delivery_id/carrier-requests/:carrier_request_id/accept')
  @UseGuards(YouAuthorizedSlim, DeliveryExists, DeliveryHasNoAssignedCarrier, DeliveryCarrierRequestExistsAndIsPending, IsDeliveryOwnerOfDeliveryCarrierRequest)
  accept_carrier_delivery_request(
    @ResponseLocals('delivery_carrier_request') delivery_carrier_request: DeliveryCarrierRequestEntity,
    @JwtPayloadAuthorized() you: UserEntity,
  ) {
    return DeliveriesService.accept_carrier_delivery_request(delivery_carrier_request, you.id).then(ControllerServiceResultsHandler);
  }

  @Put('/:delivery_id/carrier-requests/:carrier_request_id/decline')
  @UseGuards(YouAuthorizedSlim, DeliveryExists, DeliveryHasNoAssignedCarrier, DeliveryCarrierRequestExistsAndIsPending, IsDeliveryOwnerOfDeliveryCarrierRequest)
  decline_carrier_delivery_request(
    @ResponseLocals('delivery_carrier_request') delivery_carrier_request: DeliveryCarrierRequestEntity,
    @JwtPayloadAuthorized() you: UserEntity
  ) {
    return DeliveriesService.decline_carrier_delivery_request(delivery_carrier_request, you.id).then(ControllerServiceResultsHandler);
  }





  /** POST */

  @Post('/')
  @UseGuards(YouAuthorizedSlim, UserDoesNotHaveAnUnpaidListing)
  create_delivery(
    @JwtPayloadAuthorized() you: UserEntity,
    @ExpressUploadedFile('delivery_image') delivery_image: UploadedFile,
    @Body('payload') payload: string,
    @Body('insured') insured: string
  ) {
    const isInsured: boolean = !!insured && insured === 'true';
    return DeliveriesService.create_delivery_and_charge({ you, delivery_image, data: JSON.parse(payload), insured: isInsured }).then(ControllerServiceResultsHandler);
  }

  @Post('/find-available')
  @UseGuards(YouAuthorizedSlim)
  find_available_delivery(
    @JwtPayloadAuthorized() you: UserEntity,
    @Body() dto: FindAvailableDeliveryDto
  ) {
    return DeliveriesService.find_available_delivery({ you_id: you.id, ...dto }).then(ControllerServiceResultsHandler);
  }

  @Post('/search')
  @UseGuards(YouAuthorizedSlimWeak)
  search_deliveries(
    @Body() dto: SearchDeliveriesDto,
    @JwtPayloadAuthorized() you?: UserEntity,
  ) {
    return DeliveriesService.search_deliveries({ you_id: you?.id, ...dto }).then(ControllerServiceResultsHandler);
  }

  @Post('/browse-recent')
  @UseGuards(YouAuthorizedSlimWeak)
  browse_recent_deliveries(
    @JwtPayloadAuthorized() you?: UserEntity,
  ) {
    return DeliveriesService.browse_recent_deliveries({ you_id: you?.id }).then(ControllerServiceResultsHandler);
  }

  @Post('/browse-recent/:delivery_id')
  @UseGuards(YouAuthorizedSlimWeak)
  browse_recent_deliveries_paginate(
    @Param('delivery_id', ParseIntPipe) delivery_id: number,
    @JwtPayloadAuthorized() you?: UserEntity,
  ) {
    return DeliveriesService.browse_recent_deliveries({ you_id: you?.id, delivery_id }).then(ControllerServiceResultsHandler);
  }

  @Post('/browse-featured')
  @UseGuards(YouAuthorizedSlimWeak)
  browse_featured_deliveries(
    @JwtPayloadAuthorized() you: UserEntity,
  ) {
    return DeliveriesService.browse_featured_deliveries({ you_id: you?.id }).then(ControllerServiceResultsHandler);
  }

  @Post('/browse-featured/:delivery_id')
  @UseGuards(YouAuthorizedSlimWeak)
  browse_featured_deliveries_paginate(
    @Param('delivery_id', ParseIntPipe) delivery_id: number,
    @JwtPayloadAuthorized() you?: UserEntity,
  ) {
    return DeliveriesService.browse_featured_deliveries({ you_id: you?.id, delivery_id }).then(ControllerServiceResultsHandler);
  }

  @Post('/browse-map/swlat/:swlat/swlng/:swlng/nelat/:nelat/nelng/:nelng')
  @UseGuards(YouAuthorizedSlimWeak)
  browse_map_deliveries(
    @Param('swlat', ParseFloatPipe) swLat: number,
    @Param('swlng', ParseFloatPipe) swLng: number,
    @Param('nelat', ParseFloatPipe) neLat: number,
    @Param('nelng', ParseFloatPipe) neLng: number,
    @JwtPayloadAuthorized() you?: UserEntity,
  ) {
    return DeliveriesService.browse_map_deliveries({ you_id: you.id, swLat, swLng, neLat, neLng }).then(ControllerServiceResultsHandler);
  }


  @Post('/:delivery_id/message')
  @UseGuards(YouAuthorizedSlim, DeliveryExists)
  send_delivery_message(
    @JwtPayloadAuthorized() you: UserEntity,
    @ResponseLocals('delivery_model') delivery: DeliveryEntity,
    @Body() dto: SendDeliveryMessageDto
  ) {
    return DeliveriesService.send_delivery_message({ you_id: you.id, delivery, body: dto.body }).then(ControllerServiceResultsHandler);
  }

  @Post('/:delivery_id/remove-carrier')
  @UseGuards(YouAuthorizedSlim, DeliveryExists, IsDeliveryOwner, DeliveryHasAssignedCarrier)
  remove_carrier(
    @JwtPayloadAuthorized() you: UserEntity,
    @ResponseLocals('delivery_model') delivery: DeliveryEntity,
  ) {
    return DeliveriesService.remove_carrier({ delivery, you }).then(ControllerServiceResultsHandler);
  }

  @Post('/:delivery_id/pay-carrier')
  @UseGuards(YouAuthorizedSlim, DeliveryExists, IsDeliveryOwner)
  pay_carrier_via_transfer(
    @JwtPayloadAuthorized() you: UserEntity,
    @ResponseLocals('delivery_model') delivery: DeliveryEntity,
  ) {
    return DeliveriesService.pay_carrier_via_transfer({ you, delivery }).then(ControllerServiceResultsHandler);
  }

  @Post('/:delivery_id/carrier-self-pay')
  @UseGuards(YouAuthorizedSlim, DeliveryExists, IsDeliveryCarrier)
  carrier_self_pay(
    @JwtPayloadAuthorized() you: UserEntity,
    @ResponseLocals('delivery_model') delivery: DeliveryEntity,
  ) {
    return DeliveriesService.carrier_self_pay({ you, delivery }).then(ControllerServiceResultsHandler);
  }

  @Post('/:delivery_id/payment-success')
  @UseGuards(YouAuthorizedSlim, DeliveryExists, IsDeliveryOwner)
  payment_success(
    @JwtPayloadAuthorized() you: UserEntity,
    @ResponseLocals('delivery_model') delivery: DeliveryEntity,
    @Query('session_id') session_id: string
  ) {
    return DeliveriesService.payment_success({ you_id: you.id, delivery, session_id }).then(ControllerServiceResultsHandler);
  }

  @Post('/:delivery_id/payment-cancel')
  @UseGuards(YouAuthorizedSlim, DeliveryExists, IsDeliveryOwner)
  payment_cancel(
    @JwtPayloadAuthorized() you: UserEntity,
    @ResponseLocals('delivery_model') delivery: DeliveryEntity,
    @Query('session_id') session_id: string
  ) {
    return DeliveriesService.payment_cancel({ you_id: you.id, delivery, session_id }).then(ControllerServiceResultsHandler);
  }


  @Post('/:delivery_id/ratings/customer')
  @UseGuards(YouAuthorizedSlim, DeliveryExists, DeliveryIsCompleted, IsDeliveryCarrier, NoCustomerRating)
  leave_delivery_owner_review(
    @JwtPayloadAuthorized() you: UserEntity,
    @ResponseLocals('delivery_model') delivery: DeliveryEntity,
    @ExpressUploadedFile('image') image: UploadedFile,
    @Body('payload') payload: string
  ) {
    return DeliveriesService.leave_delivery_owner_review({ you, delivery, image, data: JSON.parse(payload) }).then(ControllerServiceResultsHandler);
  }

  @Post('/:delivery_id/ratings/carrier')
  @UseGuards(YouAuthorizedSlim, DeliveryExists, DeliveryIsCompleted, IsDeliveryOwner, NoCarrierRating)
  leave_delivery_carrier_review(
    @JwtPayloadAuthorized() you: UserEntity,
    @ResponseLocals('delivery_model') delivery: DeliveryEntity,
    @ExpressUploadedFile('image') image: UploadedFile,
    @Body('payload') payload: string
  ) {
    return DeliveriesService.leave_delivery_carrier_review({ you, delivery, image, data: JSON.parse(payload) }).then(ControllerServiceResultsHandler);
  }


  @Post('/:delivery_id/request-carrier-location')
  @UseGuards(YouAuthorizedSlim, DeliveryExists, IsDeliveryOwner, DeliveryNotCompleted, IsNotDeliveryCarrierLocationRequestCompleted)
  request_carrier_location(
    @JwtPayloadAuthorized() you: UserEntity,
    @ResponseLocals('delivery_model') delivery: DeliveryEntity,
  ) {
    return DeliveriesService.request_carrier_location({ you, delivery }).then(ControllerServiceResultsHandler);
  }

  @Post('/:delivery_id/cancel-request-carrier-location')
  @UseGuards(YouAuthorizedSlim, DeliveryExists, IsDeliveryOwner, DeliveryNotCompleted)
  cancel_request_carrier_location(
    @JwtPayloadAuthorized() you: UserEntity,
    @ResponseLocals('delivery_model') delivery: DeliveryEntity,
  ) {
    return DeliveriesService.cancel_request_carrier_location({ you, delivery }).then(ControllerServiceResultsHandler);
  }

  @Post('/:delivery_id/accept-request-carrier-location')
  @UseGuards(YouAuthorizedSlim, DeliveryExists, IsDeliveryCarrier, DeliveryNotCompleted, IsNotDeliveryCarrierLocationRequestCompleted)
  accept_request_carrier_location(
    @JwtPayloadAuthorized() you: UserEntity,
    @ResponseLocals('delivery_model') delivery: DeliveryEntity,
  ) {
    return DeliveriesService.accept_request_carrier_location({ you, delivery }).then(ControllerServiceResultsHandler);
  }

  @Post('/:delivery_id/decline-request-carrier-location')
  @UseGuards(YouAuthorizedSlim, DeliveryExists, IsDeliveryCarrier, DeliveryNotCompleted, IsNotDeliveryCarrierLocationRequestCompleted)
  decline_request_carrier_location(
    @JwtPayloadAuthorized() you: UserEntity,
    @ResponseLocals('delivery_model') delivery: DeliveryEntity,
  ) {
    return DeliveriesService.decline_request_carrier_location({ you, delivery }).then(ControllerServiceResultsHandler);
  }

  @Post('/:delivery_id/carrier-share-location')
  @UseGuards(YouAuthorizedSlim, DeliveryExists, IsDeliveryCarrier, DeliveryNotCompleted, IsNotDeliveryCarrierLocationRequestCompleted)
  carrier_share_location(
    @JwtPayloadAuthorized() you: UserEntity,
    @ResponseLocals('delivery_model') delivery: DeliveryEntity,
  ) {
    return DeliveriesService.carrier_share_location({ you, delivery }).then(ControllerServiceResultsHandler);
  }

  @Post('/:delivery_id/carrier-unshare-location')
  @UseGuards(YouAuthorizedSlim, DeliveryExists, IsDeliveryCarrier, DeliveryNotCompleted,IsDeliveryCarrierLocationRequestCompleted)
  carrier_unshare_location(
    @JwtPayloadAuthorized() you: UserEntity,
    @ResponseLocals('delivery_model') delivery: DeliveryEntity,
  ) {
    return DeliveriesService.carrier_unshare_location({ you, delivery }).then(ControllerServiceResultsHandler);
  }

  //  update location
  @Post('/:delivery_id/carrier-update-location')
  @UseGuards(YouAuthorizedSlim, DeliveryExists, IsDeliveryCarrier, DeliveryNotCompleted)
  carrier_update_location(
    @JwtPayloadAuthorized() you: UserEntity,
    @ResponseLocals('delivery_model') delivery: DeliveryEntity,
    @Body(new ValidationPipe()) dto: CreateCarrierupdateLocationDto
  ) {
    return DeliveriesService.carrier_update_location({ you, delivery, ...dto }).then(ControllerServiceResultsHandler);
  }


  @Post('/:delivery_id/create-delivery-dispute')
  @UseGuards(YouAuthorizedSlim, DeliveryExists, IsDeliveryOwnerOrCarrier, DeliveryNotCompleted, DeliveryDisputeNotExistsSlim)
  create_delivery_dispute(
    @JwtPayloadAuthorized() you: UserEntity,
    @ResponseLocals('delivery_model') delivery: DeliveryEntity,
    @ExpressUploadedFile('image') image: UploadedFile,
    @Body('payload') payload: string
  ) {
    return DeliveriesService.create_delivery_dispute({ you, delivery, image, data: JSON.parse(payload) }).then(ControllerServiceResultsHandler);
  }

  @Post('/:delivery_id/create-delivery-dispute-log')
  @UseGuards(YouAuthorizedSlim, DeliveryExists, IsDeliveryOwnerOrCarrier, DeliveryNotCompleted, DeliveryDisputeExistsSlim, DeliveryDisputeStatusOpen)
  create_delivery_dispute_log(
    @JwtPayloadAuthorized() you: UserEntity,
    @ResponseLocals('delivery_model') delivery: DeliveryEntity,
    @ResponseLocals('delivery_dispute_model') delivery_dispute: DeliveryDisputeEntity,
    @ExpressUploadedFile('image') image: UploadedFile,
    @Body('payload') payload: string
  ) {
    return DeliveriesService.create_delivery_dispute_log({ you, delivery, delivery_dispute, image, data: JSON.parse(payload) }).then(ControllerServiceResultsHandler);
  }

  @Post('/:delivery_id/create-delivery-dispute-customer-support-message')
  @UseGuards(YouAuthorizedSlim, DeliveryExists, IsDeliveryOwnerOrCarrier, DeliveryNotCompleted, DeliveryDisputeExistsSlim, DeliveryDisputeStatusOpen)
  create_delivery_dispute_customer_service_message(
    @JwtPayloadAuthorized() you: UserEntity,
    @ResponseLocals('delivery_model') delivery: DeliveryEntity,
    @ResponseLocals('delivery_dispute_model') delivery_dispute: DeliveryDisputeEntity,
    @ExpressUploadedFile('image') image: UploadedFile,
    @Body('payload') payload: string
  ) {
    return DeliveriesService.create_delivery_dispute_customer_service_message({ you, delivery, delivery_dispute, image, data: JSON.parse(payload) }).then(ControllerServiceResultsHandler);
  }

  @Post('/:delivery_id/make-delivery-dispute-settlement-offer')
  @UseGuards(YouAuthorizedSlim, DeliveryExists, IsDeliveryOwnerOrCarrier, DeliveryNotCompleted, DeliveryDisputeExistsSlim, DeliveryDisputeStatusOpen, DeliveryDisputeOpenSettlementNotExists)
  make_delivery_dispute_settlement_offer(
    @JwtPayloadAuthorized() you: UserEntity,
    @ResponseLocals('delivery_model') delivery: DeliveryEntity,
    @ResponseLocals('delivery_dispute_model') delivery_dispute: DeliveryDisputeEntity,
    @Body() dto: CreateDisputeSettlementOfferDto
  ) {
    return DeliveriesService.make_delivery_dispute_settlement_offer({ you, delivery, delivery_dispute, data: dto }).then(ControllerServiceResultsHandler);
  }

  @Post('/:delivery_id/cancel-delivery-dispute-settlement-offer')
  @UseGuards(YouAuthorizedSlim, DeliveryExists, IsDeliveryOwnerOrCarrier, DeliveryNotCompleted, DeliveryDisputeExistsSlim, DeliveryDisputeStatusOpen, DeliveryDisputeOpenSettlementExists, IsSettlementOfferCreator, SettlementStatusIsPending)
  cancel_delivery_dispute_settlement_offer(
    @JwtPayloadAuthorized() you: UserEntity,
    @ResponseLocals('delivery_model') delivery: DeliveryEntity,
    @ResponseLocals('delivery_dispute_model') delivery_dispute: DeliveryDisputeEntity,
    @ResponseLocals('settlement_offer_model') settlement_offer: DeliveryDisputeSettlementOfferEntity,
  ) {
    return DeliveriesService.cancel_delivery_dispute_settlement_offer({ you, delivery, delivery_dispute, settlement_offer }).then(ControllerServiceResultsHandler);
  }

  @Post('/:delivery_id/accept-delivery-dispute-settlement-offer')
  @UseGuards(YouAuthorizedSlim, DeliveryExists, IsDeliveryOwnerOrCarrier, DeliveryNotCompleted, DeliveryDisputeExistsSlim, DeliveryDisputeStatusOpen, DeliveryDisputeOpenSettlementExists, IsNotSettlementOfferCreator, SettlementStatusIsPending)
  accept_delivery_dispute_settlement_offer(
    @JwtPayloadAuthorized() you: UserEntity,
    @ResponseLocals('delivery_model') delivery: DeliveryEntity,
    @ResponseLocals('delivery_dispute_model') delivery_dispute: DeliveryDisputeEntity,
    @ResponseLocals('settlement_offer_model') settlement_offer: DeliveryDisputeSettlementOfferEntity,
    @Body('payment_method_id') payment_method_id: string
  ) {
    return DeliveriesService.accept_delivery_dispute_settlement_offer({ you, delivery, delivery_dispute, settlement_offer, payment_method_id }).then(ControllerServiceResultsHandler);
  }

  @Post('/:delivery_id/decline-delivery-dispute-settlement-offer')
  @UseGuards(YouAuthorizedSlim, DeliveryExists, IsDeliveryOwnerOrCarrier, DeliveryNotCompleted, DeliveryDisputeExistsSlim, DeliveryDisputeStatusOpen, DeliveryDisputeOpenSettlementExists, IsNotSettlementOfferCreator, SettlementStatusIsPending)
  decline_delivery_dispute_settlement_offer(
    @JwtPayloadAuthorized() you: UserEntity,
    @ResponseLocals('delivery_model') delivery: DeliveryEntity,
    @ResponseLocals('delivery_dispute_model') delivery_dispute: DeliveryDisputeEntity,
    @ResponseLocals('settlement_offer_model') settlement_offer: DeliveryDisputeSettlementOfferEntity,
  ) {
    return DeliveriesService.decline_delivery_dispute_settlement_offer({ you, delivery, delivery_dispute, settlement_offer }).then(ControllerServiceResultsHandler);
  }



  /** PUT */

  @Put('/:delivery_id')
  @UseGuards(YouAuthorizedSlim, DeliveryExists, IsDeliveryOwner, DeliveryNotCompleted, DeliveryHasNoCarrierAssigned)
  update_delivery(
    @ResponseLocals('delivery_model') delivery: DeliveryEntity,
    @JwtPayloadAuthorized() you: UserEntity,
    @ExpressUploadedFile('delivery_image') delivery_image: UploadedFile,
    @Body('payload') payload: string
  ) {
    return DeliveriesService.update_delivery({ you, delivery, delivery_image, data: JSON.parse(payload) }).then(ControllerServiceResultsHandler);
  }




  /** DELETE */

  @Delete('/:delivery_id')
  @UseGuards(YouAuthorizedSlim, DeliveryExists, IsDeliveryOwner)
  delete_delivery(
    @JwtPayloadAuthorized() you: UserEntity,
    @ResponseLocals('delivery_model') delivery: DeliveryEntity,
  ) {
    return DeliveriesService.delete_delivery_and_refund(delivery).then(ControllerServiceResultsHandler);
  }


}
