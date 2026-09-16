import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Vibration } from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../theme';
import Avatar from '../components/Avatar';
import { useUser } from '../context/UserContext';
import { subscribeRoom, setCallState } from '../utils/rooms';

function fmt(sec) {
  const m = String(Math.floor(sec / 60)).padStart(2, '0');
  const s = String(sec % 60).padStart(2, '0');
  return `${m}:${s}`;
}

export default function CallScreen({ navigation }) {
  const { user, activeMatch, deviceId } = useUser();
  const isRemote = !!activeMatch?.isRemote;
  const roomCode = activeMatch?.roomCode || '';

  const [phase, setPhase] = useState('connecting'); // connecting | ringing | connected | ended
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const [speaker, setSpeaker] = useState(false);
  const [remoteCall, setRemoteCall] = useState(null);
  const connectedAt = useRef(0);
  const announced = useRef(false);

  // Mock (single-phone) behavior — unchanged
  useEffect(() => {
    if (!activeMatch || isRemote) return;
    try {
      Vibration.vibrate([0, 400, 200, 400]);
    } catch {}
    const t = setTimeout(() => {
      setPhase('connected');
      connectedAt.current = Date.now();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }, 2000);
    return () => clearTimeout(t);
  }, [activeMatch, isRemote]);

  // Remote (2-phone) signaling via Firestore rooms/{code}.call
  useEffect(() => {
    if (!activeMatch || !isRemote || !roomCode) return;
    // I am starting the call -> announce ringing (only once per mount if idle)
    setCallState({
      code: roomCode,
      state: 'ringing',
      deviceId,
      name: user?.name || 'Partner',
    }).catch(() => {});
    try {
      Vibration.vibrate([0, 400, 200, 400]);
    } catch {}

    const unsub = subscribeRoom(roomCode, (room) => {
      const call = room?.call;
      if (!call) return;
      setRemoteCall(call);
      if (call.state === 'connected') {
        setPhase('connected');
        if (!connectedAt.current) connectedAt.current = call.at || Date.now();
        if (!announced.current) {
          announced.current = true;
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        }
      } else if (call.state === 'ringing') {
        // If the OTHER phone is ringing, show ringing UI (waiting for accept)
        // If I am the ringer, also show ringing until someone accepts
        setPhase('ringing');
      } else if (call.state === 'ended') {
        setPhase('ended');
        setTimeout(() => navigation.goBack(), 1200);
      } else {
        setPhase('connecting');
      }
    });
    return () => unsub();
  }, [isRemote, roomCode]);

  useEffect(() => {
    if (phase !== 'connected') return;
    if (!connectedAt.current) connectedAt.current = Date.now();
    const i = setInterval(() => {
      const base = connectedAt.current || Date.now();
      setSeconds(Math.max(0, Math.floor((Date.now() - base) / 1000)));
    }, 1000);
    return () => clearInterval(i);
  }, [phase]);

  if (!activeMatch) {
    return (
      <View style={styles.wrap}>
        <Text style={{ color: '#fff' }}>No active call.</Text>
      </View>
    );
  }

  const accept = () => {
    if (!isRemote) {
      setPhase('connected');
      connectedAt.current = Date.now();
      return;
    }
    setCallState({ code: roomCode, state: 'connected', deviceId, name: user?.name || 'Partner' }).catch(() => {});
  };

  const end = () => {
    if (isRemote) {
      setCallState({ code: roomCode, state: 'ended', deviceId, name: user?.name || 'Partner' }).catch(() => {});
    }
    setPhase('ended');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    setTimeout(() => navigation.goBack(), 1200);
  };

  const { peer } = activeMatch;
  const ringingByOther = isRemote && remoteCall?.state === 'ringing' && remoteCall?.byDeviceId !== deviceId;

  return (
    <View style={styles.wrap}>
      <Text style={styles.sim}>
        {isRemote ? `SYNCED CALL · Room ${roomCode} — state is real, mic audio is simulated` : 'SIMULATED CALL — demo UI, no real audio routing'}
      </Text>
      <Avatar name={peer.name} color={peer.color} size={110} />
      <Text style={styles.name}>{peer.name}</Text>
      <Text style={styles.status}>
        {phase === 'connecting' || phase === 'ringing'
          ? ringingByOther
            ? `Incoming call from ${remoteCall.byName || 'partner'}…`
            : 'Ringing…'
          : phase === 'connected'
            ? fmt(seconds)
            : `Ended · ${fmt(seconds)}`}
      </Text>
      <Text style={styles.sub}>
        {isRemote ? `🔑 Room ${roomCode}` : `📍 ${peer.location} · 🗣 ${(activeMatch.sharedLanguages[0] || peer.languages[0] || '')}`}
      </Text>

      {phase !== 'ended' ? (
        <>
          {ringingByOther && (
            <TouchableOpacity style={styles.accept} onPress={accept}>
              <Text style={styles.acceptText}>✅ Accept Call</Text>
            </TouchableOpacity>
          )}
          <View style={styles.controls}>
            <TouchableOpacity
              style={[styles.ctrl, muted && styles.ctrlActive]}
              onPress={() => setMuted((m) => !m)}
            >
              <Text style={styles.ctrlIcon}>{muted ? '🔇' : '🎙'}</Text>
              <Text style={styles.ctrlLabel}>{muted ? 'Unmute' : 'Mute'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.end} onPress={end}>
              <Text style={styles.endIcon}>📞</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.ctrl, speaker && styles.ctrlActive]}
              onPress={() => setSpeaker((s) => !s)}
            >
              <Text style={styles.ctrlIcon}>🔈</Text>
              <Text style={styles.ctrlLabel}>{speaker ? 'Speaker on' : 'Speaker'}</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.tip}>
            {isRemote
              ? ringingByOther
                ? 'Tap Accept to join. Timer syncs from Firestore.'
                : phase === 'connected'
                  ? 'Connected — timer synced on both phones (simulated audio).'
                  : 'Waiting for the other phone… (both see this state)'
              : phase === 'connecting'
                ? 'Ringing… (vibration simulated)'
                : muted
                  ? 'You are muted (simulated).'
                  : 'Talk! This is a mock call for the demo.'}
          </Text>
        </>
      ) : (
        <Text style={styles.tip}>Call ended. Returning…</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: '#191932',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  sim: {
    color: '#FFD38A',
    fontWeight: '800',
    fontSize: 11,
    marginBottom: 20,
    backgroundColor: 'rgba(255,211,138,0.15)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    textAlign: 'center',
  },
  name: { color: '#fff', fontSize: 26, fontWeight: '900', marginTop: 16 },
  status: { color: '#fff', fontSize: 18, fontWeight: '700', marginTop: 6 },
  sub: { color: 'rgba(255,255,255,0.7)', marginTop: 6, fontWeight: '600' },
  accept: {
    backgroundColor: '#22C55E',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 26,
    marginTop: 18,
  },
  acceptText: { color: '#fff', fontWeight: '900', fontSize: 15 },
  controls: { flexDirection: 'row', alignItems: 'center', marginTop: 32, gap: 24 },
  ctrl: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctrlActive: { backgroundColor: 'rgba(255,255,255,0.28)' },
  ctrlIcon: { fontSize: 24 },
  ctrlLabel: { color: '#fff', fontSize: 11, fontWeight: '700', marginTop: 2 },
  end: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: '#E11D48',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '135deg' }],
  },
  endIcon: { fontSize: 30 },
  tip: { color: 'rgba(255,255,255,0.7)', marginTop: 28, textAlign: 'center' },
});
