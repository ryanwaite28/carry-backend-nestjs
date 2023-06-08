import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { MobileCarryAppModule } from '@carry/carry-app-services';

@Module({
  imports: [MobileCarryAppModule],
})
export class MobileApigatewayModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // apply legacy express guards here
  }
}