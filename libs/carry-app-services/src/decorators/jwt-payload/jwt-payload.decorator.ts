import { Request, Response } from 'express';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthorizeJwt } from '../../utils/jwt.utils';
import { UploadedFile } from 'express-fileupload';
import {
  UserEntity
} from '../../entities/carry.entity';



export const ResponseLocals = createParamDecorator(
  (propName: string, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    return response.locals[propName];
  },
);




export const JwtPayload = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    const auth = AuthorizeJwt(request, true);
    return auth;
  },
);


export const JwtPayloadSlim = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    const auth = AuthorizeJwt(request, false);
    return auth;
  },
);

export const JwtPayloadAuthorized = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    const you: UserEntity = response.locals.you;
    return you;
  },
);


export const UserExistsParam = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    const user = response.locals.user;
    return user;
  },
);

export const DeliveryExistsParam = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    const delivery = response.locals.delivery_model;
    return delivery;
  },
);


export const ExpressUploadedFile = createParamDecorator(
  (fileName: string, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<Request>();
    const file: UploadedFile | undefined = request.files && (<UploadedFile> request.files[fileName]) as UploadedFile | undefined;
    return file;
  },
);

