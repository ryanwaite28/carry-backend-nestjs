import { Request, Response } from 'express';
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException
} from '@nestjs/common';
import {
  DeliveryDisputeEntity,
  DeliveryDisputeSettlementOfferEntity,
  UserEntity
} from '../../entities/carry.entity';
import {
  get_delivery_dispute_by_delivery_id,
  get_delivery_dispute_info_by_delivery_id,
  get_open_delivery_dispute_settlement_offer_by_dispute_id
} from '../../repos/deliveries.repo';
import {
  DeliveryDisputeSettlementOfferStatus,
  DeliveryDisputeStatus
} from '../../enums/carry.enum';



@Injectable()
export class DeliveryDisputeExists implements CanActivate {
  constructor() {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    
    const delivery_id = parseInt(request.params.delivery_id, 10);
    const delivery_dispute_model: DeliveryDisputeEntity | null = await get_delivery_dispute_by_delivery_id(delivery_id);
    if (!delivery_dispute_model) {
      throw new NotFoundException({
        message: `Delivery Dispute not found`
      });
    }
    response.locals.delivery_dispute_model = delivery_dispute_model;
    
    return true;
  }
}


@Injectable()
export class DeliveryDisputeInfoExists implements CanActivate {
  constructor() {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    
    const delivery_id = parseInt(request.params.delivery_id, 10);
    const delivery_dispute_model: DeliveryDisputeEntity | null = await get_delivery_dispute_info_by_delivery_id(delivery_id);
    if (!delivery_dispute_model) {
      throw new NotFoundException({
        message: `Delivery Dispute not found`
      });
    }
    response.locals.delivery_dispute_model = delivery_dispute_model;
    
    return true;
  }
}


@Injectable()
export class DeliveryDisputeNotExists implements CanActivate {
  constructor() {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    
    const delivery_id = parseInt(request.params.delivery_id, 10);
  const delivery_dispute_model: DeliveryDisputeEntity | null = await get_delivery_dispute_info_by_delivery_id(delivery_id);
  if (!!delivery_dispute_model) {
    throw new ForbiddenException({
      message: `Delivery Dispute already created`,
      // data: delivery_dispute_model,
    });
  }
    
    return true;
  }
}


@Injectable()
export class DeliveryDisputeExistsSlim implements CanActivate {
  constructor() {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    
    const delivery_id = parseInt(request.params.delivery_id, 10);
  const delivery_dispute_model: DeliveryDisputeEntity | null = await get_delivery_dispute_by_delivery_id(delivery_id);
  if (!delivery_dispute_model) {
    throw new NotFoundException({
      message: `Delivery Dispute not found`
    });
  }
  response.locals.delivery_dispute_model = delivery_dispute_model;
    
    return true;
  }
}


@Injectable()
export class DeliveryDisputeNotExistsSlim implements CanActivate {
  constructor() {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    
    const delivery_id = parseInt(request.params.delivery_id, 10);
  const delivery_dispute_model: DeliveryDisputeEntity | null = await get_delivery_dispute_by_delivery_id(delivery_id);
  if (!!delivery_dispute_model) {
    throw new ForbiddenException({
      message: `Delivery Dispute already created`,
      // data: delivery_dispute_model,
    });
  }
    
    return true;
  }
}


@Injectable()
export class DeliveryDisputeStatusOpen implements CanActivate {
  constructor() {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    
    const delivery_dispute_model: DeliveryDisputeEntity = response.locals.delivery_dispute_model;
  if (delivery_dispute_model.status !== DeliveryDisputeStatus.OPEN) {
    throw new ForbiddenException({
      message: `Delivery Dispute not in open status`
    });
  }
    
    return true;
  }
}


@Injectable()
export class DeliveryDisputeOpenSettlementNotExists implements CanActivate {
  constructor() {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    
    const delivery_dispute_model: DeliveryDisputeEntity = response.locals.delivery_dispute_model;
  const settlement_offer_model: DeliveryDisputeSettlementOfferEntity | null = await get_open_delivery_dispute_settlement_offer_by_dispute_id(delivery_dispute_model.id);

  if (!!settlement_offer_model) {
    throw new ForbiddenException({
      message: `Delivery Dispute Settlement already exists`,
      data: settlement_offer_model
    });
  }
    
    return true;
  }
}


@Injectable()
export class DeliveryDisputeOpenSettlementExists implements CanActivate {
  constructor() {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    
    const delivery_dispute_model: DeliveryDisputeEntity = response.locals.delivery_dispute_model;
  const settlement_offer_model: DeliveryDisputeSettlementOfferEntity | null = await get_open_delivery_dispute_settlement_offer_by_dispute_id(delivery_dispute_model.id);

  if (!settlement_offer_model) {
    throw new ForbiddenException({
      message: `Delivery Dispute Open Settlement not found`
    });
  }
  
  response.locals.settlement_offer_model = settlement_offer_model;
    
    return true;
  }
}


@Injectable()
export class IsSettlementOfferCreator implements CanActivate {
  constructor() {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    
    const settlement_offer_model: DeliveryDisputeSettlementOfferEntity = response.locals.settlement_offer_model;
  const you: UserEntity = response.locals.you;
  
  const isCreator = settlement_offer_model.creator_id === you.id;

  if (!isCreator) {
    throw new ForbiddenException({
      message: `Cannot complete; Is not settlement creator`
    });
  }
    
    return true;
  }
}


@Injectable()
export class SettlementStatusIsPending implements CanActivate {
  constructor() {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    
    const settlement_offer_model: DeliveryDisputeSettlementOfferEntity = response.locals.settlement_offer_model;
  const you: UserEntity = response.locals.you;
  const isPending = settlement_offer_model.status === DeliveryDisputeSettlementOfferStatus.PENDING;

  if (!isPending) {
    throw new ForbiddenException({
      message: `Offer no longer pending`
    });
  }
    
    return true;
  }
}


@Injectable()
export class IsNotSettlementOfferCreator implements CanActivate {
  constructor() {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    
    const settlement_offer_model: DeliveryDisputeSettlementOfferEntity = response.locals.settlement_offer_model;
  const you: UserEntity = response.locals.you;
  
  const isCreator = settlement_offer_model.creator_id === you.id;

  if (isCreator) {
    throw new ForbiddenException({
      message: `Cannot complete; Is settlement creator`
    });
  }
    
    return true;
  }
}

