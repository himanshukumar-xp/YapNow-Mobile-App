import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../theme';

export default function IcebreakerCard({ item, onUse, onShuffle }) {
  if (!item) return null;
  return (
    <View style={styles.card}>
      <Text style={styles.label}>✨ AI STARTER · {item.reason}</Text>
      <Text style={styles.text}>“{item.text}”</Text>
      <View style={styles.row}>
        <TouchableOpacity style={styles.useBtn} onPress={onUse}>
          <Text style={styles.useText}>Use as first message</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onShuffle} style={styles.shuffleBtn}>
          <Text style={styles.shuffleText}>Shuffle</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF7E8',
    borderColor: '#F5D48E',
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    marginHorizontal: 14,
    marginVertical: 8,
  },
  label: { fontSize: 11, fontWeight: '800', color: '#B7791F', marginBottom: 4 },
  text: { fontSize: 14, color: COLORS.text, lineHeight: 20, fontStyle: 'italic' },
  row: { flexDirection: 'row', marginTop: 8, alignItems: 'center' },
  useBtn: {
    backgroundColor: COLORS.text,
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  useText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  shuffleBtn: { paddingVertical: 7, paddingHorizontal: 8 },
  shuffleText: { color: COLORS.primary, fontWeight: '800', fontSize: 12 },
});
