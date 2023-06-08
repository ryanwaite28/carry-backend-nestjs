import { IMyModel, MyModelStatic } from "../interfaces/carry.interface";
import { CreateOptions, DestroyOptions, FindAttributeOptions, FindOptions, GroupOption, Includeable, Model, Order, UpdateOptions, WhereOptions } from 'sequelize';
import {
  sign as jwt_sign,
  verify as jwt_verify
} from 'jsonwebtoken';
import {
  Request,
  Response,
  NextFunction,
} from 'express';
import { plainToInstance, ClassConstructor } from 'class-transformer';
import { UploadedFile } from 'express-fileupload';
import { ServiceMethodResults, IModelValidator, PlainObject, ServiceMethodAsyncResults, IPaginateModelsOptions, IRandomModelsOptions } from '../interfaces/common.interface';
import { allowedImages } from "./constants.utils";
import { validateName, validateEmail, validatePassword, numberValidator, genericTextValidator } from "./validators.utils";
import { HttpStatusCode } from "../enums/http-status-codes.enum";
import { IStoreImage, decodeBase64, store_base64_image, store_image } from "./cloudinary-manager.utils";
import { getAll, getRandomModels, paginateTable } from "../repos/_common.repo";
import { BaseEntity, UserEntity } from "../entities/carry.entity";
import { HttpException } from "@nestjs/common";
import { deliveryGeneralIncludes, deliveryOrderBy } from "../repos/deliveries.repo";



export function uniqueValue() {
  return String(Date.now()) +
    Math.random().toString(36).substr(2, 34) +
    Math.random().toString(36).substr(2, 34);
}

export function capitalize(str: string) {
  if (!str) {
    return '';
  } else if (str.length < 2) {
    return str.toUpperCase();
  }
  const Str = str.toLowerCase();
  const capitalized = Str.charAt(0).toUpperCase() + Str.slice(1);
  return capitalized;
}

export function getRandomIndex(array: any[]) {
  const badInput = !array || !array.length;
  if (badInput) {
    return null;
  }
  const indexList = array.map((item, index) => index);
  const randomIndex = Math.floor(Math.random() * indexList.length);
  const item = indexList[randomIndex];
  return item;
}

export function getRandomItem(array: any[]) {
  const badInput = !array || !array.length;
  if (badInput) {
    return null;
  }
  const randomIndex = Math.floor(Math.random() * array.length);
  const item = array[randomIndex];
  return item;
}






export const check_model_args = async (options: {
  model_id?: number,
  model?: IMyModel,
  model_name?: string,
  get_model_fn: (id: number) => Promise<IMyModel | null>
}) => {
  const { model_id, model, model_name, get_model_fn } = options;
  const useName = model_name || 'model';

  if (!model_id && !model) {
    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.BAD_REQUEST,
      error: true,
      info: {
        message: `${useName} id or model instance is required.`
      }
    };
    return serviceMethodResults;
  }
  const model_model: IMyModel | null = model || await get_model_fn(model_id!);
  if (!model_model) {
    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.NOT_FOUND,
      error: true,
      info: {
        message: `${useName} not found...`,
      }
    };
    return serviceMethodResults;
  }

  const serviceMethodResults: ServiceMethodResults = {
    status: HttpStatusCode.OK,
    error: false,
    info: {
      data: model_model,
    }
  };
  return serviceMethodResults;
};

export const getUserFullName = (user: UserEntity) => {
  if (user) {
    const { firstname, middlename, lastname } = user;
    const middle = middlename
      ? ` ${middlename} `
      : ` `;

    const displayName = `${firstname}${middle}${lastname}`;
    return displayName;
  } else {
    return '';
  }
};

