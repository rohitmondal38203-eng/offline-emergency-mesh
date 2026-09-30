/**
 * Core BLE Radio Service
 *
 * Implements:
 * - Real BLE Central scanning via react-native-ble-plx
 * - Duplicate device elimination & RSSI updates
 * - Peer connection & clean disconnection
 * - Automatic scan timeout
 * - Resource cleanup on unmount
 * - Error classification (disabled, denied, unsupported, timeout)
 */

import {BleManager, Device, State, Subscription} from 'react-native-ble-plx';
import {
  BlePeer,
  BleRadioState,
  RESQ_MESH_SERVICE_UUID,
} from './types';
import {PeerIdentityService} from './peerIdentity';
import {BlePermissions} from './blePermissions';

const SCAN_TIMEOUT_MS = 20000; // 20 seconds automatic scan timeout

export class BleServiceManager {
  private manager: BleManager | null = null;
  private stateSubscription: Subscription | null = null;
  private scanTimeoutTimer: ReturnType<typeof setTimeout> | null = null;

  private isScanningActive = false;
  private discoveredPeersMap = new Map<string, BlePeer>();
  private activeConnections = new Map<string, Device>();

  private onPeersUpdatedCallback: ((peers: BlePeer[]) => void) | null = null;
  private onRadioStateChangedCallback: ((state: BleRadioState) => void) | null = null;
  private onScanStatusChangedCallback: ((isScanning: boolean) => void) | null = null;
  private onErrorCallback: ((error: string) => void) | null = null;

  /**
   * Initializes the BleManager singleton and begins radio state observation.
   */
  public initialize(
    onRadioStateChange?: (state: BleRadioState) => void
  ): void {
    if (this.manager) {
      return;
    }

    try {
      this.manager = new BleManager();
      this.onRadioStateChangedCallback = onRadioStateChange || null;

      this.stateSubscription = this.manager.onStateChange(state => {
        const mapped = this.mapRadioState(state);
        if (this.onRadioStateChangedCallback) {
          this.onRadioStateChangedCallback(mapped);
        }
        if (mapped === 'POWERED_OFF' && this.isScanningActive) {
          this.stopScanning();
          if (this.onErrorCallback) {
            this.onErrorCallback('Bluetooth radio was turned off. Scan stopped.');
          }
        }
      }, true);
    } catch (e: any) {
      if (this.onErrorCallback) {
        this.onErrorCallback(`Failed to initialize BLE radio: ${e?.message || e}`);
      }
    }
  }

  /**
   * Maps react-native-ble-plx State to our BleRadioState enum.
   */
  private mapRadioState(state: State): BleRadioState {
    switch (state) {
      case State.PoweredOn:
        return 'POWERED_ON';
      case State.PoweredOff:
        return 'POWERED_OFF';
      case State.Unauthorized:
        return 'UNAUTHORIZED';
      case State.Unsupported:
        return 'UNSUPPORTED';
      case State.Resetting:
        return 'RESETTING';
      case State.Unknown:
      default:
        return 'UNKNOWN';
    }
  }

  /**
   * Reads current radio state from the BLE controller.
   */
  public async getRadioState(): Promise<BleRadioState> {
    if (!this.manager) {
      this.initialize();
    }
    try {
      const state = await this.manager!.state();
      return this.mapRadioState(state);
    } catch {
      return 'UNKNOWN';
    }
  }

  /**
   * Sets callback listeners for UI subscription.
   */
  public setListeners(listeners: {
    onPeersUpdated?: (peers: BlePeer[]) => void;
    onRadioStateChanged?: (state: BleRadioState) => void;
    onScanStatusChanged?: (isScanning: boolean) => void;
    onError?: (error: string) => void;
  }): void {
    if (listeners.onPeersUpdated) this.onPeersUpdatedCallback = listeners.onPeersUpdated;
    if (listeners.onRadioStateChanged) this.onRadioStateChangedCallback = listeners.onRadioStateChanged;
    if (listeners.onScanStatusChanged) this.onScanStatusChangedCallback = listeners.onScanStatusChanged;
    if (listeners.onError) this.onErrorCallback = listeners.onError;
  }

