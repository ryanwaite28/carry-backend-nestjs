import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { CommonController } from './controllers/common/common.controller';
import { UsersController } from './controllers/users/users.controller';
import { DeliveriesController } from './controllers/deliveries/deliveries.controller';
import { OauthController } from './controllers/oauth/oauth.controller';

@Module({
  controllers: [
    OauthController
  ],
  providers: [
    OauthController
  ],
  exports: [
    OauthController
  ],
})
export class OauthCarryAppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
  }
}




@Module({
  controllers: [
    CommonController,
    UsersController,
    DeliveriesController,
  ],
  providers: [
    CommonController,
    UsersController,
    DeliveriesController,
  ],
  exports: [
    CommonController,
    UsersController,
    DeliveriesController
  ],
})
export class ApiCarryAppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
  }
}

@Module({
  controllers: [
    CommonController,
    UsersController,
    DeliveriesController
  ],
  providers: [
    CommonController,
    UsersController,
    DeliveriesController,
  ],
  exports: [
    CommonController,
    UsersController,
    DeliveriesController
  ],
})
export class WebCarryAppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
  }
}

@Module({
  controllers: [
    CommonController,
    UsersController,
    DeliveriesController
  ],
  providers: [
    CommonController,
    UsersController,
    DeliveriesController,
  ],
  exports: [
    CommonController,
    UsersController,
    DeliveriesController
  ],
})
export class MobileCarryAppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
  }
}