export const create_user_required_props: IModelValidator[] = [
  // { field: `username`, name: `Username`, validator: validateUsername, errorMessage: `must be: at least 2 characters, alphanumeric, dashes, underscores, periods` },
  // { field: `displayname`, name: `DisplayName`, validator: validateDisplayName, errorMessage: `must be: at least 2 characters, alphanumeric, dashes, underscores, periods, spaces`, },
  { field: `firstname`, name: `First Name`, validator: validateName, errorMessage: `must be: at least 2 characters, letters only`, },
  // { field: `middlename`, name: `Middle Name`, validator: (arg: any) => !arg || validateName(arg), errorMessage: `must be: at least 2 characters, letters only`, },
  { field: `lastname`, name: `Last Name`, validator: validateName, errorMessage: `must be: at least 2 characters, letters only`, },
  { field: `email`, name: `Email`, validator: validateEmail, errorMessage: `is in bad format`, },
  { field: `password`, name: `Password`, validator: validatePassword, errorMessage: `Password must be: at least 7 characters, upper and/or lower case alphanumeric`, },
  { field: `confirmPassword`, name: `Confirm Password`, validator: validatePassword, errorMessage: `Confirm Password must be: at least 7 characters, upper and/or lower case alphanumeric`, },
];

export const VALID_RATINGS = new Set([1, 2, 3, 4, 5]);
export const create_rating_required_props: IModelValidator[] = [
  { field: `user_id`, name: `User Id`, validator: (arg: any) => numberValidator(arg) && parseInt(arg) > 0, errorMessage: `is required` },
  { field: `writer_id`, name: `Writer Id`, validator: (arg: any) => numberValidator(arg) && parseInt(arg) > 0, errorMessage: `is required` },
  { field: `rating`, name: `Rating`, validator: (arg: any) => numberValidator(arg) && VALID_RATINGS.has(parseInt(arg)), errorMessage: `must be 1-5` },
  { field: `title`, name: `Title`, validator: genericTextValidator, errorMessage: `must be: at least 3 characters, alphanumeric, dashes, underscores, periods, etc` },
  { field: `summary`, name: `Summary`, validator: genericTextValidator, errorMessage: `must be: at least 3 characters, alphanumeric, dashes, underscores, periods, etc` },
];




export const convertModel = <T> (model: IMyModel | Model | null) => {
  return model ? (<any> model.toJSON()) as T : null;
}

export const convertModels = <T> (models: (IMyModel | Model)[]) => {
  return models.map((model) => (<any> model.toJSON()) as T);
}

export const convertModelCurry = <T> () => (model: IMyModel | Model | null) => {
  return model ? (<any> model.toJSON()) as T : null;
}

export const convertModelsCurry = <T> () => (models: (IMyModel | Model)[]) => {
  return models.map((model) => (<any> model.toJSON()) as T);
}


export function generateJWT(data: any, secret?: string) {
  // console.log(`generateJWT:`, { data });
  try {
    const jwt_token = jwt_sign({ ...data }, secret || (<string> process.env.JWT_SECRET));
    return jwt_token || null;
  } catch (e) {
    console.log(`Could not create jwt with:`, { data });
    console.log(e);
    return null;
  }
}

export function decodeJWT(token: any, secret?: string) {
  try {
    const data = jwt_verify(token, secret || (<string> process.env.JWT_SECRET));
    // console.log(`decodeJWT:`, { data });
    return data;
  } catch (e) {
    console.log(e);
    return null;
  }
}

export function AuthorizeJWT(
  request: Request,
  checkUrlYouIdMatch: boolean = true,
  secret?: string,
): {
  error: boolean;
  status: HttpStatusCode;
  message: string;
  you?: UserEntity;
} {
  try {
    /* First, check Authorization header */
    const auth = request.get('Authorization');
    if (!auth) {
      return {
        error: true,
        status: HttpStatusCode.UNAUTHORIZED,
        message: `Request not authorized: missing Authorization header`
      };
    }
    const isNotBearerFormat = !(/Bearer\s[^]/).test(auth);
    if (isNotBearerFormat) {
      return {
        error: true,
        status: HttpStatusCode.UNAUTHORIZED,
        message: `Request not authorized: Authorization header must be Bearer format`
      };
    }

    /* Check token validity */
    const token = auth.split(' ')[1];
    let you;
    try {
      you = decodeJWT(token, secret) || null;
    } catch (e) {
      console.log(e);
      you = null;
    }
    if (!you) {
      return {
        error: true,
        status: HttpStatusCode.UNAUTHORIZED,
        message: `Request not authorized: invalid token`
      };
    }

    /* Check if user id match the `you_id` path param IF checkUrlIdMatch = true */
    if (checkUrlYouIdMatch) {
      const you_id: number = parseInt(request.params.you_id, 10);
      const notYou: boolean = you_id !== (<UserEntity> you).id;
      if (notYou) {
        return {
          error: true,
          status: HttpStatusCode.UNAUTHORIZED,
          message: `Request not authorized: You are not permitted to complete this action`
        };
      }
    }

    /* Request is okay */
    return {
      error: false,
      status: HttpStatusCode.OK,
      message: `user authorized`,
      you: (<UserEntity> you),
    };
  } catch (error) {
    console.log(`auth jwt error:`, error);
    return {
      error: true,
      status: HttpStatusCode.INTERNAL_SERVER_ERROR,
      message: `Request auth failed...`
    };
  }
}



