import { NestFactory } from '@nestjs/core';
import { Application } from 'express';
import { WebApigatewayModule } from './web-apigateway.module';
import express_fileupload from 'express-fileupload';

import {
  ExpressAdapter,
  NestExpressApplication
} from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(WebApigatewayModule, new ExpressAdapter());
  const expressApp: Application = app.getHttpAdapter().getInstance();

  expressApp.use(express_fileupload({ safeFileNames: true, preserveExtension: true }));
  
  app.setGlobalPrefix('/web');
  await app.listen(3000);
}
bootstrap();
