import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../theme';

export default function ScreenHeader({
  title,
  subtitle,
  onBack,
  rightAction,
  theme = 'light', // 'light' | 'dark'
  centerContent,
}) {
  const insets = useSafeAreaInsets();
  const isDark = theme === 'dark';

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (onBack) onBack();
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: Math.max(insets.top, 12) },
        isDark ? styles.containerDark : styles.containerLight,
      ]}
    >
      <View style={styles.bar}>
        <View style={styles.left}>
          {onBack ? (
            <TouchableOpacity
              style={[styles.backBtn, isDark && styles.backBtnDark]}
              onPress={handleBack}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              activeOpacity={0.7}
            >
              <Text style={[styles.backArrow, isDark && styles.textDark]}>‹</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.placeholder} />
          )}
        </View>

        <View style={styles.center}>
          {centerContent ? (
            centerContent
          ) : (
            <>
              <Text
                style={[styles.title, isDark ? styles.textDark : styles.textLight]}
                numberOfLines={1}
              >
                {title}
              </Text>
              {subtitle ? (
                <Text
                  style={[
                    styles.subtitle,
                    isDark ? styles.subtitleDark : styles.subtitleLight,
                  ]}
                  numberOfLines={1}
                >
                  {subtitle}
                </Text>
              ) : null}
            </>
          )}
        </View>

        <View style={styles.right}>
          {rightAction || <View style={styles.placeholder} />}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  containerLight: {
    backgroundColor: '#FFFFFF',
    borderBottomColor: COLORS.border,
  },
  containerDark: {
    backgroundColor: COLORS.darkBg,
    borderBottomColor: COLORS.darkBorder,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  left: {
    width: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  right: {
    width: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  placeholder: {
    width: 44,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnDark: {
    backgroundColor: COLORS.darkSurfaceGlass,
  },
  backArrow: {
    fontSize: 28,
    fontWeight: '300',
    color: COLORS.text,
    marginTop: -3,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },
  textLight: {
    color: COLORS.text,
  },
  textDark: {
    color: COLORS.darkText,
  },
  subtitleLight: {
    color: COLORS.muted,
  },
  subtitleDark: {
    color: COLORS.darkTextMuted,
  },
});
