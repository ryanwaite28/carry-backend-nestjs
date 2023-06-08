import { NextFunction, Request, Response } from "express";


export function ResponseLoggerMiddleware(request: Request, response: Response, next: NextFunction) {
  console.log(`\n\n\n======= BEGIN ResponseLoggerMiddleware =======`);
  console.log({ response });
  console.log(`======= NEXT =======\n\n\n`);

  return next();
}