/**
 * Android BLE Permissions Manager
 *
 * Handles runtime permission requests for both modern Android (API 31+, Android 12+)
 * and legacy Android (API <= 30, Android 11 and lower).
 *
 * Distinguishes between:
 * - Bluetooth disabled
 * - Bluetooth permission denied / permanently denied
 * - Location permission requirement on legacy Android
 * - BLE unsupported
 * - BLE available and ready
 */

import {PermissionsAndroid, Platform} from 'react-native';
import {BlePermissionStatus} from './types';

export interface PermissionCheckResult {
  status: BlePermissionStatus;
  canScan: boolean;
  canAdvertise: boolean;
  missingPermissions: string[];
  message: string;
}

export const BlePermissions = {
  /**
   * Checks whether all required BLE permissions are currently granted.
   */
  async checkPermissions(): Promise<PermissionCheckResult> {
    if (Platform.OS !== 'android') {
      return {
        status: 'GRANTED',
        canScan: true,
        canAdvertise: true,
        missingPermissions: [],
        message: 'BLE permissions handled by OS',
      };
    }

    const apiLevel = Platform.Version as number;
    const missing: string[] = [];

    if (apiLevel >= 31) {
      // Android 12+ (API 31+) requires BLUETOOTH_SCAN and BLUETOOTH_CONNECT
      const hasScan = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN
      );
      if (!hasScan) missing.push(PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN);

      const hasConnect = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT
      );
      if (!hasConnect) missing.push(PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT);

      const hasAdv = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE
      );
      if (!hasAdv) missing.push(PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE);

    } else {
      // Legacy Android (<= API 30) requires ACCESS_FINE_LOCATION for BLE discovery
      const hasLocation = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      if (!hasLocation) {
        missing.push(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
      }
    }

    if (missing.length === 0) {
      return {
        status: 'GRANTED',
        canScan: true,
        canAdvertise: true,
        missingPermissions: [],
        message: 'BLE permissions granted and active',
      };
    }

    return {
      status: 'DENIED',
      canScan: false,
      canAdvertise: false,
      missingPermissions: missing,
      message: `Missing permissions: ${missing.map(m => m.split('.').pop()).join(', ')}`,
    };
  },

  /**
   * Prompts the user to grant missing BLE permissions.
   */
  async requestPermissions(): Promise<PermissionCheckResult> {
    if (Platform.OS !== 'android') {
      return {
        status: 'GRANTED',
        canScan: true,
        canAdvertise: true,
        missingPermissions: [],
        message: 'Non-Android platform',
      };
    }

    const apiLevel = Platform.Version as number;

    if (apiLevel >= 31) {
      const permsToRequest = [
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
      ];

      const results = await PermissionsAndroid.requestMultiple(permsToRequest);

      const scanGranted =
        results[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] ===
        PermissionsAndroid.RESULTS.GRANTED;
      const connectGranted =
        results[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] ===
        PermissionsAndroid.RESULTS.GRANTED;
      const advGranted =
        results[PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE] ===
        PermissionsAndroid.RESULTS.GRANTED;

      const anyNeverAskAgain = Object.values(results).some(
        res => res === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN
      );

      if (scanGranted && connectGranted && advGranted) {
        return {
          status: 'GRANTED',
          canScan: true,
          canAdvertise: true,
          missingPermissions: [],
          message: 'All Android 12+ BLE permissions granted',
        };
      }

      return {
        status: anyNeverAskAgain ? 'NEVER_ASK_AGAIN' : 'DENIED',
        canScan: scanGranted,
        canAdvertise: advGranted,
        missingPermissions: permsToRequest.filter(
          p => results[p] !== PermissionsAndroid.RESULTS.GRANTED
        ),
        message: anyNeverAskAgain
          ? 'Bluetooth permissions permanently denied in OS Settings'
          : 'Bluetooth permissions were denied by user',
      };
    } else {
      // Legacy Android (API <= 30)
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission for BLE Mesh',
          message:
            'Android versions prior to Android 12 require Location access to perform Bluetooth Low Energy peer discovery.',
          buttonPositive: 'Grant Permission',
          buttonNegative: 'Deny',
        }
      );

      if (result === PermissionsAndroid.RESULTS.GRANTED) {
        return {
          status: 'GRANTED',
          canScan: true,
          canAdvertise: true,
          missingPermissions: [],
          message: 'Legacy BLE location permission granted',
        };
      }

      return {
        status:
          result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN
            ? 'NEVER_ASK_AGAIN'
            : 'DENIED',
        canScan: false,
        canAdvertise: false,
        missingPermissions: [PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION],
        message:
          result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN
            ? 'Location permission permanently denied. Enable in Settings to scan.'
            : 'Location permission denied. Nearby peer discovery cannot scan.',
      };
    }
  },
};
