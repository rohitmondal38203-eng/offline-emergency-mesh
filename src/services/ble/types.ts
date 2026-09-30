/**
 * BLE Mesh & P2P Link Data Types
 * Phase 3: BLE Discovery & Basic P2P Presence
 */

export type BleRadioState =
  | 'POWERED_ON'
  | 'POWERED_OFF'
  | 'UNAUTHORIZED'
  | 'UNSUPPORTED'
  | 'RESETTING'
  | 'UNKNOWN';

export type BlePermissionStatus =
  | 'GRANTED'
  | 'DENIED'
  | 'NEVER_ASK_AGAIN'
  | 'CHECKING';

export type PeerConnectionStatus =
  | 'discovered'
  | 'connecting'
  | 'connected'
  | 'disconnected';

export interface BlePeer {
  /** Unique hardware identifier (Android MAC address or iOS UUID) */
  id: string;
  /** RESQ-MESH local identity tag (e.g. RESQ-MESH:7F3A or device name) */
  peerId: string;
  /** Advertised name */
  name: string;
  /** Received Signal Strength Indicator in dBm */
  rssi: number | null;
  /** Discovered Service UUIDs */
  serviceUUIDs: string[] | null;
  /** Link state */
  connectionState: PeerConnectionStatus;
  /** Milliseconds epoch timestamp of latest packet reception */
  lastSeen: number;
  /** Whether the peer is recognized as a RESQ-MESH protocol node */
  isResqMeshPeer: boolean;
}

export interface BleDiscoveryState {
  bluetoothState: BleRadioState;
  permissionStatus: BlePermissionStatus;
  isScanning: boolean;
  isAdvertising: boolean;
  advertisingSupported: boolean;
  localPeerId: string;
  peers: BlePeer[];
  errorMessage: string | null;
}

/** Standard RESQ-MESH BLE 128-bit Service UUID */
export const RESQ_MESH_SERVICE_UUID = '0000fd08-0000-1000-8000-00805f9b34fb';
