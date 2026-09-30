import React from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';
import {THEME} from '../config/theme';
import {
  AppHeader,
  EmergencyButton,
  FeatureCard,
  SectionHeader,
  StatusCard,
} from '../components';
import {NavigationProp} from '../navigation/types';

interface HomeScreenProps {
  navigation: NavigationProp;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({navigation}) => {
  return (
    <View style={styles.container}>
      <AppHeader
        title="RESQ-MESH"
        subtitle="Disaster Emergency Mesh"
        onSettings={() => navigation.navigate('SETTINGS')}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Offline Mode Banner */}
        <View style={styles.offlineBanner}>
          <View style={styles.offlineDot} />
          <Text style={styles.offlineText}>OFFLINE MODE ACTIVE</Text>
          <Text style={styles.offlineSubtext}>Zero Cellular / Zero Internet</Text>
        </View>

        {/* Live Network & Mesh Status */}
        <SectionHeader title="System Telemetry" badge="LOCAL SENSORS" />
        <StatusCard
          variant="info"
          items={[
            {label: 'Operating Environment', value: '100% Offline', color: THEME.colors.warning},
            {label: 'P2P Mesh Radio', value: 'Standby (Phase 3)', color: THEME.colors.signal},
            {label: 'Discovered Mesh Peers', value: '0 Devices', color: THEME.colors.textMuted},
            {label: 'Active Rescue Beacon', value: 'None Active', color: THEME.colors.success},
          ]}
        />

        {/* PRIMARY ACTION: Large REQUEST RESCUE Button */}
        <View style={styles.emergencySection}>
          <Text style={styles.emergencyPrompt}>LIFE-THREATENING EMERGENCY?</Text>
          <EmergencyButton
            title="⚠ REQUEST RESCUE"
            subtitle="Broadcast distress beacon across nearby mesh peers"
            variant="emergency"
            onPress={() => navigation.navigate('REQUEST_RESCUE')}
          />
        </View>

        {/* Core Tactical Modules */}
        <SectionHeader
          title="Tactical Emergency Modules"
          subtitle="Short-range radios, offline cartography & rescue tools"
        />

        {/* 1. Nearby Devices (FR-1) */}
        <FeatureCard
          title="FR-1: Nearby Devices"
          subtitle="P2P BLE & Wi-Fi Direct peer discovery and link monitor"
          badge="PHASE 3"
          badgeColor={THEME.colors.warning}
          iconSymbol="📶"
          accentColor={THEME.colors.signal}
          onPress={() => navigation.navigate('NEARBY_DEVICES')}
        />

        {/* 2. Offline Map (FR-4) */}
        <FeatureCard
          title="FR-4: Offline Vector Map"
          subtitle="Emergency relief shelters, safe zones & survivor coordinates"
          badge="PHASE 6"
          badgeColor={THEME.colors.warning}
          iconSymbol="🗺️"
          accentColor={THEME.colors.success}
          onPress={() => navigation.navigate('OFFLINE_MAP')}
        />

        {/* 3. Hazard Broadcast (FR-5) */}
        <FeatureCard
          title="FR-5: Hazard Broadcast"
          subtitle="Verified responder updates: drinking water, road blocks, medical"
          badge="PHASE 7"
          badgeColor={THEME.colors.warning}
          iconSymbol="📢"
          accentColor="#ec4899"
          onPress={() => navigation.navigate('HAZARD_BROADCAST')}
        />

        {/* 4. SOS Flashlight (FR-6) */}
        <FeatureCard
          title="FR-6: SOS Flashlight"
          subtitle="Morse code SOS camera strobe for night search & rescue"
          badge="PHASE 8"
          badgeColor={THEME.colors.warning}
          iconSymbol="🔦"
          accentColor={THEME.colors.emergency}
          onPress={() => navigation.navigate('SOS_FLASHLIGHT')}
        />

        {/* Project & Hardware Status Footer */}
        <View style={styles.footerNote}>
          <Text style={styles.footerText}>
            APP-08 • Phase 2 Navigation Shell • Radios inactive until Phase 3
          </Text>
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
  offlineBanner: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.warningBorder,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: THEME.spacing.md,
  },
  offlineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: THEME.colors.warning,
    marginRight: 10,
  },
  offlineText: {
    fontSize: 13,
    fontWeight: '900',
    color: THEME.colors.warning,
    letterSpacing: 0.8,
    marginRight: 8,
  },
  offlineSubtext: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    flex: 1,
    textAlign: 'right',
  },
  emergencySection: {
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.md,
    marginVertical: THEME.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.3)',
  },
  emergencyPrompt: {
    ...THEME.typography.caption,
    color: THEME.colors.emergency,
    marginBottom: 8,
    textAlign: 'center',
  },
  footerNote: {
    marginTop: THEME.spacing.lg,
    paddingTop: THEME.spacing.md,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.surfaceBorder,
    alignItems: 'center',
  },
  footerText: {
    ...THEME.typography.caption,
    color: THEME.colors.textMuted,
    textAlign: 'center',
  },
});
