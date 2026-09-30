/**
 * RESQ-MESH BLE Peripheral Advertiser Bridge
 *
 * Exposes minimal non-emergency beacon presence for peer discovery.
 * Uses native Android BluetoothLeAdvertiser.
 */

import {NativeModules, Platform} from 'react-native';
import {RESQ_MESH_SERVICE_UUID} from './types';

const {ResqBleAdvertiser} = NativeModules;

export const BleAdvertiser = {
  /**
   * Checks if the device radio supports BLE Peripheral Multi-Advertisement.
   */
  async isSupported(): Promise<boolean> {
    if (Platform.OS !== 'android' || !ResqBleAdvertiser?.isAdvertisingSupported) {
      return false;
    }
    try {
      return await ResqBleAdvertiser.isAdvertisingSupported();
    } catch {
      return false;
    }
  },

  /**
   * Checks if Bluetooth radio is powered on.
   */
  async isBluetoothEnabled(): Promise<boolean> {
    if (Platform.OS !== 'android' || !ResqBleAdvertiser?.isBluetoothEnabled) {
      return false;
    }
    try {
      return await ResqBleAdvertiser.isBluetoothEnabled();
    } catch {
      return false;
    }
  },

  /**
   * Starts broadcasting minimal RESQ-MESH presence advertisement.
   *
   * @param peerId Local stable ID (e.g. RESQ-MESH:7F3A)
   */
  async startAdvertising(peerId: string): Promise<{
    success: boolean;
    peerId: string;
    serviceUuid: string;
  }> {
    if (Platform.OS !== 'android' || !ResqBleAdvertiser?.startAdvertising) {
      throw new Error('BLE advertising is not supported on this platform/device');
    }

    return await ResqBleAdvertiser.startAdvertising(
      peerId,
      RESQ_MESH_SERVICE_UUID
    );
  },

  /**
   * Stops broadcasting the BLE presence advertisement.
   */
  async stopAdvertising(): Promise<boolean> {
    if (Platform.OS !== 'android' || !ResqBleAdvertiser?.stopAdvertising) {
      return true;
    }
    try {
      return await ResqBleAdvertiser.stopAdvertising();
    } catch {
      return false;
    }
  },

  /**
   * Returns whether advertising is currently active.
   */
  async isAdvertising(): Promise<boolean> {
    if (Platform.OS !== 'android' || !ResqBleAdvertiser?.isAdvertising) {
      return false;
    }
    try {
      return await ResqBleAdvertiser.isAdvertising();
    } catch {
      return false;
    }
  },
};
