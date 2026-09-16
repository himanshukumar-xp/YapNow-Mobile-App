import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../theme';

export default function ChatBubble({ mine, text, time }) {
  return (
    <View style={[styles.wrap, mine ? styles.mineWrap : styles.themWrap]}>
      <View style={[styles.bubble, mine ? styles.mine : styles.them]}>
        <Text style={[styles.text, mine ? styles.textMine : styles.textThem]}>{text}</Text>
        <Text style={[styles.time, mine ? styles.timeMine : styles.timeThem]}>{time}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', marginVertical: 3, paddingHorizontal: 14 },
  mineWrap: { justifyContent: 'flex-end' },
  themWrap: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '78%', borderRadius: 18, paddingVertical: 9, paddingHorizontal: 13 },
  mine: { backgroundColor: COLORS.bubbleMe, borderBottomRightRadius: 6 },
  them: { backgroundColor: '#fff', borderBottomLeftRadius: 6, borderWidth: 1, borderColor: COLORS.border },
  text: { fontSize: 15, lineHeight: 21 },
  textMine: { color: '#fff' },
  textThem: { color: COLORS.text },
  time: { fontSize: 10, marginTop: 4, fontWeight: '600' },
  timeMine: { color: 'rgba(255,255,255,0.7)', textAlign: 'right' },
  timeThem: { color: COLORS.muted },
});
