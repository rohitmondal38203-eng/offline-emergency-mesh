import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';

export type DeviceConnectionState = 'discovered' | 'connecting' | 'connected' | 'disconnected' | 'idle';

export interface DeviceItemProps {
  id: string;
  name: string;
  rssi?: number;
  radioType?: 'BLE' | 'Wi-Fi Direct';
  connectionState: DeviceConnectionState;
  lastSeen?: string;
  isRelayNode?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export const DeviceCard: React.FC<DeviceItemProps> = ({
  name,
  rssi = -72,
  radioType = 'BLE',
  connectionState,
  lastSeen = 'Just now',
  isRelayNode = true,
  onConnect,
  onDisconnect,
}) => {
  // Approximate distance estimation from RSSI for realistic rescue context
  const getEstimatedDistance = () => {
    if (rssi >= -60) return '~45 m • 1 hop';
    if (rssi >= -75) return '~62 m • 1 hop';
    if (rssi >= -85) return '~78 m • 2 hop';
    return '~94 m • 2 hop';
  };

  const isConnected = connectionState === 'connected';
  const isConnecting = connectionState === 'connecting';

  return (
    <View style={styles.card}>
      <View style={styles.mainRow}>
        <View style={styles.leftCol}>
          <View style={styles.titleRow}>
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: isConnected
                    ? '#10B981'
                    : isConnecting
                    ? '#F59E0B'
                    : '#0066FF',
                },
              ]}
            />
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.signalIcon}> 📶</Text>
          </View>
          <View style={styles.metaRow}>
            <Text
              style={[
                styles.statusText,
                {
                  color: isConnected
                    ? '#059669'
                    : isConnecting
                    ? '#D97706'
                    : '#0066FF',
                },
              ]}>
              {isConnected
                ? 'Link Active'
                : isConnecting
                ? 'Connecting'
                : 'Available'}
            </Text>
            <Text style={styles.metaDot}>•</Text>
            <Text style={styles.metaText}>{getEstimatedDistance()}</Text>
            <Text style={styles.metaDot}>•</Text>
            <Text style={styles.metaText}>{rssi} dBm</Text>
          </View>
          {isRelayNode ? (
            <View style={styles.relayRow}>
              <Text style={styles.relayBadgeText}>⚡ MESH RELAY</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.rightCol}>
          {isConnected ? (
            <View style={styles.connectedCol}>
              <View style={[styles.pillBadge, styles.pillConnected]}>
                <View style={styles.connectedDot} />
                <Text style={styles.pillConnectedText}>CONNECTED</Text>
              </View>
              {onDisconnect ? (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={onDisconnect}
                  style={styles.disconnectBtn}>
                  <Text style={styles.disconnectBtnText}>Disconnect</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : isConnecting ? (
            <View style={[styles.pillBadge, styles.pillConnecting]}>
              <Text style={styles.pillConnectingText}>Connecting...</Text>
            </View>
          ) : (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onConnect}
              disabled={!onConnect}
              style={styles.connectBtn}>
              <Text style={styles.connectBtnText}>CONNECT</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginVertical: 5,
    borderWidth: 1,
    borderColor: '#EDF0F3',
    shadowColor: '#0F172A',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  mainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftCol: {
    flex: 1,
    paddingRight: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  signalIcon: {
    fontSize: 12,
    color: '#10B981',
    marginLeft: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    paddingLeft: 16,
    flexWrap: 'wrap',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  metaDot: {
    fontSize: 10,
    color: '#94A3B8',
    marginHorizontal: 4,
  },
  metaText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  relayRow: {
    marginTop: 4,
    paddingLeft: 16,
  },
  relayBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#0066FF',
    letterSpacing: 0.5,
  },
  rightCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  connectBtn: {
    backgroundColor: '#0066FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 92,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0066FF',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  connectBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  connectedCol: {
    alignItems: 'flex-end',
  },
  pillBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
    minWidth: 84,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillConnected: {
    flexDirection: 'row',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  connectedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#059669',
    marginRight: 5,
  },
  pillConnectedText: {
    color: '#059669',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  disconnectBtn: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  disconnectBtnText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '600',
  },
  pillConnecting: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  pillConnectingText: {
    color: '#D97706',
    fontSize: 11,
    fontWeight: '700',
  },
});
