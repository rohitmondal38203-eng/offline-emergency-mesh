import React from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';
import {THEME} from '../config/theme';
import {AppHeader, PlaceholderNotice, SectionHeader, StatusCard} from '../components';
import {NavigationProp} from '../navigation/types';

interface OfflineMapScreenProps {
  navigation: NavigationProp;
}

export const OfflineMapScreen: React.FC<OfflineMapScreenProps> = ({
  navigation,
}) => {
  return (
    <View style={styles.container}>
      <AppHeader
        title="Offline Vector Map"
        subtitle="Pre-cached Local GeoJSON & Shelters"
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Phase Notice */}
        <PlaceholderNotice
          phase="Phase 6"
          featureName="FR-4: Offline Vector Map & MBTiles"
          description="Vector tiles bundled inside APK assets will render roads, topographic safe contours, and emergency relief shelters with zero online tile fetches."
          hardwareDependency="Embedded Vector MBTiles & Local OpenGL Renderer"
        />

        {/* Map Telemetry */}
        <StatusCard
          variant="warning"
          items={[
            {label: 'Tile Archive Status', value: 'Pre-cache pending (Phase 6)', color: THEME.colors.warning},
            {label: 'GPS Location Fix', value: 'Unavailable (Offline)', color: THEME.colors.textMuted},
            {label: 'Cataloged Shelters', value: '4 Safe Points (GeoJSON)', color: THEME.colors.signal},
            {label: 'High-Ground Safe Zones', value: '2 Designated Zones', color: THEME.colors.success},
          ]}
        />

        {/* TACTICAL MAP CANVAS PLACEHOLDER */}
        <View style={styles.mapCanvas}>
          {/* Tactical Grid Background */}
          <View style={styles.gridOverlay}>
            <View style={styles.gridLineH} />
            <View style={styles.gridLineH} />
            <View style={styles.gridLineV} />
            <View style={styles.gridLineV} />
          </View>

          {/* Compass / Orientation */}
          <View style={styles.compassBox}>
            <Text style={styles.compassText}>▲ N</Text>
            <Text style={styles.compassCoords}>GRID: DISASTER SECTOR 4</Text>
          </View>

          {/* User Location Placeholder Marker */}
          <View style={styles.userLocationMarker}>
            <View style={styles.userLocationPulse} />
            <Text style={styles.userLocationText}>📍 YOUR LOCATION (OFFLINE)</Text>
          </View>

          {/* Simulated Relief Shelter Marker A */}
          <View style={[styles.mapPin, styles.pinShelterA]}>
            <Text style={styles.pinIcon}>⛺</Text>
            <Text style={styles.pinLabel}>Central High School (Shelter)</Text>
          </View>

          {/* Simulated Safe High-Ground Zone B */}
          <View style={[styles.mapPin, styles.pinHighGround]}>
            <Text style={styles.pinIcon}>⛰️</Text>
            <Text style={styles.pinLabel}>Stadium Ridge (High Ground: 45m)</Text>
          </View>

          {/* Central Watermark / Banner */}
          <View style={styles.canvasNotice}>
            <Text style={styles.canvasNoticeTitle}>OFFLINE VECTOR ENGINE</Text>
            <Text style={styles.canvasNoticeSubtitle}>
              Offline map integration will be implemented in Phase 6.
            </Text>
            <Text style={styles.canvasNoticeSub}>
              Zero Google Maps / Zero Mapbox API network calls.
            </Text>
          </View>
        </View>

        {/* Shelter Legend & Safe Zones */}
        <SectionHeader
          title="Cataloged Evacuation Safe Zones"
          subtitle="Pre-loaded disaster management infrastructure"
        />

        <View style={styles.shelterList}>
          {/* Shelter 1 */}
          <View style={styles.shelterCard}>
            <View style={styles.shelterHeader}>
              <Text style={styles.shelterIcon}>⛺</Text>
              <View style={styles.shelterTitleCol}>
                <Text style={styles.shelterName}>District Central Relief Camp</Text>
                <Text style={styles.shelterType}>Primary Shelter • Medical Facility</Text>
              </View>
              <View style={styles.capacityBadge}>
                <Text style={styles.capacityText}>CAPACITY: 500</Text>
              </View>
            </View>
            <Text style={styles.shelterMeta}>
              Distance: Approx 1.4 km North-East • Elevation: 28m ASL
            </Text>
          </View>

          {/* Shelter 2 */}
          <View style={styles.shelterCard}>
            <View style={styles.shelterHeader}>
              <Text style={styles.shelterIcon}>⛰️</Text>
              <View style={styles.shelterTitleCol}>
                <Text style={styles.shelterName}>Municipal Stadium Grounds</Text>
                <Text style={styles.shelterType}>Designated High-Ground Assembly</Text>
              </View>
              <View style={[styles.capacityBadge, styles.badgeHighGround]}>
                <Text style={styles.capacityText}>SAFE ZONE</Text>
              </View>
            </View>
            <Text style={styles.shelterMeta}>
              Distance: Approx 2.1 km East • Elevation: 45m ASL (Flood-Safe)
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  scrollContent: {
    padding: THEME.spacing.md,
    paddingBottom: THEME.spacing.xxl,
  },
  mapCanvas: {
    height: 260,
    backgroundColor: '#070b14',
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    marginVertical: THEME.spacing.sm,
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-around',
    alignItems: 'stretch',
    opacity: 0.15,
  },
  gridLineH: {
    height: 1,
    backgroundColor: THEME.colors.signal,
    width: '100%',
  },
  gridLineV: {
    width: 1,
    backgroundColor: THEME.colors.signal,
    height: '100%',
    position: 'absolute',
    left: '50%',
  },
  compassBox: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(17, 24, 39, 0.8)',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
  },
  compassText: {
    fontSize: 10,
    fontWeight: '900',
    color: THEME.colors.signal,
  },
  compassCoords: {
    fontSize: 8,
    color: THEME.colors.textMuted,
    fontWeight: '700',
  },
  userLocationMarker: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(31, 41, 55, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: THEME.colors.signal,
  },
  userLocationPulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: THEME.colors.signal,
    marginRight: 6,
  },
  userLocationText: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  mapPin: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(19, 27, 46, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
  },
  pinShelterA: {
    top: 36,
    right: 16,
    borderColor: THEME.colors.signal,
  },
  pinHighGround: {
    top: 96,
    left: 16,
    borderColor: THEME.colors.success,
  },
  pinIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  pinLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  canvasNotice: {
    backgroundColor: 'rgba(9, 13, 22, 0.92)',
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: THEME.colors.warningBorder,
    alignItems: 'center',
    maxWidth: 290,
  },
  canvasNoticeTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: THEME.colors.warning,
    letterSpacing: 1,
    marginBottom: 4,
  },
  canvasNoticeSubtitle: {
    fontSize: 11,
    color: THEME.colors.textPrimary,
    textAlign: 'center',
    fontWeight: '700',
    lineHeight: 16,
  },
  canvasNoticeSub: {
    fontSize: 10,
    color: THEME.colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
  shelterList: {
    marginVertical: THEME.spacing.xs,
  },
  shelterCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    marginVertical: THEME.spacing.xs,
  },
  shelterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  shelterIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  shelterTitleCol: {
    flex: 1,
  },
  shelterName: {
    ...THEME.typography.titleCard,
    color: THEME.colors.textPrimary,
  },
  shelterType: {
    ...THEME.typography.bodySmall,
    color: THEME.colors.signal,
    marginTop: 2,
  },
  capacityBadge: {
    backgroundColor: THEME.colors.surfaceRaised,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
  },
  badgeHighGround: {
    borderColor: THEME.colors.success,
  },
  capacityText: {
    fontSize: 9,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  shelterMeta: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 4,
  },
});
