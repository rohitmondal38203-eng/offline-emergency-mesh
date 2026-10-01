import {NativeModules, Platform} from 'react-native';
import {
  BoundariesFeatureCollection,
  DatasetStats,
  EmergencyFacilityType,
  EmergencyLocation,
  NearestFacilityResult,
  RoadsFeatureCollection,
  WaterwaysFeatureCollection,
} from './types';

const {ResqMapAssetModule} = NativeModules;

// Geographic bounds for South 24 Parganas validation
const S24P_VALIDATION_BBOX = {
  minLat: 21.0,
  maxLat: 23.0,
  minLon: 87.5,
  maxLon: 89.5,
};

export class MapServiceManager {
  private boundaries: BoundariesFeatureCollection | null = null;
  private waterways: WaterwaysFeatureCollection | null = null;
  private roads: RoadsFeatureCollection | null = null;
  private facilities: EmergencyLocation[] = [];

  private isLoaded = false;
  private isLoading = false;
  private stats: DatasetStats = {
    boundariesCount: 0,
    waterwaysCount: 0,
    roadsCount: 0,
    facilitiesCount: 0,
    sheltersCount: 0,
    hospitalsCount: 0,
    emergencyPointsCount: 0,
    safeZonesCount: 0,
    highGroundCount: 0,
    isReady: false,
    loadDurationMs: 0,
  };

