import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
} from 'react-native';
import {THEME} from '../config/theme';

export type ButtonVariant = 'emergency' | 'primary' | 'secondary' | 'warning' | 'disabled';

interface EmergencyButtonProps extends TouchableOpacityProps {
  title: string;
  subtitle?: string;
  variant?: ButtonVariant;
  icon?: string;
}

export const EmergencyButton: React.FC<EmergencyButtonProps> = ({
  title,
  subtitle,
  variant = 'primary',
  disabled,
  style,
  onPress,
  ...rest
}) => {
  const isActuallyDisabled = disabled || variant === 'disabled';

  const getVariantStyles = () => {
    switch (variant) {
      case 'emergency':
        return {
          container: styles.emergencyContainer,
          text: styles.emergencyText,
        };
      case 'warning':
        return {
          container: styles.warningContainer,
          text: styles.warningText,
        };
      case 'secondary':
        return {
          container: styles.secondaryContainer,
          text: styles.secondaryText,
        };
      case 'disabled':
        return {
          container: styles.disabledContainer,
          text: styles.disabledText,
        };
      case 'primary':
      default:
        return {
          container: styles.primaryContainer,
          text: styles.primaryText,
        };
    }
  };

  const vStyles = getVariantStyles();

  return (
    <TouchableOpacity
      activeOpacity={isActuallyDisabled ? 1 : 0.75}
      disabled={isActuallyDisabled}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{disabled: isActuallyDisabled}}
      style={[
        styles.baseContainer,
        vStyles.container,
        isActuallyDisabled && styles.disabledContainer,
        style,
      ]}
      {...rest}>
      <View style={styles.contentWrapper}>
        <Text
          style={[
            styles.baseText,
            vStyles.text,
            isActuallyDisabled && styles.disabledText,
          ]}>
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={[
              styles.subtitleText,
              isActuallyDisabled && styles.disabledSubtitleText,
            ]}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  baseContainer: {
    minHeight: THEME.touchTarget.minHeight,
    borderRadius: THEME.borderRadius.md,
    paddingVertical: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: THEME.spacing.xs,
  },
  contentWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  baseText: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.8,
    textAlign: 'center',
  },
  subtitleText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.75)',
    marginTop: 2,
    textAlign: 'center',
  },

  // Emergency (Crimson SOS)
  emergencyContainer: {
    backgroundColor: THEME.colors.emergency,
    borderWidth: 2,
    borderColor: THEME.colors.emergencyBorder,
    shadowColor: THEME.colors.emergency,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  emergencyText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '900',
  },

  // Primary (Signal Blue)
  primaryContainer: {
    backgroundColor: THEME.colors.signalDark,
    borderWidth: 1,
    borderColor: THEME.colors.signal,
  },
  primaryText: {
    color: '#ffffff',
  },

  // Warning (Amber)
  warningContainer: {
    backgroundColor: THEME.colors.warning,
    borderWidth: 1,
    borderColor: THEME.colors.warningBorder,
  },
  warningText: {
    color: '#090d16',
    fontWeight: '800',
  },

  // Secondary (Dark surface with border)
  secondaryContainer: {
    backgroundColor: THEME.colors.surfaceRaised,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
  },
  secondaryText: {
    color: THEME.colors.textPrimary,
  },

  // Disabled
  disabledContainer: {
    backgroundColor: THEME.colors.disabledBg,
    borderWidth: 1,
    borderColor: THEME.colors.disabledBorder,
    elevation: 0,
    shadowOpacity: 0,
  },
  disabledText: {
    color: THEME.colors.disabledText,
  },
  disabledSubtitleText: {
    color: THEME.colors.textMuted,
  },
});
