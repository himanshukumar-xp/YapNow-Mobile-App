import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { COLORS, RADIUS, SHADOWS } from '../theme';
import MatchCard from '../components/MatchCard';
import PrimaryButton from '../components/PrimaryButton';
import IcebreakerCard from '../components/IcebreakerCard';
import ScreenHeader from '../components/ScreenHeader';
import { useUser } from '../context/UserContext';
import { matchReason } from '../utils/match';
import { getIcebreakerList } from '../utils/icebreakers';
import { saveHistoryItem } from '../utils/storage';

export default function MatchScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, activeMatch } = useUser();
  const [iceIndex, setIceIndex] = useState(0);

  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const starters = useMemo(() => {
    if (!user || !activeMatch) return [];
    return getIcebreakerList(user, activeMatch.peer, activeMatch, 5);
  }, [user, activeMatch]);

  if (!user || !activeMatch) {
    return (
      <View style={styles.emptyWrap}>
        <ScreenHeader title="YapNow" onBack={() => navigation.navigate('Home')} />
        <View style={styles.emptyContent}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyTitle}>No connection selected</Text>
          <Text style={styles.emptySub}>
            Return to home to connect with someone new.
          </Text>
          <PrimaryButton
            title="Back to Home"
            onPress={() => navigation.navigate('Home')}
            size="md"
            style={{ marginTop: 16 }}
          />
        </View>
      </View>
    );
  }

  const { peer } = activeMatch;
  const current = starters.length ? starters[iceIndex % starters.length] : null;

  const goChat = async (withMessage) => {
    try {
      if (!activeMatch.isRemote) await saveHistoryItem(activeMatch);
    } catch {}
    navigation.navigate('Chat', { initialMessage: withMessage ? current?.text : undefined });
  };

  const goCall = async () => {
    try {
      if (!activeMatch.isRemote) await saveHistoryItem(activeMatch);
    } catch {}
    navigation.navigate('Call');
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={activeMatch.isRemote ? `Room ${activeMatch.roomCode}` : 'New Connection'}
        subtitle={activeMatch.isRemote ? 'Private Room' : 'Smart Match'}
        onBack={() => navigation.navigate('Home')}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom + 24, 40) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          }}
        >
          {/* Header Banner */}
          <View style={styles.bannerWrap}>
            {activeMatch.isRemote ? (
              <View style={styles.roomBanner}>
                <View style={styles.kickerBadge}>
                  <Text style={styles.kickerBadgeText}>🔑 PRIVATE ROOM</Text>
                </View>
                <Text style={styles.roomCodeDisplay}>{activeMatch.roomCode}</Text>
                <Text style={styles.reasonText}>
                  Share this code with the other phone to join and chat in realtime.
                </Text>
              </View>
            ) : (
              <View style={styles.matchBanner}>
                <View style={styles.celebrateBadge}>
                  <Text style={styles.celebrateBadgeText}>🎉 IT'S A MATCH</Text>
                </View>
                <Text style={styles.reasonText}>
                  {matchReason(activeMatch)}
                </Text>
              </View>
            )}
          </View>

          {/* Peer Card */}
          <MatchCard
            peer={peer}
            sharedInterests={activeMatch.sharedInterests}
            sharedLanguages={activeMatch.sharedLanguages}
          />

          {/* AI Icebreaker Card */}
          <View style={styles.icebreakerWrap}>
            <IcebreakerCard
              item={current}
              onShuffle={() => setIceIndex((i) => i + 1)}
              onUse={() => goChat(true)}
            />
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonGroup}>
            <PrimaryButton
              title="💬  Start Chat"
              onPress={() => goChat(false)}
              size="lg"
            />

            <PrimaryButton
              title={
                activeMatch.isRemote
                  ? '📞  Voice Call (synced)'
                  : '📞  Voice Call (simulated)'
              }
              onPress={goCall}
              variant="secondary"
              size="lg"
            />

            <PrimaryButton
              title={activeMatch.isRemote ? 'Back to Home' : '🔀  Meet Someone Else'}
              onPress={() => navigation.navigate('Home')}
              variant="ghost"
              size="md"
            />
          </View>
        </Animated.View>
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
    paddingTop: 16,
  },
  bannerWrap: {
    alignItems: 'center',
    marginBottom: 16,
  },
  matchBanner: {
    alignItems: 'center',
  },
  roomBanner: {
    alignItems: 'center',
  },
  celebrateBadge: {
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderRadius: RADIUS.full,
    marginBottom: 8,
  },
  celebrateBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  kickerBadge: {
    backgroundColor: '#DBEAFE',
    borderWidth: 1,
    borderColor: '#93C5FD',
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderRadius: RADIUS.full,
    marginBottom: 8,
  },
  kickerBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primaryDark,
    letterSpacing: 0.5,
  },
  roomCodeDisplay: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.primaryDark,
    letterSpacing: 3,
    marginBottom: 4,
  },
  reasonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  icebreakerWrap: {
    marginTop: 6,
    marginBottom: 10,
  },
  buttonGroup: {
    marginTop: 6,
    paddingBottom: 10,
  },
  emptyWrap: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  emptyContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  emptySub: {
    fontSize: 14,
    color: COLORS.muted,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
});
