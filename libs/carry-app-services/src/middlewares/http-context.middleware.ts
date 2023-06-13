import { Request, Response, NextFunction } from "express";


export class HttpContextHolder {
  static queue: { request: Request, response: Response, cycleId: number }[] = [];

  static get request() {
    return HttpContextHolder.queue[0].request;
  }

  static get response() {
    return HttpContextHolder.queue[0].response;
  }

  static get cycleId() {
    return HttpContextHolder.queue[0].cycleId;
  }
}


export function HttpContextMiddleware(request: Request, response: Response, next: NextFunction) {

  HttpContextHolder.queue.push({ request, response, cycleId: Date.now() });
  console.log(`HttpContextHolder cycle started: `, { cycleId: HttpContextHolder.cycleId, queue: HttpContextHolder.queue.length });


  const old_send = response.send;
  response.send = function () {
    const item = HttpContextHolder.queue.shift();
    console.log(`HttpContextHolder cycle ended: `, { cycleId: item.cycleId, queue: HttpContextHolder.queue.length });
    return old_send.apply(response, arguments);
  }

  return next();

}