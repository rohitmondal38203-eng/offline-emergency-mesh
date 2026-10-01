import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {THEME} from '../config/theme';
import {NavigationProp, ScreenName} from '../navigation/types';

interface BottomTabBarProps {
  navigation: NavigationProp;
}

interface TabItem {
  id: string;
  targetScreen: ScreenName;
  label: string;
  icon: string;
  badge?: number;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({navigation}) => {
  const {currentScreen} = navigation;

  const tabs: TabItem[] = [
    {
      id: 'home',
      targetScreen: 'HOME',
      label: 'Home',
      icon: '🏠',
    },
    {
      id: 'request_sos',
      targetScreen: 'REQUEST_RESCUE',
      label: 'Request SOS',
      icon: '🚨',
    },
    {
      id: 'nearby_mesh',
      targetScreen: 'NEARBY_DEVICES',
      label: 'Nearby Mesh',
      icon: '📶',
    },
    {
      id: 'status',
      targetScreen: 'SYSTEM_STATUS',
      label: 'Status',
      icon: '📊',
    },
  ];

  const isTabActive = (target: ScreenName): boolean => {
    return currentScreen === target;
  };

  return (
    <View style={styles.container}>
      {tabs.map(tab => {
        const active = isTabActive(tab.targetScreen);
        return (
          <TouchableOpacity
            key={tab.id}
            activeOpacity={0.7}
            onPress={() => navigation.navigate(tab.targetScreen)}
            style={styles.tabItem}>
            <View style={styles.iconWrapper}>
              <Text style={[styles.iconText, active && styles.iconTextActive]}>
                {tab.icon}
              </Text>
              {tab.badge !== undefined && tab.badge > 0 && (
                <View style={styles.badgeContainer}>
                  <Text style={styles.badgeText}>{tab.badge}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'space-around',
    shadowColor: '#0F172A',
    shadowOffset: {width: 0, height: -2},
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 4,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  iconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 20,
    opacity: 0.5,
  },
  iconTextActive: {
    opacity: 1,
  },
  badgeContainer: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: THEME.colors.emergency,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 3,
  },
  tabLabelActive: {
    color: THEME.colors.primary,
    fontWeight: '700',
  },
});
