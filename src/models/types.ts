/**
 * Core Domain Models & Schemas (Planned Specifications)
 */

export type EmergencyStatusCode = 'TRAPPED' | 'MEDICAL' | 'FOOD_WATER' | 'EVACUATION';

export interface DistressBeaconPayload {
  uuid: string;
  timestamp: number;
  latitude: number;
  longitude: number;
  accuracy: number;
  statusCode: EmergencyStatusCode;
  headcountAdults: number;
  headcountChildren: number;
  headcountInjured: number;
  notes?: string;
  signature?: string;
  publicKey?: string;
}

export interface MeshPacketEnvelope {
  packetId: string;
  originNodeId: string;
  ttl: number;
  hopCount: number;
  timestamp: number;
  payloadType: 'DISTRESS_BEACON' | 'HAZARD_BROADCAST' | 'ACK';
  payload: string; // Base64 or serialized JSON
  signature: string;
}

export interface HazardBroadcastPayload {
  broadcastId: string;
  authorAuthorityId: string;
  timestamp: number;
  expiresAt: number;
  hazardType: 'FLOOD_WARNING' | 'WATER_POINT' | 'SHELTER_OPEN' | 'ROAD_BLOCKED';
  message: string;
  targetGeoBounds?: {
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
  };
  signature: string;
}

export interface PeerNode {
  nodeId: string;
  lastSeenTimestamp: number;
  rssi: number;
  radioType: 'BLE' | 'WIFI_DIRECT';
}