export const validateData = (options: {
  data: any,
  validators: IModelValidator[],
  mutateObj?: any
}): ServiceMethodResults => {
  const { data, validators, mutateObj } = options;
  const dataObj: any = {};

  for (const prop of validators) {
    if (!data.hasOwnProperty(prop.field)) {
      if (prop.optional) {
        if (prop.defaultValue) {
          dataObj[prop.field] = prop.defaultValue;
        }
        continue;
      }

      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.BAD_REQUEST,
        error: true,
        info: {
          message: `${prop.name} is required.`
        }
      };
      return serviceMethodResults;
    }
    const isValid: boolean = prop.validator(data[prop.field]);
    if (!isValid) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.BAD_REQUEST,
        error: true,
        info: {
          message: prop.errorMessage ? `${prop.name} ${prop.errorMessage}` : `${prop.name} is invalid.`
        }
      };
      return serviceMethodResults;
    }
    
    dataObj[prop.field] = data[prop.field];
  }

  if (mutateObj) {
    Object.assign(mutateObj, dataObj);
  }

  const serviceMethodResults: ServiceMethodResults = {
    status: HttpStatusCode.OK,
    error: false,
    info: {
      message: `validation passed.`,
      data: dataObj,
    }
  };
  return serviceMethodResults;
}

export async function isImageFileOrBase64(file: string | UploadedFile | undefined,) {
  if (typeof file === 'string') {
    const fileBuffer = decodeBase64(file);
    const isInvalidType = !allowedImages.includes(fileBuffer.file_type.split('/')[1]);
    return isInvalidType;
  }
  else {
    const isInvalidType = !allowedImages.includes((<UploadedFile> file).mimetype.split('/')[1]);
    return isInvalidType;
  }
}

export const validateAndUploadImageFile = async (
  image_file: string | UploadedFile | undefined,
  options?: {
    treatNotFoundAsError: boolean,

    mutateObj?: PlainObject,
    id_prop?: string,
    link_prop?: string;
  }
): ServiceMethodAsyncResults => {
  if (!image_file) {
    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.BAD_REQUEST,
      error: options && options.hasOwnProperty('treatNotFoundAsError') ? options.treatNotFoundAsError : true,
      info: {
        message: `No image file found/given`
      }
    };
    return serviceMethodResults;
  }



  let image_results: IStoreImage;
  
  if (typeof image_file === 'string') {
    // base64 string provided; attempt parsing...
    image_results = await store_base64_image(image_file);
  }
  else {
    const type = (<UploadedFile> image_file).mimetype.split('/')[1];
    const isInvalidType = !allowedImages.includes(type);
    if (isInvalidType) {
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.BAD_REQUEST,
        error: true,
        info: {
          message: 'Invalid file type: jpg, jpeg or png required...'
        }
      };
      return serviceMethodResults;
    }
    image_results = await store_image(image_file);
  }

  if (!image_results.result) {
    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.INTERNAL_SERVER_ERROR,
      error: true,
      info: {
        message: 'Could not upload file...',
        data: image_results
      }
    };
    return serviceMethodResults;
  }

  if (options && options.mutateObj && options.id_prop && options.link_prop) {
    options.mutateObj[options.id_prop] = image_results.result.public_id;
    options.mutateObj[options.link_prop] = image_results.result.secure_url;
  }

  const serviceMethodResults: ServiceMethodResults<{
    image_results: any,
    image_id: string,
    image_link: string,
  }> = {
    status: HttpStatusCode.OK,
    error: false,
    info: {
      data: {
        image_results,
        image_id: image_results.result.public_id,
        image_link: image_results.result.secure_url
      }
    }
  };
  return serviceMethodResults;
};

