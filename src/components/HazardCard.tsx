import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {THEME} from '../config/theme';

export type HazardCategory = 'WATER' | 'MEDICAL' | 'ROAD_ALERT' | 'EVACUATION' | 'SHELTER';

export interface HazardCardProps {
  id: string;
  category: HazardCategory;
  title: string;
  description: string;
  location: string;
  timestamp: string;
  authorityName?: string;
  isVerified?: boolean;
}

export const HazardCard: React.FC<HazardCardProps> = ({
  category,
  title,
  description,
  location,
  timestamp,
  authorityName = 'NDRF Relief Unit',
  isVerified = true,
}) => {
  const getCategoryTheme = () => {
    switch (category) {
      case 'WATER':
        return {badge: 'DRINKING WATER', color: THEME.colors.signal};
      case 'MEDICAL':
        return {badge: 'MEDICAL AID', color: THEME.colors.emergency};
      case 'ROAD_ALERT':
        return {badge: 'ROAD BLOCKED', color: THEME.colors.warning};
      case 'EVACUATION':
        return {badge: 'EVACUATION', color: '#ec4899'};
      case 'SHELTER':
      default:
        return {badge: 'SAFE SHELTER', color: THEME.colors.success};
    }
  };

  const cat = getCategoryTheme();

  return (
    <View style={styles.card}>
      {/* Demo watermark */}
      <View style={styles.demoWatermark}>
        <Text style={styles.demoWatermarkText}>SIMULATED / DEMO ALERT DATA</Text>
      </View>

      <View style={styles.headerRow}>
        <View style={[styles.categoryBadge, {borderColor: cat.color}]}>
          <Text style={[styles.categoryText, {color: cat.color}]}>
            {cat.badge}
          </Text>
        </View>
        <Text style={styles.timestamp}>{timestamp}</Text>
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>

      <View style={styles.footer}>
        <View style={styles.locationRow}>
          <Text style={styles.locationPin}>📍</Text>
          <Text style={styles.locationText}>{location}</Text>
        </View>
        {isVerified ? (
          <View style={styles.verifiedRow}>
            <Text style={styles.verifiedCheck}>✓</Text>
            <Text style={styles.authorityText}>{authorityName}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.md,
    marginVertical: THEME.spacing.xs,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
  },
  demoWatermark: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderRadius: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  demoWatermarkText: {
    fontSize: 9,
    fontWeight: '800',
    color: THEME.colors.warning,
    letterSpacing: 0.5,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    backgroundColor: THEME.colors.surfaceRaised,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  timestamp: {
    ...THEME.typography.caption,
    color: THEME.colors.textMuted,
  },
  title: {
    ...THEME.typography.titleCard,
    color: THEME.colors.textPrimary,
    marginBottom: 4,
  },
  description: {
    ...THEME.typography.bodySmall,
    color: THEME.colors.textSecondary,
    lineHeight: 18,
    marginBottom: 10,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: THEME.colors.surfaceBorder,
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationPin: {
    fontSize: 11,
    marginRight: 4,
  },
  locationText: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    fontWeight: '600',
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifiedCheck: {
    color: THEME.colors.success,
    fontSize: 11,
    fontWeight: '800',
    marginRight: 4,
  },
  authorityText: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.success,
  },
});
