import { ApiKeyEntity } from "@carry/carry-app-services/entities/carry.entity";
import { get_api_key } from "@carry/carry-app-services/repos/users.repo";
import { OauthJwtData } from "@carry/carry-app-services/types/oauth-jwt-data.types";
import { AppEnvironment } from "@carry/carry-app-services/utils/app.enviornment";
import { BadRequestException, Controller, Get, Headers, Query, UnauthorizedException } from "@nestjs/common";



@Controller('oauth')
export class OauthController {

  @Get('token')
  async create_oauth_access_token_from_api_key(
    @Query('api-key') api_key_param: string
  ) {

    // check header or URL param for api key
    const api_key_uuid: string = api_key_param;

    // check if api key was given
    if (!api_key_uuid) {
      throw new BadRequestException({ message: `Api Key URL param is missing/invalid` });
    }

    // check if api key record exists
    const api_key: ApiKeyEntity | null = await get_api_key(api_key_uuid);
    if (!api_key) {
      throw new UnauthorizedException({ message: `No records exist by given API key` });
    }

    // create access token out of api_key
    const now = new Date();
    now.setHours(now.getHours() + 6); // expire in 6 hours
    const expiration: string = now.toISOString();
    const data: OauthJwtData = { api_key: { ...api_key }, expiration };
    const access_token: string = AppEnvironment.JWT_SECRETS.OAUTH.encode(data);

    return { data: { access_token } };

  }

}