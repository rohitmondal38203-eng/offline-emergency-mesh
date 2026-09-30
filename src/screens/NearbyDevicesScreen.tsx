import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
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
  DeviceCard,
  EmergencyButton,
  SectionHeader,
  StatusCard,
} from '../components';
import {NavigationProp} from '../navigation/types';
import {
  bleService,
  BleAdvertiser,
  BlePermissions,
  BlePeer,
  BleRadioState,
  BlePermissionStatus,
  PeerIdentityService,
} from '../services/ble';

interface NearbyDevicesScreenProps {
  navigation: NavigationProp;
}

export const NearbyDevicesScreen: React.FC<NearbyDevicesScreenProps> = ({
  navigation,
}) => {
  const [radioState, setRadioState] = useState<BleRadioState>('UNKNOWN');
  const [permissionStatus, setPermissionStatus] = useState<BlePermissionStatus>('CHECKING');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isAdvertising, setIsAdvertising] = useState<boolean>(false);
  const [advertisingSupported, setAdvertisingSupported] = useState<boolean>(true);
  const [localPeerId, setLocalPeerId] = useState<string>('RESQ-MESH:----');
  const [discoveredPeers, setDiscoveredPeers] = useState<BlePeer[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize BLE service, read identity, and check permissions
  useEffect(() => {
    let isMounted = true;

    async function setupBle() {
      // 1. Load stable peer identity
      const peerId = await PeerIdentityService.getLocalPeerId();
      if (isMounted) {
        setLocalPeerId(peerId);
      }

      // 2. Check advertising support
      const advSupport = await BleAdvertiser.isSupported();
      if (isMounted) {
        setAdvertisingSupported(advSupport);
      }

      // 3. Check initial runtime permissions
      const permResult = await BlePermissions.checkPermissions();
      if (isMounted) {
        setPermissionStatus(permResult.status);
      }

      // 4. Initialize BleManager and radio listener
      bleService.initialize((state: BleRadioState) => {
        if (isMounted) {
          setRadioState(state);
          if (state === 'POWERED_OFF') {
            setIsAdvertising(false);
          }
        }
      });

      // Get initial radio state
      const initialRadio = await bleService.getRadioState();
      if (isMounted) {
        setRadioState(initialRadio);
      }

      // 5. Register BLE service callbacks
      bleService.setListeners({
        onPeersUpdated: (peers: BlePeer[]) => {
          if (isMounted) {
            setDiscoveredPeers(peers);
          }
        },
        onScanStatusChanged: (scanning: boolean) => {
          if (isMounted) {
            setIsScanning(scanning);
          }
        },
        onError: (err: string) => {
          if (isMounted) {
            setErrorMessage(err);
          }
        },
      });
    }

    setupBle();

    return () => {
      isMounted = false;
      // Step 10: Screen unmount cleanup - stop scanning to conserve radio battery
      bleService.stopScanning();
    };
  }, []);

  // Request permissions if not granted
  const handleRequestPermissions = async () => {
    setErrorMessage(null);
    const result = await BlePermissions.requestPermissions();
    setPermissionStatus(result.status);
    if (!result.canScan) {
      setErrorMessage(result.message);
    }
  };

  // Start BLE scanning
  const handleStartScan = async () => {
    setErrorMessage(null);

    // Permission check
    if (permissionStatus !== 'GRANTED') {
      const result = await BlePermissions.requestPermissions();
      setPermissionStatus(result.status);
      if (!result.canScan) {
        setErrorMessage(result.message);
        return;
      }
    }

    // Radio state check
    const currentRadio = await bleService.getRadioState();
    setRadioState(currentRadio);
    if (currentRadio === 'POWERED_OFF') {
      setErrorMessage('Bluetooth is turned OFF. Please turn on Bluetooth in device settings.');
      return;
    }
    if (currentRadio === 'UNSUPPORTED') {
      setErrorMessage('BLE is unsupported on this device hardware.');
      return;
    }

    await bleService.startScanning();
  };

  // Stop BLE scanning
  const handleStopScan = () => {
    bleService.stopScanning();
  };

  // Toggle BLE peripheral advertising
  const handleToggleAdvertising = async () => {
    setErrorMessage(null);

    if (isAdvertising) {
      await BleAdvertiser.stopAdvertising();
      setIsAdvertising(false);
      return;
    }

    if (permissionStatus !== 'GRANTED') {
      const result = await BlePermissions.requestPermissions();
      setPermissionStatus(result.status);
      if (!result.canAdvertise) {
        setErrorMessage(result.message);
        return;
      }
    }

    try {
      await BleAdvertiser.startAdvertising(localPeerId);
      setIsAdvertising(true);
    } catch (e: any) {
      setIsAdvertising(false);
      setErrorMessage(`Advertising error: ${e?.message || e}`);
    }
  };

  // Connect to a peer
  const handleConnectPeer = useCallback(async (peerId: string) => {
    setErrorMessage(null);
    const success = await bleService.connectToPeer(peerId);
    if (!success) {
      // Error message broadcasted via bleService.onError
    }
  }, []);

  // Disconnect from a peer
  const handleDisconnectPeer = useCallback(async (peerId: string) => {
    await bleService.disconnectFromPeer(peerId);
  }, []);

  // Clear discovered peers
  const handleClearPeers = () => {
    bleService.clearDiscoveredPeers();
  };

  // Format radio status for display
  const getRadioDisplay = () => {
    switch (radioState) {
      case 'POWERED_ON':
        return {text: 'ON', color: THEME.colors.signal};
      case 'POWERED_OFF':
        return {text: 'OFF (DISABLED)', color: THEME.colors.emergency};
      case 'UNAUTHORIZED':
        return {text: 'PERMISSION DENIED', color: THEME.colors.emergency};
      case 'UNSUPPORTED':
        return {text: 'UNSUPPORTED', color: THEME.colors.emergency};
      default:
        return {text: 'INITIALIZING', color: THEME.colors.warning};
    }
  };

  const radioBadge = getRadioDisplay();

  return (
    <View style={styles.container}>
      <AppHeader
        title="Nearby Devices"
        subtitle="Phase 3: BLE Discovery & Presence"
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Error / Warning Alert Banner */}
        {errorMessage && (
          <View style={styles.errorBanner}>
            <View style={styles.errorRow}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
            <TouchableOpacity
              onPress={() => setErrorMessage(null)}
              style={styles.errorDismiss}>
              <Text style={styles.errorDismissText}>DISMISS</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Local Node Identity Card */}
        <View style={styles.nodeIdentityCard}>
          <View style={styles.nodeIdentityRow}>
            <View>
              <Text style={styles.nodeIdentityLabel}>THIS DEVICE IDENTITY</Text>
              <Text style={styles.nodeIdentityVal}>{localPeerId}</Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleToggleAdvertising}
              style={[
                styles.advToggleBtn,
                isAdvertising && styles.advToggleBtnActive,
              ]}>
              <Text style={styles.advToggleBtnText}>
                {isAdvertising ? '■ STOP BEACON' : '▲ ADVERTISE BEACON'}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.nodeIdentityHint}>
            Non-emergency BLE presence beacon broadcasts your node ID so other phones running RESQ-MESH can discover you.
          </Text>
        </View>

        {/* Radio & Telemetry Status Card */}
        <StatusCard
          variant="info"
          items={[
            {
              label: 'Bluetooth',
              value: radioBadge.text,
              color: radioBadge.color,
            },
            {
              label: 'BLE Permission',
              value:
                permissionStatus === 'GRANTED'
                  ? 'Granted'
                  : permissionStatus === 'NEVER_ASK_AGAIN'
                  ? 'Blocked in Settings'
                  : 'Not Granted',
              color:
                permissionStatus === 'GRANTED'
                  ? THEME.colors.signal
                  : THEME.colors.warning,
            },
            {
              label: 'Scanning',
              value: isScanning ? 'ACTIVE (SEARCHING)' : 'IDLE',
              color: isScanning ? THEME.colors.signal : THEME.colors.textMuted,
            },
            {
              label: 'Advertising',
              value: !advertisingSupported
                ? 'Hardware Unsupported'
                : isAdvertising
                ? 'BROADCASTING'
                : 'Disabled',
              color: isAdvertising ? THEME.colors.success : THEME.colors.textMuted,
            },
          ]}
        />

        {/* Permission Request Prompt if not granted */}
        {permissionStatus !== 'GRANTED' && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleRequestPermissions}
            style={styles.permissionActionBtn}>
            <Text style={styles.permissionActionBtnText}>
              🔑 GRANT BLUETOOTH RUNTIME PERMISSIONS
            </Text>
          </TouchableOpacity>
        )}

        {/* Scan Action Controls */}
        <View style={styles.scanControlsContainer}>
          {isScanning ? (
            <EmergencyButton
              title="■ STOP BLE SCAN"
              subtitle="Cease active BLE radio discovery"
              variant="warning"
              onPress={handleStopScan}
            />
          ) : (
            <EmergencyButton
              title="🔍 START REAL BLE SCAN"
              subtitle="Scan for nearby RESQ-MESH nodes & BLE peripherals"
              variant="secondary"
              onPress={handleStartScan}
            />
          )}
        </View>

        {/* Scanning Activity Indicator Bar */}
        {isScanning && (
          <View style={styles.scanningIndicatorBar}>
            <ActivityIndicator size="small" color={THEME.colors.signal} />
            <Text style={styles.scanningIndicatorText}>
              Scanning 2.4 GHz BLE spectrum (20s timeout)...
            </Text>
          </View>
        )}

        {/* Section Header with Peer Count and Clear Action */}
        <View style={styles.sectionHeaderRow}>
          <SectionHeader
            title="Discovered BLE Peers"
            badge={`${discoveredPeers.length} FOUND`}
          />
          {discoveredPeers.length > 0 && (
            <TouchableOpacity onPress={handleClearPeers} style={styles.clearBtn}>
              <Text style={styles.clearBtnText}>CLEAR</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Discovered Peer List or Empty State */}
        {discoveredPeers.length === 0 ? (
          <View style={styles.emptyStateCard}>
            <Text style={styles.emptyIcon}>📡</Text>
            <Text style={styles.emptyTitle}>No Nearby Peers Discovered</Text>
            <Text style={styles.emptySubtitle}>
              Tap "START REAL BLE SCAN" above to scan for nearby phones running RESQ-MESH or other BLE peripherals.
            </Text>
            <Text style={styles.emptyAdvice}>
              Tip: If testing with Phone B, tap "ADVERTISE BEACON" on Phone B so Phone A can discover it over Bluetooth Low Energy.
            </Text>
          </View>
        ) : (
          <View style={styles.peerListContainer}>
            {discoveredPeers.map(peer => (
              <DeviceCard
                key={peer.id}
                id={peer.id}
                name={peer.name}
                rssi={peer.rssi !== null ? peer.rssi : -99}
                radioType="BLE"
                connectionState={peer.connectionState}
                lastSeen={
                  peer.connectionState === 'connected'
                    ? 'Active link'
                    : `${Math.round((Date.now() - peer.lastSeen) / 1000)}s ago`
                }
                isRelayNode={peer.isResqMeshPeer}
                onConnect={() => handleConnectPeer(peer.id)}
                onDisconnect={() => handleDisconnectPeer(peer.id)}
              />
            ))}
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
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: THEME.colors.emergency,
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.sm,
    marginBottom: THEME.spacing.sm,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  errorText: {
    flex: 1,
    ...THEME.typography.caption,
    color: '#fca5a5',
    fontWeight: '600',
  },
  errorDismiss: {
    alignSelf: 'flex-end',
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  errorDismissText: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.emergency,
  },
  nodeIdentityCard: {
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.signalDark,
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.sm,
  },
  nodeIdentityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nodeIdentityLabel: {
    ...THEME.typography.caption,
    color: THEME.colors.signal,
    letterSpacing: 0.5,
  },
  nodeIdentityVal: {
    fontSize: 18,
    fontWeight: '900',
    color: THEME.colors.textPrimary,
    letterSpacing: 1,
    marginTop: 2,
  },
  nodeIdentityHint: {
    ...THEME.typography.bodySmall,
    color: THEME.colors.textMuted,
    fontSize: 11,
    marginTop: 6,
    lineHeight: 15,
  },
  advToggleBtn: {
    backgroundColor: THEME.colors.surfaceRaised,
    borderWidth: 1,
    borderColor: THEME.colors.signal,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: THEME.borderRadius.sm,
  },
  advToggleBtnActive: {
    backgroundColor: THEME.colors.signalDark,
    borderColor: THEME.colors.signal,
  },
  advToggleBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  permissionActionBtn: {
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    borderWidth: 1,
    borderColor: THEME.colors.warning,
    borderRadius: THEME.borderRadius.md,
    paddingVertical: 10,
    paddingHorizontal: THEME.spacing.md,
    alignItems: 'center',
    marginBottom: THEME.spacing.sm,
  },
  permissionActionBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.colors.warning,
    letterSpacing: 0.5,
  },
  scanControlsContainer: {
    marginVertical: THEME.spacing.xs,
  },
  scanningIndicatorBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderRadius: THEME.borderRadius.sm,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: THEME.spacing.sm,
  },
  scanningIndicatorText: {
    fontSize: 12,
    color: THEME.colors.signal,
    fontWeight: '600',
    marginLeft: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: THEME.spacing.xs,
  },
  clearBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  clearBtnText: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    fontWeight: '700',
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
    maxWidth: 290,
  },
  emptyAdvice: {
    ...THEME.typography.bodySmall,
    color: THEME.colors.signal,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    maxWidth: 290,
    marginTop: 10,
  },
  peerListContainer: {
    marginVertical: THEME.spacing.xs,
  },
});
