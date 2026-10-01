import {NativeModules, PermissionsAndroid, Platform} from 'react-native';
import {GeoLocation, LocationResult} from './types';

const {ResqLocationModule} = NativeModules;

class LocationService {
  /**
   * Request Android location permissions using standard React Native PermissionsAndroid
   */
  async requestLocationPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return true;
    }

    try {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
      ]);

      const fineGranted =
        granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] ===
        PermissionsAndroid.RESULTS.GRANTED;
      const coarseGranted =
        granted[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] ===
        PermissionsAndroid.RESULTS.GRANTED;

      return fineGranted || coarseGranted;
    } catch (e) {
      console.warn('[LocationService] Permission request error:', e);
      return false;
    }
  }

  /**
   * Check if location permissions are currently granted
   */
  async hasLocationPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return true;
    }

    try {
      const fineGranted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      const coarseGranted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION
      );
      return fineGranted || coarseGranted;
    } catch {
      return false;
    }
  }

  /**
   * Check if device GPS / hardware location provider is enabled
   */
  async isGpsAvailable(): Promise<boolean> {
    if (!ResqLocationModule || typeof ResqLocationModule.isGpsAvailable !== 'function') {
      return false;
    }
    try {
      return await ResqLocationModule.isGpsAvailable();
    } catch {
      return false;
    }
  }

  /**
   * Acquire the phone's current GPS location offline.
   * Handles:
   * - Location permission not granted
   * - Location services/GPS disabled
   * - Location unavailable/timeout
   * - Successful location: { latitude, longitude, accuracy, timestamp }
   */
  async getCurrentLocation(timeoutMs = 15000): Promise<LocationResult> {
    // 1. Check & request permission if needed
    const hasPermission = await this.hasLocationPermission();
    if (!hasPermission) {
      const requested = await this.requestLocationPermission();
      if (!requested) {
        return {
          success: false,
          error: {
            code: 'PERMISSION_NOT_GRANTED',
            message: 'Location permission was denied. Please grant location access in device Settings.',
          },
        };
      }
    }

    // 2. Check native module presence
    if (!ResqLocationModule || typeof ResqLocationModule.getCurrentLocation !== 'function') {
      return {
        success: false,
        error: {
          code: 'LOCATION_UNAVAILABLE',
          message: 'Native ResqLocationModule is not registered.',
        },
      };
    }

    // 3. Check hardware GPS provider
    const isHardwareReady = await this.isGpsAvailable();
    if (!isHardwareReady) {
      return {
        success: false,
        error: {
          code: 'GPS_DISABLED',
          message: 'Location services / GPS is disabled on this device. Please turn on Location in Settings.',
        },
      };
    }

    // 4. Acquire location fix
    try {
      const loc: GeoLocation = await ResqLocationModule.getCurrentLocation(timeoutMs);
      return {
        success: true,
        location: {
          latitude: loc.latitude,
          longitude: loc.longitude,
          accuracy: Math.round(loc.accuracy * 10) / 10,
          timestamp: loc.timestamp,
        },
      };
    } catch (e: any) {
      const code = e?.code || 'UNKNOWN_ERROR';
      const message = e?.message || 'Failed to acquire offline GPS coordinates.';

      return {
        success: false,
        error: {
          code,
          message,
        },
      };
    }
  }
}

export const locationService = new LocationService();
