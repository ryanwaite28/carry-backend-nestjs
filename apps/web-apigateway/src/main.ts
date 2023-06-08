import { NestFactory } from '@nestjs/core';
import { Application } from 'express';
import { WebApigatewayModule } from './web-apigateway.module';



import {
  ExpressAdapter,
  NestExpressApplication
} from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(WebApigatewayModule, new ExpressAdapter());
  const expressApp: Application = app.getHttpAdapter().getInstance();
  
  app.setGlobalPrefix('/web');
  await app.listen(3000);
}
bootstrap();
