import React, {useState} from 'react';
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {THEME} from '../config/theme';
import {AppHeader} from '../components';
import {NavigationProp} from '../navigation/types';

interface HomeScreenProps {
  navigation: NavigationProp;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({navigation}) => {
  const [holdingProgress] = useState(new Animated.Value(1));

  const handlePressIn = () => {
    Animated.spring(holdingProgress, {
      toValue: 0.94,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(holdingProgress, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handleSosPress = () => {
    navigation.navigate('REQUEST_RESCUE');
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title="RESQ-MESH"
        subtitle="Offline Disaster Mesh & Rescue"
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Large Central Circular SOS Button */}
        <View style={styles.sosContainer}>
          <View style={styles.sosOuterRing2}>
            <View style={styles.sosOuterRing1}>
              <Animated.View
                style={[
                  styles.sosButton,
                  {transform: [{scale: holdingProgress}]},
                ]}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPressIn={handlePressIn}
                  onPressOut={handlePressOut}
                  onPress={handleSosPress}
                  style={styles.sosTouchable}>
                  <Text style={styles.sosText}>SOS</Text>
                  <Text style={styles.sosIcon}>⚠️</Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </View>
          <Text style={styles.sosPrompt}>Tap or hold to request emergency rescue</Text>
        </View>

        {/* Quick Access Cards */}
        <View style={styles.cardGroup}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate('OFFLINE_MAP')}
            style={styles.infoCard}>
            <View style={[styles.cardIconCircle, {backgroundColor: '#EFF6FF'}]}>
              <Text style={styles.cardIconGlyph}>📍</Text>
            </View>
            <View style={styles.cardTextWrapper}>
              <Text style={styles.cardTitle}>Offline GPS Fix</Text>
              <Text style={styles.cardSubtitle}>Acquire GNSS satellite coordinates without internet</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate('HAZARD_BROADCAST')}
            style={[styles.infoCard, {marginTop: 10}]}>
            <View style={[styles.cardIconCircle, {backgroundColor: '#FEF3C7'}]}>
              <Text style={styles.cardIconGlyph}>📢</Text>
            </View>
            <View style={styles.cardTextWrapper}>
              <Text style={styles.cardTitle}>Local Hazard Broadcast</Text>
              <Text style={styles.cardSubtitle}>Broadcast & receive offline disaster bulletins</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Emergency Tool Shortcuts (Only real working features) */}
        <Text style={styles.sectionTitle}>Emergency Radios & Tools</Text>
        <View style={styles.toolsGrid}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate('NEARBY_DEVICES')}
            style={styles.toolCard}>
            <View style={[styles.toolIconCircle, {backgroundColor: '#EFF6FF'}]}>
              <Text style={styles.toolIcon}>📶</Text>
            </View>
            <Text style={styles.toolName}>Nearby Nodes</Text>
            <Text style={styles.toolDesc}>BLE Discovery & Mesh Relay</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate('SYSTEM_STATUS')}
            style={styles.toolCard}>
            <View style={[styles.toolIconCircle, {backgroundColor: '#ECFDF5'}]}>
              <Text style={styles.toolIcon}>📊</Text>
            </View>
            <Text style={styles.toolName}>System Status</Text>
            <Text style={styles.toolDesc}>Radio State & Telemetry</Text>
          </TouchableOpacity>
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
  },
  sosContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 18,
  },
  sosOuterRing2: {
    width: 216,
    height: 216,
    borderRadius: 108,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosOuterRing1: {
    width: 176,
    height: 176,
    borderRadius: 88,
    backgroundColor: 'rgba(239, 68, 68, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosButton: {
    width: 136,
    height: 136,
    borderRadius: 68,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EF4444',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  sosTouchable: {
    width: '100%',
    height: '100%',
    borderRadius: 68,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 2,
  },
  sosIcon: {
    fontSize: 16,
    marginTop: 2,
  },
  sosPrompt: {
    marginTop: 12,
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.3,
  },
  cardGroup: {
    marginVertical: 10,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EDF0F3',
    shadowColor: '#0F172A',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  cardIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardIconGlyph: {
    fontSize: 18,
  },
  cardTextWrapper: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  cardSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 1,
  },
  chevron: {
    fontSize: 20,
    color: '#CBD5E1',
    fontWeight: '300',
    marginLeft: 6,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 16,
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  toolsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  toolCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 4,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#EDF0F3',
    shadowColor: '#0F172A',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  toolIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  toolIcon: {
    fontSize: 18,
  },
  toolName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  toolDesc: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 14,
  },
});
