import { NestFactory } from '@nestjs/core';
import { DeveloperApigatewayModule } from './developer-apigateway.module';

async function bootstrap() {
  const app = await NestFactory.create(DeveloperApigatewayModule);
  app.setGlobalPrefix('/api');
  await app.listen(3000);
}
bootstrap();
