import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
} from 'react-native';
import {THEME} from '../config/theme';

export type ButtonVariant = 'emergency' | 'primary' | 'secondary' | 'warning' | 'disabled' | 'outline';

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
      case 'outline':
        return {
          container: styles.outlineContainer,
          text: styles.outlineText,
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
      activeOpacity={isActuallyDisabled ? 1 : 0.8}
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
              variant === 'secondary' && styles.secondarySubtitleText,
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
    minHeight: 48,
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
  },
  contentWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  baseText: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  subtitleText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
    textAlign: 'center',
  },
  secondarySubtitleText: {
    color: '#64748B',
  },

  // Primary (Modern Blue Action - matching reference "Send Request" / "Turn ON")
  primaryContainer: {
    backgroundColor: '#0066FF',
    shadowColor: '#0066FF',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryText: {
    color: '#FFFFFF',
  },

  // Emergency (Safety Red - matching reference SOS)
  emergencyContainer: {
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 4,
  },
  emergencyText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },

  // Secondary (Light Blue pill - matching reference "Stop Scan")
  secondaryContainer: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  secondaryText: {
    color: '#0066FF',
  },

  // Outline
  outlineContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  outlineText: {
    color: '#0F172A',
  },

  // Warning (Amber)
  warningContainer: {
    backgroundColor: '#F59E0B',
    shadowColor: '#F59E0B',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  warningText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  // Disabled
  disabledContainer: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 0,
    shadowOpacity: 0,
  },
  disabledText: {
    color: '#94A3B8',
  },
  disabledSubtitleText: {
    color: '#CBD5E1',
  },
});

