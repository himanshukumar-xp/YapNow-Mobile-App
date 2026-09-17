import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, RADIUS, SHADOWS } from '../theme';

export default function ChatBubble({ mine, text, time, senderName }) {
  return (
    <View style={[styles.wrap, mine ? styles.mineWrap : styles.themWrap]}>
      <View style={[styles.container, mine ? styles.containerMine : styles.containerThem]}>
        {!mine && senderName ? (
          <Text style={styles.senderName}>{senderName}</Text>
        ) : null}
        <View style={[styles.bubble, mine ? styles.mine : styles.them]}>
          <Text style={[styles.text, mine ? styles.textMine : styles.textThem]}>
            {text}
          </Text>
          <View style={[styles.metaRow, mine ? styles.metaRowMine : styles.metaRowThem]}>
            <Text style={[styles.time, mine ? styles.timeMine : styles.timeThem]}>
              {time}
            </Text>
            {mine ? <Text style={styles.tick}>✓✓</Text> : null}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    marginVertical: 4,
    paddingHorizontal: 16,
  },
  mineWrap: {
    justifyContent: 'flex-end',
  },
  themWrap: {
    justifyContent: 'flex-start',
  },
  container: {
    maxWidth: '82%',
  },
  containerMine: {
    alignItems: 'flex-end',
  },
  containerThem: {
    alignItems: 'flex-start',
  },
  senderName: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 3,
    marginLeft: 6,
  },
  bubble: {
    borderRadius: RADIUS.lg,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  mine: {
    backgroundColor: COLORS.bubbleMe,
    borderBottomRightRadius: 4,
    ...SHADOWS.sm,
  },
  them: {
    backgroundColor: COLORS.surface,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  text: {
    fontSize: 15,
    lineHeight: 21,
  },
  textMine: {
    color: COLORS.bubbleMeText,
  },
  textThem: {
    color: COLORS.bubbleThemText,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  metaRowMine: {
    justifyContent: 'flex-end',
  },
  metaRowThem: {
    justifyContent: 'flex-start',
  },
  time: {
    fontSize: 10,
    fontWeight: '500',
  },
  timeMine: {
    color: 'rgba(255, 255, 255, 0.75)',
  },
  timeThem: {
    color: COLORS.textMuted,
  },
  tick: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.85)',
    marginLeft: 4,
    fontWeight: '700',
  },
});
