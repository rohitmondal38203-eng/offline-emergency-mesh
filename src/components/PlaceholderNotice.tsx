import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {THEME} from '../config/theme';

interface PlaceholderNoticeProps {
  phase: string;
  featureName: string;
  description: string;
  hardwareDependency?: string;
}

export const PlaceholderNotice: React.FC<PlaceholderNoticeProps> = ({
  phase,
  featureName,
  description,
  hardwareDependency,
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.tag}>
          <Text style={styles.tagText}>{phase.toUpperCase()} — PLANNED</Text>
        </View>
        <Text style={styles.statusIndicator}>● NOT IMPLEMENTED YET</Text>
      </View>
      <Text style={styles.featureName}>{featureName}</Text>
      <Text style={styles.description}>{description}</Text>
      {hardwareDependency ? (
        <View style={styles.dependencyBox}>
          <Text style={styles.dependencyLabel}>Target Hardware Dependency:</Text>
          <Text style={styles.dependencyText}>{hardwareDependency}</Text>
        </View>
      ) : null}
      <View style={styles.alertNotice}>
        <Text style={styles.alertNoticeText}>
          ⚠️ This is an architectural UI preview. No real network transmission, radio scanning, or hardware access is active.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: THEME.colors.surfaceSubtle,
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: THEME.colors.warningBorder,
    padding: THEME.spacing.md,
    marginVertical: THEME.spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.xs,
  },
  tag: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: THEME.colors.warning,
  },
  tagText: {
    color: THEME.colors.warning,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  statusIndicator: {
    color: THEME.colors.warning,
    fontSize: 11,
    fontWeight: '700',
  },
  featureName: {
    ...THEME.typography.titleCard,
    color: THEME.colors.textPrimary,
    marginTop: 4,
  },
  description: {
    ...THEME.typography.bodySmall,
    color: THEME.colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  dependencyBox: {
    backgroundColor: THEME.colors.surfaceRaised,
    borderRadius: THEME.borderRadius.sm,
    padding: THEME.spacing.sm,
    marginTop: THEME.spacing.sm,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
  },
  dependencyLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.signal,
    textTransform: 'uppercase',
  },
  dependencyText: {
    fontSize: 12,
    color: THEME.colors.textPrimary,
    marginTop: 2,
    fontWeight: '500',
  },
  alertNotice: {
    marginTop: THEME.spacing.sm,
    paddingTop: THEME.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: 'rgba(245, 158, 11, 0.2)',
  },
  alertNoticeText: {
    fontSize: 11,
    color: THEME.colors.warning,
    lineHeight: 16,
    fontWeight: '500',
  },
});
