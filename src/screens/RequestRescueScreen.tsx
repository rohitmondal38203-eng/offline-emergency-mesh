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
import {meshRouter, DistressBeaconPayload} from '../services/mesh';

interface RequestRescueScreenProps {
  navigation: NavigationProp;
}

type EmergencyType = 'MEDICAL' | 'FOOD' | 'TRAPPED' | 'WATER' | 'OTHER';

interface CategoryOption {
  type: EmergencyType;
  title: string;
  icon: string;
  color: string;
  bgColor: string;
}

export const RequestRescueScreen: React.FC<RequestRescueScreenProps> = ({
  navigation,
}) => {
  const [selectedType, setSelectedType] = useState<EmergencyType>('MEDICAL');
  const [peopleCount, setPeopleCount] = useState<number>(1);
  const [additionalNotes, setAdditionalNotes] = useState<string>('');

  // Phase 6 Step 2: Offline GPS Fix State
  const [gpsStatus, setGpsStatus] = useState<'ACQUIRING' | 'LOCKED' | 'UNAVAILABLE'>('ACQUIRING');
  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [isSending, setIsSending] = useState<boolean>(false);

  const categories: CategoryOption[] = [
    {
      type: 'MEDICAL',
      title: 'Medical',
      icon: '➕',
      color: '#EF4444',
      bgColor: '#FEE2E2',
    },
    {
      type: 'FOOD',
      title: 'Food',
      icon: '🍴',
      color: '#F97316',
      bgColor: '#FFEDD5',
    },
    {
      type: 'TRAPPED',
      title: 'Trapped',
      icon: '👤',
      color: '#F59E0B',
      bgColor: '#FEF3C7',
    },
    {
      type: 'WATER',
      title: 'Water',
      icon: '💧',
      color: '#0066FF',
      bgColor: '#EFF6FF',
    },
    {
      type: 'OTHER',
      title: 'Other',
      icon: '•••',
      color: '#64748B',
      bgColor: '#F1F5F9',
    },
  ];

  const acquireGps = useCallback(async () => {
    setGpsStatus('ACQUIRING');
    try {
      const res = await locationService.getCurrentLocation(8000);
      if (res.success) {
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

  useEffect(() => {
    acquireGps();
  }, [acquireGps]);

  const handleSendRequest = async () => {
    setIsSending(true);
    try {
      const payload: DistressBeaconPayload = {
        emergencyType: selectedType,
        count: peopleCount,
        notes: additionalNotes.trim() || undefined,
        location: location
          ? {
              latitude: location.latitude,
              longitude: location.longitude,
              accuracy: location.accuracy,
              timestamp: location.timestamp,
            }
          : undefined,
      };

      await meshRouter.sendDistressBeacon(payload);

      const locSummary = location
        ? `📍 Location\nLatitude: ${location.latitude.toFixed(6)}\nLongitude: ${location.longitude.toFixed(6)}\nAccuracy: ±${location.accuracy}m`
        : '📍 Location unavailable';

      Alert.alert(
        '🚨 DISTRESS BEACON ENQUEUED',
        `Emergency Type: ${selectedType}\nPeople: ${peopleCount}\n\n${locSummary}\n\nSaved to local persistent mesh queue with TTL=5. Relaying opportunistically across all nearby BLE peers.`,
        [
          {
            text: 'View Mesh Status',
            onPress: () => navigation.navigate('NEARBY_DEVICES'),
          },
          {
            text: 'OK',
            style: 'cancel',
          },
        ]
      );
    } catch (e: any) {
      Alert.alert('Transmission Error', `Failed to broadcast distress beacon: ${e?.message || e}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title="Request Rescue"
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        {/* Title */}
        <Text style={styles.sectionHeaderTitle}>What do you need?</Text>

        {/* 2x2 Grid of Categories + Wide 'Other' (Screen 2 in Reference) */}
        <View style={styles.grid}>
          {categories.slice(0, 4).map(cat => {
            const isSelected = selectedType === cat.type;
            return (
              <TouchableOpacity
                key={cat.type}
                activeOpacity={0.75}
                onPress={() => setSelectedType(cat.type)}
                style={[
                  styles.categoryCard,
                  isSelected && styles.categoryCardSelected,
                ]}>
                <View
                  style={[
                    styles.iconCircle,
                    {backgroundColor: cat.bgColor},
                    isSelected && {borderColor: cat.color, borderWidth: 1.5},
                  ]}>
                  <Text style={[styles.iconText, {color: cat.color}]}>
                    {cat.icon}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.categoryTitle,
                    isSelected && styles.categoryTitleSelected,
                  ]}>
                  {cat.title}
                </Text>
              </TouchableOpacity>
            );
          })}

          {/* Wide 'Other' Category Button */}
          {categories.slice(4).map(cat => {
            const isSelected = selectedType === cat.type;
            return (
              <TouchableOpacity
                key={cat.type}
                activeOpacity={0.75}
                onPress={() => setSelectedType(cat.type)}
                style={[
                  styles.categoryCardWide,
                  isSelected && styles.categoryCardSelected,
                ]}>
                <View
                  style={[
                    styles.iconCircleSmall,
                    {backgroundColor: cat.bgColor},
                    isSelected && {borderColor: cat.color, borderWidth: 1.5},
                  ]}>
                  <Text style={[styles.iconTextSmall, {color: cat.color}]}>
                    {cat.icon}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.categoryTitleWide,
                    isSelected && styles.categoryTitleSelected,
                  ]}>
                  {cat.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* People Count Stepper */}
        <View style={styles.stepperCard}>
          <Text style={styles.stepperLabel}>People involved</Text>
          <View style={styles.stepperControls}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setPeopleCount(prev => Math.max(1, prev - 1))}
              style={styles.stepperBtn}>
              <Text style={styles.stepperBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.stepperValue}>{peopleCount}</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setPeopleCount(prev => prev + 1)}
              style={styles.stepperBtn}>
              <Text style={styles.stepperBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Optional Notes Input */}
        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>Additional details (optional)</Text>
          <TextInput
            style={styles.textInput}
            value={additionalNotes}
            onChangeText={setAdditionalNotes}
            placeholder="e.g. 2nd floor, water rising quickly, medical condition..."
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={2}
          />
        </View>

        {/* Phase 6 Step 2: Offline Emergency Location Status Card */}
        <View style={styles.gpsCard}>
          <View style={styles.gpsHeaderRow}>
            <View style={styles.gpsHeaderLeft}>
              <Text style={styles.gpsTitle}>EMERGENCY LOCATION (OFFLINE GPS)</Text>
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
                <Text style={styles.coordLabel}>Latitude:</Text>
                <Text style={styles.coordValue}>{location.latitude.toFixed(6)}°</Text>
              </View>
              <View style={styles.coordRow}>
                <Text style={styles.coordLabel}>Longitude:</Text>
                <Text style={styles.coordValue}>{location.longitude.toFixed(6)}°</Text>
              </View>
              <View style={styles.coordRow}>
                <Text style={styles.coordLabel}>Accuracy:</Text>
                <Text style={styles.coordValue}>±{location.accuracy} meters</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.gpsNoticeText}>
              {gpsStatus === 'ACQUIRING'
                ? 'Acquiring offline satellite coordinates from device GNSS hardware...'
                : 'Location unavailable — SOS will still be sent.'}
            </Text>
          )}
        </View>

        {/* Primary Action Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          disabled={isSending}
          onPress={handleSendRequest}
          style={[styles.sendButton, isSending && styles.sendButtonDisabled]}>
          {isSending ? (
            <ActivityIndicator size="small" color="#FFFFFF" style={{marginRight: 8}} />
          ) : (
            <Text style={styles.sendIcon}>✈️</Text>
          )}
          <Text style={styles.sendButtonText}>
            {isSending ? 'Broadcasting Beacon...' : 'Send Request'}
          </Text>
        </TouchableOpacity>
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
  },
  sectionHeaderTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#EDF0F3',
    shadowColor: '#0F172A',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  categoryCardWide: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#EDF0F3',
  },
  categoryCardSelected: {
    borderColor: '#EF4444',
    backgroundColor: '#FFFFFF',
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  iconCircleSmall: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  iconText: {
    fontSize: 24,
  },
  iconTextSmall: {
    fontSize: 16,
  },
  categoryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  categoryTitleWide: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  categoryTitleSelected: {
    color: '#EF4444',
  },
  stepperCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EDF0F3',
  },
  stepperLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  stepperControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepperBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0F172A',
    lineHeight: 22,
  },
  stepperValue: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginHorizontal: 16,
    minWidth: 20,
    textAlign: 'center',
  },
  inputWrapper: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EDF0F3',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#0F172A',
    textAlignVertical: 'top',
    minHeight: 64,
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
  gpsNoticeText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 6,
    fontStyle: 'italic',
  },
  sendButton: {
    backgroundColor: '#0066FF',
    borderRadius: 9999,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0066FF',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendIcon: {
    fontSize: 18,
    color: '#FFFFFF',
    marginRight: 8,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});
