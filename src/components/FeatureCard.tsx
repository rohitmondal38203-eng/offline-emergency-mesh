import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {THEME} from '../config/theme';

interface FeatureCardProps {
  title: string;
  subtitle: string;
  badge?: string;
  badgeColor?: string;
  iconSymbol?: string;
  onPress: () => void;
  accentColor?: string;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  title,
  subtitle,
  badge = 'PLANNED',
  badgeColor = THEME.colors.warning,
  iconSymbol,
  onPress,
  accentColor = THEME.colors.signal,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${subtitle}`}
      style={styles.card}>
      <View style={[styles.accentStripe, {backgroundColor: accentColor}]} />
      <View style={styles.content}>
        <View style={styles.topRow}>
          <View style={styles.titleRow}>
            {iconSymbol ? (
              <View style={[styles.iconCircle, {borderColor: accentColor}]}>
                <Text style={[styles.iconText, {color: accentColor}]}>
                  {iconSymbol}
                </Text>
              </View>
            ) : null}
            <Text style={styles.title}>{title}</Text>
          </View>
          {badge ? (
            <View style={[styles.badge, {borderColor: badgeColor}]}>
              <Text style={[styles.badgeText, {color: badgeColor}]}>
                {badge}
              </Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.subtitle} numberOfLines={2}>
          {subtitle}
        </Text>
        <View style={styles.footerRow}>
          <Text style={styles.openText}>Tap to inspect interface</Text>
          <Text style={styles.arrowText}>→</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.md,
    marginVertical: THEME.spacing.xs,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    flexDirection: 'row',
    overflow: 'hidden',
    minHeight: 88,
  },
  accentStripe: {
    width: 4,
  },
  content: {
    flex: 1,
    padding: THEME.spacing.md,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  iconText: {
    fontSize: 12,
    fontWeight: '800',
  },
  title: {
    ...THEME.typography.titleCard,
    flex: 1,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    backgroundColor: THEME.colors.surfaceRaised,
    marginLeft: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  subtitle: {
    ...THEME.typography.bodySmall,
    color: THEME.colors.textSecondary,
    marginVertical: 4,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  openText: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.colors.signal,
  },
  arrowText: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.colors.signal,
  },
});