  /**
   * Starts real hardware BLE scanning for nearby devices.
   */
  public async startScanning(): Promise<void> {
    if (!this.manager) {
      this.initialize();
    }

    // 1. Verify runtime permissions
    const permResult = await BlePermissions.checkPermissions();
    if (!permResult.canScan) {
      const reqResult = await BlePermissions.requestPermissions();
      if (!reqResult.canScan) {
        if (this.onErrorCallback) {
          this.onErrorCallback(reqResult.message);
        }
        return;
      }
    }

    // 2. Verify Bluetooth hardware state
    const radioState = await this.getRadioState();
    if (radioState === 'POWERED_OFF') {
      if (this.onErrorCallback) {
        this.onErrorCallback('Bluetooth is turned off. Please enable Bluetooth in your device settings.');
      }
      return;
    }
    if (radioState === 'UNSUPPORTED') {
      if (this.onErrorCallback) {
        this.onErrorCallback('Bluetooth Low Energy (BLE) is not supported on this device.');
      }
      return;
    }

    // 3. Stop any existing scan
    if (this.isScanningActive) {
      this.stopScanning();
    }

    this.isScanningActive = true;
    if (this.onScanStatusChangedCallback) {
      this.onScanStatusChangedCallback(true);
    }

    // Start auto-timeout
    if (this.scanTimeoutTimer) {
      clearTimeout(this.scanTimeoutTimer);
    }
    this.scanTimeoutTimer = setTimeout(() => {
      this.stopScanning();
    }, SCAN_TIMEOUT_MS);

    try {
      // Scan for all BLE peripherals (null) so user can see real nearby BLE nodes
      this.manager!.startDeviceScan(
        null,
        {allowDuplicates: false},
        (error, device) => {
          if (error) {
            this.isScanningActive = false;
            if (this.onScanStatusChangedCallback) {
              this.onScanStatusChangedCallback(false);
            }
            if (this.onErrorCallback) {
              this.onErrorCallback(`BLE Scan error: ${error.message}`);
            }
            return;
          }

          if (device) {
            this.handleDiscoveredDevice(device);
          }
        }
      );
    } catch (e: any) {
      this.isScanningActive = false;
      if (this.onScanStatusChangedCallback) {
        this.onScanStatusChangedCallback(false);
      }
      if (this.onErrorCallback) {
        this.onErrorCallback(`Unable to start BLE scan: ${e?.message || e}`);
      }
    }
  }

  /**
   * Processes a discovered device, deduplicating and updating signal / identity.
   */
  private handleDiscoveredDevice(device: Device): void {
    const rawName = device.name || device.localName || '';
    const hasResqService =
      device.serviceUUIDs &&
      device.serviceUUIDs.some(
        uuid => uuid.toLowerCase() === RESQ_MESH_SERVICE_UUID.toLowerCase()
      );

    const isResq = PeerIdentityService.isResqMeshName(rawName) || Boolean(hasResqService);

    const displayName = rawName
      ? rawName
      : isResq
      ? `RESQ-MESH:${device.id.slice(-4).toUpperCase()}`
      : `BLE Node [${device.id.slice(-5)}]`;

    const existing = this.discoveredPeersMap.get(device.id);

    const updatedPeer: BlePeer = {
      id: device.id,
      peerId: isResq ? displayName : device.id,
      name: displayName,
      rssi: device.rssi !== null ? device.rssi : (existing?.rssi ?? null),
      serviceUUIDs: device.serviceUUIDs ?? existing?.serviceUUIDs ?? null,
      connectionState: existing?.connectionState ?? 'discovered',
      lastSeen: Date.now(),
      isResqMeshPeer: isResq,
    };

    this.discoveredPeersMap.set(device.id, updatedPeer);
    this.broadcastPeersList();
  }

