import React, {useState} from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';
import {THEME} from '../config/theme';
import {
  AppHeader,
  EmergencyButton,
  PlaceholderNotice,
  SectionHeader,
  StatusCard,
} from '../components';
import {NavigationProp} from '../navigation/types';

interface SosFlashlightScreenProps {
  navigation: NavigationProp;
}

export const SosFlashlightScreen: React.FC<SosFlashlightScreenProps> = ({
  navigation,
}) => {
  const [isSimulatedActive, setIsSimulatedActive] = useState<boolean>(false);

  const handleToggleSos = () => {
    setIsSimulatedActive(!isSimulatedActive);
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title="SOS Flashlight Strobe"
        subtitle="Visual Optical Search & Rescue Signal"
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Phase notice */}
        <PlaceholderNotice
          phase="Phase 8"
          featureName="FR-6: Emergency Flashlight SOS Strobe"
          description="Precision timing driver interfacing directly with the Android Camera2 Torch Mode to project an optical SOS strobe for night rescue teams and drones."
          hardwareDependency="Android Camera2 CameraManager & Physical LED Flash"
        />

        {/* Status */}
        <StatusCard
          variant={isSimulatedActive ? 'emergency' : 'default'}
          items={[
            {
              label: 'Flashlight Hardware Bridge',
              value: 'Unbound (Phase 8)',
              color: THEME.colors.textMuted,
            },
            {
              label: 'UI Simulation State',
              value: isSimulatedActive ? 'ACTIVE (SIMULATED)' : 'IDLE',
              color: isSimulatedActive ? THEME.colors.emergency : THEME.colors.textSecondary,
            },
            {
              label: 'Signal Pattern',
              value: 'Morse SOS (... --- ...)',
              color: THEME.colors.signal,
            },
          ]}
        />

        {/* Optical Simulation Graphic */}
        <View
          style={[
            styles.beaconBox,
            isSimulatedActive && styles.beaconBoxActive,
          ]}>
          <Text style={styles.beaconIcon}>
            {isSimulatedActive ? '🚨' : '🔦'}
          </Text>
          <Text
            style={[
              styles.beaconTitle,
              isSimulatedActive && styles.beaconTitleActive,
            ]}>
            {isSimulatedActive
              ? 'SIMULATED SOS PULSE IN PROGRESS'
              : 'OPTICAL SOS READY'}
          </Text>
          <Text style={styles.beaconSub}>
            {isSimulatedActive
              ? 'Screen UI pulse simulated only • Physical camera torch is NOT active'
              : 'Flashlight SOS hardware integration will be implemented in Phase 8'}
          </Text>

          {/* Morse Code Rhythm Visualizer */}
          <View style={styles.morseVisualizer}>
            <View style={styles.morseGroup}>
              <View style={[styles.morseDot, isSimulatedActive && styles.morseActive]} />
              <View style={[styles.morseDot, isSimulatedActive && styles.morseActive]} />
              <View style={[styles.morseDot, isSimulatedActive && styles.morseActive]} />
              <Text style={styles.morseLetter}>S (3 Dots)</Text>
            </View>
            <View style={styles.morseGroup}>
              <View style={[styles.morseDash, isSimulatedActive && styles.morseActive]} />
              <View style={[styles.morseDash, isSimulatedActive && styles.morseActive]} />
              <View style={[styles.morseDash, isSimulatedActive && styles.morseActive]} />
              <Text style={styles.morseLetter}>O (3 Dashes)</Text>
            </View>
            <View style={styles.morseGroup}>
              <View style={[styles.morseDot, isSimulatedActive && styles.morseActive]} />
              <View style={[styles.morseDot, isSimulatedActive && styles.morseActive]} />
              <View style={[styles.morseDot, isSimulatedActive && styles.morseActive]} />
              <Text style={styles.morseLetter}>S (3 Dots)</Text>
            </View>
          </View>
        </View>

        {/* Primary Controls */}
        <View style={styles.controlsSection}>
          <EmergencyButton
            title={isSimulatedActive ? '⏹ STOP SIMULATED SOS' : '🚨 ACTIVATE SIMULATED SOS'}
            subtitle={
              isSimulatedActive
                ? 'Stop UI animation'
                : 'Does not control hardware flash • Phase 8 integration'
            }
            variant={isSimulatedActive ? 'warning' : 'emergency'}
            onPress={handleToggleSos}
          />
        </View>

        {/* Specifications */}
        <SectionHeader
          title="Optical Signaling Specifications"
          subtitle="Standard international distress optical pulse parameters"
        />

        <View style={styles.specsCard}>
          <View style={styles.specRow}>
            <Text style={styles.specLabel}>Dot ($\cdot$) Pulse Duration:</Text>
            <Text style={styles.specVal}>200 ms ON</Text>
          </View>
          <View style={styles.specRow}>
            <Text style={styles.specLabel}>Dash ($-$) Pulse Duration:</Text>
            <Text style={styles.specVal}>600 ms ON</Text>
          </View>
          <View style={styles.specRow}>
            <Text style={styles.specLabel}>Letter Interval:</Text>
            <Text style={styles.specVal}>600 ms OFF</Text>
          </View>
          <View style={styles.specRow}>
            <Text style={styles.specLabel}>Loop Cycle Interval:</Text>
            <Text style={styles.specVal}>1400 ms OFF</Text>
          </View>
          <View style={styles.specRow}>
            <Text style={styles.specLabel}>Target Optical Visibility:</Text>
            <Text style={styles.specVal}>Up to 1.5 km (Night Line-of-Sight)</Text>
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
  beaconBox: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    padding: THEME.spacing.xl,
    alignItems: 'center',
    marginVertical: THEME.spacing.sm,
  },
  beaconBoxActive: {
    borderColor: THEME.colors.emergency,
    backgroundColor: 'rgba(220, 38, 38, 0.12)',
  },
  beaconIcon: {
    fontSize: 52,
    marginBottom: 8,
  },
  beaconTitle: {
    ...THEME.typography.titleCard,
    color: THEME.colors.textPrimary,
    marginBottom: 4,
    textAlign: 'center',
  },
  beaconTitleActive: {
    color: THEME.colors.emergency,
  },
  beaconSub: {
    ...THEME.typography.bodySmall,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
  },
  morseVisualizer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.surfaceBorder,
    width: '100%',
  },
  morseGroup: {
    alignItems: 'center',
    marginHorizontal: 8,
  },
  morseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: THEME.colors.surfaceRaised,
    marginVertical: 2,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
  },
  morseDash: {
    width: 20,
    height: 8,
    borderRadius: 4,
    backgroundColor: THEME.colors.surfaceRaised,
    marginVertical: 2,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
  },
  morseActive: {
    backgroundColor: THEME.colors.emergency,
    borderColor: THEME.colors.emergencyBorder,
  },
  morseLetter: {
    fontSize: 9,
    fontWeight: '800',
    color: THEME.colors.textMuted,
    marginTop: 4,
  },
  controlsSection: {
    marginVertical: THEME.spacing.sm,
  },
  specsCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    marginVertical: THEME.spacing.xs,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.surfaceRaised,
  },
  specLabel: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
  },
  specVal: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
});
