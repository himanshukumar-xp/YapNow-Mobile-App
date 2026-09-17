import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, RADIUS } from '../theme';

export function Chip({ label, selected, onPress, icon }) {
  const handlePress = () => {
    Haptics.selectionAsync().catch(() => {});
    if (onPress) onPress();
  };

  return (
    <TouchableOpacity
      style={[styles.chip, selected ? styles.chipSelected : styles.chipUnselected]}
      onPress={handlePress}
      activeOpacity={0.75}
    >
      {selected ? (
        <Text style={styles.checkIcon}>✓</Text>
      ) : icon ? (
        <Text style={styles.prefixIcon}>{icon}</Text>
      ) : null}
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export function Tag({ label, highlight = false, size = 'md' }) {
  const isSm = size === 'sm';
  return (
    <View
      style={[
        styles.tag,
        isSm && styles.tagSm,
        highlight ? styles.tagHighlight : styles.tagDefault,
      ]}
    >
      <Text
        style={[
          styles.tagText,
          isSm && styles.tagTextSm,
          highlight ? styles.tagTextHighlight : styles.tagTextDefault,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.full,
    paddingVertical: 9,
    paddingHorizontal: 15,
    marginRight: 8,
    marginBottom: 10,
  },
  chipUnselected: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  chipSelected: {
    backgroundColor: COLORS.primary,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  checkIcon: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 12,
    marginRight: 6,
  },
  prefixIcon: {
    fontSize: 13,
    marginRight: 6,
  },
  chipText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
    fontSize: 14,
  },
  chipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  tag: {
    borderRadius: RADIUS.full,
    paddingVertical: 5,
    paddingHorizontal: 11,
    marginRight: 6,
    marginBottom: 6,
    alignSelf: 'flex-start',
  },
  tagSm: {
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  tagDefault: {
    backgroundColor: COLORS.surfaceSubtle,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tagHighlight: {
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tagTextSm: {
    fontSize: 11,
  },
  tagTextDefault: {
    color: COLORS.textSecondary,
  },
  tagTextHighlight: {
    color: COLORS.primary,
    fontWeight: '700',
  },
});
