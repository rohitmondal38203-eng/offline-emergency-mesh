import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export default function App(): React.JSX.Element {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0b0f19" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header / App Title */}
        <View style={styles.header}>
          <Text style={styles.badge}>APP-08 • PHASE 1 BASELINE SHELL</Text>
          <Text style={styles.title}>RESQ-MESH</Text>
          <Text style={styles.subtitle}>
            Offline-First Disaster Emergency Mesh & Hazard Broadcast
          </Text>
        </View>

        {/* System Status Banner */}
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, styles.dotAmber]} />
            <Text style={styles.statusLabel}>Mesh Radio Status:</Text>
            <Text style={styles.statusValue}>STANDBY (Not Initialized)</Text>
          </View>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, styles.dotBlue]} />
            <Text style={styles.statusLabel}>Network Environment:</Text>
            <Text style={styles.statusValue}>100% Offline Mode</Text>
          </View>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, styles.dotGray]} />
            <Text style={styles.statusLabel}>Active Peers:</Text>
            <Text style={styles.statusValue}>0 Nodes Discovered</Text>
          </View>
        </View>

        {/* Emergency Status Area */}
        <View style={styles.emergencyCard}>
          <Text style={styles.cardHeader}>EMERGENCY STATUS</Text>
          <Text style={styles.emergencyStatusText}>Status: Normal / Standby</Text>
          <Text style={styles.emergencyDesc}>
            No active distress beacon registered. System ready to capture offline
            GPS fix and publish emergency payload once Phase 4 is reached.
          </Text>
        </View>

        {/* Section: Nearby Devices (Placeholder) */}
        <View style={styles.moduleCard}>
          <View style={styles.moduleHeaderRow}>
            <Text style={styles.moduleTitle}>FR-1: Nearby Mesh Peers</Text>
            <Text style={styles.plannedBadge}>PLANNED (Phase 3)</Text>
          </View>
          <Text style={styles.moduleDescription}>
            P2P Bluetooth Low Energy & Wi-Fi Direct peer discovery. Nearby
            survivor and responder devices will appear here once radio engine is
            active.
          </Text>
          <View style={styles.disabledButton}>
            <Text style={styles.disabledButtonText}>Scan for Peers (Not Implemented)</Text>
          </View>
        </View>

        {/* Section: Request Rescue (Placeholder) */}
        <View style={styles.moduleCard}>
          <View style={styles.moduleHeaderRow}>
            <Text style={styles.moduleTitle}>FR-3: Distress Beacon</Text>
            <Text style={styles.plannedBadge}>PLANNED (Phase 4)</Text>
          </View>
          <Text style={styles.moduleDescription}>
            Allows victims to dispatch signed SOS payloads with status (Trapped /
            Medical / Food), headcount, and offline GNSS coordinates.
          </Text>
          <View style={[styles.disabledButton, styles.disabledRescueButton]}>
            <Text style={styles.disabledButtonText}>Request Rescue (Not Implemented)</Text>
          </View>
        </View>

        {/* Section: Offline Map (Placeholder) */}
        <View style={styles.moduleCard}>
          <View style={styles.moduleHeaderRow}>
            <Text style={styles.moduleTitle}>FR-4: Offline Vector Map</Text>
            <Text style={styles.plannedBadge}>PLANNED (Phase 6)</Text>
          </View>
          <Text style={styles.moduleDescription}>
            Pre-bundled local vector tiles displaying emergency shelters,
            high-ground zones, and incoming survivor distress beacons.
          </Text>
          <View style={styles.disabledButton}>
            <Text style={styles.disabledButtonText}>Open Offline Map (Not Implemented)</Text>
          </View>
        </View>

        {/* Section: Hazard Broadcast (Placeholder) */}
        <View style={styles.moduleCard}>
          <View style={styles.moduleHeaderRow}>
            <Text style={styles.moduleTitle}>FR-5: Hazard Broadcasts</Text>
            <Text style={styles.plannedBadge}>PLANNED (Phase 7)</Text>
          </View>
          <Text style={styles.moduleDescription}>
            First responder disaster advisories, safe evacuation routes, and
            water distribution points propagated across the mesh.
          </Text>
          <View style={styles.disabledButton}>
            <Text style={styles.disabledButtonText}>View Broadcasts (Not Implemented)</Text>
          </View>
        </View>

        {/* Section: SOS Flashlight (Placeholder) */}
        <View style={styles.moduleCard}>
          <View style={styles.moduleHeaderRow}>
            <Text style={styles.moduleTitle}>FR-6: SOS Flashlight Strobe</Text>
            <Text style={styles.plannedBadge}>PLANNED (Phase 8)</Text>
          </View>
          <Text style={styles.moduleDescription}>
            Optical Morse Code SOS strobe using the hardware rear camera flash for
            night search and rescue visibility.
          </Text>
          <View style={styles.disabledButton}>
            <Text style={styles.disabledButtonText}>Start SOS Strobe (Not Implemented)</Text>
          </View>
        </View>

        {/* Footer Notice */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Phase 1 Baseline Architecture • Do not use for actual emergencies.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0f19',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 16,
    paddingVertical: 12,
  },
  badge: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  title: {
    color: '#f8fafc',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 1,
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 13,
    marginTop: 4,
  },
  statusCard: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  dotAmber: {
    backgroundColor: '#f59e0b',
  },
  dotBlue: {
    backgroundColor: '#38bdf8',
  },
  dotGray: {
    backgroundColor: '#64748b',
  },
  statusLabel: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
    marginRight: 6,
  },
  statusValue: {
    color: '#f1f5f9',
    fontSize: 12,
    fontWeight: '500',
  },
  emergencyCard: {
    backgroundColor: '#182030',
    borderRadius: 8,
    padding: 14,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#38bdf8',
  },
  cardHeader: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  emergencyStatusText: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  emergencyDesc: {
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 18,
  },
  moduleCard: {
    backgroundColor: '#131b2e',
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  moduleHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  moduleTitle: {
    color: '#f1f5f9',
    fontSize: 14,
    fontWeight: '700',
  },
  plannedBadge: {
    color: '#f59e0b',
    backgroundColor: '#292524',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 10,
    fontWeight: '700',
  },
  moduleDescription: {
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 10,
  },
  disabledButton: {
    backgroundColor: '#1e293b',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  disabledRescueButton: {
    borderColor: '#7f1d1d',
    backgroundColor: '#1c1917',
  },
  disabledButtonText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
  },
  footer: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    alignItems: 'center',
  },
  footerText: {
    color: '#64748b',
    fontSize: 11,
    textAlign: 'center',
  },
});
