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

import {DeviceEventEmitter, NativeModules} from 'react-native';
import {BleManager, Device, State, Subscription} from 'react-native-ble-plx';
import {
  BlePeer,
  BleRadioState,
  RESQ_MESH_SERVICE_UUID,
  RESQ_MESH_CHARACTERISTIC_UUID,
} from './types';
import {PeerIdentityService} from './peerIdentity';
import {BlePermissions} from './blePermissions';

const SCAN_TIMEOUT_MS = 20000; // 20 seconds automatic scan timeout
const KEEPALIVE_INTERVAL_MS = 4000; // 4 seconds diagnostic keep-alive timer

export class BleServiceManager {
  private manager: BleManager | null = null;
  private stateSubscription: Subscription | null = null;
  private gattConnSubscription: any = null;
  private scanTimeoutTimer: ReturnType<typeof setTimeout> | null = null;

  private isScanningActive = false;
  private discoveredPeersMap = new Map<string, BlePeer>();
  private activeConnections = new Map<string, Device>();
  private connectingPeers = new Set<string>();
  private keepAliveTimers = new Map<string, ReturnType<typeof setInterval>>();
  private isKeepAliveInProgress = new Map<string, boolean>();
  private reverseConnectTimers = new Map<string, ReturnType<typeof setTimeout>>();

  private onPeersUpdatedCallback: ((peers: BlePeer[]) => void) | null = null;
  private onRadioStateChangedCallback: ((state: BleRadioState) => void) | null = null;
  private onScanStatusChangedCallback: ((isScanning: boolean) => void) | null = null;
  private onErrorCallback: ((error: string) => void) | null = null;
  private onDeviceConnectedCallback: ((device: Device) => void) | null = null;

  public setOnDeviceConnected(callback: ((device: Device) => void) | null): void {
    this.onDeviceConnectedCallback = callback;
  }

  /**
   * Returns the underlying BleManager instance for GATT operations.
   */
  public getBleManager(): BleManager | null {
    if (!this.manager) {
      this.initialize();
    }
    return this.manager;
  }

  /**
   * Returns list of currently discovered peers, prioritizing connected links and RESQ nodes.
   */
  public getDiscoveredPeers(): BlePeer[] {
    return Array.from(this.discoveredPeersMap.values()).sort((a, b) => {
      // 1. Prioritize active connected links first
      if (a.connectionState === 'connected' && b.connectionState !== 'connected') return -1;
      if (a.connectionState !== 'connected' && b.connectionState === 'connected') return 1;
      // 2. Prioritize recognized RESQ-MESH protocol nodes
      if (a.isResqMeshPeer && !b.isResqMeshPeer) return -1;
      if (!a.isResqMeshPeer && b.isResqMeshPeer) return 1;
      // 3. Prioritize by strongest RSSI
      const rssiA = a.rssi ?? -999;
      const rssiB = b.rssi ?? -999;
      return rssiB - rssiA;
    });
  }

  /**
   * Returns the active connected Device instance for a given peer ID, if connected.
   */
  public getActiveDevice(deviceId: string): Device | undefined {
    const peer = this.getPeer(deviceId);
    const target = (peer ? peer.id : deviceId).toUpperCase();
    return (
      this.activeConnections.get(target) ||
      this.activeConnections.get(deviceId) ||
      this.activeConnections.get(deviceId.toUpperCase()) ||
      this.activeConnections.get(deviceId.toLowerCase())
    );
  }

  /**
   * Checks if a device is currently connected in our active connections map.
   */
  public isPeerConnected(deviceId: string): boolean {
    const peer = this.getPeer(deviceId);
    const target = (peer ? peer.id : deviceId).toUpperCase();
    return (
      this.activeConnections.has(target) ||
      this.activeConnections.has(deviceId) ||
      this.activeConnections.has(deviceId.toUpperCase()) ||
      this.activeConnections.has(deviceId.toLowerCase())
    );
  }

