import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {THEME} from '../config/theme';

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
  const getStateBadge = () => {
    switch (connectionState) {
      case 'connected':
        return {text: 'LINK ACTIVE', color: THEME.colors.success};
      case 'connecting':
        return {text: 'NEGOTIATING', color: THEME.colors.warning};
      case 'disconnected':
        return {text: 'DISCONNECTED', color: THEME.colors.textMuted};
      case 'discovered':
      default:
        return {text: 'DISCOVERED', color: THEME.colors.signal};
    }
  };

  const badge = getStateBadge();

  return (
    <View style={styles.card}>
      <View style={styles.mainRow}>
        <View style={styles.leftCol}>
          <View style={styles.titleRow}>
            <View style={[styles.statusDot, {backgroundColor: badge.color}]} />
            <Text style={styles.name}>{name}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>{radioType}</Text>
            <Text style={styles.metaDot}>•</Text>
            <Text style={styles.metaText}>RSSI: {rssi} dBm</Text>
            <Text style={styles.metaDot}>•</Text>
            <Text style={styles.metaText}>{lastSeen}</Text>
          </View>
        </View>

        <View style={styles.rightCol}>
          <View style={[styles.stateBadge, {borderColor: badge.color}]}>
            <Text style={[styles.stateBadgeText, {color: badge.color}]}>
              {badge.text}
            </Text>
          </View>
          {isRelayNode ? (
            <View style={styles.relayBadge}>
              <Text style={styles.relayBadgeText}>RELAY CAPABLE</Text>
            </View>
          ) : null}
          {connectionState === 'connected' && onDisconnect ? (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onDisconnect}
              style={[styles.actionBtn, styles.actionBtnDisconnect]}>
              <Text style={styles.actionBtnText}>DISCONNECT</Text>
            </TouchableOpacity>
          ) : connectionState === 'discovered' && onConnect ? (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onConnect}
              style={styles.actionBtn}>
              <Text style={styles.actionBtnText}>CONNECT</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.md,
    marginVertical: THEME.spacing.xs,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
  },
  mainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftCol: {
    flex: 1,
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
    ...THEME.typography.titleCard,
    color: THEME.colors.textPrimary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  metaText: {
    ...THEME.typography.bodySmall,
    color: THEME.colors.textMuted,
  },
  metaDot: {
    color: THEME.colors.textMuted,
    marginHorizontal: 6,
    fontSize: 10,
  },
  rightCol: {
    alignItems: 'flex-end',
  },
  stateBadge: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: THEME.colors.surfaceRaised,
  },
  stateBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  relayBadge: {
    marginTop: 4,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 3,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
  },
  relayBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: THEME.colors.signal,
  },
  actionBtn: {
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: THEME.colors.signalDark,
  },
  actionBtnDisconnect: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: THEME.colors.emergency,
  },
  actionBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
});
