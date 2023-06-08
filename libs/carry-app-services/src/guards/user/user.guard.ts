import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { HttpStatusCode } from '../../enums/http-status-codes.enum';
import { AppEnvironment } from '../../utils/app.enviornment';
import { AuthorizeJwt } from '../..//utils/jwt.utils';
import { get_user_by_id } from '../../repos/users.repo';
import { UserEntity } from '../../entities/carry.entity';
import { AuthorizeJWT } from '../../utils/helpers.utils';

@Injectable()
export class UserExists implements CanActivate {
  constructor() {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    const user_id: number = parseInt(request.params.user_id, 10);
    const user_model: UserEntity = await get_user_by_id(user_id);
    if (!user_model) {
      throw new NotFoundException({
        message: `User does not exist by id: ${user_id}`,
      });
    }
    response.locals.user_model = user_model;
    response.locals.user = user_model;

    return true;
  }
}

@Injectable()
export class YouAuthorizedSlimWeak implements CanActivate {
  constructor() {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const auth = AuthorizeJWT(request, false);
    response.locals.you = auth.you;
    return true;
  }
}

@Injectable()
export class UserIdsAreDifferent implements CanActivate {
  constructor() {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const you_id = parseInt(request.params.you_id, 10);
    const user_id = parseInt(request.params.user_id, 10);
    if (user_id === you_id) {
      throw new ForbiddenException({
        message: `user_id and you_id cannot be the same`,
      });
    }
    return true;
  }
}

@Injectable()
export class YouHasStripeConnect implements CanActivate {
  constructor() {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const you = response.locals.you as UserEntity;
    if (!you.stripe_account_verified) {
      throw new ForbiddenException({
        message: `You do not have verified stripe account`,
      });
    }
    return true;
  }
}

@Injectable()
export class UserHasStripeConnect implements CanActivate {
  constructor() {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const user = response.locals.user as UserEntity;
    if (!user.stripe_account_verified) {
      throw new ForbiddenException({
        message: `User does not have verified stripe account`,
      });
    }
    return true;
  }
}
