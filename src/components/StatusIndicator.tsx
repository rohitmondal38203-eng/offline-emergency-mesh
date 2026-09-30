import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {THEME} from '../config/theme';

export type StatusType =
  | 'offline'
  | 'connected'
  | 'searching'
  | 'warning'
  | 'emergency'
  | 'unavailable';

interface StatusIndicatorProps {
  status: StatusType;
  label: string;
  sublabel?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  label,
  sublabel,
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'offline':
        return THEME.colors.warning;
      case 'connected':
        return THEME.colors.success;
      case 'searching':
        return THEME.colors.signal;
      case 'warning':
        return THEME.colors.warning;
      case 'emergency':
        return THEME.colors.emergency;
      case 'unavailable':
      default:
        return THEME.colors.textMuted;
    }
  };

  const color = getStatusColor();

  return (
    <View style={styles.container}>
      <View style={[styles.dot, {backgroundColor: color}]} />
      <View style={styles.textContainer}>
        <Text style={[styles.label, {color: THEME.colors.textPrimary}]}>
          {label}
        </Text>
        {sublabel ? <Text style={styles.sublabel}>{sublabel}</Text> : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: THEME.spacing.sm,
  },
  textContainer: {
    flexDirection: 'column',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  sublabel: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    marginTop: 1,
  },
});
