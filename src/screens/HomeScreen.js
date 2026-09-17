import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { COLORS, RADIUS, SHADOWS } from '../theme';
import Avatar from '../components/Avatar';
import { Tag } from '../components/Chips';
import PrimaryButton from '../components/PrimaryButton';
import { useUser } from '../context/UserContext';
import { MOCK_USERS } from '../data/mockUsers';
import { findRandomMatch, matchReason } from '../utils/match';
import { loadHistory } from '../utils/storage';
import { createRoom, joinRoom, normalizeCode, remoteMatch } from '../utils/rooms';

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, logout, setActiveMatch, deviceId } = useUser();

  const [searching, setSearching] = useState(false);
  const [history, setHistory] = useState([]);
  const [seenIds, setSeenIds] = useState([]);
  const [roomInput, setRoomInput] = useState('');
  const [roomBusy, setRoomBusy] = useState(false);
  const [lastRoom, setLastRoom] = useState('');
  const [roomTab, setRoomTab] = useState('join'); // 'join' | 'create'

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
        Alert.alert(
          'You met everyone! 🎉',
          'You have matched with all available people. Starting fresh so you can reconnect anytime.',
          [{ text: 'OK', onPress: () => setSeenIds([]) }]
        );
        return;
      }
      setSeenIds((prev) => [...prev, match.peer.id]);
      setActiveMatch(match);
      navigation.navigate('Match');
    }, 1400);
  };

  const openHistory = (item) => {
    Haptics.selectionAsync().catch(() => {});
    setActiveMatch(item);
    if (item.isRemote) {
      navigation.navigate('Chat');
    } else {
      navigation.navigate('Match');
    }
  };

  const handleCreateRoom = async () => {
    if (roomBusy) return;
    setRoomBusy(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    try {
      const code = await createRoom({ deviceId, name: user.name });
      setLastRoom(code);
      const m = remoteMatch({
        code,
        members: [{ deviceId, name: user.name }],
        deviceId,
      });
      setActiveMatch(m);
      Alert.alert(
        'Room Created! 🔑',
        `Room Code: ${code}\n\nShare this 6-character code with another phone to chat and call in realtime.`,
        [
          { text: 'Open Chat Room', onPress: () => navigation.navigate('Chat') },
          { text: 'Stay Here', style: 'cancel' },
        ]
      );
    } catch (e) {
      Alert.alert('Could not create room', e.message || 'Check internet and Firestore setup.');
    } finally {
      setRoomBusy(false);
    }
  };

  const handleJoinRoom = async () => {
    const clean = normalizeCode(roomInput);
    if (clean.length !== 6) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      Alert.alert('Invalid Code', 'Please enter a valid 6-character room code (e.g. KQ7X2P).');
      return;
    }
    if (roomBusy) return;
    setRoomBusy(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    try {
      const { code, data } = await joinRoom({ code: clean, deviceId, name: user.name });
      setLastRoom(code);
      const m = remoteMatch({ code, members: data.members || [], deviceId });
      setActiveMatch(m);
      navigation.navigate('Chat');
    } catch (e) {
      Alert.alert('Could not join room', e.message || 'Check internet connection or room code.');
    } finally {
      setRoomBusy(false);
    }
  };

  const promptLogout = () => {
    Alert.alert(
      'Log Out',
      'This will reset your local profile. You can recreate or re-enter anytime.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: logout },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: Math.max(insets.top + 12, 24), paddingBottom: Math.max(insets.bottom + 24, 36) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Top App Bar */}
        <View style={styles.topBar}>
          <View style={styles.greetingWrap}>
            <Text style={styles.helloText}>Hey, {user.name} 👋</Text>
            <Text style={styles.subText}>Ready to yap with someone new?</Text>
          </View>

          <TouchableOpacity
            style={styles.avatarButton}
            onPress={() => navigation.navigate('Onboarding')}
            activeOpacity={0.8}
          >
            <Avatar name={user.name} color={COLORS.primary} size={48} showStatus isOnline />
          </TouchableOpacity>
        </View>

        {/* User Profile Capsule */}
        <View style={styles.profileCapsule}>
          <View style={styles.profileCapsuleLeft}>
            <View style={styles.profileMetaRow}>
              <Text style={styles.locationTag}>📍 {user.location}</Text>
              <Text style={styles.dividerDot}>•</Text>
              <Text style={styles.langSummary}>
                🗣 {user.languages.join(', ')}
              </Text>
            </View>
            <View style={styles.tagWrap}>
              {user.interests.map((i) => (
                <Tag key={i} label={i} highlight size="sm" />
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={styles.editProfileBtn}
            onPress={() => navigation.navigate('Onboarding')}
          >
            <Text style={styles.editProfileText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Hero Card: Match with Random Person */}
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View style={styles.onlineBadge}>
              <View style={styles.greenDot} />
              <Text style={styles.onlineText}>
                {MOCK_USERS.length} People Online
              </Text>
            </View>
            <Text style={styles.aiSparkTag}>✨ Smart Matching</Text>
          </View>

          <Text style={styles.heroTitle}>Talk to Someone New</Text>
          <Text style={styles.heroSub}>
            Instant connection scored by shared interests, spoken languages, and location.
          </Text>

          <PrimaryButton
            title={searching ? 'Finding someone great...' : '🔀  Connect to Random Person'}
            onPress={handleConnect}
            loading={searching}
            size="lg"
            style={styles.heroBtn}
          />
        </View>

        {/* 2-Phone Realtime Room Section */}
        <View style={styles.roomCard}>
          <View style={styles.roomHeader}>
            <View>
              <Text style={styles.roomTitle}>📱 2-Phone Realtime Room</Text>
              <Text style={styles.roomSub}>
                Firebase Firestore synced chat & call across two real phones.
              </Text>
            </View>
          </View>

          {/* Segmented control */}
          <View style={styles.segmentedTabs}>
            <TouchableOpacity
              style={[styles.segTab, roomTab === 'join' && styles.segTabActive]}
              onPress={() => setRoomTab('join')}
              activeOpacity={0.8}
            >
              <Text style={[styles.segTabText, roomTab === 'join' && styles.segTabTextActive]}>
                Join with Code
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.segTab, roomTab === 'create' && styles.segTabActive]}
              onPress={() => setRoomTab('create')}
              activeOpacity={0.8}
            >
              <Text style={[styles.segTabText, roomTab === 'create' && styles.segTabTextActive]}>
                Create Room
              </Text>
            </TouchableOpacity>
          </View>

          {roomTab === 'join' ? (
            <View style={styles.joinSection}>
              <View style={styles.joinInputRow}>
                <TextInput
                  style={styles.codeInput}
                  placeholder="CODE (e.g. KQ7X2P)"
                  placeholderTextColor={COLORS.textMuted}
                  value={roomInput}
                  onChangeText={(t) => setRoomInput(t.toUpperCase())}
                  autoCapitalize="characters"
                  maxLength={6}
                  autoCorrect={false}
                />
                <PrimaryButton
                  title="Join"
                  onPress={handleJoinRoom}
                  loading={roomBusy}
                  size="md"
                  style={styles.joinActionBtn}
                />
              </View>
            </View>
          ) : (
            <View style={styles.createSection}>
              <Text style={styles.createNote}>
                Create a room code and share it with phone B to test live messages and voice ringing.
              </Text>
              <PrimaryButton
                title={roomBusy ? 'Creating...' : '＋  Create Private Room Code'}
                onPress={handleCreateRoom}
                loading={roomBusy}
                variant="secondary"
                size="md"
              />
            </View>
          )}

          {lastRoom ? (
            <View style={styles.lastRoomPill}>
              <Text style={styles.lastRoomLabel}>Recent Room:</Text>
              <Text style={styles.lastRoomCode}>{lastRoom}</Text>
              <TouchableOpacity
                onPress={() => {
                  setRoomInput(lastRoom);
                  setRoomTab('join');
                }}
              >
                <Text style={styles.useLastRoom}>Use</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>

        {/* Recent Connections Section */}
        <View style={styles.historySection}>
          <Text style={styles.sectionHeader}>Recent Connections</Text>

          {history.length > 0 ? (
            <View style={styles.historyList}>
              {history.slice(0, 5).map((h) => (
                <TouchableOpacity
                  key={h.id + h.peer.id}
                  style={styles.historyCard}
                  onPress={() => openHistory(h)}
                  activeOpacity={0.7}
                >
                  <Avatar
                    name={h.peer.name}
                    color={h.peer.color || COLORS.primary}
                    size={44}
                  />
                  <View style={styles.historyInfo}>
                    <Text style={styles.historyName}>{h.peer.name}</Text>
                    <Text style={styles.historyReason} numberOfLines={1}>
                      {h.isRemote ? `🔑 Room ${h.roomCode}` : matchReason(h)}
                    </Text>
                  </View>
                  <View style={styles.historyChevronWrap}>
                    <Text style={styles.historyChevron}>›</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyHistory}>
              <Text style={styles.emptyHistoryIcon}>💬</Text>
              <Text style={styles.emptyHistoryTitle}>No conversations yet</Text>
              <Text style={styles.emptyHistorySub}>
                Tap “Connect to Random Person” above to make your first connection!
              </Text>
            </View>
          )}
        </View>

        {/* Logout Footer */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={promptLogout}
          activeOpacity={0.7}
        >
          <Text style={styles.logoutText}>Log Out / Reset Demo Profile</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  greetingWrap: {
    flex: 1,
  },
  helloText: {
    fontSize: 26,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: -0.3,
  },
  subText: {
    fontSize: 14,
    color: COLORS.muted,
    fontWeight: '500',
    marginTop: 2,
  },
  avatarButton: {
    marginLeft: 12,
  },
  profileCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.lg,
    padding: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  profileCapsuleLeft: {
    flex: 1,
  },
  profileMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  locationTag: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  dividerDot: {
    marginHorizontal: 6,
    color: COLORS.border,
  },
  langSummary: {
    fontSize: 12,
    color: COLORS.muted,
    fontWeight: '600',
  },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 2,
  },
  editProfileBtn: {
    backgroundColor: COLORS.surfaceSubtle,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: RADIUS.full,
    marginLeft: 10,
  },
  editProfileText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },

  // Hero Card
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.xl,
    padding: 20,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.md,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.successLight,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.successBorder,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.success,
    marginRight: 6,
  },
  onlineText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.success,
  },
  aiSparkTag: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.3,
  },
  heroSub: {
    fontSize: 14,
    color: COLORS.muted,
    lineHeight: 20,
    marginTop: 4,
    marginBottom: 16,
  },
  heroBtn: {
    marginVertical: 0,
  },

  // 2-Phone Room Card
  roomCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: RADIUS.xl,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    ...SHADOWS.sm,
  },
  roomHeader: {
    marginBottom: 12,
  },
  roomTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  roomSub: {
    fontSize: 12,
    color: COLORS.muted,
    lineHeight: 18,
    marginTop: 3,
  },
  segmentedTabs: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: RADIUS.md,
    padding: 3,
    marginBottom: 14,
  },
  segTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: RADIUS.sm,
  },
  segTabActive: {
    backgroundColor: '#FFFFFF',
    ...SHADOWS.sm,
  },
  segTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.muted,
  },
  segTabTextActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  joinSection: {},
  joinInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  codeInput: {
    flex: 1,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: COLORS.primaryBorder,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: 2,
  },
  joinActionBtn: {
    width: 84,
    height: 48,
    marginLeft: 8,
    marginVertical: 0,
  },
  createSection: {},
  createNote: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 17,
    marginBottom: 10,
  },
  lastRoomPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DBEAFE',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: RADIUS.full,
    marginTop: 12,
    alignSelf: 'center',
  },
  lastRoomLabel: {
    fontSize: 11,
    color: COLORS.primaryDark,
    fontWeight: '600',
    marginRight: 4,
  },
  lastRoomCode: {
    fontSize: 12,
    color: COLORS.primaryDark,
    fontWeight: '900',
    letterSpacing: 1,
  },
  useLastRoom: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '800',
    marginLeft: 8,
    textDecorationLine: 'underline',
  },

  // History Section
  historySection: {
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 12,
  },
  historyList: {},
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.lg,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  historyInfo: {
    flex: 1,
    marginLeft: 12,
  },
  historyName: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
  },
  historyReason: {
    fontSize: 12,
    color: COLORS.muted,
    fontWeight: '500',
    marginTop: 2,
  },
  historyChevronWrap: {
    paddingHorizontal: 8,
  },
  historyChevron: {
    fontSize: 22,
    color: COLORS.textMuted,
    fontWeight: '300',
  },
  emptyHistory: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.lg,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyHistoryIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyHistoryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  emptyHistorySub: {
    fontSize: 13,
    color: COLORS.muted,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },

  // Logout
  logoutBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    marginBottom: 16,
  },
  logoutText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.danger,
  },
});
