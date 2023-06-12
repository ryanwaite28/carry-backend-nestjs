import { Request, Response, NextFunction } from "express";
import { HttpStatusCode } from "../enums/http-status-codes.enum";
import { AppEnvironment } from "../utils/app.enviornment";
import { OauthJwtData } from "../types/oauth-jwt-data.types";
import { LOGGER } from "../utils/logger.utils";
import { create_api_key_request } from "../repos/users.repo";
import { dateTimeTransform } from "../utils/carry.chamber";

/*
  The mobile app has a hard-coded secret in an environment variable set during its build.
  All requests from the mobile app should have attached a header, passing along that secret;
  only the mobile app and the backend services know that secret.
  The mobile app also uses `/mobile` as the global prefix for URL requests to the backend services
*/


export const OAUTH_ACCESS_TOKEN_HEADER_NAME = `x-oauth-access-token`;

export function ApiRequestGuard(request: Request, response: Response, next: NextFunction) {
  
  // check if access token is attached/given
  const oauth_access_token_header_present = OAUTH_ACCESS_TOKEN_HEADER_NAME in request.headers;
  if (!oauth_access_token_header_present) {
    return response.status(HttpStatusCode.BAD_REQUEST).json({
      message: `"${OAUTH_ACCESS_TOKEN_HEADER_NAME}" header is missing`,
      missing: true
    });
  }

  // check if access token has value
  const oauth_access_token = request.headers[OAUTH_ACCESS_TOKEN_HEADER_NAME];
  if (!oauth_access_token) {
    return response.status(HttpStatusCode.BAD_REQUEST).json({
      message: `"${OAUTH_ACCESS_TOKEN_HEADER_NAME}" header is empty/invalid`,
      empty: true
    });
  }

  // check if access token is valid
  let data: OauthJwtData;
  try {
    data = AppEnvironment.JWT_SECRETS.OAUTH.decode(oauth_access_token) as OauthJwtData;
  }
  catch (e) {
    LOGGER.error(`Could not decode jwt access_token...`, { oauth_access_token });
    data = null;
  }
  if (!data) {
    return response.status(HttpStatusCode.BAD_REQUEST).json({
      message: `"${OAUTH_ACCESS_TOKEN_HEADER_NAME}" value is invalid`,
      invalid: true
    });
  }

  // check if access token is expired
  const jwtCreationDate = new Date(data.expiration);
  const isExpired = (new Date()) > jwtCreationDate;
  if (isExpired) {
    return response.status(HttpStatusCode.FORBIDDEN).json({
      message: `"${OAUTH_ACCESS_TOKEN_HEADER_NAME}" value is expired`,
      expired: true
    });
  }

  
  
  // is valid API request
  LOGGER.info(`Oauth Access Token verified; API request is valid.`);
  response.locals['API_KEY'] = data.api_key;

  // log api key request
  create_api_key_request({
    api_key_id: data.api_key.id,
    url: request.url,
    method: request.method,
    metadata: JSON.stringify({
      timestamp: Date.now(),
      datetime: dateTimeTransform(new Date()),
      
      url: request.url,
      method: request.method,
      body: request.body,
      headers: request.headers,
      raw_headers: request.rawHeaders,
      cookies: request.cookies,
      device: JSON.stringify(request['device']),
      params: request.params,
      query: request.query,
      signed_cookies: request.signedCookies,
    })
  });

  return next();

}
