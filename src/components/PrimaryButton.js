import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, RADIUS, SHADOWS } from '../theme';

export default function PrimaryButton({
  title,
  onPress,
  variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost'
  size = 'md', // 'sm' | 'md' | 'lg'
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
}) {
  const handlePress = (e) => {
    if (disabled || loading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (onPress) onPress(e);
  };

  const getVariantContainerStyle = () => {
    switch (variant) {
      case 'secondary':
        return styles.secondaryBtn;
      case 'outline':
        return styles.outlineBtn;
      case 'danger':
        return styles.dangerBtn;
      case 'ghost':
        return styles.ghostBtn;
      case 'primary':
      default:
        return styles.primaryBtn;
    }
  };

  const getVariantTextStyle = () => {
    switch (variant) {
      case 'secondary':
        return styles.secondaryText;
      case 'outline':
        return styles.outlineText;
      case 'danger':
        return styles.dangerText;
      case 'ghost':
        return styles.ghostText;
      case 'primary':
      default:
        return styles.primaryText;
    }
  };

  const getSizeContainerStyle = () => {
    switch (size) {
      case 'sm':
        return styles.smContainer;
      case 'lg':
        return styles.lgContainer;
      case 'md':
      default:
        return styles.mdContainer;
    }
  };

  const getSizeTextStyle = () => {
    switch (size) {
      case 'sm':
        return styles.smText;
      case 'lg':
        return styles.lgText;
      case 'md':
      default:
        return styles.mdText;
    }
  };

  const getSpinnerColor = () => {
    if (variant === 'primary' || variant === 'danger') return '#FFFFFF';
    return COLORS.primary;
  };

  return (
    <TouchableOpacity
      style={[
        styles.base,
        getSizeContainerStyle(),
        getVariantContainerStyle(),
        disabled && styles.disabled,
        style,
      ]}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.82}
    >
      {loading ? (
        <ActivityIndicator size="small" color={getSpinnerColor()} />
      ) : (
        <View style={styles.contentRow}>
          {icon ? <View style={styles.iconWrap}>{icon}</View> : null}
          <Text
            style={[
              styles.baseText,
              getSizeTextStyle(),
              getVariantTextStyle(),
              textStyle,
            ]}
          >
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    marginRight: 8,
  },
  baseText: {
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // Sizes
  smContainer: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    minHeight: 38,
  },
  smText: {
    fontSize: 13,
  },
  mdContainer: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    minHeight: 50,
  },
  mdText: {
    fontSize: 15,
  },
  lgContainer: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    minHeight: 56,
  },
  lgText: {
    fontSize: 17,
  },

  // Variants
  primaryBtn: {
    backgroundColor: COLORS.primary,
    ...SHADOWS.sm,
  },
  primaryText: {
    color: '#FFFFFF',
  },
  secondaryBtn: {
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  secondaryText: {
    color: COLORS.primary,
  },
  outlineBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  outlineText: {
    color: COLORS.text,
  },
  dangerBtn: {
    backgroundColor: COLORS.danger,
    ...SHADOWS.sm,
  },
  dangerText: {
    color: '#FFFFFF',
  },
  ghostBtn: {
    backgroundColor: 'transparent',
  },
  ghostText: {
    color: COLORS.muted,
  },

  disabled: {
    opacity: 0.45,
  },
});
