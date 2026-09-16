import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TextInput } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../theme';
import Avatar from '../components/Avatar';
import { Tag } from '../components/Chips';
import PrimaryButton from '../components/PrimaryButton';
import { useUser } from '../context/UserContext';
import { MOCK_USERS } from '../data/mockUsers';
import { findRandomMatch, matchReason } from '../utils/match';
import { loadHistory } from '../utils/storage';
import { createRoom, joinRoom, normalizeCode, remoteMatch } from '../utils/rooms';

export default function HomeScreen({ navigation }) {
  const { user, logout, setActiveMatch, deviceId } = useUser();
  const [searching, setSearching] = useState(false);
  const [history, setHistory] = useState([]);
  const [seenIds, setSeenIds] = useState([]);
  const [roomInput, setRoomInput] = useState('');
  const [roomBusy, setRoomBusy] = useState(false);
  const [lastRoom, setLastRoom] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadHistory().then(setHistory).catch(() => {});
    }, [])
  );

  if (!user) return null;

  const handleConnect = () => {
    setSearching(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setTimeout(() => {
      const match = findRandomMatch(user, MOCK_USERS, seenIds);
      setSearching(false);
      if (!match) {
        Alert.alert('No more people', 'You have met everyone! Restart to meet again.');
        setSeenIds([]);
        return;
      }
      setSeenIds((prev) => [...prev, match.peer.id]);
      setActiveMatch(match);
      navigation.navigate('Match');
    }, 1500);
  };

  const openHistory = (item) => {
    setActiveMatch(item);
    if (item.isRemote) navigation.navigate('Chat');
    else navigation.navigate('Match');
  };

  const handleCreateRoom = async () => {
    if (roomBusy) return;
    setRoomBusy(true);
    try {
      const code = await createRoom({ deviceId, name: user.name });
      setLastRoom(code);
      const m = remoteMatch({ code, members: [{ deviceId, name: user.name }], deviceId });
      setActiveMatch(m);
      Alert.alert('Room created', `Share this code with the other phone:\n\n${code}`, [
        { text: 'Open Chat', onPress: () => navigation.navigate('Chat') },
        { text: 'Stay', style: 'cancel' },
      ]);
    } catch (e) {
      Alert.alert('Could not create room', e.message || 'Check internet + Firestore is enabled.');
    } finally {
      setRoomBusy(false);
    }
  };

  const handleJoinRoom = async () => {
    const clean = normalizeCode(roomInput);
    if (clean.length !== 6) {
      Alert.alert('Enter code', 'Room code is 6 letters/numbers (e.g. KQ7X2P).');
      return;
    }
    if (roomBusy) return;
    setRoomBusy(true);
    try {
      const { code, data } = await joinRoom({ code: clean, deviceId, name: user.name });
      setLastRoom(code);
      const m = remoteMatch({ code, members: data.members || [], deviceId });
      setActiveMatch(m);
      navigation.navigate('Chat');
    } catch (e) {
      Alert.alert('Could not join room', e.message || 'Check internet + code.');
    } finally {
      setRoomBusy(false);
    }
  };

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.hello}>Hey {user.name} 👋</Text>
          <Text style={styles.sub}>Ready to yap?</Text>
        </View>
        <Avatar name={user.name} color={COLORS.primary} size={52} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Your profile</Text>
        <Text style={styles.cardSub}>📍 {user.location}</Text>
        <View style={styles.row}>
          {user.languages.map((l) => (
            <Tag key={l} label={`🗣 ${l}`} />
          ))}
        </View>
        <View style={styles.row}>
          {user.interests.map((i) => (
            <Tag key={i} label={i} highlight />
          ))}
        </View>
        <Text style={styles.edit} onPress={() => navigation.navigate('Onboarding')}>
          Edit profile
        </Text>
      </View>

      <PrimaryButton
        title={searching ? 'Finding someone...' : '🔀  Connect to Random Person'}
        onPress={handleConnect}
        loading={searching}
      />
      <Text style={styles.hint}>
        Single-phone demo with 1 of {MOCK_USERS.length} mock users.
      </Text>

      <View style={styles.roomCard}>
        <Text style={styles.cardTitle}>📱 2-Phone Private Room (Firebase)</Text>
        <Text style={styles.roomSub}>
          Phone A: Create → share code. Phone B: enter code → Join. Then chat + call in realtime.
        </Text>
        <PrimaryButton
          title={roomBusy ? 'Working…' : '＋  Create Private Room'}
          onPress={handleCreateRoom}
          loading={roomBusy}
        />
        <View style={styles.joinRow}>
          <TextInput
            style={styles.codeInput}
            placeholder="Enter code e.g. KQ7X2P"
            value={roomInput}
            onChangeText={(t) => setRoomInput(t.toUpperCase())}
            autoCapitalize="characters"
            maxLength={6}
          />
          <View style={{ width: 12 }} />
          <View style={{ flex: 1 }}>
            <PrimaryButton title="Join" onPress={handleJoinRoom} variant="secondary" />
          </View>
        </View>
        {lastRoom ? <Text style={styles.lastRoom}>Last room: {lastRoom}</Text> : null}
      </View>

      {history.length > 0 && (
        <View style={styles.history}>
          <Text style={styles.cardTitle}>Recent connections</Text>
          {history.slice(0, 5).map((h) => (
            <Text key={h.id + h.peer.id} style={styles.historyItem} onPress={() => openHistory(h)}>
              • {h.peer.name} — {h.isRemote ? `Room ${h.roomCode}` : matchReason(h)}
            </Text>
          ))}
        </View>
      )}

      <Text style={styles.logout} onPress={logout}>
        Log out (clear profile)
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  hello: { fontSize: 24, fontWeight: '900', color: COLORS.text },
  sub: { color: COLORS.muted, fontWeight: '600' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTitle: { fontWeight: '800', fontSize: 16, color: COLORS.text },
  cardSub: { color: COLORS.muted, marginTop: 4, fontWeight: '600' },
  row: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
  edit: { color: COLORS.primary, fontWeight: '800', marginTop: 10 },
  hint: { textAlign: 'center', color: COLORS.muted, fontSize: 12, marginTop: 4 },
  roomCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 20,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  roomSub: { color: COLORS.muted, marginTop: 6, lineHeight: 19, fontSize: 13 },
  joinRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  codeInput: {
    flex: 1.2,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 12,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
    color: COLORS.text,
    textAlign: 'center',
  },
  lastRoom: { textAlign: 'center', fontWeight: '800', color: COLORS.primaryDark, marginTop: 8 },
  history: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  historyItem: { color: COLORS.primaryDark, marginTop: 8, fontWeight: '600', lineHeight: 20 },
  logout: { textAlign: 'center', color: '#E11D48', fontWeight: '700', marginTop: 22 },
});
