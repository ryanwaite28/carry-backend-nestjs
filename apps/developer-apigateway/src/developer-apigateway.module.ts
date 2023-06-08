import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ApiCarryAppModule } from '@carry/carry-app-services';

@Module({
  imports: [ApiCarryAppModule],
})
export class DeveloperApigatewayModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // apply legacy express guards here
  }
}