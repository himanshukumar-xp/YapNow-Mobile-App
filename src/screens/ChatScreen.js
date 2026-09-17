import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { COLORS, RADIUS, SHADOWS } from '../theme';
import ChatBubble from '../components/ChatBubble';
import IcebreakerCard from '../components/IcebreakerCard';
import Avatar from '../components/Avatar';
import TypingIndicator from '../components/TypingIndicator';
import ScreenHeader from '../components/ScreenHeader';
import { useUser } from '../context/UserContext';
import { getIcebreakerList, getMockReply } from '../utils/icebreakers';
import { loadMessages, saveMessages } from '../utils/storage';
import { subscribeMessages, subscribeRoom, sendRoomMessage } from '../utils/rooms';

function fmtTime(ts) {
  const d = new Date(ts);
  let h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'pm' : 'am';
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}

export default function ChatScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { user, activeMatch, setActiveMatch, deviceId } = useUser();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [iceIndex, setIceIndex] = useState(0);
  const [showSparks, setShowSparks] = useState(false);
  const [roomInfo, setRoomInfo] = useState(null);
  const [netError, setNetError] = useState('');

  const listRef = useRef(null);
  const replyTimer = useRef(null);
  const initialHandled = useRef(false);

  const isRemote = !!activeMatch?.isRemote;
  const roomCode = activeMatch?.roomCode || '';
  const matchId = activeMatch?.id || 'none';

  const starters = useMemo(() => {
    if (!user || !activeMatch) return [];
    const peer = activeMatch.peer || { name: 'Partner' };
    return getIcebreakerList(user, peer, activeMatch, 5);
  }, [user, activeMatch]);

  const current = starters.length ? starters[iceIndex % starters.length] : null;

  // Remote peer name from room members
  const remotePeerName = useMemo(() => {
    if (!isRemote) return activeMatch?.peer?.name;
    const others = (roomInfo?.members || []).filter((m) => m.deviceId !== deviceId);
    if (others.length > 0) return others.map((m) => m.name).join(', ');
    return activeMatch?.peer?.name || 'Waiting for partner…';
  }, [isRemote, roomInfo, deviceId, activeMatch]);

  // Handle initial message from MatchScreen
  useEffect(() => {
    if (route?.params?.initialMessage && !initialHandled.current) {
      initialHandled.current = true;
      send(route.params.initialMessage);
    }
  }, [route?.params]);

  // Mock mode: load from AsyncStorage
  useEffect(() => {
    if (!activeMatch || isRemote) return;
    loadMessages(matchId).then(setMessages).catch(() => {});
    return () => {
      if (replyTimer.current) clearTimeout(replyTimer.current);
    };
  }, [matchId, isRemote, activeMatch]);

  // Remote mode: subscribe to Firestore room + messages
  useEffect(() => {
    if (!activeMatch || !isRemote || !roomCode) return;
    const unsubRoom = subscribeRoom(
      roomCode,
      (room) => {
        setRoomInfo(room);
        if (room && room.members) {
          const others = room.members.filter((m) => m.deviceId !== deviceId);
          if (others.length > 0) {
            setActiveMatch((prev) =>
              prev && prev.isRemote
                ? { ...prev, peer: { ...prev.peer, id: others[0].deviceId, name: others[0].name } }
                : prev
            );
          }
        }
        // Incoming call alert
        if (room && room.call && room.call.state === 'ringing' && room.call.byDeviceId !== deviceId) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
          Alert.alert('Incoming Call 📞', `${room.call.byName || 'Partner'} is calling you…`, [
            {
              text: 'Accept Call',
              onPress: () => navigation.navigate('Call'),
            },
            { text: 'Decline', style: 'cancel' },
          ]);
        }
      },
      () => setNetError('Could not sync room. Check connection.')
    );

    const unsubMsgs = subscribeMessages(
      roomCode,
      (list) => {
        setMessages(list);
        setNetError('');
      },
      () => setNetError('Could not load messages.')
    );

    return () => {
      unsubRoom();
      unsubMsgs();
    };
  }, [isRemote, roomCode]);

  if (!user || !activeMatch) {
    return (
      <View style={styles.emptyWrap}>
        <ScreenHeader title="Chat" onBack={() => navigation.navigate('Home')} />
        <View style={styles.emptyContent}>
          <Text style={styles.emptyText}>No active conversation found.</Text>
          <TouchableOpacity
            style={styles.backHomeBtn}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.backHomeBtnText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const persistMock = (next) => {
    setMessages(next);
    saveMessages(matchId, next).catch(() => {});
  };

  const send = async (textOverride) => {
    const text = (textOverride ?? input).trim();
    if (!text) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

    if (isRemote) {
      setInput('');
      try {
        await sendRoomMessage({ code: roomCode, deviceId, name: user.name, text });
      } catch (e) {
        Alert.alert('Message failed', e.message || 'Check connection.');
      }
      return;
    }

    if (typing) return;
    const mine = { id: `m${Date.now()}`, senderId: 'me', text, ts: Date.now() };
    const next = [...messages, mine];
    persistMock(next);
    setInput('');
    setTyping(true);

    replyTimer.current = setTimeout(() => {
      const reply = {
        id: `r${Date.now()}`,
        senderId: activeMatch.peer.id,
        text: getMockReply(user, activeMatch.peer, activeMatch),
        ts: Date.now(),
      };
      persistMock([...next, reply]);
      setTyping(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }, 1300);
  };

  const useIcebreaker = () => {
    if (current) {
      send(current.text);
      setShowSparks(false);
    }
  };

  const myIdForBubble = isRemote ? deviceId : 'me';
  const peerDisplay = isRemote ? remotePeerName : activeMatch.peer.name;

  return (
    <View style={styles.container}>
      {/* Top Header with Avatar and Call Button */}
      <ScreenHeader
        onBack={() => navigation.goBack()}
        centerContent={
          <View style={styles.headerCenter}>
            <Avatar
              name={peerDisplay}
              color={activeMatch.peer?.color || COLORS.primary}
              size={34}
              showStatus
              isOnline
            />
            <View style={styles.headerTextWrap}>
              <Text style={styles.headerName} numberOfLines={1}>
                {peerDisplay}
              </Text>
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {isRemote ? `Room ${roomCode}` : 'Active now'}
              </Text>
            </View>
          </View>
        }
        rightAction={
          <TouchableOpacity
            style={styles.callHeaderBtn}
            onPress={() => navigation.navigate('Call')}
            activeOpacity={0.8}
          >
            <Text style={styles.callHeaderIcon}>📞</Text>
          </TouchableOpacity>
        }
      />

      {/* Remote Room Info Banner */}
      {isRemote && (
        <View style={styles.roomBanner}>
          <Text style={styles.roomBannerText}>
            🔑 Room {roomCode} · 2-Phone Realtime Mode
          </Text>
          {netError ? <Text style={styles.netErrorText}>{netError}</Text> : null}
        </View>
      )}

      {/* Collapsible AI Sparks Drawer */}
      {showSparks && current && (
        <View style={styles.sparksDrawer}>
          <IcebreakerCard
            item={current}
            onUse={useIcebreaker}
            onShuffle={() => setIceIndex((i) => i + 1)}
            compact
          />
        </View>
      )}

      {/* Message Viewport */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          style={styles.list}
          contentContainerStyle={[
            styles.listContent,
            messages.length === 0 && styles.listContentEmpty,
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <View style={styles.emptyAvatarBadge}>
                <Avatar
                  name={peerDisplay}
                  color={activeMatch.peer?.color || COLORS.primary}
                  size={64}
                />
              </View>
              <Text style={styles.emptyChatTitle}>
                Say hello to {peerDisplay}! 👋
              </Text>
              <Text style={styles.emptyChatSubtitle}>
                {isRemote
                  ? `Both devices in room ${roomCode} can chat and voice call in realtime.`
                  : 'Start the conversation with an AI prompt or your own greeting.'}
              </Text>

              {current && (
                <TouchableOpacity
                  style={styles.starterPill}
                  onPress={useIcebreaker}
                  activeOpacity={0.8}
                >
                  <Text style={styles.starterPillLabel}>✨ Tap to send starter:</Text>
                  <Text style={styles.starterPillText} numberOfLines={2}>
                    “{current.text}”
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          }
          renderItem={({ item }) => {
            const isMine = item.senderId === myIdForBubble;
            return (
              <ChatBubble
                mine={isMine}
                senderName={!isMine && isRemote ? item.senderName : undefined}
                text={item.text}
                time={fmtTime(item.ts)}
              />
            );
          }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          ListFooterComponent={
            !isRemote && typing ? <TypingIndicator /> : null
          }
        />

        {/* AI Sparks Pill Toggle */}
        <View style={styles.sparksToggleRow}>
          <TouchableOpacity
            style={[styles.sparksToggle, showSparks && styles.sparksToggleActive]}
            onPress={() => setShowSparks((prev) => !prev)}
            activeOpacity={0.7}
          >
            <Text style={styles.sparksToggleIcon}>✨</Text>
            <Text style={styles.sparksToggleText}>
              {showSparks ? 'Hide AI Sparks' : 'AI Sparks Starter'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Message Input Bar */}
        <View
          style={[
            styles.inputBar,
            { paddingBottom: Math.max(insets.bottom, 10) },
          ]}
        >
          <TextInput
            style={styles.textInput}
            placeholder={
              isRemote
                ? `Message room ${roomCode}...`
                : `Message ${peerDisplay}...`
            }
            placeholderTextColor={COLORS.textMuted}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => send()}
            returnKeyType="send"
            multiline={false}
          />

          <TouchableOpacity
            style={[
              styles.sendButton,
              input.trim().length > 0 ? styles.sendButtonActive : styles.sendButtonInactive,
            ]}
            onPress={() => send()}
            disabled={input.trim().length === 0}
            activeOpacity={0.8}
          >
            <Text style={styles.sendButtonIcon}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTextWrap: {
    marginLeft: 10,
  },
  headerName: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
    maxWidth: 160,
  },
  headerSubtitle: {
    fontSize: 11,
    color: COLORS.success,
    fontWeight: '600',
    marginTop: 1,
  },
  callHeaderBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callHeaderIcon: {
    fontSize: 16,
  },
  roomBanner: {
    backgroundColor: '#EFF6FF',
    borderBottomWidth: 1,
    borderBottomColor: '#BFDBFE',
    paddingVertical: 7,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  roomBannerText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  netErrorText: {
    fontSize: 11,
    color: COLORS.danger,
    marginTop: 2,
  },
  sparksDrawer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingVertical: 12,
  },
  listContentEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyChat: {
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingVertical: 32,
  },
  emptyAvatarBadge: {
    marginBottom: 16,
  },
  emptyChatTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 6,
  },
  emptyChatSubtitle: {
    fontSize: 13,
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  starterPill: {
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    borderRadius: RADIUS.lg,
    padding: 14,
    width: '100%',
    ...SHADOWS.sm,
  },
  starterPillLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 4,
  },
  starterPillText: {
    fontSize: 13,
    color: COLORS.text,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  sparksToggleRow: {
    paddingHorizontal: 16,
    paddingBottom: 6,
    alignItems: 'flex-start',
  },
  sparksToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderRadius: RADIUS.full,
    ...SHADOWS.sm,
  },
  sparksToggleActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primaryBorder,
  },
  sparksToggleIcon: {
    fontSize: 11,
    marginRight: 5,
  },
  sparksToggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: 14,
    paddingTop: 10,
  },
  textInput: {
    flex: 1,
    height: 44,
    backgroundColor: COLORS.surfaceSubtle,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.full,
    paddingHorizontal: 16,
    fontSize: 15,
    color: COLORS.text,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sendButtonActive: {
    backgroundColor: COLORS.primary,
  },
  sendButtonInactive: {
    backgroundColor: COLORS.border,
  },
  sendButtonIcon: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    marginTop: -2,
  },
  emptyWrap: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  emptyContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.muted,
  },
  backHomeBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: RADIUS.md,
    marginTop: 14,
  },
  backHomeBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
