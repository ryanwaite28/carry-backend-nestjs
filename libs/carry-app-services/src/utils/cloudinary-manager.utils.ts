import { UploadedFile } from "express-fileupload";
import { uniqueValue } from "./helpers.utils";
import { AwsS3Service } from "./s3.utils";
import { LOGGER } from "./logger.utils";
import { AppEnvironment } from "./app.enviornment";

const cloudinary = require('cloudinary').v2;
const fs = require('fs');



export interface IUploadFile {
  error: boolean;
  filename?: string;
  file_path?: string;
  message?: string;
  filetype: string;
}

export function upload_file(file: UploadedFile): Promise<IUploadFile> {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject({error: true, filename: undefined, file_path: undefined, message: 'no file given...'});
    }
    const unique_filename = uniqueValue();
    const filename = unique_filename + (<string> file.name);
    const file_path = __dirname + '/' + filename;
    const filetype = file.mimetype;
    file.mv(file_path, (error: any) => {
      if (error) {
        return reject({error: true, filename: undefined, filetype, file_path: undefined, message: 'could not upload file...'});
      } else {
        return resolve({ error: false, filename, file_path, filetype: undefined, message: undefined });
      }
    });
  });
}

export const base64Regex = /^data:([A-Za-z-+\/]+);base64,(.+)$/;

export function decodeBase64(dataString: string) {
  let matches = dataString.match(base64Regex);
  let response: { file_type: string, file_data: Buffer } = {
    file_data: Buffer.from(''),
    file_type: '',
  };

  if (!matches || matches.length !== 3) {
    throw new Error('Invalid base64 input string');
  }

  response.file_type = matches[1];
  response.file_data = Buffer.from(matches[2], 'base64');

  if (!response.file_type || !response.file_data) {
    throw new Error(`Could not parse base64 string`);
  }

  return response;
}

export function upload_base64(base64: string): Promise<IUploadFile> {
  return new Promise((resolve, reject) => {
    try {
      if (!base64) {
        return reject({error: true, filename: undefined, file_path: undefined, message: 'no base64 input given...'});
      }
  
      const fileBuffer = decodeBase64(base64);
      const filetype = fileBuffer.file_type;
      const filename = `${Date.now()}.${filetype.split('/')[1]}`;
      const file_path = __dirname + '/' + filename;
      console.log(`upload_base64:`, { filename, filetype, file_path });
      const writeOp = fs.writeFileSync(file_path, fileBuffer.file_data);
      console.log(`successfully uploaded base64`);
      return resolve({ error: false, filename, file_path, filetype, message: undefined });
    }
    catch (e) {
      console.log(`upload_base64 error:`, e);
      return reject({ error: true, filename: undefined, filetype: undefined, file_path: undefined, message: 'could not upload file...' });
    }
  });
}

export interface IStoreImage {
  error: boolean;
  message?: string;
  filedata: IUploadFile;
  result?: {
    public_id: string;
    secure_url: string;
  };
}

export function delete_cloudinary_image (public_id: string) {
  return new Promise((resolve, reject) => {
    console.log('deleting cloud image with public_id:', public_id);
    cloudinary.uploader.destroy(public_id, (error: any, result: any) => {
      if (error) {
        LOGGER.error('error deleting...', error);
        return reject(error);
      } else {
        LOGGER.info(
          `deleted from cloudinary successfully!`,
          { public_id, result }
        );
        return resolve(null);
      }
    });
  });
}

export function delete_s3_image (key_id: string) {
  const splitter = key_id.split('|');
  const Bucket = splitter[0];
  const Key = splitter[1];
  return AwsS3Service.deleteObject({ Bucket, Key }).then((error) => {
    LOGGER.error(`Could not delete S3 object...`, { key_id });
  });
}

export function delete_cloud_image(id: string) {
  if (AwsS3Service.isS3ConventionId(id)) {
    // is s3 object
    return delete_s3_image(id);
  }
  else {
    // must be cloudinary image
    delete_cloudinary_image(id);
    return 
  }
}

// export const delete_cloudinary_image = delete_cloudinary_image;

export function store_image(file: any, public_id?: string): Promise<IStoreImage> {
  return new Promise(async (resolve, reject) => {
    const cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
    const api_key = process.env.CLOUDINARY_API_KEY;
    const api_secret = process.env.CLOUDINARY_API_SECRET;
    const oneCredentialMissing = (!cloud_name || !api_key || !api_secret);

    if (oneCredentialMissing) {
      console.log({ file, public_id, cloud_name, api_key, api_secret });
      const errorObj = {
        error: true,
        results: undefined,
        message: `One cloudinary credential is missing; upload attempt canceled.`
      };
      return reject(errorObj);
    }

    const filedata = await upload_file(file);
    if (filedata.error) {
      const errorObj = { error: filedata.error, message: filedata.message };
      return reject(errorObj);
    }

    cloudinary.config({ cloud_name, api_key, api_secret });

    if (public_id) {
      console.log('deleting cloud image with public_id:', public_id);
      cloudinary.uploader.destroy(public_id, (error: any, result: any) => {
        if (error) {
          console.log('error deleting...', error);
        } else {
          console.log(
            'deleted from cloudinary successfully!',
            'public_id: ' + public_id,
            'result: ', result
          );
        }
      });
    }

    cloudinary.uploader.upload(filedata.filename, (error: any, result: any) => {
      fs.unlink(filedata.filename, (err: any) => {
        if (err) {
          console.log(err);
        } else {
          console.log(
            'file deleted successfully!',
            filedata.filename
          );
        }
      });

      console.log({ error });
      return result && result.secure_url ?
        resolve({ error: false, result, filedata }) :
        reject({ error: true, result, filedata });
    });
  });
}

export function store_base64_image(base64_image: string, public_id?: string): Promise<IStoreImage> {
  return new Promise(async (resolve, reject) => {
    const cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
    const api_key = process.env.CLOUDINARY_API_KEY;
    const api_secret = process.env.CLOUDINARY_API_SECRET;
    const oneCredentialMissing = (!cloud_name || !api_key || !api_secret);

    if (oneCredentialMissing) {
      console.log({ public_id, cloud_name, api_key, api_secret });
      const errorObj = {
        error: true,
        results: undefined,
        message: `One cloudinary credential is missing; upload attempt canceled.`
      };
      return reject(errorObj);
    }

    const filedata = await upload_base64(base64_image);
    if (filedata.error) {
      const errorObj = { error: filedata.error, message: filedata.message };
      return reject(errorObj);
    }
    
    cloudinary.config({ cloud_name, api_key, api_secret });

    if (public_id) {
      console.log('deleting cloud image with public_id:', public_id);
      cloudinary.uploader.destroy(public_id, (error: any, result: any) => {
        if (error) {
          console.log('error deleting...', error);
        } else {
          console.log(
            'deleted from cloudinary successfully!',
            'public_id: ' + public_id,
            'result: ', result
          );
        }
      });
    }

    console.log(`attempting cloud upload...`);
    cloudinary.uploader.upload(filedata.file_path, (error: any, result: any) => {
      fs.unlink(filedata.file_path, (err: any) => {
        if (err) {
          console.log(err);
        } else {
          console.log(
            'file deleted successfully!',
            filedata.filename
          );
        }
      });

      console.log({ error });
      return result && result.secure_url ?
        resolve({ error: false, result, filedata }) :
        reject({ error: true, result, filedata });
    });
  });
}
