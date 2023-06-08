import { STATUSES } from '@carry/carry-app-services/enums/common.enum';
import { DeliveryEntity } from '../../entities/carry.entity';
import {
  check_carrier_delivery_request_pending,
  check_delivery_unpaid_listing_is_unpaid,
  check_user_has_unpaid_listings,
  delivery_has_an_accepted_carrier_request,
  delivery_has_at_lease_one_pending_carrier_request,
  exists_delivery_by_id,
  get_carrier_delivery_request_by_id,
  get_carrier_requests_pending_all,
  get_delivery_by_id,
  get_user_delivering_inprogress_count,
} from '../../repos/deliveries.repo';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Request, Response } from 'express';



@Injectable()
export class DeliveryExists implements CanActivate {
  constructor() {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const delivery_id = parseInt(request.params.delivery_id, 10);
    const delivery_model: DeliveryEntity | null = await get_delivery_by_id(
      delivery_id,
    );
    if (!delivery_model) {
      throw new NotFoundException({
        message: `Delivery not found`,
      });
    }
    response.locals.delivery_model = delivery_model;
    return true;
  }
}

@Injectable()
export class DeliveryExistsSlim implements CanActivate {
  constructor() {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const delivery_id = parseInt(request.params.delivery_id, 10);
    const exists: boolean = await exists_delivery_by_id(delivery_id);
    if (!exists) {
      throw new NotFoundException({
        message: `Delivery not found`,
      });
    }

    return true;
  }
}

@Injectable()
export class DeliveryHasAssignedCarrier implements CanActivate {
  constructor() {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const delivery_model = <DeliveryEntity>response.locals.delivery_model;
    if (!delivery_model.carrier_id) {
      throw new ForbiddenException({
        message: `Delivery does not have a carrier assigned`,
      });
    }
    return true;
  }
}

@Injectable()
export class DeliveryHasNoAssignedCarrier implements CanActivate {
  constructor() {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const delivery_model = <DeliveryEntity>response.locals.delivery_model;
    if (!!delivery_model.carrier_id) {
      throw new ForbiddenException({
        message: `Delivery has a carrier assigned`,
      });
    }
    return true;
  }
}

@Injectable()
export class DeliveryHasNoPendingCarrierRequests implements CanActivate {
  constructor() {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const delivery_model = <DeliveryEntity>response.locals.delivery_model;
    const pending_request =
      await delivery_has_at_lease_one_pending_carrier_request(
        delivery_model.id,
      );
    if (!!pending_request) {
      throw new ForbiddenException({
        message: `Delivery has a pending carrier request`,
      });
    }
    return true;
  }
}

@Injectable()
export class CarrierHasNoPendingDeliveryRequest implements CanActivate {
  constructor() {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const delivery_model = <DeliveryEntity>response.locals.delivery_model;
    const pending_request = await check_carrier_delivery_request_pending(
      delivery_model.id,
      response.locals.you.id,
    );
    // console.log({ pending_request });
    if (!!pending_request) {
      throw new ForbiddenException({
        message: `Already sent request`,
      });
    }
    return true;
  }
}

@Injectable()
export class CarrierIsBelowCarryingLimit implements CanActivate {
  constructor() {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const delivering_inprogress_count =
      await get_user_delivering_inprogress_count(response.locals.you.id);
    if (delivering_inprogress_count === 3) {
      throw new ForbiddenException({
        message: `Cannot request a delivery while already carrying the max allowed at a time (3).`,
      });
    }

    return true;
  }
}

@Injectable()
export class CarrierIsBelowPendingRequestsLimit implements CanActivate {
  constructor() {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const pending_requests = await get_carrier_requests_pending_all(
      response.locals.you.id,
    );
    if (pending_requests.length === 3) {
      throw new ForbiddenException({
        message: `Cannot request a delivery while already at the max allowed pending requests (3).`,
      });
    }

    return true;
  }
}

