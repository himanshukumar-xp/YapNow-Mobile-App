import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { COLORS, RADIUS, SHADOWS } from '../theme';
import { LANGUAGES, INTERESTS, LOCATIONS } from '../data/options';
import { Chip } from '../components/Chips';
import PrimaryButton from '../components/PrimaryButton';
import { useUser } from '../context/UserContext';

const QUICK_PROFILES = [
  { name: 'Himanshu', location: 'Delhi', languages: ['English', 'Hindi'], interests: ['Coding', 'Cricket', 'Music'] },
  { name: 'Aarav', location: 'Bangalore', languages: ['English', 'Hinglish'], interests: ['Coding', 'Gaming', 'Food'] },
  { name: 'Ananya', location: 'Mumbai', languages: ['English', 'Hindi'], interests: ['Travel', 'Cinema', 'Photography'] },
  { name: 'Rohan', location: 'Pune', languages: ['English', 'Hindi'], interests: ['Music', 'Books', 'Yoga'] },
];

export default function OnboardingScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, saveProfile } = useUser();

  const [name, setName] = useState(user?.name || '');
  const [location, setLocation] = useState(user?.location || 'Delhi');
  const [languages, setLanguages] = useState(user?.languages || ['English']);
  const [interests, setInterests] = useState(user?.interests || []);
  const [isFocused, setIsFocused] = useState(false);
  const [saving, setSaving] = useState(false);

  const isEditing = !!user;

  const toggle = (list, setList, item) => {
    if (list.includes(item)) {
      setList(list.filter((x) => x !== item));
    } else {
      setList([...list, item]);
    }
  };

  const handleQuickFill = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const randomProfile = QUICK_PROFILES[Math.floor(Math.random() * QUICK_PROFILES.length)];
    setName(randomProfile.name);
    setLocation(randomProfile.location);
    setLanguages(randomProfile.languages);
    setInterests(randomProfile.interests);
  };

  const handleContinue = async () => {
    if (name.trim().length < 2) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      Alert.alert('Name required', 'Please enter your name (at least 2 characters).');
      return;
    }
    if (languages.length === 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      Alert.alert('Select a language', 'Pick at least 1 language you are comfortable speaking.');
      return;
    }
    if (interests.length === 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      Alert.alert('Pick an interest', 'Select at least 1 passion so we can find great matches.');
      return;
    }

    setSaving(true);
    try {
      await saveProfile({
        name: name.trim(),
        location,
        languages,
        interests,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      if (isEditing) {
        navigation.goBack();
      } else {
        navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
      }
    } catch (e) {
      Alert.alert('Error', 'Could not save your profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: Math.max(insets.top + 16, 28), paddingBottom: Math.max(insets.bottom + 32, 40) },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>
                  {isEditing ? 'EDIT PROFILE' : 'QUICK SETUP'}
                </Text>
              </View>
              {!isEditing && (
                <TouchableOpacity
                  style={styles.quickFillBtn}
                  onPress={handleQuickFill}
                  activeOpacity={0.7}
                >
                  <Text style={styles.quickFillText}>⚡ Quick Fill Demo</Text>
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.title}>
              {isEditing ? 'Update your profile 👤' : 'Welcome to YapNow 👋'}
            </Text>
            <Text style={styles.subtitle}>
              {isEditing
                ? 'Make changes to your location, languages, or passions.'
                : 'Tell us a bit about yourself so we can introduce you to someone great.'}
            </Text>
          </View>

          {/* Name Section */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.sectionLabel}>Your Name</Text>
              <Text style={styles.charCount}>{name.length}/30</Text>
            </View>
            <View
              style={[
                styles.inputWrapper,
                isFocused && styles.inputWrapperFocused,
              ]}
            >
              <TextInput
                style={styles.input}
                placeholder="e.g. Himanshu"
                placeholderTextColor={COLORS.textMuted}
                value={name}
                onChangeText={setName}
                maxLength={30}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                returnKeyType="done"
              />
              {name.length > 0 && (
                <TouchableOpacity
                  onPress={() => setName('')}
                  style={styles.clearBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.clearBtnText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Location Section */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.sectionLabel}>Location</Text>
              <Text style={styles.selectedCount}>Current: {location}</Text>
            </View>
            <View style={styles.chipGrid}>
              {LOCATIONS.map((c) => (
                <Chip
                  key={c}
                  label={c}
                  selected={location === c}
                  onPress={() => setLocation(c)}
                />
              ))}
            </View>
          </View>

          {/* Languages Section */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.sectionLabel}>Languages you speak</Text>
              <Text style={styles.selectedCount}>
                {languages.length} selected
              </Text>
            </View>
            <View style={styles.chipGrid}>
              {LANGUAGES.map((l) => (
                <Chip
                  key={l}
                  label={l}
                  selected={languages.includes(l)}
                  onPress={() => toggle(languages, setLanguages, l)}
                />
              ))}
            </View>
          </View>

          {/* Interests Section */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.sectionLabel}>Interests & Passions</Text>
              <Text style={styles.selectedCount}>
                {interests.length} selected
              </Text>
            </View>
            <Text style={styles.helperText}>
              We use these to match you with like-minded people and spark conversations.
            </Text>
            <View style={styles.chipGrid}>
              {INTERESTS.map((i) => (
                <Chip
                  key={i}
                  label={i}
                  selected={interests.includes(i)}
                  onPress={() => toggle(interests, setInterests, i)}
                />
              ))}
            </View>
          </View>

          {/* Action Button */}
          <View style={styles.actionWrap}>
            <PrimaryButton
              title={isEditing ? 'Save Changes' : 'Continue to YapNow →'}
              onPress={handleContinue}
              loading={saving}
              size="lg"
            />
            {isEditing && (
              <PrimaryButton
                title="Cancel"
                onPress={() => navigation.goBack()}
                variant="ghost"
                size="md"
              />
            )}
            <Text style={styles.privacyNote}>
              🔒 Stored locally on this device. No password or account setup required.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  header: {
    marginBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  stepBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: RADIUS.full,
  },
  stepBadgeText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  quickFillBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: RADIUS.full,
  },
  quickFillText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: -0.4,
  },
  subtitle: {
    color: COLORS.muted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.xl,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
  },
  charCount: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  selectedCount: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '700',
  },
  helperText: {
    fontSize: 13,
    color: COLORS.muted,
    lineHeight: 18,
    marginBottom: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSubtle,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
  },
  inputWrapperFocused: {
    borderColor: COLORS.primary,
    backgroundColor: '#FFFFFF',
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  clearBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtnText: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: '800',
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  actionWrap: {
    marginTop: 10,
    alignItems: 'center',
  },
  privacyNote: {
    textAlign: 'center',
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 12,
    lineHeight: 17,
  },
});
