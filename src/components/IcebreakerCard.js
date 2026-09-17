import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, RADIUS, SHADOWS } from '../theme';

export default function IcebreakerCard({ item, onUse, onShuffle, compact = false }) {
  if (!item) return null;

  const handleShuffle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (onShuffle) onShuffle();
  };

  const handleUse = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    if (onUse) onUse();
  };

  return (
    <View style={[styles.card, compact && styles.cardCompact]}>
      <View style={styles.topRow}>
        <View style={styles.sparkBadge}>
          <Text style={styles.sparkIcon}>✨</Text>
          <Text style={styles.sparkText}>AI SPARK</Text>
        </View>
        <Text style={styles.reason} numberOfLines={1}>
          {item.reason}
        </Text>
      </View>

      <Text style={[styles.quoteText, compact && styles.quoteTextCompact]}>
        “{item.text}”
      </Text>

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.useBtn}
          onPress={handleUse}
          activeOpacity={0.8}
        >
          <Text style={styles.useBtnIcon}>💬</Text>
          <Text style={styles.useBtnText}>Use as message</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.shuffleBtn}
          onPress={handleShuffle}
          activeOpacity={0.7}
        >
          <Text style={styles.shuffleBtnText}>Shuffle ↻</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    borderRadius: RADIUS.lg,
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 10,
    ...SHADOWS.sm,
  },
  cardCompact: {
    padding: 10,
    marginHorizontal: 12,
    marginVertical: 6,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sparkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDE9FE',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: RADIUS.full,
    marginRight: 8,
  },
  sparkIcon: {
    fontSize: 10,
    marginRight: 4,
  },
  sparkText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  reason: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.muted,
  },
  quoteText: {
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.text,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  quoteTextCompact: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 8,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  useBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: RADIUS.md,
    ...SHADOWS.sm,
  },
  useBtnIcon: {
    fontSize: 12,
    marginRight: 6,
  },
  useBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  shuffleBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  shuffleBtnText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 12,
  },
});
