import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {THEME} from '../config/theme';
import {AppHeader} from '../components';
import {NavigationProp} from '../navigation/types';
import {locationService, GeoLocation} from '../services/location';
import {
  HazardBroadcastPayload,
  HazardSeverity,
  HazardType,
  meshRouter,
  meshStore,
  StoredMeshMessage,
} from '../services/mesh';

interface HazardBroadcastScreenProps {
  navigation: NavigationProp;
}

interface HazardTypeOption {
  type: HazardType;
  label: string;
  icon: string;
}

const HAZARD_TYPES: HazardTypeOption[] = [
  {type: 'FLOOD', label: 'Flood', icon: '🌊'},
  {type: 'FIRE', label: 'Fire', icon: '🔥'},
  {type: 'ROAD_BLOCKED', label: 'Road Blocked', icon: '🚧'},
  {type: 'BUILDING_COLLAPSE', label: 'Building Collapse', icon: '🏚️'},
  {type: 'LANDSLIDE', label: 'Landslide', icon: '⛰️'},
  {type: 'OTHER', label: 'Other Hazard', icon: '⚠️'},
];

const SEVERITIES: {level: HazardSeverity; label: string; color: string; bgColor: string; borderColor: string}[] = [
  {level: 'LOW', label: 'LOW', color: '#2563EB', bgColor: '#EFF6FF', borderColor: '#BFDBFE'},
  {level: 'MEDIUM', label: 'MEDIUM', color: '#D97706', bgColor: '#FEF3C7', borderColor: '#FCD34D'},
  {level: 'HIGH', label: 'HIGH', color: '#EA580C', bgColor: '#FFEDD5', borderColor: '#FDBA74'},
  {level: 'CRITICAL', label: 'CRITICAL', color: '#DC2626', bgColor: '#FEE2E2', borderColor: '#FCA5A5'},
];

