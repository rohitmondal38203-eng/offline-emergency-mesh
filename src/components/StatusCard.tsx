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
  return (
    <View style={styles.card}>
      {title ? <Text style={styles.cardTitle}>{title}</Text> : null}
      <View style={styles.itemsWrapper}>
        {items.map((item, idx) => (
          <View
            key={idx}
            style={[
              styles.row,
              idx < items.length - 1 && styles.rowDivider,
            ]}>
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
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#EDF0F3',
    marginVertical: 6,
    shadowColor: '#0F172A',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0066FF',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  itemsWrapper: {
    flexDirection: 'column',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  label: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  value: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '700',
  },
  badge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0066FF',
  },
});

