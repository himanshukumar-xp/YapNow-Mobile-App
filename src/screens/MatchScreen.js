import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { COLORS } from '../theme';
import MatchCard from '../components/MatchCard';
import PrimaryButton from '../components/PrimaryButton';
import IcebreakerCard from '../components/IcebreakerCard';
import { useUser } from '../context/UserContext';
import { matchReason } from '../utils/match';
import { getIcebreakerList } from '../utils/icebreakers';
import { saveHistoryItem } from '../utils/storage';

export default function MatchScreen({ navigation }) {
  const { user, activeMatch } = useUser();
  const [iceIndex, setIceIndex] = useState(0);

  const starters = useMemo(() => {
    if (!user || !activeMatch) return [];
    return getIcebreakerList(user, activeMatch.peer, activeMatch, 5);
  }, [user, activeMatch]);

  if (!user || !activeMatch) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No match yet. Go connect first!</Text>
        <PrimaryButton title="Back Home" onPress={() => navigation.navigate('Home')} />
      </View>
    );
  }

  const { peer } = activeMatch;
  const current = starters[iceIndex % Math.max(1, starters.length)];

  const goChat = async () => {
    try {
      if (!activeMatch.isRemote) await saveHistoryItem(activeMatch);
    } catch {}
    navigation.navigate('Chat');
  };

  const goCall = async () => {
    try {
      if (!activeMatch.isRemote) await saveHistoryItem(activeMatch);
    } catch {}
    navigation.navigate('Call');
  };

  if (activeMatch.isRemote) {
    return (
      <ScrollView style={styles.wrap} contentContainerStyle={styles.content}>
        <Text style={styles.kicker}>🔑 PRIVATE ROOM {activeMatch.roomCode}</Text>
        <Text style={styles.reason}>Share this code with the other phone to chat + call in realtime.</Text>
        <MatchCard peer={peer} sharedInterests={[]} sharedLanguages={[]} />
        <View style={{ height: 12 }} />
        <IcebreakerCard item={current} onShuffle={() => setIceIndex((i) => i + 1)} onUse={goChat} />
        <PrimaryButton title="💬  Open Room Chat" onPress={goChat} />
        <PrimaryButton title="📞  Voice Call (synced)" onPress={goCall} variant="secondary" />
        <PrimaryButton title="Back Home" onPress={() => navigation.navigate('Home')} variant="secondary" />
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={styles.content}>
      <Text style={styles.kicker}>🎉 IT'S A MATCH</Text>
      <Text style={styles.reason}>{matchReason(activeMatch)}</Text>

      <MatchCard
        peer={peer}
        sharedInterests={activeMatch.sharedInterests}
        sharedLanguages={activeMatch.sharedLanguages}
      />

      <View style={{ height: 12 }} />
      <IcebreakerCard
        item={current}
        onShuffle={() => setIceIndex((i) => i + 1)}
        onUse={goChat}
      />

      <PrimaryButton title="💬  Start Chat" onPress={goChat} />
      <PrimaryButton title="📞  Voice Call (simulated)" onPress={goCall} variant="secondary" />
      <PrimaryButton title="🔀  Next person" onPress={() => navigation.navigate('Home')} variant="secondary" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 20, paddingBottom: 40 },
  kicker: { textAlign: 'center', fontWeight: '900', color: COLORS.primary, fontSize: 16, marginTop: 8 },
  reason: { textAlign: 'center', color: COLORS.muted, fontWeight: '600', marginVertical: 8 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: COLORS.bg },
  emptyText: { fontSize: 16, color: COLORS.muted, marginBottom: 16 },
});