export const HazardBroadcastScreen: React.FC<HazardBroadcastScreenProps> = ({
  navigation,
}) => {
  const [activeTab, setActiveTab] = useState<'FEED' | 'COMPOSE'>('FEED');

  // Feed State
  const [hazards, setHazards] = useState<StoredMeshMessage[]>([]);
  const [filterSeverity, setFilterSeverity] = useState<HazardSeverity | 'ALL'>('ALL');

  // Compose State
  const [selectedType, setSelectedType] = useState<HazardType>('FLOOD');
  const [selectedSeverity, setSelectedSeverity] = useState<HazardSeverity>('HIGH');
  const [title, setTitle] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [includeLocation, setIncludeLocation] = useState<boolean>(true);
  const [isBroadcasting, setIsBroadcasting] = useState<boolean>(false);

  // Offline GPS State
  const [gpsStatus, setGpsStatus] = useState<'ACQUIRING' | 'LOCKED' | 'UNAVAILABLE'>('ACQUIRING');
  const [location, setLocation] = useState<GeoLocation | null>(null);

  const loadHazards = useCallback(() => {
    const list = meshStore.getHazardBroadcasts();
    setHazards(list);
  }, []);

  const acquireGps = useCallback(async () => {
    setGpsStatus('ACQUIRING');
    try {
      const res = await locationService.getCurrentLocation(8000);
      if (res.success && res.location) {
        setLocation(res.location);
        setGpsStatus('LOCKED');
      } else {
        setLocation(null);
        setGpsStatus('UNAVAILABLE');
      }
    } catch {
      setLocation(null);
      setGpsStatus('UNAVAILABLE');
    }
  }, []);

  // Initial load and live mesh router listeners
  useEffect(() => {
    loadHazards();
    acquireGps();

    // Subscribe to live telemetry and message reception without polling
    const unsubTelemetry = meshRouter.addOnTelemetryUpdatedListener(() => {
      loadHazards();
    });

    const unsubMessage = meshRouter.addOnMessageReceivedListener(msg => {
      if (msg.messageType === 'HAZARD_BROADCAST') {
        loadHazards();
      }
    });

    return () => {
      unsubTelemetry();
      unsubMessage();
    };
  }, [loadHazards, acquireGps]);

  const handleBroadcast = async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage) {
      Alert.alert('Required Field', 'Please provide a message or description of the hazard.');
      return;
    }

    setIsBroadcasting(true);
    try {
      const payload: HazardBroadcastPayload = {
        hazardType: selectedType,
        severity: selectedSeverity,
        title: title.trim() || undefined,
        message: trimmedMessage,
        location:
          includeLocation && location
            ? {
                latitude: location.latitude,
                longitude: location.longitude,
                accuracy: location.accuracy,
                timestamp: location.timestamp,
              }
            : undefined,
      };

      await meshRouter.sendHazardBroadcast(payload);

      // Refresh list immediately
      loadHazards();

      // Reset form fields
      setTitle('');
      setMessage('');
      setActiveTab('FEED');

      const locSummary = payload.location
        ? `\n📍 Location: ${payload.location.latitude.toFixed(5)}°, ${payload.location.longitude.toFixed(5)}° (±${payload.location.accuracy}m)`
        : '';

      Alert.alert(
        '📢 HAZARD BROADCAST ENQUEUED',
        `Type: ${selectedType}\nSeverity: ${selectedSeverity}${locSummary}\n\nBroadcast enqueued in local mesh store (TTL=5). Relaying opportunistically across all nearby BLE peers.`,
        [
          {text: 'OK'},
          {
            text: 'View Mesh Nodes',
            onPress: () => navigation.navigate('NEARBY_DEVICES'),
          },
        ]
      );
    } catch (e: any) {
      Alert.alert('Broadcast Error', `Failed to enqueue hazard broadcast: ${e?.message || e}`);
    } finally {
      setIsBroadcasting(false);
    }
  };

  const filteredHazards = hazards.filter(item => {
    if (filterSeverity === 'ALL') return true;
    const payload = item.message.payload as HazardBroadcastPayload;
    return payload && payload.severity === filterSeverity;
  });

  const formatTimestamp = (epochMs: number): string => {
    if (!epochMs) return '';
    const diffSec = Math.floor((Date.now() - epochMs) / 1000);
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const date = new Date(epochMs);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}`;
  };

  const getSeverityStyle = (severity: HazardSeverity) => {
    switch (severity) {
      case 'CRITICAL':
        return {color: '#DC2626', bg: '#FEE2E2', border: '#FCA5A5'};
      case 'HIGH':
        return {color: '#EA580C', bg: '#FFEDD5', border: '#FDBA74'};
      case 'MEDIUM':
        return {color: '#D97706', bg: '#FEF3C7', border: '#FCD34D'};
      case 'LOW':
      default:
        return {color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE'};
    }
  };

  const getTypeDetails = (type: HazardType) => {
    const match = HAZARD_TYPES.find(h => h.type === type);
    return match || {type, label: type, icon: '⚠️'};
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title="Hazard Broadcast"
        subtitle="Offline Disaster Bulletins"
        showBack
        onBack={() => navigation.goBack()}
      />

      {/* Screen Segment Tabs */}
      <View style={styles.segmentContainer}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setActiveTab('FEED')}
          style={[styles.segmentBtn, activeTab === 'FEED' && styles.segmentBtnActive]}>
          <Text style={[styles.segmentBtnText, activeTab === 'FEED' && styles.segmentBtnTextActive]}>
            📢 Bulletins ({hazards.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setActiveTab('COMPOSE')}
          style={[styles.segmentBtn, activeTab === 'COMPOSE' && styles.segmentBtnActive]}>
          <Text style={[styles.segmentBtnText, activeTab === 'COMPOSE' && styles.segmentBtnTextActive]}>
            ➕ Report Hazard
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        {activeTab === 'FEED' ? (
          /* ================= BULLETIN FEED TAB ================= */
          <View>
            {/* Filter Pills */}
            <View style={styles.filterRow}>
              {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map(sev => {
                const isActive = filterSeverity === sev;
                return (
                  <TouchableOpacity
                    key={sev}
                    activeOpacity={0.7}
                    onPress={() => setFilterSeverity(sev)}
                    style={[styles.filterPill, isActive && styles.filterPillActive]}>
                    <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>
                      {sev}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Empty State */}
            {filteredHazards.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyIcon}>📡</Text>
                <Text style={styles.emptyTitle}>No Local Hazard Bulletins</Text>
                <Text style={styles.emptySubtitle}>
                  {filterSeverity === 'ALL'
                    ? 'No hazard broadcasts have been originated or received over BLE mesh yet. Broadcasts propagate peer-to-peer without internet.'
                    : `No hazard broadcasts found with severity level ${filterSeverity}.`}
                </Text>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setActiveTab('COMPOSE')}
                  style={styles.emptyActionBtn}>
                  <Text style={styles.emptyActionBtnText}>Report a Hazard Now</Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* Hazard Feed List */
              filteredHazards.map(item => {
                const msg = item.message;
                const payload = (typeof msg.payload === 'object' && msg.payload !== null
                  ? msg.payload
                  : {}) as HazardBroadcastPayload;

                const sevStyle = getSeverityStyle(payload.severity || 'LOW');
                const typeInfo = getTypeDetails(payload.hazardType || 'OTHER');

                return (
                  <View key={msg.messageId} style={styles.bulletinCard}>
                    {/* Header Row: Severity + Type + Timestamp */}
                    <View style={styles.cardHeaderRow}>
                      <View style={styles.badgesWrapper}>
                        <View
                          style={[
                            styles.severityBadge,
                            {backgroundColor: sevStyle.bg, borderColor: sevStyle.border},
                          ]}>
                          <Text style={[styles.severityText, {color: sevStyle.color}]}>
                            {payload.severity || 'UNKNOWN'}
                          </Text>
                        </View>
                        <View style={styles.typeBadge}>
                          <Text style={styles.typeIcon}>{typeInfo.icon}</Text>
                          <Text style={styles.typeText}>{typeInfo.label}</Text>
                        </View>
                      </View>
                      <Text style={styles.cardTimestamp}>
                        {formatTimestamp(msg.createdAt || item.receivedAt)}
                      </Text>
                    </View>

                    {/* Title (if present) */}
                    {payload.title ? (
                      <Text style={styles.bulletinTitle}>{payload.title}</Text>
                    ) : null}

                    {/* Message Body */}
                    <Text style={styles.bulletinMessage}>{payload.message || 'No description provided'}</Text>

                    {/* Location Box (if available) */}
                    {payload.location ? (
                      <View style={styles.bulletinLocBox}>
                        <Text style={styles.bulletinLocPin}>📍</Text>
                        <Text style={styles.bulletinLocText}>
                          {payload.location.latitude.toFixed(5)}°, {payload.location.longitude.toFixed(5)}°
                          {payload.location.accuracy ? ` (±${payload.location.accuracy}m)` : ''}
                        </Text>
                      </View>
                    ) : null}

                    {/* Card Footer: Metadata */}
                    <View style={styles.bulletinFooter}>
                      <View style={styles.footerNodeWrapper}>
                        <Text style={styles.footerNodeLabel}>Origin:</Text>
                        <Text style={styles.footerNodeVal}>{msg.originNodeId}</Text>
                      </View>
                      <View style={styles.footerHopsWrapper}>
                        <Text style={styles.footerHopsText}>
                          Hops: {msg.hopCount ?? 0} • TTL: {msg.ttl ?? 0}
                        </Text>
                        <View
                          style={[
                            styles.statusDot,
                            item.status === 'DELIVERED'
                              ? styles.statusDotDelivered
                              : item.status === 'FORWARDED'
                              ? styles.statusDotForwarded
                              : styles.statusDotPending,
                          ]}
                        />
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        ) : (
          /* ================= AUTHORING FORM TAB ================= */
          <View>
            <Text style={styles.sectionHeaderTitle}>Broadcast Offline Hazard</Text>
            <Text style={styles.sectionSubtitle}>
              Broadcast critical emergency hazard alerts over peer-to-peer BLE mesh to all nearby phones.
            </Text>

            {/* 1. Hazard Type Selection Grid */}
            <Text style={styles.fieldLabel}>HAZARD TYPE</Text>
            <View style={styles.typesGrid}>
              {HAZARD_TYPES.map(opt => {
                const isSelected = selectedType === opt.type;
                return (
                  <TouchableOpacity
                    key={opt.type}
                    activeOpacity={0.75}
                    onPress={() => setSelectedType(opt.type)}
                    style={[styles.typeOptionCard, isSelected && styles.typeOptionCardSelected]}>
                    <Text style={styles.typeOptionIcon}>{opt.icon}</Text>
                    <Text
                      style={[
                        styles.typeOptionText,
                        isSelected && styles.typeOptionTextSelected,
                      ]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 2. Severity Selection */}
            <Text style={styles.fieldLabel}>SEVERITY LEVEL</Text>
            <View style={styles.severityRow}>
              {SEVERITIES.map(s => {
                const isSelected = selectedSeverity === s.level;
                return (
                  <TouchableOpacity
                    key={s.level}
                    activeOpacity={0.75}
                    onPress={() => setSelectedSeverity(s.level)}
                    style={[
                      styles.severityOptionBtn,
                      {backgroundColor: s.bgColor, borderColor: s.borderColor},
                      isSelected && {borderColor: s.color, borderWidth: 2},
                    ]}>
                    <Text style={[styles.severityOptionText, {color: s.color}]}>
                      {s.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 3. Title Input (Optional) */}
            <View style={styles.inputWrapper}>
              <Text style={styles.fieldLabel}>TITLE (OPTIONAL)</Text>
              <TextInput
                style={styles.textInputSingle}
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. North River Bridge Flooded"
                placeholderTextColor="#94A3B8"
              />
            </View>

            {/* 4. Message / Details (Required) */}
            <View style={styles.inputWrapper}>
              <Text style={styles.fieldLabel}>MESSAGE & DETAILS (REQUIRED)</Text>
              <TextInput
                style={styles.textInputMulti}
                value={message}
                onChangeText={setMessage}
                placeholder="Describe current hazard situation, impassable roads, structural damage, water depth, or warnings..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={3}
              />
            </View>

            {/* 5. Offline GPS Location */}
            <View style={styles.gpsCard}>
              <View style={styles.gpsHeaderRow}>
                <View style={styles.gpsHeaderLeft}>
                  <Text style={styles.gpsTitle}>OFFLINE GNSS LOCATION</Text>
                  <Text
                    style={[
                      styles.gpsStatusBadge,
                      gpsStatus === 'LOCKED'
                        ? styles.gpsStatusLocked
                        : gpsStatus === 'ACQUIRING'
                        ? styles.gpsStatusAcquiring
                        : styles.gpsStatusUnavailable,
                    ]}>
                    {gpsStatus === 'LOCKED'
                      ? `GPS: Locked ±${location?.accuracy ?? 0}m`
                      : gpsStatus === 'ACQUIRING'
                      ? 'GPS: Acquiring...'
                      : 'GPS: Unavailable'}
                  </Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={acquireGps}
                  style={styles.gpsRefreshBtn}>
                  <Text style={styles.gpsRefreshText}>🔄 REFRESH</Text>
                </TouchableOpacity>
              </View>

              {location ? (
                <View style={styles.gpsDetailsBox}>
                  <View style={styles.coordRow}>
                    <Text style={styles.coordLabel}>Coordinates:</Text>
                    <Text style={styles.coordValue}>
                      {location.latitude.toFixed(6)}°, {location.longitude.toFixed(6)}°
                    </Text>
                  </View>
                  <View style={styles.coordRow}>
                    <Text style={styles.coordLabel}>Accuracy:</Text>
                    <Text style={styles.coordValue}>±{location.accuracy} meters</Text>
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setIncludeLocation(!includeLocation)}
                    style={styles.locationToggleRow}>
                    <View
                      style={[
                        styles.checkbox,
                        includeLocation && styles.checkboxActive,
                      ]}>
                      {includeLocation ? <Text style={styles.checkboxCheck}>✓</Text> : null}
                    </View>
                    <Text style={styles.locationToggleLabel}>
                      Attach GPS coordinates to broadcast
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Text style={styles.gpsNoticeText}>
                  {gpsStatus === 'ACQUIRING'
                    ? 'Acquiring offline GPS fix from device hardware...'
                    : 'GPS unavailable — bulletin can still be broadcast without location.'}
                </Text>
              )}
            </View>

            {/* 6. Broadcast Action Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              disabled={isBroadcasting}
              onPress={handleBroadcast}
              style={[styles.broadcastBtn, isBroadcasting && styles.broadcastBtnDisabled]}>
              {isBroadcasting ? (
                <ActivityIndicator size="small" color="#FFFFFF" style={{marginRight: 8}} />
              ) : (
                <Text style={styles.broadcastBtnIcon}>📢</Text>
              )}
              <Text style={styles.broadcastBtnText}>
                {isBroadcasting ? 'Broadcasting Bulletin...' : 'Broadcast Across Mesh'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F7F9',
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF0F3',
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    marginHorizontal: 4,
  },
  segmentBtnActive: {
    backgroundColor: '#0066FF',
  },
  segmentBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  segmentBtnTextActive: {
    color: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 32,
  },
  /* Filter Row */
  filterRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  filterPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EDF0F3',
    marginRight: 6,
  },
  filterPillActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },
  /* Empty State */
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EDF0F3',
    marginTop: 10,
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  emptyActionBtn: {
    backgroundColor: '#0066FF',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  emptyActionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  /* Bulletin Card */
  bulletinCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EDF0F3',
    shadowColor: '#0F172A',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgesWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    marginRight: 6,
  },
  severityText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeIcon: {
    fontSize: 11,
    marginRight: 4,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  cardTimestamp: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  bulletinTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  bulletinMessage: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
    marginBottom: 10,
  },
  bulletinLocBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EDF0F3',
  },
  bulletinLocPin: {
    fontSize: 12,
    marginRight: 6,
  },
  bulletinLocText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  bulletinFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  footerNodeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerNodeLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
    marginRight: 4,
  },
  footerNodeVal: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '700',
  },
  footerHopsWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerHopsText: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
    marginRight: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusDotDelivered: {
    backgroundColor: '#10B981',
  },
  statusDotForwarded: {
    backgroundColor: '#0066FF',
  },
  statusDotPending: {
    backgroundColor: '#F59E0B',
  },
  /* Authoring Tab Styles */
  sectionHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  typesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  typeOptionCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: '#EDF0F3',
  },
  typeOptionCardSelected: {
    borderColor: '#0066FF',
    backgroundColor: '#EFF6FF',
  },
  typeOptionIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  typeOptionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  typeOptionTextSelected: {
    color: '#0066FF',
  },
  severityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  severityOptionBtn: {
    flex: 1,
    marginHorizontal: 3,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  severityOptionText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    marginBottom: 14,
  },
  textInputSingle: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EDF0F3',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  textInputMulti: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EDF0F3',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
    textAlignVertical: 'top',
    minHeight: 70,
  },
  gpsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EDF0F3',
    padding: 14,
    marginBottom: 20,
    shadowColor: '#0F172A',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  gpsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gpsHeaderLeft: {
    flex: 1,
    paddingRight: 8,
  },
  gpsTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.6,
  },
  gpsStatusBadge: {
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
  },
  gpsStatusLocked: {
    color: '#059669',
  },
  gpsStatusAcquiring: {
    color: '#D97706',
  },
  gpsStatusUnavailable: {
    color: '#64748B',
  },
  gpsRefreshBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  gpsRefreshText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0066FF',
  },
  gpsDetailsBox: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  coordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  coordLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  coordValue: {
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '700',
  },
  locationToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    backgroundColor: '#FFFFFF',
  },
  checkboxActive: {
    backgroundColor: '#0066FF',
    borderColor: '#0066FF',
  },
  checkboxCheck: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  locationToggleLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  gpsNoticeText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 6,
    fontStyle: 'italic',
  },
  broadcastBtn: {
    backgroundColor: '#0066FF',
    borderRadius: 9999,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0066FF',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  broadcastBtnDisabled: {
    opacity: 0.6,
  },
  broadcastBtnIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  broadcastBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});
