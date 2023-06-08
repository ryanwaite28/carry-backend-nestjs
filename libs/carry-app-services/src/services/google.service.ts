import {
  Client,
  ReverseGeocodeRequest,
  LatLng
} from "@googlemaps/google-maps-services-js";
import { PlainObject } from '../interfaces/common.interface';



export class GoogleService {
  static readonly componentForm: PlainObject = {
    street_number: 'short_name',
    route: 'long_name',
    locality: 'long_name',
    administrative_area_level_1: 'short_name',
    administrative_area_level_2: 'short_name',
    country: 'long_name',
    postal_code: 'short_name'
  };

  static switchName(name: string) {
    switch(name) {
      case 'locality':
        return 'city';
      case 'administrative_area_level_1':
        return 'state';
      case 'administrative_area_level_2':
          return 'county';
      case 'country':
        return 'country';
      case 'postal_code':
        return 'zipcode';

      default:
        return name;
    }
  }
  
  static async getLocationFromCoordinates(lat: number | string, lng: number | string) {
    const api_url = `https://maps.googleapis.com/maps/api/geocode/json?` + 
      `latlng=${lat},${lng}&sensor=true&key=${process.env.GOOGLE_MAPS_API_KEY}`;

    const client = new Client({});

    const request: ReverseGeocodeRequest = {
      params: {
        latlng: [parseFloat(lat as any), parseFloat(lng as any)],
        key: process.env.GOOGLE_MAPS_API_KEY!,
      }
    };
    return client.reverseGeocode(request).then((response) => {
      // console.log({ response });
      // console.log({ data: response.data.results });

      const placeData: any = {};
      const place: any = response.data.results[0];

      for (var i = 0; i < place.address_components.length; i++) {
        // var addressType = place.address_components[i].types[0];
        for (const t of place.address_components[i].types) {
          if (GoogleService.componentForm[t]) {
            var val = place.address_components[i][GoogleService.componentForm[t]];
            placeData[GoogleService.switchName(t)] = val;
          }
        }
      }
      if (!placeData['city']) {
        placeData['city'] = '';
      }
      if (!placeData['state']) {
        placeData['state'] = '';
      }

      console.log({ place, placeData });

      return placeData;
    })
    .catch(e => {
      console.log(e);
      throw e;
    });
  }
}