import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import {
  ApiCarryAppModule,
  WebCarryAppModule,
  MobileCarryAppModule,
  OauthCarryAppModule
} from '@carry/carry-app-services';
import { RouterModule } from '@nestjs/core';
import { carry_db_init } from '@carry/carry-app-services/models/_def.model';
import { startPushNewListingsAlertsNotificationsIntervalJob } from '@carry/carry-app-services/workers/master.worker';

@Module({
  imports: [
    ApiCarryAppModule,
    WebCarryAppModule,
    MobileCarryAppModule,
    OauthCarryAppModule,

    RouterModule.register([
      { path: '/api', module: ApiCarryAppModule },
      { path: '/web', module: WebCarryAppModule },
      { path: '/mobile', module: MobileCarryAppModule },
    ]),
  ],
  providers: [
    {
      provide: 'DB',
      useFactory: () => {
        return carry_db_init().then(() => {
          console.log(`app db ready; starting app.`);
        
          /** Start Thread Workers */
      
          startPushNewListingsAlertsNotificationsIntervalJob().subscribe({
            next: () => {}
          });

          return;
        }); 
      }
    }
  ]
})
export class ApigatewayModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // apply legacy express guards here
  }
}