  /**
   * Checks if a device is currently in the process of establishing a connection.
   */
  public isPeerConnecting(deviceId: string): boolean {
    const peer = this.getPeer(deviceId);
    const target = (peer ? peer.id : deviceId).toUpperCase();
    return (
      this.connectingPeers.has(target) ||
      this.connectingPeers.has(deviceId) ||
      this.connectingPeers.has(deviceId.toUpperCase()) ||
      this.connectingPeers.has(deviceId.toLowerCase())
    );
  }

  /**
   * Finds a peer in discoveredPeersMap across case variations and peer identities.
   */
  public getPeer(deviceId: string): BlePeer | undefined {
    const key = deviceId.toUpperCase();
    const direct =
      this.discoveredPeersMap.get(key) ||
      this.discoveredPeersMap.get(deviceId) ||
      this.discoveredPeersMap.get(deviceId.toLowerCase());
    if (direct) return direct;

    for (const p of this.discoveredPeersMap.values()) {
      if (
        p.id.toUpperCase() === key ||
        p.peerId.toUpperCase() === key ||
        p.name.toUpperCase() === key
      ) {
        return p;
      }
    }
    return undefined;
  }

  /**
   * Initializes the BleManager singleton and begins radio state observation.
   */
  public initialize(
    onRadioStateChange?: (state: BleRadioState) => void
  ): void {
    this.ensureGattSubscription();

    if (this.manager) {
      if (onRadioStateChange) {
        this.onRadioStateChangedCallback = onRadioStateChange;
      }
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

  private ensureGattSubscription(): void {
    if (!this.gattConnSubscription) {
      this.gattConnSubscription = DeviceEventEmitter.addListener(
        'onMeshGattConnectionChange',
        (event: {
          deviceAddress: string;
          deviceName?: string;
          connected: boolean;
        }) => {
          this.handleIncomingGattConnectionChange(
            event.deviceAddress,
            event.connected,
            event.deviceName
          );
        }
      );
    }
  }

  /**
   * Handles incoming GATT connection state changes emitted by the native GATT Server.
   */
  public handleIncomingGattConnectionChange(
    deviceAddress: string,
    connected: boolean,
    deviceName?: string
  ): void {
    const normAddress = deviceAddress.toUpperCase();
    console.log(
      `[BLE] INCOMING_GATT_CONNECTION device=${normAddress} connected=${connected} name=${deviceName || 'unknown'}`
    );

    if (connected) {
      let peer = this.getPeer(normAddress);
      const rawName = deviceName || peer?.name || '';
      const isResq = PeerIdentityService.isResqMeshName(rawName);

      // Never fabricate an ID. If identity cannot be known immediately,
      // temporarily register real remote BLE address.
      const displayName = isResq ? rawName : (rawName || normAddress);

      if (!peer) {
        peer = {
          id: normAddress,
          peerId: displayName,
          name: displayName,
          rssi: -50,
          serviceUUIDs: [RESQ_MESH_SERVICE_UUID],
          connectionState: 'connected',
          lastSeen: Date.now(),
          isResqMeshPeer: isResq,
        };
        this.discoveredPeersMap.set(normAddress, peer);
      } else {
        peer.connectionState = 'connected';
        peer.lastSeen = Date.now();
        if (isResq) {
          peer.peerId = displayName;
          peer.name = displayName;
          peer.isResqMeshPeer = true;
        } else if (!peer.name || !PeerIdentityService.isResqMeshName(peer.name)) {
          peer.name = displayName;
          peer.peerId = displayName;
        }
      }
      this.broadcastPeersList();

      // Proactively establish reverse GATT client connection after brief delay
      // to allow remote client's initial discovery to settle
      this.scheduleReverseGattClientConnection(normAddress);
    } else {
      this.stopKeepAlive(normAddress);
      console.log(`[BLE] DISCONNECT device=${normAddress}`);
      console.log(`[BLE] DISCONNECT_REASON: Remote peer disconnected from GATT server`);

      this.activeConnections.delete(normAddress);
      this.activeConnections.delete(deviceAddress);
      this.activeConnections.delete(deviceAddress.toLowerCase());

      const peer = this.getPeer(normAddress);
      if (peer) {
        peer.connectionState = 'disconnected';
        this.broadcastPeersList();
      }
    }
  }

  /**
   * Schedules establishing the reverse GATT client connection to a connected peer
   * so that outbound writes can be performed directly over the existing physical link.
   */
  public scheduleReverseGattClientConnection(deviceAddress: string): void {
    const key = deviceAddress.toLowerCase();
    if (this.reverseConnectTimers.has(key)) {
      clearTimeout(this.reverseConnectTimers.get(key)!);
    }

    const timer = setTimeout(async () => {
      this.reverseConnectTimers.delete(key);

      // Verify device is still marked connected in peer map
      const peer = this.getPeer(deviceAddress);
      if (!peer || peer.connectionState !== 'connected') {
        return;
      }

      // Check if connection already exists or is in progress
      if (this.isPeerConnected(deviceAddress) || this.isPeerConnecting(deviceAddress)) {
        return;
      }

      console.log(`[BLE] REVERSE_GATT_CLIENT_CONNECT starting device=${deviceAddress}`);
      try {
        await this.connectToPeer(deviceAddress);
        console.log(`[BLE] REVERSE_GATT_CLIENT_CONNECT success device=${deviceAddress}`);
      } catch (err: any) {
        console.log(
          `[BLE] REVERSE_GATT_CLIENT_CONNECT note: will connect on demand if needed (${err?.message || err})`
        );
      }
    }, 600);

    this.reverseConnectTimers.set(key, timer);
  }

  /**
   * Registers or updates a peer identity when an incoming packet reveals the sender's originNodeId.
   */
  public registerPeerIdentity(deviceId: string, peerId: string): void {
    const normAddress = deviceId.toUpperCase();
    console.log(`[BLE] registerPeerIdentity: device=${normAddress} peerId=${peerId}`);
    let peer = this.getPeer(normAddress);
    if (peer) {
      peer.peerId = peerId;
      peer.name = peerId;
      peer.isResqMeshPeer = true;
      peer.connectionState = 'connected';
      peer.lastSeen = Date.now();
    } else {
      peer = {
        id: normAddress,
        peerId: peerId,
        name: peerId,
        rssi: -50,
        serviceUUIDs: [RESQ_MESH_SERVICE_UUID],
        connectionState: 'connected',
        lastSeen: Date.now(),
        isResqMeshPeer: true,
      };
      this.discoveredPeersMap.set(normAddress, peer);
    }
    this.broadcastPeersList();

    if (!this.isPeerConnected(normAddress) && !this.isPeerConnecting(normAddress)) {
      this.scheduleReverseGattClientConnection(normAddress);
    }
  }

  /**
   * Registers an externally established active Device instance in activeConnections map.
   */
  public registerActiveDevice(deviceId: string, device: Device): void {
    this.activeConnections.set(deviceId, device);
    this.activeConnections.set(deviceId.toUpperCase(), device);
    this.activeConnections.set(deviceId.toLowerCase(), device);

    let peer = this.getPeer(deviceId);
    if (!peer) {
      const displayName = `RESQ Node [${deviceId.slice(-5)}]`;
      peer = {
        id: deviceId,
        peerId: displayName,
        name: displayName,
        rssi: -50,
        serviceUUIDs: [RESQ_MESH_SERVICE_UUID],
        connectionState: 'connected',
        lastSeen: Date.now(),
        isResqMeshPeer: true,
      };
      this.discoveredPeersMap.set(deviceId, peer);
    } else {
      peer.connectionState = 'connected';
      peer.lastSeen = Date.now();
    }
    this.broadcastPeersList();
    this.startKeepAlive(deviceId, device);
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
   * Sets callback listeners for UI subscription and immediately emits current radio, scan, and peer states.
   */
  public setListeners(listeners: {
    onPeersUpdated?: (peers: BlePeer[]) => void;
    onRadioStateChanged?: (state: BleRadioState) => void;
    onScanStatusChanged?: (isScanning: boolean) => void;
    onError?: (error: string) => void;
  }): void {
    console.log('[BLE] peer subscription attached');
    if (listeners.onPeersUpdated) {
      this.onPeersUpdatedCallback = listeners.onPeersUpdated;
      // Immediately emit currently known peers to newly attached subscriber
      const currentPeers = this.getDiscoveredPeers();
      listeners.onPeersUpdated(currentPeers);
    }
    if (listeners.onRadioStateChanged) {
      this.onRadioStateChangedCallback = listeners.onRadioStateChanged;
      this.getRadioState().then(st => {
        if (this.onRadioStateChangedCallback) {
          this.onRadioStateChangedCallback(st);
        }
      });
    }
    if (listeners.onScanStatusChanged) {
      this.onScanStatusChangedCallback = listeners.onScanStatusChanged;
      listeners.onScanStatusChanged(this.isScanningActive);
    }
    if (listeners.onError) {
      this.onErrorCallback = listeners.onError;
    }
  }

  /**
   * Detaches UI callback listeners without stopping scanning or tearing down connections.
   */
  public removeListeners(): void {
    console.log('[BLE] peer subscription detached');
    this.onPeersUpdatedCallback = null;
    this.onRadioStateChangedCallback = null;
    this.onScanStatusChangedCallback = null;
    this.onErrorCallback = null;
  }

  /**
   * Returns whether BLE scanning is currently active.
   */
  public getIsScanning(): boolean {
    return this.isScanningActive;
  }

  /**
   * Returns list of currently connected device IDs.
   */
  public getConnectedPeerIds(): string[] {
    return Array.from(this.activeConnections.keys());
  }

  /**
   * Starts real hardware BLE scanning for nearby devices.
   */
  public async startScanning(caller = 'user'): Promise<void> {
    console.log(`[BLE] START_SCAN caller=${caller}`);
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
      this.stopScanning('restart');
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
      this.stopScanning('timeout');
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
    const normId = device.id.toUpperCase();
    const rawName = device.name || device.localName || '';
    const hasResqService =
      device.serviceUUIDs &&
      device.serviceUUIDs.some(
        uuid => uuid.toLowerCase() === RESQ_MESH_SERVICE_UUID.toLowerCase()
      );

    const existing = this.getPeer(normId);
    const existingIsResq = existing ? PeerIdentityService.isResqMeshName(existing.name) : false;

    let isResq = false;
    let displayName = '';

    if (existingIsResq && existing) {
      // Retain resolved RESQ-MESH name
      isResq = true;
      displayName = existing.name;
    } else if (PeerIdentityService.isResqMeshName(rawName)) {
      isResq = true;
      displayName = rawName;
    } else {
      isResq = Boolean(hasResqService);
      displayName = rawName || normId;
    }

    const updatedPeer: BlePeer = {
      id: normId,
      peerId: isResq ? displayName : (existing?.peerId || displayName),
      name: displayName,
      rssi: device.rssi !== null ? device.rssi : (existing?.rssi ?? null),
      serviceUUIDs: device.serviceUUIDs ?? existing?.serviceUUIDs ?? null,
      connectionState: existing?.connectionState ?? 'discovered',
      lastSeen: Date.now(),
      isResqMeshPeer: isResq,
    };

    this.discoveredPeersMap.set(normId, updatedPeer);
    this.broadcastPeersList();
  }

  /**
   * Sorts and broadcasts the updated peer list to UI listeners.
   */
  private broadcastPeersList(): void {
    if (!this.onPeersUpdatedCallback) return;
    const list = this.getDiscoveredPeers();
    this.onPeersUpdatedCallback(list);
  }

  /**
   * Stops real hardware BLE scanning.
   */
  public stopScanning(caller = 'user'): void {
    console.log(`[BLE] STOP_SCAN activeScan=${this.isScanningActive} caller=${caller}`);
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

    let peer = this.getPeer(deviceId);
    const normId = (peer ? peer.id : deviceId).toUpperCase();

    // Check if device is already actively connected
    if (this.isPeerConnected(normId)) {
      console.log(`[BLE] CONNECT: device=${normId} already actively connected, reusing link`);
      return true;
    }

    if (this.isPeerConnecting(normId)) {
      console.log(`[BLE] CONNECT: connection already in progress device=${normId}`);
      return false;
    }

    // Stop scanning during connection attempt to conserve radio resources
    if (this.isScanningActive) {
      this.stopScanning();
    }

    if (!peer) {
      peer = this.getPeer(normId);
    }
    if (!peer) {
      peer = {
        id: normId,
        peerId: normId,
        name: normId,
        rssi: -50,
        serviceUUIDs: [RESQ_MESH_SERVICE_UUID],
        connectionState: 'connecting',
        lastSeen: Date.now(),
        isResqMeshPeer: false,
      };
      this.discoveredPeersMap.set(normId, peer);
      this.broadcastPeersList();
    } else {
      peer.connectionState = 'connecting';
      this.broadcastPeersList();
    }

    console.log(`[BLE] CONNECT_START device=${normId}`);
    this.connectingPeers.add(normId);
    this.connectingPeers.add(deviceId);
    this.connectingPeers.add(deviceId.toLowerCase());

    try {
      const connectedDevice = await this.manager.connectToDevice(normId, {
        autoConnect: false,
        timeout: 30000,
      });

      console.log(`[BLE] CONNECT_SUCCESS device=${normId}`);

      this.activeConnections.set(normId, connectedDevice);
      this.activeConnections.set(deviceId, connectedDevice);
      this.activeConnections.set(deviceId.toLowerCase(), connectedDevice);

      // Perform immediate service discovery and request high connection priority
      // to keep GATT link active and prevent 15-20s idle supervision timeout
      console.log(`[BLE] DISCOVER_SERVICES device=${normId}`);
      try {
        try {
          await connectedDevice.requestMTU(256);
        } catch {}
        await connectedDevice.discoverAllServicesAndCharacteristics();
        await connectedDevice.requestConnectionPriority(1); // 1 = ConnectionPriority.High
        console.log(`[BLE] DISCOVER_SERVICES success device=${normId}`);
      } catch (discErr: any) {
        console.warn(`[BLE] DISCOVER_SERVICES warning device=${normId}:`, discErr?.message || discErr);
      }

      if (peer) {
        peer.connectionState = 'connected';
        this.broadcastPeersList();
      }

      // Start diagnostic keep-alive experiment (periodic lightweight GATT read every 4s)
      this.startKeepAlive(normId, connectedDevice);

      // Notify connection established listener (for identity handshake)
      if (this.onDeviceConnectedCallback) {
        try {
          this.onDeviceConnectedCallback(connectedDevice);
        } catch (connCbErr: any) {
          console.warn(`[BLE] onDeviceConnectedCallback error:`, connCbErr);
        }
      }

      // Register disconnect listener with reason logging
      connectedDevice.onDisconnected((error: any) => {
        this.stopKeepAlive(normId);
        console.log(`[BLE] DISCONNECT device=${normId}`);
        const reason = error?.message || error?.errorCode || (error ? JSON.stringify(error) : 'Remote peer or connection closed');
        console.log(`[BLE] DISCONNECT_REASON: ${reason}`);

        this.activeConnections.delete(normId);
        this.activeConnections.delete(deviceId);
        this.activeConnections.delete(deviceId.toLowerCase());

        if (peer) {
          peer.connectionState = 'disconnected';
          this.broadcastPeersList();
        }
      });

      return true;
    } catch (e: any) {
      this.stopKeepAlive(normId);
      console.log(`[BLE] DISCONNECT device=${normId}`);
      console.log(`[BLE] DISCONNECT_REASON: Connection attempt failed - ${e?.message || e}`);

      if (peer) {
        peer.connectionState = 'disconnected';
        this.broadcastPeersList();
      }
      if (this.onErrorCallback) {
        this.onErrorCallback(`Connection failed: ${e?.message || e}`);
      }
      return false;
    } finally {
      this.connectingPeers.delete(normId);
      this.connectingPeers.delete(deviceId);
      this.connectingPeers.delete(deviceId.toLowerCase());
    }
  }

  /**
   * Disconnects from a currently connected BLE peer.
   */
  public async disconnectFromPeer(deviceId: string): Promise<void> {
    const peer = this.getPeer(deviceId);
    const normId = (peer ? peer.id : deviceId).toUpperCase();
    this.stopKeepAlive(normId);
    const connection = this.getActiveDevice(normId);

    if (connection) {
      try {
        await connection.cancelConnection();
      } catch {}
      this.activeConnections.delete(normId);
      this.activeConnections.delete(deviceId);
      this.activeConnections.delete(deviceId.toLowerCase());
    }

    // Cancel server-side connection via NativeModule if present
    if (NativeModules.ResqBleAdvertiser?.disconnectDevice) {
      try {
        await NativeModules.ResqBleAdvertiser.disconnectDevice(normId);
      } catch {}
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
   * Starts a diagnostic keep-alive timer on the central connection.
   * Periodically performs a lightweight GATT read of the mesh characteristic every 4s
   * to produce real ATT over-the-air traffic and verify if it prevents Android GATT idle disconnects.
   */
  private startKeepAlive(deviceId: string, device: Device): void {
    this.stopKeepAlive(deviceId);

    console.log(`[BLE] KEEPALIVE_START device=${deviceId}`);

    const key = deviceId.toLowerCase();
    const timer = setInterval(async () => {
      // Check if connection is still active
      if (!this.getActiveDevice(deviceId)) {
        this.stopKeepAlive(deviceId);
        return;
      }

      if (this.isKeepAliveInProgress.get(key)) {
        return;
      }

      this.isKeepAliveInProgress.set(key, true);
      console.log(`[BLE] KEEPALIVE_TICK device=${deviceId}`);

      try {
        await device.readCharacteristicForService(
          RESQ_MESH_SERVICE_UUID,
          RESQ_MESH_CHARACTERISTIC_UUID
        );
        console.log(`[BLE] KEEPALIVE_SUCCESS device=${deviceId}`);
      } catch (err: any) {
        console.log(`[BLE] KEEPALIVE_FAIL device=${deviceId} error=${err?.message || err}`);
      } finally {
        this.isKeepAliveInProgress.delete(key);
      }
    }, KEEPALIVE_INTERVAL_MS);

    this.keepAliveTimers.set(key, timer);
  }

  /**
   * Cleanly stops the diagnostic keep-alive timer for a device.
   */
  private stopKeepAlive(deviceId: string): void {
    const key = deviceId.toLowerCase();
    const timer = this.keepAliveTimers.get(key);
    if (timer) {
      clearInterval(timer);
      this.keepAliveTimers.delete(key);
      this.isKeepAliveInProgress.delete(key);
      console.log(`[BLE] KEEPALIVE_STOP device=${deviceId}`);
    }
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
    if (this.gattConnSubscription) {
      this.gattConnSubscription.remove();
      this.gattConnSubscription = null;
    }
    for (const [id, timer] of this.reverseConnectTimers.entries()) {
      clearTimeout(timer);
    }
    this.reverseConnectTimers.clear();

    // Stop all keep-alive timers cleanly
    for (const [id, timer] of this.keepAliveTimers.entries()) {
      clearInterval(timer);
      console.log(`[BLE] KEEPALIVE_STOP device=${id}`);
    }
    this.keepAliveTimers.clear();
    this.isKeepAliveInProgress.clear();

    // Disconnect any active connections cleanly
    this.activeConnections.forEach(async (dev) => {
      try {
        console.log(`[BLE] CANCEL_CONNECTION device=${dev.id} caller=bleService.destroy`);
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
