import {
  createLogger,
  format,
  transports,
} from 'winston';
import { SPLAT } from 'triple-beam';
import 'winston-daily-rotate-file';
import  DailyRotateFile from 'winston-daily-rotate-file';



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

