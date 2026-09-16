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
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../theme';
import ChatBubble from '../components/ChatBubble';
import IcebreakerCard from '../components/IcebreakerCard';
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

export default function ChatScreen({ navigation }) {
  const { user, activeMatch, setActiveMatch, deviceId } = useUser();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [iceIndex, setIceIndex] = useState(0);
  const [roomInfo, setRoomInfo] = useState(null);
  const [netError, setNetError] = useState('');
  const listRef = useRef(null);
  const replyTimer = useRef(null);

  const isRemote = !!activeMatch?.isRemote;
  const roomCode = activeMatch?.roomCode || '';
  const matchId = activeMatch?.id || 'none';

  const starters = useMemo(() => {
    if (!user || !activeMatch) return [];
    const peer = activeMatch.peer || { name: 'Partner' };
    return getIcebreakerList(user, peer, activeMatch, 5);
  }, [user, activeMatch]);

  const current = starters.length ? starters[iceIndex % starters.length] : null;

  // Remote peer name from room members (updates when partner joins)
  const remotePeerName = useMemo(() => {
    if (!isRemote) return activeMatch?.peer?.name;
    const others = (roomInfo?.members || []).filter((m) => m.deviceId !== deviceId);
    if (others.length > 0) return others.map((m) => m.name).join(', ');
    return activeMatch?.peer?.name || 'Waiting for partner…';
  }, [isRemote, roomInfo, deviceId, activeMatch]);

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
          // Keep peer display fresh
          const others = room.members.filter((m) => m.deviceId !== deviceId);
          if (others.length > 0) {
            setActiveMatch((prev) =>
              prev && prev.isRemote
                ? { ...prev, peer: { ...prev.peer, id: others[0].deviceId, name: others[0].name } }
                : prev
            );
          }
        }
        // If incoming call ringing, prompt to jump to Call screen
        if (room && room.call && room.call.state === 'ringing' && room.call.byDeviceId !== deviceId) {
          Alert.alert('Incoming call', `${room.call.byName || 'Partner'} is calling…`, [
            {
              text: 'Accept',
              onPress: () => navigation.navigate('Call'),
            },
            { text: 'Later', style: 'cancel' },
          ]);
        }
      },
      () => setNetError('Could not sync room. Check internet / Firestore enabled.')
    );
    const unsubMsgs = subscribeMessages(
      roomCode,
      (list) => {
        setMessages(list);
        setNetError('');
      },
      () => setNetError('Could not load messages. Check internet / Firestore rules.')
    );
    return () => {
      unsubRoom();
      unsubMsgs();
    };
  }, [isRemote, roomCode]);

  useEffect(() => {
    const title = isRemote ? `Room ${roomCode} · ${remotePeerName}` : activeMatch?.peer?.name || 'Chat';
    navigation.setOptions({ title });
  }, [activeMatch, isRemote, roomCode, remotePeerName]);

  if (!user || !activeMatch) {
    return (
      <View style={styles.empty}>
        <Text>No active chat.</Text>
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

    if (isRemote) {
      setInput('');
      try {
        await sendRoomMessage({ code: roomCode, deviceId, name: user.name, text });
      } catch (e) {
        Alert.alert('Send failed', e.message || 'Check internet / Firestore rules.');
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
    }, 1400);
  };

  const useIcebreaker = () => {
    if (current) send(current.text);
  };

  const myIdForBubble = isRemote ? deviceId : 'me';

  return (
    <SafeAreaView style={styles.wrap} edges={['bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        {isRemote && (
          <View style={styles.roomBanner}>
            <Text style={styles.roomBannerText}>
              🔑 Room {roomCode} · You are {user.name} · Talking to: {remotePeerName}
            </Text>
            {netError ? <Text style={styles.netError}>{netError}</Text> : null}
          </View>
        )}
        <IcebreakerCard
          item={current}
          onUse={useIcebreaker}
          onShuffle={() => setIceIndex((i) => i + 1)}
        />
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingVertical: 8, flexGrow: 1 }}
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <Text style={styles.emptyChatText}>
                {isRemote
                  ? `Share code ${roomCode} with the other phone, then say hi! 👋`
                  : `Say hi to ${activeMatch.peer.name}! 👋\nTry the AI starter above.`}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <ChatBubble
              mine={item.senderId === myIdForBubble}
              text={item.senderId === myIdForBubble ? item.text : `${item.senderName || ''}: ${item.text}`}
              time={fmtTime(item.ts)}
            />
          )}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          ListFooterComponent={
            !isRemote && typing ? (
              <Text style={styles.typing}>{activeMatch.peer.name} is typing…</Text>
            ) : null
          }
        />
        <View style={styles.bar}>
          <TextInput
            style={styles.input}
            placeholder={isRemote ? `Message Room ${roomCode}...` : `Message ${activeMatch.peer.name}...`}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => send()}
            returnKeyType="send"
          />
          <TouchableOpacity style={styles.send} onPress={() => send()}>
            <Text style={styles.sendText}>Send</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Call')} style={styles.callLink}>
          <Text style={styles.callLinkText}>📞 Switch to voice call instead?</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: COLORS.bg },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  roomBanner: { backgroundColor: '#EFF6FF', padding: 10, borderBottomWidth: 1, borderBottomColor: '#BFDBFE' },
  roomBannerText: { textAlign: 'center', fontWeight: '800', color: COLORS.primaryDark, fontSize: 12 },
  netError: { textAlign: 'center', color: '#E11D48', fontSize: 11, marginTop: 4 },
  emptyChat: { alignItems: 'center', padding: 30 },
  emptyChatText: { color: COLORS.muted, textAlign: 'center', lineHeight: 22, fontWeight: '600' },
  typing: { color: COLORS.muted, fontStyle: 'italic', paddingHorizontal: 18, paddingVertical: 6, fontSize: 12 },
  bar: { flexDirection: 'row', padding: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: COLORS.border },
  input: {
    flex: 1,
    backgroundColor: COLORS.bg,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.text,
  },
  send: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingHorizontal: 18,
    justifyContent: 'center',
    marginLeft: 8,
  },
  sendText: { color: '#fff', fontWeight: '800' },
  callLink: { alignItems: 'center', paddingVertical: 8, backgroundColor: '#fff' },
  callLinkText: { color: COLORS.primary, fontWeight: '700', fontSize: 13 },
});
