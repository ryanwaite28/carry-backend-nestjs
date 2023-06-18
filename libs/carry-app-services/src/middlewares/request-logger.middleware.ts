import { NextFunction, Request, Response } from "express";
import { LogSplunkCloudEvent, REQUESTS_FILE_LOGGER } from "../utils/logger.utils";
import { dateTimeTransform } from "../utils/carry.chamber";





export function RequestLoggerMiddleware(request: Request, response: Response, next: NextFunction) {
  const requestData = {
    timestamp: Date.now(),
    datetime: dateTimeTransform(new Date()),
    
    url: request.url,
    ip_address: request.ip,
    method: request.method,
    body: request.body,
    headers: request.headers,
    raw_headers: request.rawHeaders,
    cookies: request.cookies,
    device: JSON.stringify(request['device']),
    params: request.params,
    query: request.query,
    signed_cookies: request.signedCookies,
  };

  console.log(`\n\n\n======= BEGIN RequestLoggerMiddleware =======`);
  console.log(requestData);
  console.log(`======= NEXT =======\n\n\n`);

  // REQUESTS_FILE_LOGGER.info(`request data:`, {
  //   request: requestData
  // });

  // SPLUNK_CLOUD_LOGGER.info('incoming request', { event: `INCOMING REQUEST`, request: requestData });

  // LogSplunkCloudEvent({ event: `Incoming Request`, data: requestData });

  return next();
}