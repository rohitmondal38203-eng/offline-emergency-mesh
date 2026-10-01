/**
 * Phase 4: Mesh Message Domain Models & Routing Types
 */

export type MeshMessageType =
  | 'TEST'
  | 'TEXT'
  | 'DISTRESS_BEACON'
  | 'HAZARD_BROADCAST'
  | 'ACK';

export type MessageDeliveryStatus =
  | 'PENDING'
  | 'FORWARDED'
  | 'DELIVERED'
  | 'EXPIRED';

/**
 * Structured Payload for DISTRESS_BEACON
 */
export interface DistressBeaconPayload {
  emergencyType: string;
  count: number;
  notes?: string;
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: number;
  };
}

/**
 * Phase 7: Local Hazard Broadcast Types
 */
export type HazardType =
  | 'FLOOD'
  | 'FIRE'
  | 'ROAD_BLOCKED'
  | 'BUILDING_COLLAPSE'
  | 'LANDSLIDE'
  | 'OTHER';

export type HazardSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface HazardLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export interface HazardBroadcastPayload {
  hazardType: HazardType;
  severity: HazardSeverity;
  title?: string;
  message: string;
  location?: HazardLocation;
  expiresAt?: number;
}

/**
 * Standard Application-Layer Mesh Message
 */
export interface MeshMessage {
  /** Globally unique identifier for this message */
  messageId: string;
  /** Originating peer identity tag (e.g. RESQ-MESH:7F3A) */
  originNodeId: string;
  /** Destination peer identity, or undefined / 'BROADCAST' for flood routing */
  destinationNodeId?: string;
  /** Generic payload classification */
  messageType: MeshMessageType;
  /** Epoch milliseconds timestamp when message was created */
  createdAt: number;
  /** Remaining hop budget (Time-To-Live) */
  ttl: number;
  /** Number of hops traversed across intermediate relay nodes */
  hopCount: number;
  /** Generic payload (structured object or UTF-8 string) */
  payload: Record<string, any> | string;
}

/**
 * Persisted Mesh Queue Entry
 */
export interface StoredMeshMessage {
  message: MeshMessage;
  status: MessageDeliveryStatus;
  receivedAt: number;
  /** Addresses or peer IDs this node has successfully transmitted this message to */
  forwardedToPeers: string[];
  /** Peer address/ID that directly delivered this packet to us */
  lastHopSender?: string;
  /** Timestamp of most recent transmission attempt (for retry backoff) */
  lastAttemptAt?: number;
  /** Failure reason if last delivery attempt failed */
  lastError?: string;
}

/**
 * Live Mesh Telemetry for Debugging & Demonstrations
 */
export interface MeshTelemetry {
  localNodeId: string;
  totalMessages: number;
  pendingCount: number;
  forwardedCount: number;
  deliveredCount: number;
  expiredCount: number;
  lastReceivedMessage: MeshMessage | null;
  lastForwardedMessage: MeshMessage | null;
}

/**
 * Standard RESQ-MESH GATT Service and Characteristic UUIDs
 */
export const MESH_SERVICE_UUID = '0000fd08-0000-1000-8000-00805f9b34fb';
export const MESH_CHARACTERISTIC_UUID = '0000fd09-0000-1000-8000-00805f9b34fb';

/** Configurable Routing Limits */
export const DEFAULT_TTL = 5;
export const MAX_HOPS = 10;
export const RETRY_BACKOFF_MS = 5000; // 5-second minimum interval between peer relay retries
export const MESSAGE_MAX_AGE_MS = 86400000; // 24 hours expiry
