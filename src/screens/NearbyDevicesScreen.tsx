import React, {useState} from 'react';
import {ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {THEME} from '../config/theme';
import {
  AppHeader,
  DeviceCard,
  EmergencyButton,
  PlaceholderNotice,
  SectionHeader,
  StatusCard,
} from '../components';
import {NavigationProp} from '../navigation/types';

interface NearbyDevicesScreenProps {
  navigation: NavigationProp;
}

export const NearbyDevicesScreen: React.FC<NearbyDevicesScreenProps> = ({
  navigation,
}) => {
  const [viewMode, setViewMode] = useState<'empty' | 'preview'>('empty');
  const [isSimulatedScan, setIsSimulatedScan] = useState<boolean>(false);

  const toggleSimulatedScan = () => {
    setIsSimulatedScan(!isSimulatedScan);
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title="Nearby Devices"
        subtitle="P2P BLE & Wi-Fi Direct Mesh"
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Phase notice */}
        <PlaceholderNotice
          phase="Phase 3"
          featureName="FR-1: P2P Mesh Network Initialization"
          description="Autonomous BLE Peripheral advertising, background Central scanning, and Wi-Fi Direct Group Owner negotiation will be activated in Phase 3."
          hardwareDependency="Bluetooth 5.0+ LE Controller & Wi-Fi Direct P2P Driver"
        />

        {/* Radio Telemetry Card */}
        <StatusCard
          variant="info"
          items={[
            {
              label: 'Radio Driver',
              value: isSimulatedScan ? 'SCANNING (SIMULATED)' : 'STANDBY (NOT ACTIVE)',
              color: isSimulatedScan ? THEME.colors.signal : THEME.colors.warning,
            },
            {label: 'BLE Advertising', value: 'Disabled', color: THEME.colors.textMuted},
            {label: 'Wi-Fi Direct P2P', value: 'Uninitialized', color: THEME.colors.textMuted},
          ]}
        />

        {/* UI State Preview Controls */}
        <View style={styles.previewToolbar}>
          <Text style={styles.toolbarLabel}>INSPECT UI STATES:</Text>
          <View style={styles.toggleRow}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setViewMode('empty')}
              style={[
                styles.toggleBtn,
                viewMode === 'empty' && styles.toggleBtnActive,
              ]}>
              <Text
                style={[
                  styles.toggleBtnText,
                  viewMode === 'empty' && styles.toggleBtnTextActive,
                ]}>
                Empty State
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setViewMode('preview')}
              style={[
                styles.toggleBtn,
                viewMode === 'preview' && styles.toggleBtnActive,
              ]}>
              <Text
                style={[
                  styles.toggleBtnText,
                  viewMode === 'preview' && styles.toggleBtnTextActive,
                ]}>
                Preview Mock Peers
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Scan Trigger Button (UI simulation only) */}
        <EmergencyButton
          title={isSimulatedScan ? '■ STOP SIMULATED SCAN' : '🔍 START SIMULATED SCAN'}
          subtitle={
            isSimulatedScan
              ? 'Toggling UI animation only • No hardware radio accessed'
              : 'BLE discovery will be implemented in Phase 3'
          }
          variant={isSimulatedScan ? 'warning' : 'secondary'}
          onPress={toggleSimulatedScan}
        />

        {/* Device List or Empty State */}
        <SectionHeader
          title="Discovered Mesh Nodes"
          badge={viewMode === 'preview' ? '3 SIMULATED' : '0 DETECTED'}
        />

        {viewMode === 'empty' ? (
          /* Empty State */
          <View style={styles.emptyStateCard}>
            <Text style={styles.emptyIcon}>📡</Text>
            <Text style={styles.emptyTitle}>No Nearby Devices Found</Text>
            <Text style={styles.emptySubtitle}>
              Hardware BLE discovery and peer advertising will be activated in Phase 3.
              Ensure nearby survivor devices have APP-08 installed and Bluetooth enabled.
            </Text>
          </View>
        ) : (
          /* Visual states preview */
          <View style={styles.listContainer}>
            <View style={styles.stateNotice}>
              <Text style={styles.stateNoticeText}>
                The cards below illustrate UI visual states for Discovered, Connecting, and Connected peers:
              </Text>
            </View>

            {/* State: Connected Link */}
            <DeviceCard
              id="node-01"
              name="NDRF Field Relay (Node #01)"
              rssi={-58}
              radioType="BLE"
              connectionState="connected"
              lastSeen="Active link"
              isRelayNode={true}
            />

            {/* State: Discovered Peer */}
            <DeviceCard
              id="node-02"
              name="Survivor Device (Node #44)"
              rssi={-78}
              radioType="BLE"
              connectionState="discovered"
              lastSeen="15s ago"
              isRelayNode={true}
            />

            {/* State: Wi-Fi Direct Peer */}
            <DeviceCard
              id="node-03"
              name="Medical Volunteer (Node #12)"
              rssi={-64}
              radioType="Wi-Fi Direct"
              connectionState="connecting"
              lastSeen="Just now"
              isRelayNode={true}
            />
          </View>
        )}
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
  previewToolbar: {
    backgroundColor: THEME.colors.surface,
    padding: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.md,
    marginVertical: THEME.spacing.xs,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
  },
  toolbarLabel: {
    ...THEME.typography.caption,
    color: THEME.colors.signal,
    marginBottom: 6,
  },
  toggleRow: {
    flexDirection: 'row',
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: THEME.borderRadius.sm,
    backgroundColor: THEME.colors.surfaceRaised,
    marginHorizontal: 3,
  },
  toggleBtnActive: {
    backgroundColor: THEME.colors.signalDark,
  },
  toggleBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
  },
  toggleBtnTextActive: {
    color: '#ffffff',
  },
  emptyStateCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    padding: THEME.spacing.xxl,
    alignItems: 'center',
    marginVertical: THEME.spacing.sm,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: THEME.spacing.sm,
  },
  emptyTitle: {
    ...THEME.typography.titleCard,
    color: THEME.colors.textPrimary,
    marginBottom: 6,
  },
  emptySubtitle: {
    ...THEME.typography.bodySmall,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
  listContainer: {
    marginVertical: THEME.spacing.xs,
  },
  stateNotice: {
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderRadius: 4,
    padding: 8,
    marginBottom: 8,
  },
  stateNoticeText: {
    fontSize: 11,
    color: THEME.colors.signal,
    lineHeight: 16,
  },
});
