import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { COLORS } from '../theme';
import { useUser } from '../context/UserContext';

export default function SplashScreen({ navigation }) {
  const { user, loading } = useUser();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 7,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    if (loading) return;
    const t = setTimeout(() => {
      navigation.reset({
        index: 0,
        routes: [{ name: user ? 'Home' : 'Onboarding' }],
      });
    }, 1100);
    return () => clearTimeout(t);
  }, [loading, user]);

  return (
    <View style={styles.wrap}>
      <Animated.View
        style={[
          styles.centerBox,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.iconBadge}>
          <Text style={styles.iconEmoji}>💬</Text>
        </View>

        <View style={styles.logoRow}>
          <Text style={styles.logoText}>Yap</Text>
          <Text style={[styles.logoText, styles.logoAccent]}>Now</Text>
        </View>

        <Text style={styles.tagline}>Talk to someone new, right now.</Text>
      </Animated.View>

      <View style={styles.footer}>
        <View style={styles.pulseDot} />
        <Text style={styles.footerText}>Instant 1-to-1 audio & chat</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  centerBox: {
    alignItems: 'center',
  },
  iconBadge: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  iconEmoji: {
    fontSize: 34,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 46,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  logoAccent: {
    color: '#FDE047',
  },
  tagline: {
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 10,
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  footer: {
    position: 'absolute',
    bottom: 48,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: COLORS.success,
    marginRight: 8,
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 13,
    fontWeight: '600',
  },
});