export const create_model_crud_repo_from_model_class = <T> (givenModelClass: MyModelStatic) => {
  // console.log({ givenModelClass });
  if (!givenModelClass) {
    throw new Error(`Model is required...`);
  }

  const convertTypeCurry = convertModelCurry<T>();
  const convertTypeListCurry = convertModelsCurry<T>();
  const modelClass = givenModelClass as MyModelStatic;

  const create = (createObj: any, createOptions?: CreateOptions) => {
    return modelClass.create(createObj, createOptions).then(convertTypeCurry);
  };

  const count = (findOptions: FindOptions) => {
    return modelClass.count(findOptions);
  };



  const findOne = (findOptions: FindOptions) => {
    return modelClass.findOne(findOptions).then(convertTypeCurry);
  };
  const findById = (id: number, findOptions?: FindOptions) => {
    const useWhere = findOptions
      ? { ...findOptions, where: { id } }
      : { where: { id } };
    return modelClass.findOne(useWhere).then(convertTypeCurry);
  };
  const findAll = (findOptions: FindOptions) => {
    return modelClass.findAll(findOptions).then(convertTypeListCurry);
  };



  const update = (updateObj: any, options: UpdateOptions) => {
    return modelClass.update(updateObj, { ...options, returning: true })
      .then((updates) => ({ rows: updates[0], models: updates[1].map(convertTypeCurry) }));
  };
  const updateById = (id: number, updateObj: any) => {
    return modelClass.update(updateObj, { where: { id }, returning: true })
      .then((updates) => ({ rows: updates[0], model: updates[1][0] && convertTypeCurry(updates[1][0]) }));
    // .then(async (updates) => {
    //   const fresh = await findById(id);
    //   // return updates;
    //   const returnValue = [updates[0], fresh] as [number, (T|null)];
    //   return returnValue;
    // });
  };



  const deleteFn = async (destroyOptions: DestroyOptions) => {
    const results = await modelClass.destroy(destroyOptions);
    const models = !destroyOptions.where ? [] : await modelClass.findAll({ where: destroyOptions.where, paranoid: false }).then(convertTypeListCurry);
    return { results, models };
  };
  const deleteById = async (id: number) => {
    const results = await modelClass.destroy({ where: { id } });
    const model = await modelClass.findOne({ where: { id }, paranoid: false }).then(convertTypeCurry);
    return { results, model };
  };


  const paginate = (params: IPaginateModelsOptions) => {
    return paginateTable(modelClass, params).then(convertTypeListCurry);
  };

  const randomModels = (params: IRandomModelsOptions) => {
    return getRandomModels<T>(modelClass, params).then(convertTypeListCurry);
  };

  

  return {
    create,
  
    findOne,
    findAll,
    findById,
    count,

    update,
    updateById,

    destroy: deleteFn,
    delete: deleteFn,
    deleteById,

    paginate,
    randomModels,
  };

};



