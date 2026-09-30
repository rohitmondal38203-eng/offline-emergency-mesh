import React, {useState} from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {THEME} from '../config/theme';
import {
  AppHeader,
  EmergencyButton,
  HazardCard,
  PlaceholderNotice,
  SectionHeader,
  StatusCard,
} from '../components';
import {NavigationProp} from '../navigation/types';

interface HazardBroadcastScreenProps {
  navigation: NavigationProp;
}

export const HazardBroadcastScreen: React.FC<HazardBroadcastScreenProps> = ({
  navigation,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'WATER' | 'MEDICAL' | 'ROAD'>('ALL');

  const handleCreateBroadcast = () => {
    Alert.alert(
      'Feature Planned in Phase 7',
      'FR-5 Hazard Broadcasting requires cryptographic signing of responder root keys and priority mesh dissemination.\n\nAuthoring and transmitting hazard bulletins will be implemented in Phase 7.',
      [{text: 'Understood', style: 'default'}]
    );
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title="Hazard Broadcasts"
        subtitle="Mesh Disaster Bulletins & Advisories"
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Phase notice */}
        <PlaceholderNotice
          phase="Phase 7"
          featureName="FR-5: Local Hazard Broadcast Engine"
          description="Enables accredited first responders to issue cryptographically signed, mesh-wide announcements regarding potable water, road hazards, and medical triage."
          hardwareDependency="P2P Mesh Store-and-Forward & Ed25519 Authority Keystore"
        />

        {/* Telemetry */}
        <StatusCard
          variant="info"
          items={[
            {label: 'Broadcast Reception', value: 'Offline Feed (Simulated)', color: THEME.colors.warning},
            {label: 'Authority Cryptographic Verification', value: 'Unverified (Phase 9)', color: THEME.colors.textMuted},
            {label: 'Cached Mesh Bulletins', value: '3 Sample Bulletins', color: THEME.colors.signal},
          ]}
        />

        {/* First Responder Action Button */}
        <View style={styles.responderBox}>
          <Text style={styles.responderPrompt}>FIRST RESPONDER / AUTHORITY ACTIONS</Text>
          <EmergencyButton
            title="📢 CREATE HAZARD ALERT"
            subtitle="Requires accredited authority signing key • Phase 7"
            variant="warning"
            onPress={handleCreateBroadcast}
          />
        </View>

        {/* Category Filter Pills */}
        <SectionHeader
          title="Disaster Bulletins Feed"
          subtitle="All alerts propagate opportunistically across local peer nodes"
        />

        <View style={styles.filterRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setFilter('ALL')}
            style={[styles.filterPill, filter === 'ALL' && styles.filterPillActive]}>
            <Text
              style={[
                styles.filterText,
                filter === 'ALL' && styles.filterTextActive,
              ]}>
              ALL (3)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setFilter('WATER')}
            style={[styles.filterPill, filter === 'WATER' && styles.filterPillActive]}>
            <Text
              style={[
                styles.filterText,
                filter === 'WATER' && styles.filterTextActive,
              ]}>
              WATER
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setFilter('MEDICAL')}
            style={[styles.filterPill, filter === 'MEDICAL' && styles.filterPillActive]}>
            <Text
              style={[
                styles.filterText,
                filter === 'MEDICAL' && styles.filterTextActive,
              ]}>
              MEDICAL
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setFilter('ROAD')}
            style={[styles.filterPill, filter === 'ROAD' && styles.filterPillActive]}>
            <Text
              style={[
                styles.filterText,
                filter === 'ROAD' && styles.filterTextActive,
              ]}>
              ROAD
            </Text>
          </TouchableOpacity>
        </View>

        {/* Demo Hazard Cards */}
        {(filter === 'ALL' || filter === 'WATER') && (
          <HazardCard
            id="h-01"
            category="WATER"
            title="Clean Drinking Water Distribution"
            description="5,000L clean drinking water tanker arrived and stationed at School Ground. Rations distributed 10L per family. Bring clean containers."
            location="Central School Ground, Block B"
            timestamp="18 mins ago via Mesh Hop 2"
            authorityName="Municipal Water Relief Taskforce"
            isVerified={true}
          />
        )}

        {(filter === 'ALL' || filter === 'MEDICAL') && (
          <HazardCard
            id="h-02"
            category="MEDICAL"
            title="Emergency Medical Triage Camp Active"
            description="Temporary trauma stabilization center operational with 4 paramedics and tetanus/insulin supplies. Priority for elderly and wounded."
            location="Community Health Center, Sector 3"
            timestamp="42 mins ago via Mesh Hop 1"
            authorityName="Red Cross Disaster Response"
            isVerified={true}
          />
        )}

        {(filter === 'ALL' || filter === 'ROAD') && (
          <HazardCard
            id="h-03"
            category="ROAD_ALERT"
            title="River Bridge Submerged — Complete Blockage"
            description="North causeway bridge has 1.8 meters overflowing water. Structural integrity unverified. Do not attempt crossing on foot or vehicle."
            location="North River Expressway, Km 14"
            timestamp="1 hr ago via Mesh Hop 3"
            authorityName="State Disaster Management Unit"
            isVerified={true}
          />
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
  responderBox: {
    backgroundColor: THEME.colors.surface,
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: THEME.colors.warningBorder,
    marginVertical: THEME.spacing.sm,
  },
  responderPrompt: {
    ...THEME.typography.caption,
    color: THEME.colors.warning,
    marginBottom: 8,
    textAlign: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    marginVertical: THEME.spacing.xs,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: THEME.borderRadius.sm,
    backgroundColor: THEME.colors.surfaceRaised,
    marginRight: 6,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
  },
  filterPillActive: {
    backgroundColor: THEME.colors.signalDark,
    borderColor: THEME.colors.signal,
  },
  filterText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.textMuted,
  },
  filterTextActive: {
    color: '#ffffff',
  },
});
