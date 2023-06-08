import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { WebCarryAppModule } from '@carry/carry-app-services';

@Module({
  imports: [WebCarryAppModule],
})
export class WebApigatewayModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // apply legacy express guards here
  }
}