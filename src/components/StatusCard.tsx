import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {THEME} from '../config/theme';

export interface StatusCardItem {
  label: string;
  value: string;
  color?: string;
  badge?: string;
}

interface StatusCardProps {
  title?: string;
  items: StatusCardItem[];
  variant?: 'default' | 'emergency' | 'warning' | 'info';
}

export const StatusCard: React.FC<StatusCardProps> = ({
  title,
  items,
  variant = 'default',
}) => {
  const getBorderColor = () => {
    switch (variant) {
      case 'emergency':
        return THEME.colors.emergency;
      case 'warning':
        return THEME.colors.warning;
      case 'info':
        return THEME.colors.signal;
      case 'default':
      default:
        return THEME.colors.surfaceBorder;
    }
  };

  return (
    <View style={[styles.card, {borderColor: getBorderColor()}]}>
      {title ? <Text style={styles.cardTitle}>{title}</Text> : null}
      <View style={styles.itemsWrapper}>
        {items.map((item, idx) => (
          <View key={idx} style={styles.row}>
            <Text style={styles.label}>{item.label}</Text>
            <View style={styles.valueRow}>
              <Text
                style={[
                  styles.value,
                  item.color ? {color: item.color} : undefined,
                ]}>
                {item.value}
              </Text>
              {item.badge ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.badge}</Text>
                </View>
              ) : null}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.md,
    borderWidth: 1,
    marginVertical: THEME.spacing.xs,
  },
  cardTitle: {
    ...THEME.typography.caption,
    color: THEME.colors.signal,
    marginBottom: THEME.spacing.sm,
    textTransform: 'uppercase',
  },
  itemsWrapper: {
    flexDirection: 'column',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: THEME.spacing.xs,
  },
  label: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    fontWeight: '500',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  value: {
    fontSize: 13,
    color: THEME.colors.textPrimary,
    fontWeight: '700',
  },
  badge: {
    backgroundColor: THEME.colors.surfaceRaised,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.textMuted,
  },
});
