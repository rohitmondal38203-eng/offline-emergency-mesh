import React, {useCallback, useEffect, useState} from 'react';
import {BackHandler, DeviceEventEmitter, SafeAreaView, StatusBar, StyleSheet, View} from 'react-native';
import {THEME} from '../config/theme';
import {NavigationProp, ScreenName} from './types';
import {
  HazardBroadcastScreen,
  HomeScreen,
  NearbyDevicesScreen,
  OfflineMapScreen,
  RequestRescueScreen,
  SettingsScreen,
  SosFlashlightScreen,
  SystemStatusScreen,
} from '../screens';
import {meshRouter} from '../services/mesh';
import {BottomTabBar} from '../components';

export const RootNavigator: React.FC = () => {
  const [screenStack, setScreenStack] = useState<ScreenName[]>(['HOME']);

  const currentScreen = screenStack[screenStack.length - 1] || 'HOME';

  const navigate = useCallback((screen: ScreenName) => {
    setScreenStack(prev => {
      // Don't push duplicate if already on that screen
      if (prev[prev.length - 1] === screen) {
        return prev;
      }
      return [...prev, screen];
    });
  }, []);

  const goBack = useCallback(() => {
    setScreenStack(prev => {
      if (prev.length <= 1) {
        return prev;
      }
      return prev.slice(0, prev.length - 1);
    });
  }, []);

  const canGoBack = screenStack.length > 1;

  // Handle hardware Android back button
  useEffect(() => {
    const onBackPress = () => {
      if (canGoBack) {
        goBack();
        return true;
      }
      return false; // Exit app if at Home
    };

    const backHandlerSubscription = BackHandler.addEventListener(
      'hardwareBackPress',
      onBackPress
    );

    return () => backHandlerSubscription.remove();
  }, [canGoBack, goBack]);

  // Handle ADB remote commands
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('RESQ_REMOTE_CMD', (event: {cmd: string; arg?: string}) => {
      if (event.cmd === 'NAVIGATE' && event.arg) {
        navigate(event.arg as ScreenName);
      } else if (event.cmd === 'GO_BACK') {
        goBack();
      } else if (event.cmd === 'SEND_SOS') {
        const emergencyType = (event.arg as any) || 'MEDICAL';
        meshRouter.sendDistressBeacon({
          emergencyType,
          count: 1,
          location: {
            latitude: 22.458033,
            longitude: 88.170005,
            accuracy: 10,
            timestamp: Date.now(),
          },
        }).catch(e => console.error('[RootNavigator] SEND_SOS failed', e));
      } else if (event.cmd === 'SEND_HAZARD') {
        meshRouter.sendHazardBroadcast({
          hazardType: 'FLOOD',
          severity: 'CRITICAL',
          title: 'Flash Flood Alert',
          message: event.arg || 'Water levels rising rapidly in sector 4',
          location: {
            latitude: 22.458033,
            longitude: 88.170005,
            accuracy: 10,
            timestamp: Date.now(),
          },
        }).catch(e => console.error('[RootNavigator] SEND_HAZARD failed', e));
      }
    });
    return () => sub.remove();
  }, [navigate, goBack]);

  const navigation: NavigationProp = {
    currentScreen,
    navigate,
    goBack,
    canGoBack,
  };

  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'REQUEST_RESCUE':
        return <RequestRescueScreen navigation={navigation} />;
      case 'NEARBY_DEVICES':
        return <NearbyDevicesScreen navigation={navigation} />;
      case 'OFFLINE_MAP':
        return <OfflineMapScreen navigation={navigation} />;
      case 'HAZARD_BROADCAST':
        return <HazardBroadcastScreen navigation={navigation} />;
      case 'SOS_FLASHLIGHT':
        return <SosFlashlightScreen navigation={navigation} />;
      case 'SYSTEM_STATUS':
        return <SystemStatusScreen navigation={navigation} />;
      case 'SETTINGS':
        return <SettingsScreen navigation={navigation} />;
      case 'HOME':
      default:
        return <HomeScreen navigation={navigation} />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.colors.surface} />
      <View style={styles.screenWrapper}>
        {renderCurrentScreen()}
      </View>
      <BottomTabBar navigation={navigation} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  screenWrapper: {
    flex: 1,
  },
});

