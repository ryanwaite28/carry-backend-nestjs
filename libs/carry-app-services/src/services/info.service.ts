import {
  HttpStatusCode
} from '../enums/http-status-codes.enum';
import moment from 'moment';
import { ServiceMethodResults, ServiceMethodAsyncResults } from '../interfaces/common.interface';
import { NewsDataCache } from '../models/carry.model';
import { allowedImages } from '../utils/constants.utils';
import { DURATION_1_DAY_HALF } from '../enums/common.enum';


export class InfoService {
  /** Use a cache to store API results for 24 hours at a time */
  static newsApiResults = null;
  private static newsApiRefreshTimeout: any;

  static moreThanOneDayAgo(date: any) {
    return moment(date).isAfter(moment().subtract(1, 'days'));
  }

  static get_site_info(): ServiceMethodResults {
    const serviceMethodResults: ServiceMethodResults = {
      status: HttpStatusCode.OK,
      error: false,
      info: {
        data: {
          allowedImages: allowedImages.sort(),
        }
      }
    };
    return serviceMethodResults;
  }

  /** External API calls */

  static async get_business_news(): ServiceMethodAsyncResults {
    /**
     * https://docs.microsoft.com/en-us/rest/api/cognitiveservices-bingsearch/bing-news-api-v7-reference#categories-by-market
     * https://rapidapi.com/microsoft-azure-org-microsoft-cognitive-services/api/bing-news-search1?endpoint=apiendpoint_0aa346dd-16d6-40d4-930c-235f4b4fb9e6
     */

     // check cache
    if (InfoService.newsApiResults) {
      console.log(`returning news api data from cache`);
      const serviceMethodResults: ServiceMethodResults = {
        status: HttpStatusCode.BAD_REQUEST,
        error: true,
        info: {
          message: `returning news api data from cache`,
          data: InfoService.newsApiResults
        }
      };
      return serviceMethodResults;
    }

    // check database
    const result = await NewsDataCache.findOne();
    if (result) {
      // check age
      const olderThanOneDay = InfoService.moreThanOneDayAgo(result.get('date_created'));
      if (olderThanOneDay) {
        // old data, delete from db and get new
        await result.destroy();
      } else {
        // not old enough, load to cache and return
        InfoService.newsApiResults = JSON.parse(result.get('json_data'));
        console.log(`loaded news api data from db`);
        const serviceMethodResults: ServiceMethodResults = {
          status: HttpStatusCode.OK,
          error: false,
          info: {
            message: `loaded news api data from db`,
            data: InfoService.newsApiResults
          }
        };
        return serviceMethodResults;
      }
    }
    
    console.log(`no valid results in db; go fetch new`);

    const unirest = require("unirest");
    const req = unirest("GET", "https://bing-news-search1.p.rapidapi.com/news");
    req.query({
      "category": "Entertainment",
      "safeSearch": "Off",
      "textFormat": "Raw"
    });
    req.headers({
      "x-rapidapi-host": "bing-news-search1.p.rapidapi.com",
      "x-rapidapi-key": process.env.RAPID_API_KEY,
      "x-bingapis-sdk": "true",
      "useQueryString": true
    });
    const serviceMethodResults: ServiceMethodResults = await new Promise<ServiceMethodResults>((resolve, reject) => {
      req.end(async (res: any) => {
        if (res.error) {
          console.log(res.error, `could not load results`);
          const serviceMethodResults: ServiceMethodResults = {
            status: HttpStatusCode.BAD_REQUEST,
            error: true,
            info: {
              message: `error loading from API`,
              data: res,
            }
          };
          return resolve(serviceMethodResults);
        }
  
        // set to cache and set timeout
        console.log(`retrieved news data; storing in db and setting to cache`);
        const json_data: string = JSON.stringify(res.body);
        await NewsDataCache.create({ json_data });

        InfoService.newsApiResults = res.body;
        InfoService.newsApiRefreshTimeout = setTimeout(() => {
          InfoService.newsApiResults = null;
        }, DURATION_1_DAY_HALF);
  
        const serviceMethodResults: ServiceMethodResults = {
          status: HttpStatusCode.OK,
          error: false,
          info: {
            message: `retrieved news data; storing in db and setting to cache`,
            data: res.body,
          }
        };
        return resolve(serviceMethodResults);
      });
    });

    return serviceMethodResults;
  }
}