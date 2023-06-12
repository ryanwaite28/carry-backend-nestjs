import { Request, Response, NextFunction } from "express";


export class HttpContextHolder {
  static queue: { request: Request, response: Response, timestamp: number }[] = [];

  static get request() {
    return HttpContextHolder.queue[0].request;
  }

  static get response() {
    return HttpContextHolder.queue[0].response;
  }

  static get timestamp() {
    return HttpContextHolder.queue[0].timestamp;
  }
}


export function HttpContextMiddleware(request: Request, response: Response, next: NextFunction) {

  HttpContextHolder.queue.push({ request, response, timestamp: Date.now() });


  const old_send = response.send;
  response.send = function () {
    HttpContextHolder.queue.shift();
    console.log(`HttpContextHolder cycle ended: `, { queue: HttpContextHolder.queue.length });
    return old_send.apply(response, arguments);
  }

  return next();

}