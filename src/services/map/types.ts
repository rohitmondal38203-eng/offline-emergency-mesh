/**
 * Phase 7 Offline Map: Domain Types & GeoJSON Schemas
 */

export type EmergencyFacilityType =
  | 'SHELTER'
  | 'HOSPITAL'
  | 'SAFE_ZONE'
  | 'HIGH_GROUND'
  | 'EMERGENCY_POINT';

export interface EmergencyLocation {
  id: string;
  name: string;
  type: EmergencyFacilityType;
  latitude: number;
  longitude: number;
  address?: string;
  capacity?: number;
  verified: boolean;
  district: string;
  source: string;
  source_url: string;
  updated_at: string;
}

// GeoJSON Types
export type Position = [number, number]; // [longitude, latitude]

export interface GeoJsonGeometryPoint {
  type: 'Point';
  coordinates: Position;
}

export interface GeoJsonGeometryLineString {
  type: 'LineString';
  coordinates: Position[];
}

export interface GeoJsonGeometryPolygon {
  type: 'Polygon';
  coordinates: Position[][];
}

export interface GeoJsonGeometryMultiPolygon {
  type: 'MultiPolygon';
  coordinates: Position[][][];
}

export type BoundaryGeometry = GeoJsonGeometryPolygon | GeoJsonGeometryMultiPolygon;
export type WaterwayGeometry = GeoJsonGeometryLineString;
export type RoadGeometry = GeoJsonGeometryLineString;

export interface BoundaryProperties {
  id: string;
  name: string;
  admin_level: number;
  boundary_type: 'district' | 'block';
  ref_lgd?: string;
  wikidata?: string;
  source?: string;
}

export interface WaterwayProperties {
  id: string;
  name: string;
  waterway_type: string;
  source?: string;
}

export interface RoadProperties {
  id: string;
  name: string;
  ref?: string;
  highway?: string;
  surface?: string;
  oneway?: boolean;
  source?: string;
}

export interface GeoJsonFeature<G, P> {
  type: 'Feature';
  id?: string;
  geometry: G;
  properties: P;
}

export interface GeoJsonFeatureCollection<G, P> {
  type: 'FeatureCollection';
  name?: string;
  crs?: {
    type: string;
    properties: Record<string, string>;
  };
  features: GeoJsonFeature<G, P>[];
}

export type BoundariesFeatureCollection = GeoJsonFeatureCollection<
  BoundaryGeometry,
  BoundaryProperties
>;
export type WaterwaysFeatureCollection = GeoJsonFeatureCollection<
  WaterwayGeometry,
  WaterwayProperties
>;
export type RoadsFeatureCollection = GeoJsonFeatureCollection<
  RoadGeometry,
  RoadProperties
>;

export interface DatasetStats {
  boundariesCount: number;
  waterwaysCount: number;
  roadsCount: number;
  facilitiesCount: number;
  sheltersCount: number;
  hospitalsCount: number;
  emergencyPointsCount: number;
  safeZonesCount: number;
  highGroundCount: number;
  isReady: boolean;
  loadDurationMs: number;
  error?: string;
}

export interface NearestFacilityResult {
  facility: EmergencyLocation;
  distanceKm: number;
}
