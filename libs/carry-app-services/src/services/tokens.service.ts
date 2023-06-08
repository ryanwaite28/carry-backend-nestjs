import {
  Request,
} from 'express';
import { generateJWT } from '../utils/helpers.utils';
import { UserEntity } from '../entities/carry.entity';



export class TokensService {
  public static newJwtToken(
    request: Request,
    you: UserEntity,
    shouldDeleteOld: boolean
  ): string {
    // create JWT
    const jwt = <string> generateJWT(you);

    /** Ignore for now */
    // const tokenCreateOptions = {
    //   ip_address: request.ip,
    //   user_agent: (request.get('user-agent') || ''),
    //   user_id: you.id,
    //   token: jwt,
    //   device: (<any> request).device.type
    // };
    // TokenRepo.createToken(tokenCreateOptions)
    //   .then((tokenModel) => {
    //     console.log(`token created`);
    //   })
    //   .catch((error) => {
    //     console.log(`could not create token`, error);
    //   });

    // /* Delete any possible old token */
    // const searchTokenWhereClause = {
    //   ip_address: request.ip,
    //   user_agent: (request.get('user-agent') || ''),
    //   user_id: you.id,
    //   device: (<any> request).device.type
    // };
    // TokenRepo.searchToken(searchTokenWhereClause)
    //   .then((session_token_model) => {
    //     if (session_token_model) {
    //       session_token_model.destroy();
    //     }
    //   })
    //   .catch((e) => {
    //     console.log(e);
    //   });

    return jwt;
  }

  public static newUserJwtToken(you: UserEntity): string {
    // create JWT
    const jwt = <string> generateJWT(you);
    return jwt;
  }
}