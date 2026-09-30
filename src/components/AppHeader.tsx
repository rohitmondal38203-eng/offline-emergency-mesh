import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {THEME} from '../config/theme';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  onSettings?: () => void;
  showBack?: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  subtitle,
  onBack,
  onSettings,
  showBack = false,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.leftRow}>
        {showBack && onBack ? (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={styles.backButton}>
            <Text style={styles.backIcon}>‹</Text>
            <Text style={styles.backText}>BACK</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.brandBadge}>
            <Text style={styles.brandBadgeText}>APP-08</Text>
          </View>
        )}
        <View style={styles.titleWrapper}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>

      {onSettings ? (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onSettings}
          accessibilityRole="button"
          accessibilityLabel="Open settings and project about info"
          style={styles.settingsButton}>
          <Text style={styles.settingsText}>ℹ INFO</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: THEME.colors.surface,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.surfaceBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 56,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingRight: 12,
    marginRight: 8,
    minHeight: 44,
  },
  backIcon: {
    fontSize: 26,
    lineHeight: 26,
    color: THEME.colors.signal,
    fontWeight: '700',
    marginRight: 4,
  },
  backText: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.colors.signal,
    letterSpacing: 0.5,
  },
  brandBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 10,
    borderWidth: 1,
    borderColor: THEME.colors.signalDark,
  },
  brandBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.signal,
    letterSpacing: 0.5,
  },
  titleWrapper: {
    flex: 1,
  },
  title: {
    ...THEME.typography.titleSection,
    fontSize: 16,
  },
  subtitle: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 1,
  },
  settingsButton: {
    backgroundColor: THEME.colors.surfaceRaised,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    minHeight: 36,
    justifyContent: 'center',
  },
  settingsText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
    letterSpacing: 0.5,
  },
});