@Injectable()
export class IsDeliveryOwner implements CanActivate {
  constructor() {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const delivery_model = <DeliveryEntity>response.locals.delivery_model;
    const isOwner: boolean = response.locals.you.id === delivery_model.owner_id;
    if (!isOwner) {
      throw new ForbiddenException({
        message: `Not delivery owner`,
      });
    }
    return true;
  }
}

@Injectable()
export class IsNotDeliveryOwner implements CanActivate {
  constructor() {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const delivery_model = <DeliveryEntity>response.locals.delivery_model;
    const isOwner: boolean = response.locals.you.id === delivery_model.owner_id;
    if (isOwner) {
      throw new ForbiddenException({
        message: `Is delivery owner`,
      });
    }
    return true;
  }
}

@Injectable()
export class IsDeliveryCarrier implements CanActivate {
  constructor() {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const delivery_model = <DeliveryEntity>response.locals.delivery_model;
    const isCarrier: boolean =
      response.locals.you.id === delivery_model.carrier_id;
    if (!isCarrier) {
      throw new ForbiddenException({
        message: `Not delivery carrier`,
      });
    }
    return true;
  }
}

@Injectable()
export class NoCustomerRating implements CanActivate {
  constructor() {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const delivery_model = <DeliveryEntity>response.locals.delivery_model;
    const hasCustomerRating: boolean = !!delivery_model.customer_rating;
    if (hasCustomerRating) {
      throw new ForbiddenException({
        message: `Already rated`,
      });
    }
    return true;
  }
}

@Injectable()
export class NoCarrierRating implements CanActivate {
  constructor() {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const delivery_model = <DeliveryEntity>response.locals.delivery_model;
    const hasCarrierRating: boolean = !!delivery_model.carrier_rating;
    if (hasCarrierRating) {
      throw new ForbiddenException({
        message: `Already rated`,
      });
    }
    return true;
  }
}

@Injectable()
export class IsDeliveryOwnerOrCarrier implements CanActivate {
  constructor() {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const delivery_model = <DeliveryEntity>response.locals.delivery_model;
    const isOwner: boolean = response.locals.you.id === delivery_model.owner_id;
    const isCarrier: boolean =
      response.locals.you.id === delivery_model.carrier_id;
    const isEither = isOwner || isCarrier;
    if (!isEither) {
      throw new ForbiddenException({
        message: `Not delivery owner or carrier`,
      });
    }
    return true;
  }
}

@Injectable()
export class DeliveryIsCompleted implements CanActivate {
  constructor() {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const delivery_model = <DeliveryEntity>response.locals.delivery_model;
    if (!delivery_model.completed) {
      throw new ForbiddenException({
        message: `Delivery not completed yet`,
      });
    }
    return true;
  }
}

@Injectable()
export class DeliveryNotCompleted implements CanActivate {
  constructor() {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const delivery_model = <DeliveryEntity>response.locals.delivery_model;
    if (delivery_model.completed) {
      throw new ForbiddenException({
        message: `Delivery already completed`,
      });
    }
    return true;
  }
}

@Injectable()
export class DeliveryHasNoCarrierAssigned implements CanActivate {
  constructor() {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const delivery_model = <DeliveryEntity>response.locals.delivery_model;
    if (delivery_model.carrier_id) {
      throw new ForbiddenException({
        message: `Delivery has carrier assigned`,
      });
    }
    return true;
  }
}

@Injectable()
export class IsDeliveryCarrierLocationRequestCompleted implements CanActivate {
  constructor() {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const delivery_model = <DeliveryEntity>response.locals.delivery_model;
    if (!delivery_model.carrier_location_request_completed) {
      throw new ForbiddenException({
        message: `Delivery carrier location request is not completed`,
      });
    }
    return true;
  }
}

