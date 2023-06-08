import { Request, Response } from 'express';
import { WhereOptions, fn } from 'sequelize';
import * as CommonRepo from '../repos/_common.repo';
import { HttpStatusCode } from '../enums/http-status-codes.enum';
import { Notifications, Users } from '../models/carry.model';
import { TokensService } from './tokens.service';
import { get_user_notification_last_opened, update_user_notification_last_opened } from '../repos/_common.repo';
import { populate_carry_notification_obj } from '../utils/carry.chamber';
import { ServiceMethodAsyncResults, ServiceMethodResults } from '../interfaces/common.interface';
import { create_model_crud_repo_from_model_class } from '../utils/helpers.utils';
import { IMyModel } from '../interfaces/carry.interface';


const notification_crud = create_model_crud_repo_from_model_class<any>(Notifications);

export class NotificationsService {
  
  // request handlers

  static async get_user_notifications(user_id: number, notification_id?: number): ServiceMethodAsyncResults {


    const notifications_models = await CommonRepo.paginateTable(
      Notifications,
      {
        user_id_field: 'to_id',
        user_id,
        min_id: notification_id
      }
    );

    const newList: any = [];
    for (const notification_model of notifications_models) {
      try {
        const app = notification_model.get('micro_app') as string;
        const notificationObj = await populate_carry_notification_obj(notification_model as IMyModel);
        newList.push(notificationObj);
      } catch (e) {
        console.log(e, { notification: notification_model.toJSON() });
        newList.push(notification_model.toJSON());
      }
    }

    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        data: newList,
      }
    };
    return serviceMethodResults;
  }

  static async get_user_notifications_all(user_id: number): ServiceMethodAsyncResults {
    const notifications_models = await CommonRepo.getAll(
      Notifications,
      'to_id',
      user_id,
    );
    
    const newList: any = [];
    for (const notification_model of notifications_models) {
      try {
        const app = notification_model.get('micro_app') as string;
        const notificationObj = await populate_carry_notification_obj(notification_model);
        newList.push(notificationObj);
      } catch (e) {
        console.log(e, { notification: notification_model.toJSON() });
        newList.push(notification_model.toJSON());
      }
    }

    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        data: newList
      }
    };
    return serviceMethodResults;
  }


  static async get_user_app_notifications(user_id: number, micro_app: string, notification_id?: number): ServiceMethodAsyncResults {
    const where: WhereOptions = { micro_app: micro_app.toUpperCase() };
    console.log({ where });

    const notifications_models = await CommonRepo.paginateTable(
      Notifications,
      {
        user_id_field: 'to_id',
        user_id,
        min_id: notification_id,
        whereClause: where
      }
    );

    console.log({ notifications_models });

    const newList: any = [];
    for (const notification_model of notifications_models) {
      try {
        const app = notification_model.get('micro_app') as string;
        const notificationObj = await populate_carry_notification_obj(notification_model as IMyModel);
        newList.push(notificationObj);
      } catch (e) {
        console.log(e);
        console.log({ notification_model });
        throw e;
      }
    }

    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        data: newList,
      }
    };
    return serviceMethodResults;
  }

  static async get_user_app_notifications_all(user_id: number, micro_app: string): ServiceMethodAsyncResults {
    const where: WhereOptions = { micro_app: micro_app.toUpperCase() };
    console.log({ where });

    const notifications_models = await CommonRepo.getAll(
      Notifications,
      'to_id',
      user_id,
      undefined,
      undefined,
      undefined,
      where
    );
    
    const newList: any = [];
    for (const notification_model of notifications_models) {
      try {
        const app = notification_model.get('micro_app') as string;
        const notificationObj = await populate_carry_notification_obj(notification_model);
        newList.push(notificationObj);
      } catch (e) {
        console.log(e, { notification: notification_model.toJSON() });
        newList.push(notification_model.toJSON());
      }
    }

    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        data: newList
      }
    };
    return serviceMethodResults;
  }



  static async update_user_last_opened(user_id: number): ServiceMethodAsyncResults {
    // update user last opened
    await Users.update(<any> { notifications_last_opened: fn('NOW') }, { where: { id: user_id } });
    const newYouModel = await Users.findOne({
      where: { id: user_id },
      attributes: { exclude: ['password'] }
    });

    const newYou = <any> newYouModel!.toJSON();
    // create new token and return
    const jwt = TokensService.newUserJwtToken(newYou);

    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        data: {
          you: newYou,
          token: jwt
        }
      }
    };
    return serviceMethodResults;
  }



  static async get_user_notification_last_opened(user_id: number): ServiceMethodAsyncResults {
    // update user last opened
    const data = await get_user_notification_last_opened(user_id);

    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        data,
      }
    };
    return serviceMethodResults;
  }

  static async update_user_notification_last_opened(user_id: number): ServiceMethodAsyncResults {
    // update user last opened
    const updates = await update_user_notification_last_opened(user_id);

    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        data: updates
      }
    };
    return serviceMethodResults;
  }
}