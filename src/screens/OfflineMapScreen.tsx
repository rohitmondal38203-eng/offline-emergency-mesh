import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {THEME} from '../config/theme';
import {AppHeader, SectionHeader, StatusCard} from '../components';
import {NavigationProp} from '../navigation/types';
import {locationService, GeoLocation} from '../services/location';
import {
  DatasetStats,
  mapService,
  NearestFacilityResult,
} from '../services/map';

interface OfflineMapScreenProps {
  navigation: NavigationProp;
}

export const OfflineMapScreen: React.FC<OfflineMapScreenProps> = ({
  navigation,
}) => {
  // GPS State
  const [gpsAvailable, setGpsAvailable] = useState<boolean | null>(null);
  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [isGpsLoading, setIsGpsLoading] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Dataset State
  const [datasetStats, setDatasetStats] = useState<DatasetStats>(
    mapService.getDatasetStats()
  );
  const [isDatasetLoading, setIsDatasetLoading] = useState<boolean>(true);

  // Nearest Facilities
  const [nearestShelter, setNearestShelter] =
    useState<NearestFacilityResult | null>(null);
  const [nearestHospital, setNearestHospital] =
    useState<NearestFacilityResult | null>(null);

  // 1. Load Bundled Map Dataset
  const loadDataset = useCallback(async () => {
    setIsDatasetLoading(true);
    try {
      const stats = await mapService.loadOfflineMapDataset();
      setDatasetStats(stats);
    } catch (e: any) {
      console.error('[OfflineMapScreen] Dataset load failed:', e);
    } finally {
      setIsDatasetLoading(false);
    }
  }, []);

  // 2. Acquire Offline GPS Fix
  const handleAcquireLocation = useCallback(async () => {
    setIsGpsLoading(true);
    setGpsError(null);
    try {
      const result = await locationService.getCurrentLocation(15000);
      if (result.success && result.location) {
        setLocation(result.location);
        setGpsAvailable(true);

        // Calculate nearest facilities using real bundled coordinates
        const shelterRes = mapService.getNearestFacility(
          result.location.latitude,
          result.location.longitude,
          'SHELTER'
        );
        const hospitalRes = mapService.getNearestFacility(
          result.location.latitude,
          result.location.longitude,
          'HOSPITAL'
        );

        setNearestShelter(shelterRes);
        setNearestHospital(hospitalRes);
      } else {
        setGpsError(result.error?.message || 'GPS fix unavailable');
        setNearestShelter(null);
        setNearestHospital(null);
      }
    } catch (e: any) {
      setGpsError(e?.message || 'Location acquisition failed');
    } finally {
      setIsGpsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadDataset();

    locationService.isGpsAvailable().then(avail => {
      setGpsAvailable(avail);
      if (avail) {
        handleAcquireLocation();
      }
    });
  }, [loadDataset, handleAcquireLocation]);

  return (
    <View style={styles.container}>
      <AppHeader
        title="Offline Map & GIS"
        subtitle="South 24 Parganas Dataset"
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Dataset Status Section */}
        <SectionHeader
          title="Bundled Offline Dataset"
          badge={
            isDatasetLoading
              ? 'LOADING'
              : datasetStats.isReady
              ? 'READY'
              : 'ERROR'
          }
        />

        {isDatasetLoading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="small" color="#0066FF" />
            <Text style={styles.loadingText}>
              Loading South 24 Parganas vector datasets from device storage...
            </Text>
          </View>
        ) : (
          <View style={styles.datasetCard}>
            <View style={styles.datasetHeaderRow}>
              <View style={styles.datasetHeaderLeft}>
                <Text style={styles.datasetTitle}>SOUTH 24 PARGANAS GIS DATASET</Text>
                <Text style={styles.datasetSubtitle}>
                  Offline dataset loaded from device storage
                </Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  datasetStats.isReady
                    ? styles.statusBadgeReady
                    : styles.statusBadgeError,
                ]}>
                <Text
                  style={[
                    styles.statusBadgeText,
                    datasetStats.isReady
                      ? styles.statusTextReady
                      : styles.statusTextError,
                  ]}>
                  {datasetStats.isReady ? 'READY' : 'ERROR'}
                </Text>
              </View>
            </View>

            {datasetStats.error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>
                  ⚠️ {datasetStats.error}
                </Text>
              </View>
            ) : null}

            {/* Feature Statistics Grid */}
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Boundaries</Text>
                <Text style={styles.statVal}>
                  {datasetStats.boundariesCount}
                </Text>
                <Text style={styles.statSub}>District & Blocks</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Waterways</Text>
                <Text style={styles.statVal}>
                  {datasetStats.waterwaysCount}
                </Text>
                <Text style={styles.statSub}>Rivers & Coast</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Roads</Text>
                <Text style={styles.statVal}>{datasetStats.roadsCount}</Text>
                <Text style={styles.statSub}>Evac Corridors</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Facilities</Text>
                <Text style={styles.statVal}>
                  {datasetStats.facilitiesCount}
                </Text>
                <Text style={styles.statSub}>Verified Points</Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Detailed Facility Breakdown */}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>🏥 Hospitals & Clinics:</Text>
              <Text style={styles.detailVal}>{datasetStats.hospitalsCount}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>🏛️ Cyclone Shelters (MPCS):</Text>
              <Text style={styles.detailVal}>{datasetStats.sheltersCount}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>🚨 Emergency Points & Ghats:</Text>
              <Text style={styles.detailVal}>
                {datasetStats.emergencyPointsCount}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>⚡ Load Duration:</Text>
              <Text style={styles.detailVal}>{datasetStats.loadDurationMs} ms</Text>
            </View>
          </View>
        )}

        {/* Offline GPS Latch Section */}
        <SectionHeader
          title="Offline GPS Location"
          badge={location ? 'FIX LOCKED' : isGpsLoading ? 'SEARCHING' : 'IDLE'}
        />

        <StatusCard
          variant={location ? 'info' : gpsError ? 'emergency' : 'default'}
          items={[
            {
              label: 'GPS Hardware Status',
              value:
                gpsAvailable === null
                  ? 'Checking...'
                  : gpsAvailable
                  ? 'Active / Available'
                  : 'Disabled in Settings',
              color: gpsAvailable ? THEME.colors.success : THEME.colors.warning,
            },
            {
              label: 'Latitude',
              value: location ? `${location.latitude.toFixed(6)}°` : 'No fix yet',
              color: location ? THEME.colors.textPrimary : THEME.colors.textMuted,
            },
            {
              label: 'Longitude',
              value: location ? `${location.longitude.toFixed(6)}°` : 'No fix yet',
              color: location ? THEME.colors.textPrimary : THEME.colors.textMuted,
            },
            {
              label: 'Accuracy',
              value: location ? `±${location.accuracy} meters` : 'N/A',
              color: location ? THEME.colors.signal : THEME.colors.textMuted,
            },
          ]}
        />

        {gpsError ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>⚠️ {gpsError}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          activeOpacity={0.8}
          disabled={isGpsLoading}
          onPress={handleAcquireLocation}
          style={[styles.gpsActionBtn, isGpsLoading && styles.btnDisabled]}>
          {isGpsLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" style={{marginRight: 8}} />
          ) : (
            <Text style={styles.gpsActionIcon}>📡</Text>
          )}
          <Text style={styles.gpsActionText}>
            {isGpsLoading ? 'Acquiring GPS Fix...' : 'Acquire Offline GPS Fix'}
          </Text>
        </TouchableOpacity>

        {/* Nearest Facility Test Section */}
        <SectionHeader
          title="Nearest Verified Emergency Facility"
          badge={location ? 'CALCULATED' : 'WAITING GPS'}
        />

        <View style={styles.facilityCard}>
          {location ? (
            <>
              {nearestShelter ? (
                <View style={styles.facilityItem}>
                  <View style={styles.facilityItemHeader}>
                    <Text style={styles.facilityTypeBadge}>🏛️ NEAREST CYCLONE SHELTER</Text>
                    <Text style={styles.facilityDistance}>
                      {nearestShelter.distanceKm} km
                    </Text>
                  </View>
                  <Text style={styles.facilityName}>
                    {nearestShelter.facility.name}
                  </Text>
                  <Text style={styles.facilityAddress}>
                    {nearestShelter.facility.address || 'South 24 Parganas'}
                  </Text>
                  {nearestShelter.facility.capacity ? (
                    <Text style={styles.facilityMeta}>
                      Capacity: {nearestShelter.facility.capacity} persons • Verified
                    </Text>
                  ) : null}
                </View>
              ) : null}

              {nearestHospital ? (
                <View style={[styles.facilityItem, {marginTop: 10}]}>
                  <View style={styles.facilityItemHeader}>
                    <Text style={[styles.facilityTypeBadge, {color: '#2563EB', backgroundColor: '#EFF6FF'}]}>
                      🏥 NEAREST HOSPITAL
                    </Text>
                    <Text style={styles.facilityDistance}>
                      {nearestHospital.distanceKm} km
                    </Text>
                  </View>
                  <Text style={styles.facilityName}>
                    {nearestHospital.facility.name}
                  </Text>
                  <Text style={styles.facilityAddress}>
                    {nearestHospital.facility.address || 'South 24 Parganas'}
                  </Text>
                  <Text style={styles.facilityMeta}>
                    Coordinates: {nearestHospital.facility.latitude.toFixed(4)}°, {nearestHospital.facility.longitude.toFixed(4)}° • Verified
                  </Text>
                </View>
              ) : null}
            </>
          ) : (
            <View style={styles.waitingContainer}>
              <Text style={styles.waitingIcon}>📍</Text>
              <Text style={styles.waitingNotice}>
                GPS position unavailable — nearest facility lookup waiting for location.
              </Text>
            </View>
          )}
        </View>

        {/* Attribution & Legal Notice */}
        <View style={styles.attributionCard}>
          <Text style={styles.attributionTitle}>LEGAL ATTRIBUTION & LICENSES</Text>
          <Text style={styles.attributionText}>
            Map data © OpenStreetMap contributors, available under the Open Database License (ODbL).
          </Text>
          <Text style={styles.attributionSub}>
            Administrative boundaries based on Survey of India / Census of India records via DataMeet (GODL-India).
          </Text>
          <Text style={styles.attributionSub}>
            Emergency shelter records verified from South 24 Parganas DDMP (NCRMP Stage II).
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F7F9',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EDF0F3',
    marginVertical: 8,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
  },
  datasetCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EDF0F3',
    marginVertical: 8,
    shadowColor: '#0F172A',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  datasetHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  datasetHeaderLeft: {
    flex: 1,
    paddingRight: 8,
  },
  datasetTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  datasetSubtitle: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusBadgeReady: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  statusBadgeError: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusTextReady: {
    color: '#059669',
  },
  statusTextError: {
    color: '#DC2626',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 8,
    alignItems: 'center',
    marginHorizontal: 3,
    borderWidth: 1,
    borderColor: '#EDF0F3',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  statVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginVertical: 2,
  },
  statSub: {
    fontSize: 9,
    color: '#94A3B8',
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  detailLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  detailVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  gpsActionBtn: {
    backgroundColor: '#0066FF',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  gpsActionIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  gpsActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  facilityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EDF0F3',
    marginVertical: 8,
  },
  facilityItem: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EDF0F3',
  },
  facilityItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  facilityTypeBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D97706',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    letterSpacing: 0.4,
  },
  facilityDistance: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0066FF',
  },
  facilityName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  facilityAddress: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  facilityMeta: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
  },
  waitingContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  waitingIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  waitingNotice: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 8,
    padding: 10,
    marginVertical: 6,
  },
  errorBannerText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '600',
  },
  attributionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EDF0F3',
    marginTop: 12,
  },
  attributionTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  attributionText: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '600',
    lineHeight: 16,
    marginBottom: 4,
  },
  attributionSub: {
    fontSize: 10,
    color: '#94A3B8',
    lineHeight: 14,
  },
});
