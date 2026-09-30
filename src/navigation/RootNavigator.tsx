import React, {useCallback, useEffect, useState} from 'react';
import {BackHandler, SafeAreaView, StatusBar, StyleSheet} from 'react-native';
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
} from '../screens';

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
      case 'SETTINGS':
        return <SettingsScreen navigation={navigation} />;
      case 'HOME':
      default:
        return <HomeScreen navigation={navigation} />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.colors.background} />
      {renderCurrentScreen()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
});
