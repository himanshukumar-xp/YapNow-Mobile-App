import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../theme';
import { useUser } from '../context/UserContext';

export default function SplashScreen({ navigation }) {
  const { user, loading } = useUser();

  useEffect(() => {
    if (loading) return;
    const t = setTimeout(() => {
      navigation.reset({
        index: 0,
        routes: [{ name: user ? 'Home' : 'Onboarding' }],
      });
    }, 900);
    return () => clearTimeout(t);
  }, [loading, user]);

  return (
    <View style={styles.wrap}>
      <View style={styles.logo}>
        <Text style={styles.logoText}>Yap</Text>
        <Text style={[styles.logoText, styles.logoAccent]}>Now</Text>
      </View>
      <Text style={styles.tag}>Talk to someone new, right now.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  logo: { flexDirection: 'row' },
  logoText: { fontSize: 52, fontWeight: '900', color: '#fff' },
  logoAccent: { color: '#FFD38A' },
  tag: { color: 'rgba(255,255,255,0.85)', marginTop: 8, fontSize: 15, fontWeight: '600' },
});
