import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {THEME} from '../config/theme';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  onSettings?: () => void;
  showBack?: boolean;
  badge?: string;
  badgeColor?: string;
  rightActionText?: string;
  onRightAction?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  subtitle,
  onBack,
  onSettings,
  showBack = false,
  badge,
  badgeColor = THEME.colors.success,
  rightActionText,
  onRightAction,
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
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.brandIconWrapper}>
            <Text style={styles.brandIconText}>🛡️</Text>
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

      {badge ? (
        <View
          style={[
            styles.badgePill,
            {backgroundColor: badgeColor === THEME.colors.success ? '#ECFDF5' : '#EFF6FF'},
          ]}>
          <View style={[styles.badgeDot, {backgroundColor: badgeColor}]} />
          <Text style={[styles.badgePillText, {color: badgeColor}]}>{badge}</Text>
        </View>
      ) : null}

      {rightActionText && onRightAction ? (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onRightAction}
          style={styles.actionBtn}>
          <Text style={styles.actionBtnText}>{rightActionText}</Text>
        </TouchableOpacity>
      ) : null}

      {!badge && !rightActionText && onSettings ? (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onSettings}
          style={styles.settingsButton}>
          <Text style={styles.settingsText}>⚙️</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
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
    paddingVertical: 6,
    paddingRight: 12,
    marginRight: 4,
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 22,
    color: '#0F172A',
    fontWeight: '600',
  },
  brandIconWrapper: {
    marginRight: 10,
  },
  brandIconText: {
    fontSize: 22,
  },
  titleWrapper: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 1,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  badgePillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  actionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#EFF6FF',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0066FF',
  },
  settingsButton: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsText: {
    fontSize: 18,
    color: '#64748B',
  },
});

