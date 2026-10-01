import React, {useEffect, useState} from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';
import {AppHeader} from '../components';
import {NavigationProp} from '../navigation/types';
import {bleService, BleRadioState} from '../services/ble';
import {meshRouter, meshStore, MeshTelemetry} from '../services/mesh';
import {locationService} from '../services/location';

interface SystemStatusScreenProps {
  navigation: NavigationProp;
}

interface StatusItem {
  id: string;
  icon: string;
  iconBg: string;
  label: string;
  value: string;
  valueColor: string;
}

export const SystemStatusScreen: React.FC<SystemStatusScreenProps> = ({navigation}) => {
  const [radioState, setRadioState] = useState<BleRadioState>('UNKNOWN');
  const [gpsAvailable, setGpsAvailable] = useState<boolean | null>(null);
  const [meshTelemetry, setMeshTelemetry] = useState<MeshTelemetry>(
    meshStore.getTelemetry('RESQ-MESH:----')
  );
  const [connectedPeerCount, setConnectedPeerCount] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;

    async function loadStatus() {
      const state = await bleService.getRadioState();
      if (isMounted) setRadioState(state);

      const peers = bleService.getDiscoveredPeers();
      const connected = peers.filter(p => p.connectionState === 'connected').length;
      if (isMounted) setConnectedPeerCount(connected);

      try {
        const hasGps = await locationService.isGpsAvailable();
        if (isMounted) setGpsAvailable(hasGps);
      } catch {
        if (isMounted) setGpsAvailable(false);
      }

      setMeshTelemetry(meshStore.getTelemetry('RESQ-MESH:----'));
    }

    loadStatus();

    meshRouter.setOnTelemetryUpdated(telem => {
      if (isMounted) setMeshTelemetry(telem);
    });

    bleService.setListeners({
      onRadioStateChanged: state => {
        if (isMounted) setRadioState(state);
      },
      onPeersUpdated: peers => {
        if (isMounted) {
          const connected = peers.filter(p => p.connectionState === 'connected').length;
          setConnectedPeerCount(connected);
        }
      },
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const isBluetoothOn = radioState === 'POWERED_ON';

  const statusItems: StatusItem[] = [
    {
      id: 'mesh',
      icon: '✳️',
      iconBg: '#ECFDF5',
      label: 'Mesh Network',
      value: connectedPeerCount > 0 ? 'Connected' : 'Active (0 Peers)',
      valueColor: '#10B981',
    },
    {
      id: 'bluetooth',
      icon: 'ᛒ',
      iconBg: '#EFF6FF',
      label: 'Bluetooth',
      value: isBluetoothOn ? 'On' : 'Off',
      valueColor: isBluetoothOn ? '#0066FF' : '#94A3B8',
    },
    {
      id: 'gps',
      icon: '📍',
      iconBg: '#EFF6FF',
      label: 'GPS Hardware',
      value:
        gpsAvailable === null
          ? 'Checking...'
          : gpsAvailable
          ? 'Available'
          : 'Disabled',
      valueColor: gpsAvailable ? '#10B981' : '#EF4444',
    },
    {
      id: 'peers',
      icon: '👥',
      iconBg: '#EFF6FF',
      label: 'Connected Peers',
      value: `${connectedPeerCount}`,
      valueColor: '#0066FF',
    },
    {
      id: 'store_forward',
      icon: '☁️',
      iconBg: '#ECFDF5',
      label: 'Store & Forward',
      value: 'Enabled',
      valueColor: '#10B981',
    },
  ];

  return (
    <View style={styles.container}>
      <AppHeader
        title="System Status"
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.cardList}>
          {statusItems.map((item, idx) => (
            <View
              key={item.id}
              style={[
                styles.rowItem,
                idx < statusItems.length - 1 && styles.rowDivider,
              ]}>
              <View style={[styles.iconCircle, {backgroundColor: item.iconBg}]}>
                <Text style={styles.iconGlyph}>{item.icon}</Text>
              </View>
              <View style={styles.textWrapper}>
                <Text style={styles.itemLabel}>{item.label}</Text>
                <Text style={[styles.itemValue, {color: item.valueColor}]}>
                  {item.value}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Telemetry Footer */}
        <View style={styles.telemetryCard}>
          <Text style={styles.telemetryTitle}>MESH TELEMETRY SUMMARY</Text>
          <View style={styles.telemetryRow}>
            <Text style={styles.telemetryLabel}>Total Packets:</Text>
            <Text style={styles.telemetryVal}>{meshTelemetry.totalMessages}</Text>
          </View>
          <View style={styles.telemetryRow}>
            <Text style={styles.telemetryLabel}>Pending Relay:</Text>
            <Text style={styles.telemetryVal}>{meshTelemetry.pendingCount}</Text>
          </View>
          <View style={styles.telemetryRow}>
            <Text style={styles.telemetryLabel}>Forwarded:</Text>
            <Text style={styles.telemetryVal}>{meshTelemetry.forwardedCount}</Text>
          </View>
          <View style={styles.telemetryRow}>
            <Text style={styles.telemetryLabel}>Delivered:</Text>
            <Text style={styles.telemetryVal}>{meshTelemetry.deliveredCount}</Text>
          </View>
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
    paddingBottom: 24,
  },
  cardList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#EDF0F3',
    shadowColor: '#0F172A',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  iconGlyph: {
    fontSize: 20,
  },
  textWrapper: {
    flex: 1,
  },
  itemLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  itemValue: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  telemetryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#EDF0F3',
  },
  telemetryTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  telemetryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  telemetryLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  telemetryVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
});
