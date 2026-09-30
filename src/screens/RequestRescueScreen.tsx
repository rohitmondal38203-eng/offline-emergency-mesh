import React, {useState} from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {THEME} from '../config/theme';
import {AppHeader, EmergencyButton, PlaceholderNotice, SectionHeader} from '../components';
import {NavigationProp} from '../navigation/types';

interface RequestRescueScreenProps {
  navigation: NavigationProp;
}

type EmergencyType = 'MEDICAL' | 'FOOD_WATER' | 'TRAPPED';

export const RequestRescueScreen: React.FC<RequestRescueScreenProps> = ({
  navigation,
}) => {
  const [emergencyType, setEmergencyType] = useState<EmergencyType>('TRAPPED');
  const [headcount, setHeadcount] = useState<number>(2);
  const [message, setMessage] = useState<string>('');
  const [transmissionNoticeVisible, setTransmissionNoticeVisible] = useState<boolean>(false);

  const handleCreateRequest = () => {
    // Strictly adhering to rules: Do NOT fake transmission!
    setTransmissionNoticeVisible(true);
    Alert.alert(
      'Transmission Not Connected',
      'Rescue transmission is not connected yet.\nP2P mesh networking and store-and-forward relay will be implemented in Phase 3 & Phase 5.\n\nYour emergency request form has NOT been transmitted over any radio.',
      [{text: 'Acknowledge', style: 'default'}]
    );
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title="Request Rescue"
        subtitle="Emergency Distress Beacon Form"
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        {/* Phase notice */}
        <PlaceholderNotice
          phase="Phase 4"
          featureName="FR-3: Distress Beacon Generation"
          description="Form inputs will be serialized into compact binary packets, signed with on-device Ed25519 keys, and propagated via multi-hop mesh."
          hardwareDependency="Android GNSS GPS Receiver & BLE Transmitter"
        />

        {transmissionNoticeVisible ? (
          <View style={styles.alertBanner}>
            <Text style={styles.alertBannerTitle}>⚠️ TRANSMISSION OFFLINE</Text>
            <Text style={styles.alertBannerBody}>
              Rescue transmission is not connected yet. Mesh networking will be
              implemented in a later phase. No data was broadcast.
            </Text>
          </View>
        ) : null}

        {/* 1. Emergency Type Selector */}
        <SectionHeader
          title="1. Emergency Classification"
          subtitle="Select primary threat level"
        />
        <View style={styles.selectorGrid}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setEmergencyType('TRAPPED')}
            style={[
              styles.typeCard,
              emergencyType === 'TRAPPED' && styles.typeCardActive,
            ]}>
            <Text style={styles.typeIcon}>🏚️</Text>
            <Text
              style={[
                styles.typeTitle,
                emergencyType === 'TRAPPED' && styles.typeTitleActive,
              ]}>
              TRAPPED
            </Text>
            <Text style={styles.typeSubtitle}>Structure / Rising Flood</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setEmergencyType('MEDICAL')}
            style={[
              styles.typeCard,
              emergencyType === 'MEDICAL' && styles.typeCardActive,
            ]}>
            <Text style={styles.typeIcon}>🚑</Text>
            <Text
              style={[
                styles.typeTitle,
                emergencyType === 'MEDICAL' && styles.typeTitleActive,
              ]}>
              MEDICAL
            </Text>
            <Text style={styles.typeSubtitle}>Injury / Oxygen / Illness</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setEmergencyType('FOOD_WATER')}
            style={[
              styles.typeCard,
              emergencyType === 'FOOD_WATER' && styles.typeCardActive,
            ]}>
            <Text style={styles.typeIcon}>💧</Text>
            <Text
              style={[
                styles.typeTitle,
                emergencyType === 'FOOD_WATER' && styles.typeTitleActive,
              ]}>
              FOOD / WATER
            </Text>
            <Text style={styles.typeSubtitle}>Supplies Exhausted</Text>
          </TouchableOpacity>
        </View>

        {/* 2. Headcount Stepper */}
        <SectionHeader
          title="2. Total Headcount"
          subtitle="Number of people requiring evacuation"
        />
        <View style={styles.headcountBox}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setHeadcount(Math.max(1, headcount - 1))}
            style={styles.stepperButton}>
            <Text style={styles.stepperButtonText}>−</Text>
          </TouchableOpacity>
          <View style={styles.headcountDisplay}>
            <Text style={styles.headcountNumber}>{headcount}</Text>
            <Text style={styles.headcountLabel}>
              {headcount === 1 ? 'PERSON' : 'PEOPLE'}
            </Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setHeadcount(Math.min(99, headcount + 1))}
            style={styles.stepperButton}>
            <Text style={styles.stepperButtonText}>+</Text>
          </TouchableOpacity>
        </View>

        {/* 3. Location Status */}
        <SectionHeader
          title="3. Geospatial Fix"
          subtitle="Satellite coordinates for rescue dispatch"
        />
        <View style={styles.locationCard}>
          <View style={styles.locationRow}>
            <Text style={styles.locationStatusDot}>●</Text>
            <Text style={styles.locationTitle}>GPS Fix Unavailable</Text>
          </View>
          <Text style={styles.locationNotice}>
            Autonomous offline GNSS satellite latching will be integrated in Phase 4 & Phase 6.
          </Text>
        </View>

        {/* 4. Optional Note */}
        <SectionHeader
          title="4. Additional Notes (Optional)"
          subtitle="Max 64 characters for radio packet economy"
        />
        <TextInput
          style={styles.textInput}
          placeholder="e.g. 2nd floor roof, 1 infant, need insulin"
          placeholderTextColor={THEME.colors.textMuted}
          value={message}
          onChangeText={setMessage}
          maxLength={64}
          multiline
        />

        {/* 5. Trigger Action */}
        <View style={styles.actionWrapper}>
          <EmergencyButton
            title="⚠ CREATE RESCUE REQUEST"
            subtitle="Not connected to radio yet • Phase 4 integration"
            variant="emergency"
            onPress={handleCreateRequest}
          />
          <Text style={styles.disclaimerText}>
            Pressing this button demonstrates UI validation only. It does not transmit radio packets.
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
  alertBanner: {
    backgroundColor: 'rgba(220, 38, 38, 0.15)',
    borderColor: THEME.colors.emergencyBorder,
    borderWidth: 1,
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.md,
    marginVertical: THEME.spacing.sm,
  },
  alertBannerTitle: {
    color: THEME.colors.emergency,
    fontWeight: '900',
    fontSize: 13,
    marginBottom: 4,
  },
  alertBannerBody: {
    color: THEME.colors.textPrimary,
    fontSize: 12,
    lineHeight: 18,
  },
  selectorGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: THEME.spacing.xs,
  },
  typeCard: {
    flex: 1,
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    padding: THEME.spacing.sm,
    alignItems: 'center',
    marginHorizontal: 4,
    minHeight: 96,
    justifyContent: 'center',
  },
  typeCardActive: {
    borderColor: THEME.colors.emergency,
    backgroundColor: 'rgba(220, 38, 38, 0.12)',
  },
  typeIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  typeTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.textSecondary,
    textAlign: 'center',
  },
  typeTitleActive: {
    color: '#ffffff',
  },
  typeSubtitle: {
    fontSize: 9,
    color: THEME.colors.textMuted,
    textAlign: 'center',
    marginTop: 2,
  },
  headcountBox: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: THEME.spacing.sm,
    marginVertical: THEME.spacing.xs,
  },
  stepperButton: {
    width: 52,
    height: 52,
    borderRadius: THEME.borderRadius.md,
    backgroundColor: THEME.colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
  },
  stepperButtonText: {
    fontSize: 26,
    color: THEME.colors.signal,
    fontWeight: '800',
  },
  headcountDisplay: {
    alignItems: 'center',
  },
  headcountNumber: {
    fontSize: 32,
    fontWeight: '900',
    color: THEME.colors.textPrimary,
  },
  headcountLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.textMuted,
    letterSpacing: 1,
  },
  locationCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    padding: THEME.spacing.md,
    marginVertical: THEME.spacing.xs,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  locationStatusDot: {
    color: THEME.colors.warning,
    fontSize: 10,
    marginRight: 6,
  },
  locationTitle: {
    ...THEME.typography.titleCard,
    fontSize: 13,
  },
  locationNotice: {
    ...THEME.typography.bodySmall,
    color: THEME.colors.textSecondary,
    lineHeight: 16,
  },
  textInput: {
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    borderRadius: THEME.borderRadius.md,
    color: THEME.colors.textPrimary,
    padding: THEME.spacing.md,
    fontSize: 14,
    minHeight: 70,
    textAlignVertical: 'top',
    marginVertical: THEME.spacing.xs,
  },
  actionWrapper: {
    marginTop: THEME.spacing.lg,
  },
  disclaimerText: {
    ...THEME.typography.caption,
    color: THEME.colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
  },
});