  /**
   * Sorts and broadcasts the updated peer list to UI listeners.
   */
  private broadcastPeersList(): void {
    if (!this.onPeersUpdatedCallback) return;

    const list = Array.from(this.discoveredPeersMap.values()).sort((a, b) => {
      // Prioritize recognized RESQ-MESH peers first
      if (a.isResqMeshPeer && !b.isResqMeshPeer) return -1;
      if (!a.isResqMeshPeer && b.isResqMeshPeer) return 1;
      // Then prioritize by strongest RSSI
      const rssiA = a.rssi ?? -999;
      const rssiB = b.rssi ?? -999;
      return rssiB - rssiA;
    });

    this.onPeersUpdatedCallback(list);
  }

  /**
   * Stops real hardware BLE scanning.
   */
  public stopScanning(): void {
    if (this.scanTimeoutTimer) {
      clearTimeout(this.scanTimeoutTimer);
      this.scanTimeoutTimer = null;
    }

    if (this.manager && this.isScanningActive) {
      try {
        this.manager.stopDeviceScan();
      } catch {}
    }

    this.isScanningActive = false;
    if (this.onScanStatusChangedCallback) {
      this.onScanStatusChangedCallback(false);
    }
  }

  /**
   * Connects to a discovered BLE peer (Step 8 basic P2P link).
   */
  public async connectToPeer(deviceId: string): Promise<boolean> {
    if (!this.manager) return false;

    // Stop scanning during connection attempt to conserve radio resources
    if (this.isScanningActive) {
      this.stopScanning();
    }

    const peer = this.discoveredPeersMap.get(deviceId);
    if (peer) {
      peer.connectionState = 'connecting';
      this.broadcastPeersList();
    }

    try {
      const connectedDevice = await this.manager.connectToDevice(deviceId, {
        autoConnect: false,
        timeout: 10000,
      });

      this.activeConnections.set(deviceId, connectedDevice);

      if (peer) {
        peer.connectionState = 'connected';
        this.broadcastPeersList();
      }

      // Register disconnect listener
      connectedDevice.onDisconnected(() => {
        this.activeConnections.delete(deviceId);
        if (peer) {
          peer.connectionState = 'disconnected';
          this.broadcastPeersList();
        }
      });

      return true;
    } catch (e: any) {
      if (peer) {
        peer.connectionState = 'disconnected';
        this.broadcastPeersList();
      }
      if (this.onErrorCallback) {
        this.onErrorCallback(`Connection failed: ${e?.message || e}`);
      }
      return false;
    }
  }

  /**
   * Disconnects from a currently connected BLE peer.
   */
  public async disconnectFromPeer(deviceId: string): Promise<void> {
    const peer = this.discoveredPeersMap.get(deviceId);
    const connection = this.activeConnections.get(deviceId);

    if (connection) {
      try {
        await connection.cancelConnection();
      } catch {}
      this.activeConnections.delete(deviceId);
    }

    if (peer) {
      peer.connectionState = 'disconnected';
      this.broadcastPeersList();
    }
  }

  /**
   * Clears the current discovered peer cache.
   */
  public clearDiscoveredPeers(): void {
    this.discoveredPeersMap.clear();
    this.broadcastPeersList();
  }

  /**
   * Full cleanup on unmount.
   */
  public destroy(): void {
    this.stopScanning();
    if (this.stateSubscription) {
      this.stateSubscription.remove();
      this.stateSubscription = null;
    }

    // Disconnect any active connections cleanly
    this.activeConnections.forEach(async (dev) => {
      try {
        await dev.cancelConnection();
      } catch {}
    });
    this.activeConnections.clear();

    if (this.manager) {
      this.manager.destroy();
      this.manager = null;
    }

    this.onPeersUpdatedCallback = null;
    this.onRadioStateChangedCallback = null;
    this.onScanStatusChangedCallback = null;
    this.onErrorCallback = null;
  }
}

export const bleService = new BleServiceManager();
