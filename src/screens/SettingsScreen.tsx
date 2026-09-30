import React from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';
import {THEME} from '../config/theme';
import {AppHeader, SectionHeader, StatusCard} from '../components';
import {NavigationProp} from '../navigation/types';

interface SettingsScreenProps {
  navigation: NavigationProp;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({navigation}) => {
  return (
    <View style={styles.container}>
      <AppHeader
        title="Settings & System Info"
        subtitle="Disaster Mesh Architecture & Privacy"
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* App Identity Banner */}
        <View style={styles.brandCard}>
          <Text style={styles.brandTitle}>RESQ-MESH (APP-08)</Text>
          <Text style={styles.brandSub}>
            Offline-First Disaster Emergency Mesh & Hazard Broadcast System
          </Text>
          <View style={styles.versionPill}>
            <Text style={styles.versionPillText}>v0.1.0 • HACKATHON PROTOTYPE</Text>
          </View>
        </View>

        {/* Phase Progress Matrix */}
        <SectionHeader
          title="Development Roadmap Status"
          subtitle="Real-time phase audit based on hackathon requirements"
        />

        <View style={styles.phaseCard}>
          <View style={styles.phaseRow}>
            <Text style={styles.phaseDone}>✓ Phase 0</Text>
            <Text style={styles.phaseName}>Documentation & Blueprints</Text>
            <Text style={styles.badgeDone}>COMPLETED</Text>
          </View>
          <View style={styles.phaseRow}>
            <Text style={styles.phaseDone}>✓ Phase 1</Text>
            <Text style={styles.phaseName}>Project Setup & React Native Baseline</Text>
            <Text style={styles.badgeDone}>COMPLETED</Text>
          </View>
          <View style={styles.phaseRow}>
            <Text style={styles.phaseActive}>● Phase 2</Text>
            <Text style={styles.phaseName}>Professional UI & Navigation Shell</Text>
            <Text style={styles.badgeActive}>COMPLETED</Text>
          </View>
          <View style={styles.phaseRow}>
            <Text style={styles.phasePending}>○ Phase 3</Text>
            <Text style={styles.phaseName}>P2P Radio Connectivity (BLE / Wi-Fi Direct)</Text>
            <Text style={styles.badgePending}>NOT STARTED</Text>
          </View>
          <View style={styles.phaseRow}>
            <Text style={styles.phasePending}>○ Phase 4</Text>
            <Text style={styles.phaseName}>Distress Beacon & Offline GNSS Latch</Text>
            <Text style={styles.badgePending}>NOT STARTED</Text>
          </View>
          <View style={styles.phaseRow}>
            <Text style={styles.phasePending}>○ Phase 5</Text>
            <Text style={styles.phaseName}>Multi-Hop Store & Forward Routing</Text>
            <Text style={styles.badgePending}>NOT STARTED</Text>
          </View>
          <View style={styles.phaseRow}>
            <Text style={styles.phasePending}>○ Phase 6</Text>
            <Text style={styles.phaseName}>Offline Vector Map & Shelter Overlays</Text>
            <Text style={styles.badgePending}>NOT STARTED</Text>
          </View>
          <View style={styles.phaseRow}>
            <Text style={styles.phasePending}>○ Phase 7</Text>
            <Text style={styles.phaseName}>Hazard Broadcast Dissemination</Text>
            <Text style={styles.badgePending}>NOT STARTED</Text>
          </View>
          <View style={styles.phaseRow}>
            <Text style={styles.phasePending}>○ Phase 8</Text>
            <Text style={styles.phaseName}>Morse Code Torch SOS Strobe</Text>
            <Text style={styles.badgePending}>NOT STARTED</Text>
          </View>
          <View style={styles.phaseRow}>
            <Text style={styles.phasePending}>○ Phase 9</Text>
            <Text style={styles.phaseName}>Ed25519 Cryptographic Signatures</Text>
            <Text style={styles.badgePending}>NOT STARTED</Text>
          </View>
          <View style={styles.phaseRow}>
            <Text style={styles.phasePending}>○ Phase 10</Text>
            <Text style={styles.phaseName}>Multi-Device Testbed Verification</Text>
            <Text style={styles.badgePending}>NOT STARTED</Text>
          </View>
          <View style={styles.phaseRow}>
            <Text style={styles.phasePending}>○ Phase 11</Text>
            <Text style={styles.phaseName}>Android Standalone Release APK</Text>
            <Text style={styles.badgePending}>NOT STARTED</Text>
          </View>
          <View style={styles.phaseRow}>
            <Text style={styles.phasePending}>○ Phase 12</Text>
            <Text style={styles.phaseName}>Final Hackathon Demo & Defense</Text>
            <Text style={styles.badgePending}>NOT STARTED</Text>
          </View>
        </View>

        {/* Privacy Guarantees */}
        <SectionHeader
          title="Privacy & Data Protection"
          subtitle="Zero tracking, zero PII, 100% on-device autonomy"
        />

        <StatusCard
          variant="info"
          items={[
            {label: 'PII Collection', value: 'Zero (No name, phone, or IMEI)', color: THEME.colors.success},
            {label: 'Remote Telemetry', value: 'None (No analytics or cloud sync)', color: THEME.colors.success},
            {label: 'Node Identity', value: 'Ephemeral Ed25519 Public Key', color: THEME.colors.signal},
            {label: 'Local Storage', value: 'Encrypted On-Device Database', color: THEME.colors.textPrimary},
          ]}
        />

        {/* Android Hardware Permissions Justification */}
        <SectionHeader
          title="Hardware Permissions Justification"
          subtitle="Why specific OS permissions are declared in AndroidManifest"
        />

        <View style={styles.infoCard}>
          <Text style={styles.permTitle}>1. Bluetooth Scan & Advertise (API 31+)</Text>
          <Text style={styles.permDesc}>
            Mandatory for discovering nearby survivor devices and propagating multi-hop distress packets without cellular networks.
          </Text>

          <Text style={styles.permTitle}>2. Fine & Coarse Location</Text>
          <Text style={styles.permDesc}>
            Required by Android OS for BLE discovery, and used to latch satellite GNSS latitude/longitude coordinates to emergency distress beacons.
          </Text>

          <Text style={styles.permTitle}>3. Camera Hardware</Text>
          <Text style={styles.permDesc}>
            Required strictly to control the physical rear camera LED flash for optical Morse Code SOS night signaling. No video or photo capture occurs.
          </Text>

          <Text style={styles.permTitle}>4. Foreground Service</Text>
          <Text style={styles.permDesc}>
            Ensures intermediate relay nodes can forward emergency distress packets while the phone is locked in a rescuer or volunteer's pocket.
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
  brandCard: {
    backgroundColor: THEME.colors.surface,
    padding: THEME.spacing.lg,
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: THEME.colors.signalDark,
    alignItems: 'center',
    marginVertical: THEME.spacing.sm,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: THEME.colors.textPrimary,
    letterSpacing: 1,
  },
  brandSub: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 280,
  },
  versionPill: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: THEME.borderRadius.full,
    marginTop: 10,
    borderWidth: 1,
    borderColor: THEME.colors.signalDark,
  },
  versionPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.signal,
    letterSpacing: 0.8,
  },
  phaseCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    marginVertical: THEME.spacing.xs,
  },
  phaseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.surfaceRaised,
  },
  phaseDone: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.success,
    width: 70,
  },
  phaseActive: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.warning,
    width: 70,
  },
  phasePending: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.textMuted,
    width: 70,
  },
  phaseName: {
    flex: 1,
    fontSize: 11,
    color: THEME.colors.textPrimary,
    fontWeight: '500',
  },
  badgeDone: {
    fontSize: 9,
    fontWeight: '800',
    color: THEME.colors.success,
  },
  badgeActive: {
    fontSize: 9,
    fontWeight: '800',
    color: THEME.colors.warning,
  },
  badgePending: {
    fontSize: 9,
    fontWeight: '700',
    color: THEME.colors.textMuted,
  },
  infoCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    marginVertical: THEME.spacing.xs,
  },
  permTitle: {
    ...THEME.typography.titleCard,
    fontSize: 13,
    color: THEME.colors.signal,
    marginTop: 8,
  },
  permDesc: {
    ...THEME.typography.bodySmall,
    color: THEME.colors.textSecondary,
    marginTop: 2,
    lineHeight: 17,
  },
});
