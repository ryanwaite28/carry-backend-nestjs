import {
  createLogger,
  format,
  transports,
} from 'winston';
import { SPLAT } from 'triple-beam';
import 'winston-daily-rotate-file';
import  DailyRotateFile from 'winston-daily-rotate-file';
import { AppEnvironment } from './app.enviornment';
import * as Axios from 'axios';
const axios = Axios.default;



const myFormat = format.printf((params) => {
  const { level, message, label, timestamp } = params;
  // console.log(params, params[SPLAT]);
  return `${timestamp} [${label}] ${level}: ${message} - ${JSON.stringify(params)}`;
});


const rotateTransport = new transports.DailyRotateFile({
  filename: 'logging-events-%DATE%.log',
  dirname: 'logs/event-logs',
  datePattern: 'YYYY-MM-DD-HH',
  // zippedArchive: true,
  // maxSize: '20m',
  maxFiles: '14d'
});

rotateTransport.on('rotate', (oldFilename, newFilename) => {
  console.log(`Log file rotated`, { oldFilename, newFilename });
});

rotateTransport.on('new', (newFilename) => {
  console.log(`Log file created`, { newFilename });
});

rotateTransport.on('archive', (zipFilename) => {
  console.log(`Log file archived`, { zipFilename });
});


rotateTransport.on('logRemoved', (fileName) => {
  console.log(`Log file removed`, { fileName });
});



export const LOGGER = createLogger({
  transports: [
    new transports.File({
      filename: 'logs/combined.log',
      format: format.combine(
        format.json(),
        format.timestamp(),
      )
    }),

    
    rotateTransport,
    new transports.Console({
      level: 'debug',
      format: format.combine(
        format.label({ label: 'EVENT' }),
        format.timestamp(),
        format.splat(),
        format.colorize({
          colors: {
            info: 'white',
            debug: 'blue',
            warn: 'yellow',
            error: 'red',
          }
        }),
        myFormat
      )
    })
  ],
});

export const REQUESTS_FILE_LOGGER = createLogger({
  transports: [
    new transports.File({
      filename: 'logs/requests.log',
      format: format.combine(
        format.json(),
        format.timestamp(),
      )
    }),
  ],
});

export const RUNTIME_FILE_LOGGER = createLogger({
  transports: [
    new transports.File({
      filename: 'logs/app-runtime.log',
      format: format.combine(
        format.json(),
        format.timestamp(),
      )
    }),
  ],
});

// export const SPLUNK_CLOUD_LOGGER = createLogger({
//   format: format.combine(
//     format.label({ label: 'SPLUNK_EVENT' }),
//     format.json(),
//     format.timestamp(),
//   ),
//   transports: [
//     new transports.Http({
//       host: process.env['SPLUNK_HTTP_COLLECTOR_HOST'],
//       port: parseInt(process.env['SPLUNK_HTTP_COLLECTOR_PORT']!),
//       headers: {
//         Authorization: `Splunk ${process.env['SPLUNK_HTTP_COLLECTOR_TOKEN']}`
//       }
//     })
//   ],
// });

export function LogSplunkCloudEvent(params: { event: string, data: any }) {
  const options: Axios.AxiosRequestConfig = {
    headers: { Authorization: `Splunk ${process.env['SPLUNK_HTTP_COLLECTOR_TOKEN']}` },
    method: 'POST',
    data: {
      ...params.data,
      event: params.event
    }
  };
  console.log(`Splunk Event Log Sending...`);
  return axios.post(AppEnvironment.SPLUNK_HTTP_COLLECTOR_ENDPOINT, options)
  .then((response: Axios.AxiosResponse) => {
    console.log(`Splunk Event Log Sent`);
  })
  .catch((error: Axios.AxiosError) => {
    console.log(error);
    console.log(`Splunk Event Log Failed`);
  });
}
