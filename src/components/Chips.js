import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { COLORS } from '../theme';

export function Chip({ label, selected, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.chip, selected && styles.chipSelected]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

export function Tag({ label, highlight = false }) {
  return (
    <View style={[styles.tag, highlight && styles.tagHighlight]}>
      <Text style={[styles.tagText, highlight && styles.tagTextHighlight]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginRight: 8,
    marginBottom: 8,
  },
  chipSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { color: COLORS.text, fontWeight: '600', fontSize: 14 },
  chipTextSelected: { color: '#fff' },
  tag: {
    backgroundColor: '#F1EDFD',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginRight: 6,
    marginBottom: 6,
  },
  tagHighlight: { backgroundColor: '#D9CFFB' },
  tagText: { color: COLORS.primaryDark, fontSize: 12, fontWeight: '700' },
  tagTextHighlight: { color: COLORS.primaryDark },
});