@Injectable()
export class IsNotDeliveryCarrierLocationRequestCompleted
  implements CanActivate
{
  constructor() {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const delivery_model = <DeliveryEntity>response.locals.delivery_model;
    if (delivery_model.carrier_location_request_completed) {
      throw new ForbiddenException({
        message: `Delivery carrier location request is already completed`,
      });
    }
    return true;
  }
}

@Injectable()
export class DeliveryIsNotUnpaid implements CanActivate {
  constructor() {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const delivery_id = parseInt(request.params.delivery_id, 10);
    const unpaid_listing = await check_delivery_unpaid_listing_is_unpaid(
      delivery_id,
    );

    if (unpaid_listing) {
      throw new ForbiddenException({
        message: `Error: Delivery listing is unpaid`,
        data: {
          unpaid_listing,
        },
      });
    }

    return true;
  }
}

@Injectable()
export class UserDoesNotHaveAnUnpaidListing implements CanActivate {
  constructor() {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const unpaid_listing = await check_user_has_unpaid_listings(
      response.locals.you.id,
    );

    if (unpaid_listing) {
      throw new ForbiddenException({
        message: `Error: User has unpaid listing`,
        data: {
          unpaid_listing,
        },
      });
    }

    return true;
  }
}

@Injectable()
export class DeliveryHasNoAcceptedRequests implements CanActivate {
  constructor() {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const delivery_id = parseInt(request.params.delivery_id, 10);
    const delivery_carrier_request =
      await delivery_has_an_accepted_carrier_request(delivery_id);

    if (!!delivery_carrier_request) {
      throw new NotFoundException({
        message: `Delivery already accepted a carrier request`,
      });
    }

    response.locals.delivery_carrier_request = delivery_carrier_request;
    return true;
  }
}

@Injectable()
export class DeliveryCarrierRequestExists implements CanActivate {
  constructor() {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const carrier_request_id = parseInt(request.params.carrier_request_id, 10);
    const delivery_carrier_request = await get_carrier_delivery_request_by_id(
      carrier_request_id,
    );

    if (!delivery_carrier_request) {
      throw new NotFoundException({
        message: `Carrier Request not found`,
      });
    }

    response.locals.delivery_carrier_request = delivery_carrier_request;
    return true;
  }
}

@Injectable()
export class DeliveryCarrierRequestExistsAndIsPending implements CanActivate {
  constructor() {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const carrier_request_id = parseInt(request.params.carrier_request_id, 10);
    const delivery_carrier_request = await get_carrier_delivery_request_by_id(
      carrier_request_id,
    );

    if (!delivery_carrier_request) {
      throw new NotFoundException({
        message: `Carrier Request not found`,
      });
    }

    const isPending = delivery_carrier_request.status === STATUSES.PENDING;
    if (!isPending) {
      throw new ForbiddenException({
        message: `Carrier Request is not pending`,
      });
    }

    response.locals.delivery_carrier_request = delivery_carrier_request;
    return true;
  }
}

@Injectable()
export class IsDeliveryOwnerOfDeliveryCarrierRequest implements CanActivate {
  constructor() {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const isCarrierRequester =
      response.locals.delivery_model.owner_id === response.locals.you.id;

    if (!isCarrierRequester) {
      throw new NotFoundException({
        message: `Not delivery owner`,
      });
    }

    return true;
  }
}

@Injectable()
export class IsRequestingCarrier implements CanActivate {
  constructor() {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const isCarrierRequester =
      response.locals.delivery_carrier_request.user_id ===
      response.locals.you.id;

    if (!isCarrierRequester) {
      throw new NotFoundException({
        message: `Not requesting carrier`,
      });
    }

    return true;
  }
}

@Injectable()
export class RequestingCarrierIsBelow implements CanActivate {
  constructor() {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const isCarrierRequester =
      response.locals.delivery_carrier_request.user_id ===
      response.locals.you.id;

    if (!isCarrierRequester) {
      throw new NotFoundException({
        message: `Not requesting carrier`,
      });
    }

    return true;
  }
}