export const sequelize_model_class_crud_to_entity_class = <T> (givenModelClass: MyModelStatic, ModelEntity: ClassConstructor<T>) => {
  // console.log({ givenModelClass });
  if (!givenModelClass) {
    throw new Error(`Model is required...`);
  }

  const convertTypeCurry = (model: IMyModel) => {
    const data = plainToInstance<T, PlainObject>(ModelEntity as ClassConstructor<T>, model.toJSON()) as T;
    // console.log(data);
    return data;
  };
  const convertTypeListCurry = (models: IMyModel[]) => models.map(convertTypeCurry);


  const modelClass = givenModelClass as MyModelStatic;

  const create = (createObj: any, createOptions?: CreateOptions) => {
    return modelClass.create(createObj, createOptions).then(convertTypeCurry);
  };

  const count = (findOptions: FindOptions) => {
    return modelClass.count(findOptions);
  };



  const findOne = (findOptions: FindOptions) => {
    return modelClass.findOne(findOptions).then(convertTypeCurry);
  };
  const findById = (id: number, findOptions?: FindOptions) => {
    const useWhere = findOptions
      ? { ...findOptions, where: { id } }
      : { where: { id } };
    return modelClass.findOne(useWhere).then(convertTypeCurry);
  };
  const findAll = (findOptions: FindOptions) => {
    return modelClass.findAll(findOptions).then(convertTypeListCurry);
  };



  const update = (updateObj: any, options: UpdateOptions) => {
    return modelClass.update(updateObj, { ...options, returning: true })
      .then((updates) => ({ rows: updates[0], models: updates[1].map(convertTypeCurry) }));
  };
  const updateById = (id: number, updateObj: any) => {
    return modelClass.update(updateObj, { where: { id }, returning: true })
      .then((updates) => ({ rows: updates[0], model: updates[1][0] && convertTypeCurry(updates[1][0]) }));
    // .then(async (updates) => {
    //   const fresh = await findById(id);
    //   // return updates;
    //   const returnValue = [updates[0], fresh] as [number, (T|null)];
    //   return returnValue;
    // });
  };



  const deleteFn = async (destroyOptions: DestroyOptions) => {
    const results = await modelClass.destroy(destroyOptions);
    const models = !destroyOptions.where ? [] : await modelClass.findAll({ where: destroyOptions.where, paranoid: false }).then(convertTypeListCurry);
    return { results, models };
  };
  const deleteById = async (id: number) => {
    const results = await modelClass.destroy({ where: { id } });
    const model = await modelClass.findOne({ where: { id }, paranoid: false }).then(convertTypeCurry);
    return { results, model };
  };


  const paginate = (params: IPaginateModelsOptions) => {
    return paginateTable(modelClass, params).then(convertTypeListCurry);
  };

  const randomModels = (params: IRandomModelsOptions) => {
    return getRandomModels<T>(modelClass, params).then(convertTypeListCurry);
  };

  const getAllModals = (params: {
    parent_id_field: string,
    parent_id: number,
    include?: Includeable[],
    attributes?: FindAttributeOptions,
    group?: GroupOption,
    whereClause?: WhereOptions,
    orderBy?: Order
  }) => {
    const {
      parent_id_field,
      parent_id,
      include,
      attributes,
      group,
      whereClause,
      orderBy
    } = params;
    return getAll(
      modelClass,
      parent_id_field,
      parent_id,
      include,
      attributes,
      group,
      whereClause,
      orderBy
    ).then(convertTypeListCurry);
  };

  

  return {
    create,
  
    findOne,
    findAll,
    findById,
    count,

    update,
    updateById,

    destroy: deleteFn,
    delete: deleteFn,
    deleteById,

    paginate,
    getAll: getAllModals,
    randomModels,
  };

};



export function get_distance_haversine_distance(params: {
  from_lat: number;
  from_lng: number;
  to_lat: number;
  to_lng: number;
}) {
  /*  
    https://developers.google.com/maps/documentation/distance-matrix/overview#DistanceMatrixRequests
    https://cloud.google.com/blog/products/maps-platform/how-calculate-distances-map-maps-javascript-api
  */
  var M = 3958.8; // Radius of the Earth in miles
  var K = 6371.0710; // Radius of the Earth in kilometers

  var rlat1 = params.from_lat * (Math.PI/180); // Convert degrees to radians
  var rlat2 = params.to_lat * (Math.PI/180); // Convert degrees to radians
  var difflat = rlat2-rlat1; // Radian difference (latitudes)
  var difflon = (params.to_lng - params.from_lng) * (Math.PI/180); // Radian difference (longitudes)

  var d = 2 * M * Math.asin(
    Math.sqrt(
      Math.sin(difflat/2) * Math.sin(difflat/2) + Math.cos(rlat1) * Math.cos(rlat2) * Math.sin(difflon/2) * Math.sin(difflon/2)
    )
  );
  return d;
}

export const ControllerServiceResultsHandler = <T> (results: ServiceMethodResults<T>) => {
  if (results.error) {
    throw new HttpException(results.info, results.status);
  }
  return results.info;
}