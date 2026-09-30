/**
 * Navigation Types and Screen Identifiers
 */

export type ScreenName =
  | 'HOME'
  | 'REQUEST_RESCUE'
  | 'NEARBY_DEVICES'
  | 'OFFLINE_MAP'
  | 'HAZARD_BROADCAST'
  | 'SOS_FLASHLIGHT'
  | 'SETTINGS';

export interface NavigationProp {
  currentScreen: ScreenName;
  navigate: (screen: ScreenName) => void;
  goBack: () => void;
  canGoBack: boolean;
}
