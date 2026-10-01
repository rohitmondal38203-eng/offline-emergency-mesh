/**
 * Location Data Structures and Error Types
 */

export interface GeoLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export type LocationErrorCode =
  | 'PERMISSION_NOT_GRANTED'
  | 'GPS_DISABLED'
  | 'TIMEOUT_OR_UNAVAILABLE'
  | 'LOCATION_UNAVAILABLE'
  | 'UNKNOWN_ERROR';

export interface LocationSuccessResult {
  success: true;
  location: GeoLocation;
  error?: undefined;
}

export interface LocationErrorResult {
  success: false;
  location?: undefined;
  error: {
    code: LocationErrorCode;
    message: string;
  };
}

export type LocationResult = LocationSuccessResult | LocationErrorResult;
