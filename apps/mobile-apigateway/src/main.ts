import { NestFactory } from '@nestjs/core';
import { MobileApigatewayModule } from './mobile-apigateway.module';

async function bootstrap() {
  const app = await NestFactory.create(MobileApigatewayModule);
  app.setGlobalPrefix('/mobile');
  await app.listen(3000);
}
bootstrap();
