import { AppEnvironment } from "@carry/carry-app-services/utils/app.enviornment";
import { Controller, Get, Post, Put } from "@nestjs/common";



@Controller('common')
export class CommonController {
  
  @Get('/utils/get-csrf-token')
  get_csrf_token() {
    return { message: 'Admit One' };
  }

  @Post('/utils/get-google-api-key')
  get_google_maps_key_post() {
    return { data: { key: AppEnvironment.API_KEYS.GOOGLE_MAPS } };
  }
  
  @Post('/utils/get-stripe-public-key')
  get_stripe_public_key_post() {
    return { data: { key: AppEnvironment.API_KEYS.STRIPE_PK } };
  }
  
  @Put('/utils/get-google-api-key')
  get_google_maps_key_put() {
    return { data: { key: AppEnvironment.API_KEYS.GOOGLE_MAPS }};
  }
  
  @Put('/utils/get-stripe-public-key')
  get_stripe_public_key_put() {
    return { data: { key: AppEnvironment.API_KEYS.STRIPE_PK } };
  }

}