import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../theme';
import Avatar from './Avatar';
import { Tag } from './Chips';

export default function MatchCard({ peer, sharedInterests = [], sharedLanguages = [] }) {
  return (
    <View style={styles.card}>
      <Avatar name={peer.name} color={peer.color} size={72} />
      <Text style={styles.name}>{peer.name}, {peer.age}</Text>
      <Text style={styles.sub}>📍 {peer.location}</Text>
      <Text style={styles.bio}>{peer.bio}</Text>
      <View style={styles.row}>
        {peer.interests.map((i) => (
          <Tag key={i} label={i} highlight={sharedInterests.includes(i)} />
        ))}
      </View>
      <View style={styles.row}>
        {peer.languages.map((l) => (
          <Tag key={l} label={`🗣 ${l}`} highlight={sharedLanguages.includes(l)} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#6C3CE0',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  name: { fontSize: 22, fontWeight: '800', color: COLORS.text, marginTop: 12 },
  sub: { color: COLORS.muted, marginTop: 2, fontWeight: '600' },
  bio: { color: COLORS.muted, textAlign: 'center', marginVertical: 10, lineHeight: 20 },
  row: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 4 },
});
