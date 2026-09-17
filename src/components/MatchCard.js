import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, RADIUS, SHADOWS } from '../theme';
import Avatar from './Avatar';
import { Tag } from './Chips';

export default function MatchCard({
  peer,
  sharedInterests = [],
  sharedLanguages = [],
  score,
}) {
  const hasAge = peer.age !== undefined && peer.age !== '';
  const sharedCount = (sharedInterests?.length || 0) + (sharedLanguages?.length || 0);

  return (
    <View style={styles.card}>
      <View style={styles.avatarWrap}>
        <Avatar name={peer.name} color={peer.color} size={84} showStatus isOnline />
      </View>

      <Text style={styles.name}>
        {peer.name}
        {hasAge ? `, ${peer.age}` : ''}
      </Text>

      <View style={styles.locationPill}>
        <Text style={styles.locationIcon}>📍</Text>
        <Text style={styles.locationText}>{peer.location}</Text>
      </View>

      {sharedCount > 0 && (
        <View style={styles.compatPill}>
          <Text style={styles.compatText}>
            ⚡ {sharedCount} shared trait{sharedCount > 1 ? 's' : ''} with you
          </Text>
        </View>
      )}

      {peer.bio ? (
        <View style={styles.bioBox}>
          <Text style={styles.bioText}>“{peer.bio}”</Text>
        </View>
      ) : null}

      {peer.interests && peer.interests.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Interests</Text>
          <View style={styles.tagRow}>
            {peer.interests.map((i) => (
              <Tag
                key={i}
                label={i}
                highlight={sharedInterests.includes(i)}
              />
            ))}
          </View>
        </View>
      )}

      {peer.languages && peer.languages.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Speaks</Text>
          <View style={styles.tagRow}>
            {peer.languages.map((l) => (
              <Tag
                key={l}
                label={`🗣 ${l}`}
                highlight={sharedLanguages.includes(l)}
              />
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.xl,
    padding: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.md,
  },
  avatarWrap: {
    marginBottom: 12,
  },
  name: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.3,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSubtle,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: RADIUS.full,
    marginTop: 6,
  },
  locationIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  locationText: {
    color: COLORS.muted,
    fontWeight: '600',
    fontSize: 13,
  },
  compatPill: {
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: RADIUS.full,
    marginTop: 10,
  },
  compatText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 12,
  },
  bioBox: {
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: RADIUS.md,
    paddingVertical: 10,
    paddingHorizontal: 14,
    width: '100%',
    marginVertical: 14,
  },
  bioText: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  section: {
    width: '100%',
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: COLORS.textMuted,
    marginBottom: 6,
    textAlign: 'center',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
});
