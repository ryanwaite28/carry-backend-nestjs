import { ApiKeyEntity } from "../entities/carry.entity";


export type OauthJwtData = {
  api_key: ApiKeyEntity;
  expiration: string;
};