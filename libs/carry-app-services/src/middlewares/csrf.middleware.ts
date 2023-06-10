import { Request, Response, NextFunction, CookieOptions } from "express";
import { HttpStatusCode } from "../enums/http-status-codes.enum";
import { v1 as uuidv1 } from "uuid";
import { AppEnvironment } from "../utils/app.enviornment";
import { isProd } from "../utils/constants.utils";



const CSRF_COOKIE_NAME = `CSRF-TOKEN`;
const CSRF_HEADER_NAME = `X-CSRF-TOKEN`;
const CSRF_SAFE_METHODS = ['GET', 'OPTIONS', 'HEAD'];



const cookieOptions: CookieOptions = {
  httpOnly: false,
  path: `/`,
  domain: AppEnvironment.USE_COOKIE_DOMAIN,
  sameSite: 'none',
  secure: true,
  // expires: moment().add(1, 'hour').toDate()
};

export function CsrfSetCookieMiddle(request: Request, response: Response, next: NextFunction) {
  const uuid = uuidv1();
  response.cookie(CSRF_COOKIE_NAME, uuid, cookieOptions);
  next();
}

export function CsrfAuthGuard(request: Request, response: Response, next: NextFunction) {
  const csrf_token_cookie = request.cookies[CSRF_COOKIE_NAME] || request.cookies[CSRF_COOKIE_NAME.toLowerCase()] || request.cookies[CSRF_COOKIE_NAME.toUpperCase()];
  const csrf_token_header = request.headers[CSRF_HEADER_NAME] || request.headers[CSRF_HEADER_NAME.toLowerCase()] || request.headers[CSRF_HEADER_NAME.toUpperCase()];

  const valid = csrf_token_header === csrf_token_cookie;
  const isSafeMethod = CSRF_SAFE_METHODS.includes(request.method.toUpperCase());
  
  console.log(`CSRF Validating:`, { isSafeMethod, csrf_token_cookie, csrf_token_header, valid, url: request.url, method: request.method });
  
  if (isSafeMethod) {
    return next();
  }
  if (!csrf_token_cookie) {
    return response.status(HttpStatusCode.BAD_REQUEST).json({
      message: `${CSRF_COOKIE_NAME} cookie not found on request.`
    });
  }
  if (!csrf_token_header) {
    return response.status(HttpStatusCode.BAD_REQUEST).json({
      message: `${CSRF_HEADER_NAME} header not found on request.`
    });
  }
  if (!valid) {
    return response.status(HttpStatusCode.BAD_REQUEST).json({
      message: `CSRF validation failed.`
    });
  }

  console.log(`CSRF Validation Successful; continuing request...`);

  next();
}


export function CsrfProtectionMiddleware(request: Request, response: Response, next: NextFunction) {
  const isSafeMethod = CSRF_SAFE_METHODS.includes(request.method.toUpperCase());
  if (isSafeMethod || !isProd) {
    // is safe mthod; set new csrf cookie value
    const uuid = uuidv1();
    response.cookie(CSRF_COOKIE_NAME, uuid, cookieOptions);
    return next();
  }

  // not safe method; validate request
  const csrf_token_cookie = request.cookies[CSRF_COOKIE_NAME] || request.cookies[CSRF_COOKIE_NAME.toLowerCase()] || request.cookies[CSRF_COOKIE_NAME.toUpperCase()];
  const csrf_token_header = request.headers[CSRF_HEADER_NAME] || request.headers[CSRF_HEADER_NAME.toLowerCase()] || request.headers[CSRF_HEADER_NAME.toUpperCase()];
  const valid = csrf_token_header === csrf_token_cookie;
  console.log(`CSRF Validating:`, { isSafeMethod, csrf_token_cookie, csrf_token_header, valid, url: request.url, method: request.method });
  
  if (!csrf_token_cookie) {
    return response.status(HttpStatusCode.BAD_REQUEST).json({
      message: `${CSRF_COOKIE_NAME} cookie not found on request.`
    });
  }
  if (!csrf_token_header) {
    return response.status(HttpStatusCode.BAD_REQUEST).json({
      message: `${CSRF_HEADER_NAME} header not found on request.`
    });
  }
  if (!valid) {
    return response.status(HttpStatusCode.BAD_REQUEST).json({
      message: `CSRF validation failed.`
    });
  }
  else {
    console.log(`CSRF check valid.`);
  }

  console.log(`CSRF Validation Successful; continuing request...`);

  next();
}