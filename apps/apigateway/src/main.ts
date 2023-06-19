import * as dotenv from 'dotenv';
dotenv.config();


import { NestFactory } from '@nestjs/core';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { Application, Request, Response, raw, json } from 'express';
import { ApigatewayModule } from './apigateway.module';
import * as express_device from 'express-device';
import * as express_fileupload from 'express-fileupload';
import * as cookie_parser from 'cookie-parser';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import {
  NestExpressApplication
} from '@nestjs/platform-express';
import { SocketsService } from '@carry/carry-app-services/services/sockets.service';
import { AppEnvironment } from '@carry/carry-app-services/utils/app.enviornment';
import { Server } from "socket.io";
import * as http from 'http';
import {
  SetApiRequestContext,
  SetWebRequestContext,
  SetMobileRequestContext,
  CorsApiMiddleware,
  CorsMobileMiddleware,
  CorsWebMiddleware,
  isProd
} from '@carry/carry-app-services/utils/constants.utils';
import { uniqueValue } from '@carry/carry-app-services/utils/helpers.utils';
import { RequestLoggerMiddleware } from '@carry/carry-app-services/middlewares/request-logger.middleware';
import { CsrfProtectionMiddleware } from '@carry/carry-app-services/middlewares/csrf.middleware';
import { StripeService } from '@carry/carry-app-services/services/stripe.service';
import { StripeWebhookEventsRequestHandler } from '@carry/carry-app-services/services/stripe-webhook-events.service';
import { MobileRequestGuard } from '@carry/carry-app-services/middlewares/mobile-auth.middleware';
import { ApiRequestGuard, OAUTH_ACCESS_TOKEN_HEADER_NAME } from '@carry/carry-app-services/middlewares/api-request.middleware';
import { OauthJwtData } from '@carry/carry-app-services/types/oauth-jwt-data.types';
import { HttpContextMiddleware } from '@carry/carry-app-services/middlewares/http-context.middleware';



async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(ApigatewayModule);
  const ioAdapter = new IoAdapter(app);
  // const nestIo = await ioAdapter.createIOServer(AppEnvironment.PORT);
  // console.log({ nestIo });
  app.useWebSocketAdapter(ioAdapter);
  const expressApp: Application = app.getHttpAdapter().getInstance();

  // swagger UI
  const config = new DocumentBuilder()
    .setTitle('Carry: Community Carrier - API Docs')
    .setDescription('The Carry: Community Carrier API description')
    .setVersion('1.0')
    .addTag('carry')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger-ui-docs', app, document);


  // use express middleware
  expressApp.use(express_fileupload({ safeFileNames: true, preserveExtension: true }));
  expressApp.use(express_device.capture());
  expressApp.use(cookie_parser());
  // expressApp.use(json());
  // expressApp.use(body_parser.urlencoded({ extended: false }));
  
  const appServer: http.Server = http.createServer(expressApp);
  
  const io: Server = new Server(appServer, {
    cors: {
      origin: AppEnvironment.CORS.WHITELIST,
    },
    
    allowRequest: (request, callback) => {
      console.log(`socket req origin: ${request.headers.origin}`);
      const useOrigin = (request.headers.origin || '');
      const originIsAllowed = !isProd || AppEnvironment.CORS.WHITELIST.includes(useOrigin);
      console.log({ socket_io_reques_origin: originIsAllowed });

      const isApiRequest = (
        (OAUTH_ACCESS_TOKEN_HEADER_NAME in request.headers) &&
        !!request.headers[OAUTH_ACCESS_TOKEN_HEADER_NAME] &&
        AppEnvironment.JWT_SECRETS.OAUTH.decode(request.headers[OAUTH_ACCESS_TOKEN_HEADER_NAME]) as OauthJwtData
      );

      const allowConnection = originIsAllowed || (!!isApiRequest && (new Date()) > (new Date(isApiRequest.expiration)));

      
      callback(null, allowConnection);
    }
  });
  io.engine.generateId = (req: any) => {
    return uniqueValue(); // must be unique across all Socket.IO servers
  };
  
  SocketsService.handle_io_connections(io);
  
  
  const endpointSecret = process.env.STRIPE_WEBHOOK_SIG ;
  expressApp.post('/stripe-webhook', raw({ type: 'application/json' }), async (request: Request, response: Response) => {  
    const sig = request.headers['stripe-signature'];
    console.log(`-------stripe webhook request:-------`, { body: request.body, headers: request.headers, sig, STRIPE_WEBHOOK_SIG: process.env.STRIPE_WEBHOOK_SIG });
    
    let event;
    
    try {
      event = StripeService.stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
    } 
    catch (err) {
      const msg = `Webhook Error: ${err['message']}`;
      console.log(msg);
      response.status(400).send(msg);
      return;
    }
    
    console.log(`stripe webhook event:`, { event }, JSON.stringify(event));
    
    return StripeWebhookEventsRequestHandler.handleEvent(event, request, response);
  });
  
  
  expressApp.use(json(), RequestLoggerMiddleware);
  expressApp.use(json(), HttpContextMiddleware);
  
  expressApp.use('/api', json(), SetApiRequestContext, CorsApiMiddleware, ApiRequestGuard);
  expressApp.use('/web', json(), SetWebRequestContext, CorsWebMiddleware, CsrfProtectionMiddleware);
  expressApp.use('/mobile', json(), SetMobileRequestContext, CorsMobileMiddleware, MobileRequestGuard);
  
  

  // health check
  expressApp.get(`/`, (req, res) => {
    return res.json({ message: 'Online' });
  });
  
  app.init();


  // listen
  // await app.listen(AppEnvironment.PORT).then(() => {
    // });
    
  await appServer.listen(AppEnvironment.PORT);
  console.log(`App listening on port ${AppEnvironment.PORT}...`);

}
bootstrap();
