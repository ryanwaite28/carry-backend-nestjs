import { Request, Response, NextFunction } from "express";
import { HttpStatusCode } from "../enums/http-status-codes.enum";
import { AppEnvironment } from "../utils/app.enviornment";

/*
  The mobile app has a hard-coded secret in an environment variable set during its build.
  All requests from the mobile app should have attached a header, passing along that secret;
  only the mobile app and the backend services know that secret.
  The mobile app also uses `/mobile` as the global prefix for URL requests to the backend services
*/


const MOBILE_APP_SECRET_NAME = `x-mobile-app-secret`;
const MOBILE_APP_SECRET_VALUE = AppEnvironment.API_SECRETS.MOBILE_APP_SECRET;

export function MobileRequestGuard(request: Request, response: Response, next: NextFunction) {
  
  const mobile_secret_header_present = MOBILE_APP_SECRET_NAME in request.headers;
  const mobile_secret_header_value = request.headers[MOBILE_APP_SECRET_NAME];
  const isValidMobileRequest = !!mobile_secret_header_present && (mobile_secret_header_value === MOBILE_APP_SECRET_VALUE);
  console.log({ mobile_secret_header_present, mobile_secret_header_value, isValidMobileRequest });

  if (!isValidMobileRequest) {
    return response.status(HttpStatusCode.UNAUTHORIZED).json({
      message: `Mobile secret is missing/invalid`
    });
  }

  return next();
}