  /**
   * Loads and validates all bundled South 24 Parganas offline map datasets.
   * Caches results in memory for zero-lag subsequent access.
   */
  public async loadOfflineMapDataset(): Promise<DatasetStats> {
    if (this.isLoaded) {
      return this.stats;
    }

    if (this.isLoading) {
      // Wait for in-flight load
      while (this.isLoading) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      return this.stats;
    }

    this.isLoading = true;
    const startTime = Date.now();

    try {
      if (Platform.OS !== 'android' || !ResqMapAssetModule?.loadAsset) {
        throw new Error(
          'Native ResqMapAssetModule is not registered or unavailable on this platform.'
        );
      }

      // 1. Load & validate Facilities JSON
      const rawFacilities: string = await ResqMapAssetModule.loadAsset(
        'offline_map/s24p_facilities.json'
      );
      this.facilities = this.parseAndValidateFacilities(rawFacilities);

      // 2. Load & validate Boundaries GeoJSON
      const rawBoundaries: string = await ResqMapAssetModule.loadAsset(
        'offline_map/s24p_boundaries.geojson'
      );
      this.boundaries = this.parseAndValidateGeoJson<BoundariesFeatureCollection>(
        rawBoundaries,
        's24p_boundaries.geojson'
      );

      // 3. Load & validate Waterways GeoJSON
      const rawWaterways: string = await ResqMapAssetModule.loadAsset(
        'offline_map/s24p_waterways.geojson'
      );
      this.waterways = this.parseAndValidateGeoJson<WaterwaysFeatureCollection>(
        rawWaterways,
        's24p_waterways.geojson'
      );

      // 4. Load & validate Roads GeoJSON
      const rawRoads: string = await ResqMapAssetModule.loadAsset(
        'offline_map/s24p_roads.geojson'
      );
      this.roads = this.parseAndValidateGeoJson<RoadsFeatureCollection>(
        rawRoads,
        's24p_roads.geojson'
      );

      // Compute statistics
      let sheltersCount = 0;
      let hospitalsCount = 0;
      let emergencyPointsCount = 0;
      let safeZonesCount = 0;
      let highGroundCount = 0;

      this.facilities.forEach(f => {
        switch (f.type) {
          case 'SHELTER':
            sheltersCount++;
            break;
          case 'HOSPITAL':
            hospitalsCount++;
            break;
          case 'EMERGENCY_POINT':
            emergencyPointsCount++;
            break;
          case 'SAFE_ZONE':
            safeZonesCount++;
            break;
          case 'HIGH_GROUND':
            highGroundCount++;
            break;
        }
      });

      this.stats = {
        boundariesCount: this.boundaries.features.length,
        waterwaysCount: this.waterways.features.length,
        roadsCount: this.roads.features.length,
        facilitiesCount: this.facilities.length,
        sheltersCount,
        hospitalsCount,
        emergencyPointsCount,
        safeZonesCount,
        highGroundCount,
        isReady: true,
        loadDurationMs: Date.now() - startTime,
      };

      this.isLoaded = true;
      console.log(
        `[MapService] Dataset loaded in ${this.stats.loadDurationMs}ms: boundaries=${this.stats.boundariesCount} waterways=${this.stats.waterwaysCount} roads=${this.stats.roadsCount} facilities=${this.stats.facilitiesCount}`
      );
      return this.stats;
    } catch (e: any) {
      const errorMsg = e?.message || 'Unknown error loading map dataset';
      console.error('[MapService] Failed to load offline map dataset:', errorMsg);
      this.stats = {
        ...this.stats,
        isReady: false,
        error: errorMsg,
        loadDurationMs: Date.now() - startTime,
      };
      return this.stats;
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Validates and parses Facilities JSON according to the approved schema.
   */
  private parseAndValidateFacilities(rawJson: string): EmergencyLocation[] {
    let parsed: any;
    try {
      parsed = JSON.parse(rawJson);
    } catch (err: any) {
      throw new Error(`Invalid JSON syntax in s24p_facilities.json: ${err.message}`);
    }

    if (!Array.isArray(parsed)) {
      throw new Error(
        's24p_facilities.json must contain an array of EmergencyLocation objects.'
      );
    }

    const seenIds = new Set<string>();
    const validated: EmergencyLocation[] = [];

    for (let i = 0; i < parsed.length; i++) {
      const item = parsed[i];

      // Required fields check
      if (!item.id || typeof item.id !== 'string') {
        throw new Error(
          `s24p_facilities.json: Record at index ${i} is missing required 'id'.`
        );
      }
      if (seenIds.has(item.id)) {
        throw new Error(
          `s24p_facilities.json: Duplicate facility ID '${item.id}' detected.`
        );
      }
      seenIds.add(item.id);

      if (!item.name || typeof item.name !== 'string') {
        throw new Error(
          `s24p_facilities.json: Record '${item.id}' is missing required 'name'.`
        );
      }
      if (
        !item.type ||
        !['SHELTER', 'HOSPITAL', 'SAFE_ZONE', 'HIGH_GROUND', 'EMERGENCY_POINT'].includes(
          item.type
        )
      ) {
        throw new Error(
          `s24p_facilities.json: Record '${item.id}' has invalid facility type '${item.type}'.`
        );
      }
      if (
        typeof item.latitude !== 'number' ||
        isNaN(item.latitude) ||
        typeof item.longitude !== 'number' ||
        isNaN(item.longitude)
      ) {
        throw new Error(
          `s24p_facilities.json: Record '${item.id}' has non-numeric coordinates.`
        );
      }

      // Coordinate range check
      if (
        item.latitude < S24P_VALIDATION_BBOX.minLat ||
        item.latitude > S24P_VALIDATION_BBOX.maxLat ||
        item.longitude < S24P_VALIDATION_BBOX.minLon ||
        item.longitude > S24P_VALIDATION_BBOX.maxLon
      ) {
        throw new Error(
          `s24p_facilities.json: Record '${item.id}' has coordinates (${item.latitude}, ${item.longitude}) outside South 24 Parganas territory.`
        );
      }

      if (!item.source || typeof item.source !== 'string') {
        throw new Error(
          `s24p_facilities.json: Record '${item.id}' is missing required 'source'.`
        );
      }

      validated.push({
        id: item.id,
        name: item.name,
        type: item.type as EmergencyFacilityType,
        latitude: item.latitude,
        longitude: item.longitude,
        address: typeof item.address === 'string' ? item.address : undefined,
        capacity: typeof item.capacity === 'number' ? item.capacity : undefined,
        verified: Boolean(item.verified),
        district: item.district || 'South 24 Parganas',
        source: item.source,
        source_url: item.source_url || '',
        updated_at: item.updated_at || new Date().toISOString(),
      });
    }

    return validated;
  }

  /**
   * Validates and parses a standard GeoJSON FeatureCollection.
   */
  private parseAndValidateGeoJson<T>(rawJson: string, filename: string): T {
    let parsed: any;
    try {
      parsed = JSON.parse(rawJson);
    } catch (err: any) {
      throw new Error(`Invalid JSON syntax in ${filename}: ${err.message}`);
    }

    if (parsed.type !== 'FeatureCollection') {
      throw new Error(
        `${filename} root type must be 'FeatureCollection', got '${parsed.type}'.`
      );
    }

    if (!Array.isArray(parsed.features)) {
      throw new Error(`${filename} is missing 'features' array.`);
    }

    if (parsed.features.length === 0) {
      throw new Error(`${filename} features array is empty.`);
    }

    // Spot-check first feature structure
    const sampleFeature = parsed.features[0];
    if (sampleFeature.type !== 'Feature' || !sampleFeature.geometry) {
      throw new Error(
        `${filename}: First element is not a valid GeoJSON Feature.`
      );
    }

    return parsed as T;
  }

  // ==========================================
  // GETTERS
  // ==========================================

  public getBoundaries(): BoundariesFeatureCollection | null {
    return this.boundaries;
  }

  public getWaterways(): WaterwaysFeatureCollection | null {
    return this.waterways;
  }

  public getRoads(): RoadsFeatureCollection | null {
    return this.roads;
  }

  public getFacilities(): EmergencyLocation[] {
    return this.facilities;
  }

  public getShelters(): EmergencyLocation[] {
    return this.facilities.filter(f => f.type === 'SHELTER');
  }

  public getHospitals(): EmergencyLocation[] {
    return this.facilities.filter(f => f.type === 'HOSPITAL');
  }

  public getEmergencyPoints(): EmergencyLocation[] {
    return this.facilities.filter(f => f.type === 'EMERGENCY_POINT');
  }

  public getDatasetStats(): DatasetStats {
    return this.stats;
  }

  /**
   * Offline Haversine distance calculator.
   * Returns distance in kilometers between two GPS coordinates.
   */
  public calculateDistanceKm(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's mean radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 100) / 100;
  }

  /**
   * Locates the nearest emergency facility to a given offline coordinate fix.
   * Runs 100% locally in memory with zero network requests.
   */
  public getNearestFacility(
    latitude: number,
    longitude: number,
    type?: EmergencyFacilityType
  ): NearestFacilityResult | null {
    if (this.facilities.length === 0) {
      return null;
    }

    const candidateList = type
      ? this.facilities.filter(f => f.type === type)
      : this.facilities;

    if (candidateList.length === 0) {
      return null;
    }

    let nearest: EmergencyLocation | null = null;
    let minDistance = Infinity;

    for (const fac of candidateList) {
      const dist = this.calculateDistanceKm(
        latitude,
        longitude,
        fac.latitude,
        fac.longitude
      );
      if (dist < minDistance) {
        minDistance = dist;
        nearest = fac;
      }
    }

    if (!nearest) return null;

    return {
      facility: nearest,
      distanceKm: minDistance,
    };
  }
}

export const mapService = new MapServiceManager();
