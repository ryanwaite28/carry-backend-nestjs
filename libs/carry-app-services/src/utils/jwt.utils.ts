import { Request } from 'express';
import {
  sign as jwt_sign,
  verify as jwt_verify
} from 'jsonwebtoken';
import { HttpStatusCode } from '../enums/http-status-codes.enum';
import { AUTH_BEARER_HEADER_REGEX } from '../regex/common.regex';
import { IAuthJwtResults } from '../interfaces/common.interface';
import { UserEntity } from '../entities/carry.entity';




export function generateJWT(data: any, secret?: string) {
  // console.log(`generateJWT:`, { data });
  try {
    const jwt_token = jwt_sign(data, secret || (<string> process.env.JWT_SECRET));
    return jwt_token || null;
  } catch (e) {
    console.log(e);
    return null;
  }
}

export function decodeJWT(token: any, secret?: string) {
  try {
    const data = jwt_verify(token, secret || (<string> process.env.JWT_SECRET));
    // console.log(`decodeJWT:`, { data });
    return data;
  } catch (e) {
    console.log(e);
    return null;
  }
}






export const AuthorizeJwt = (
  request: Request,
  checkUrlYouIdMatch: boolean = true,
): IAuthJwtResults => {
  try {
    /* First, check Authorization header */
    const auth = request.get('Authorization');
    if (!auth) {
      return {
        error: true,
        status: HttpStatusCode.UNAUTHORIZED,
        message: `Request not authorized: missing Authorization header`,
        you: null,
      };
    }
    const isNotBearerFormat = !AUTH_BEARER_HEADER_REGEX.test(auth);
    if (isNotBearerFormat) {
      return {
        error: true,
        status: HttpStatusCode.UNAUTHORIZED,
        message: `Request not authorized: Authorization header must be Bearer format`,
        you: null,
      };
    }

    /* Check token validity */
    const token = auth.split(' ')[1];
    let you;
    try {
      you = decodeJWT(token) || null;
    } catch (e) {
      console.log(e);
      you = null;
    }
    if (!you) {
      return {
        error: true,
        status: HttpStatusCode.UNAUTHORIZED,
        message: `Request not authorized: invalid token`,
        you: null,
      };
    }

    /* Check if user id match the `you_id` path param IF checkUrlIdMatch = true */
    if (checkUrlYouIdMatch) {
      const you_id: number = parseInt(request.params.you_id, 10);
      const notYou: boolean = you_id !== (<UserEntity> you).id;
      if (notYou) {
        return {
          error: true,
          status: HttpStatusCode.UNAUTHORIZED,
          message: `Request not authorized: You are not permitted to complete this action`,
          you: null,
        };
      }
    }

    /* Request is okay */
    const authData = {
      error: false,
      status: HttpStatusCode.OK,
      message: `user authorized`,
      you: (<UserEntity> you),
    };

    console.log(`Request Authorized:`, );

    return authData;
  } catch (error) {
    console.log(`auth jwt error:`, error);
    return {
      error: true,
      status: HttpStatusCode.INTERNAL_SERVER_ERROR,
      message: `Request auth failed...`,
      you: null,
    };
  }
};