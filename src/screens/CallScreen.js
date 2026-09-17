import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Vibration,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { COLORS, RADIUS } from '../theme';
import Avatar from '../components/Avatar';
import { useUser } from '../context/UserContext';
import { subscribeRoom, setCallState } from '../utils/rooms';

function fmt(sec) {
  const m = String(Math.floor(sec / 60)).padStart(2, '0');
  const s = String(sec % 60).padStart(2, '0');
  return `${m}:${s}`;
}

export default function CallScreen({ navigation }) {
  const insets = useSafeAreaInsets();
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

  // Pulse animation for ringing
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (phase === 'connecting' || phase === 'ringing') {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.18,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 900,
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [phase]);

  // Mock (single-phone) behavior
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

  // Remote (2-phone) signaling via Firestore
  useEffect(() => {
    if (!activeMatch || !isRemote || !roomCode) return;
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
        <Text style={{ color: '#FFFFFF' }}>No active call.</Text>
      </View>
    );
  }

  const accept = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    if (!isRemote) {
      setPhase('connected');
      connectedAt.current = Date.now();
      return;
    }
    setCallState({
      code: roomCode,
      state: 'connected',
      deviceId,
      name: user?.name || 'Partner',
    }).catch(() => {});
  };

  const end = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    if (isRemote) {
      setCallState({
        code: roomCode,
        state: 'ended',
        deviceId,
        name: user?.name || 'Partner',
      }).catch(() => {});
    }
    setPhase('ended');
    setTimeout(() => navigation.goBack(), 1200);
  };

  const toggleMute = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setMuted((m) => !m);
  };

  const toggleSpeaker = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setSpeaker((s) => !s);
  };

  const { peer } = activeMatch;
  const ringingByOther = isRemote && remoteCall?.state === 'ringing' && remoteCall?.byDeviceId !== deviceId;

  return (
    <View
      style={[
        styles.wrap,
        {
          paddingTop: Math.max(insets.top + 10, 24),
          paddingBottom: Math.max(insets.bottom + 20, 36),
        },
      ]}
    >
      {/* Top Bar with Minimize Action */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={styles.backBtnArrow}>‹</Text>
        </TouchableOpacity>

        <View style={styles.badgePill}>
          <Text style={styles.badgePillText}>
            {isRemote ? `SYNCED ROOM ${roomCode}` : 'SIMULATED VOICE CALL'}
          </Text>
        </View>

        <View style={styles.topPlaceholder} />
      </View>

      {/* Center Avatar & Identity Area */}
      <View style={styles.centerArea}>
        <View style={styles.avatarPulsingWrap}>
          {(phase === 'connecting' || phase === 'ringing') && (
            <Animated.View
              style={[
                styles.pulseRing,
                {
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            />
          )}

          <Avatar
            name={peer.name}
            color={peer.color || COLORS.primary}
            size={108}
            showStatus={phase === 'connected'}
            isOnline={phase === 'connected'}
          />
        </View>

        <Text style={styles.name}>{peer.name}</Text>

        {/* Status indicator */}
        <View style={styles.statusRow}>
          {phase === 'connected' && <View style={styles.activeDot} />}
          <Text style={styles.statusText}>
            {phase === 'connecting' || phase === 'ringing'
              ? ringingByOther
                ? `Incoming call from ${remoteCall.byName || 'partner'}…`
                : 'Ringing…'
              : phase === 'connected'
              ? fmt(seconds)
              : `Ended · ${fmt(seconds)}`}
          </Text>
        </View>

        <Text style={styles.subInfo}>
          {isRemote
            ? `Firebase Synced · Room ${roomCode}`
            : `📍 ${peer.location} · 🗣 ${activeMatch.sharedLanguages[0] || peer.languages[0] || 'English'}`}
        </Text>
      </View>

      {/* Accept incoming call button */}
      {phase !== 'ended' && ringingByOther && (
        <View style={styles.acceptWrap}>
          <TouchableOpacity
            style={styles.acceptBtn}
            onPress={accept}
            activeOpacity={0.8}
          >
            <Text style={styles.acceptBtnText}>📞  Accept Incoming Call</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Bottom Controls Bar */}
      {phase !== 'ended' ? (
        <View style={styles.controlsBar}>
          {/* Mute Toggle */}
          <TouchableOpacity
            style={[styles.ctrlBtn, muted && styles.ctrlBtnActive]}
            onPress={toggleMute}
            activeOpacity={0.7}
          >
            <Text style={styles.ctrlIcon}>{muted ? '🔇' : '🎙'}</Text>
            <Text style={styles.ctrlLabel}>{muted ? 'Unmute' : 'Mute'}</Text>
          </TouchableOpacity>

          {/* End Call Button */}
          <TouchableOpacity
            style={styles.endBtn}
            onPress={end}
            activeOpacity={0.8}
          >
            <Text style={styles.endIcon}>📞</Text>
          </TouchableOpacity>

          {/* Speaker Toggle */}
          <TouchableOpacity
            style={[styles.ctrlBtn, speaker && styles.ctrlBtnActive]}
            onPress={toggleSpeaker}
            activeOpacity={0.7}
          >
            <Text style={styles.ctrlIcon}>{speaker ? '🔊' : '🔈'}</Text>
            <Text style={styles.ctrlLabel}>{speaker ? 'Speaker On' : 'Speaker'}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.endedWrap}>
          <Text style={styles.endedText}>Call ended. Returning to chat…</Text>
        </View>
      )}

      {/* Informative footer tip */}
      <View style={styles.footerTipWrap}>
        <Text style={styles.footerTipText}>
          {isRemote
            ? 'State and timer are synced across both phones via Firebase.'
            : 'Simulated voice call demo interface with audio feedback.'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: COLORS.darkBg,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.darkSurfaceGlass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnArrow: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '300',
    marginTop: -2,
  },
  badgePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: RADIUS.full,
  },
  badgePillText: {
    color: '#FDE047',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  topPlaceholder: {
    width: 40,
  },
  centerArea: {
    alignItems: 'center',
    width: '100%',
  },
  avatarPulsingWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  pulseRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: 'rgba(99, 102, 241, 0.35)',
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
  },
  name: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
    marginRight: 8,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  subInfo: {
    fontSize: 13,
    color: COLORS.darkTextMuted,
    marginTop: 6,
    fontWeight: '500',
  },
  acceptWrap: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  acceptBtn: {
    backgroundColor: COLORS.success,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: RADIUS.full,
    flexDirection: 'row',
    alignItems: 'center',
  },
  acceptBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  controlsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
    width: '100%',
  },
  ctrlBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: COLORS.darkSurfaceGlass,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctrlBtnActive: {
    backgroundColor: COLORS.darkSurfaceActive,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  ctrlIcon: {
    fontSize: 22,
  },
  ctrlLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 3,
  },
  endBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: COLORS.danger,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '135deg' }],
  },
  endIcon: {
    fontSize: 28,
    color: '#FFFFFF',
  },
  endedWrap: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  endedText: {
    color: COLORS.darkTextMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  footerTipWrap: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  footerTipText: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
});
