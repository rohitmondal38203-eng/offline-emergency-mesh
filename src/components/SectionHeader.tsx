import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {THEME} from '../config/theme';

interface SectionHeaderProps {
  title: string;
  badge?: string;
  subtitle?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  badge,
  subtitle,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>{title}</Text>
        {badge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : null}
      </View>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: THEME.spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    ...THEME.typography.titleSection,
  },
  badge: {
    backgroundColor: THEME.colors.surfaceRaised,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.signal,
    letterSpacing: 0.5,
  },
  subtitle: {
    ...THEME.typography.bodySmall,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
});
