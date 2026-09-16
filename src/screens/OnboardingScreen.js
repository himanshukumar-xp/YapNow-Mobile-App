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
} from 'react-native';
import { COLORS } from '../theme';
import { LANGUAGES, INTERESTS, LOCATIONS } from '../data/options';
import { Chip } from '../components/Chips';
import PrimaryButton from '../components/PrimaryButton';
import { useUser } from '../context/UserContext';

export default function OnboardingScreen({ navigation }) {
  const { saveProfile } = useUser();
  const [name, setName] = useState('');
  const [location, setLocation] = useState('Delhi');
  const [languages, setLanguages] = useState(['English']);
  const [interests, setInterests] = useState([]);
  const [saving, setSaving] = useState(false);

  const toggle = (list, setList, item) => {
    if (list.includes(item)) setList(list.filter((x) => x !== item));
    else setList([...list, item]);
  };

  const handleContinue = async () => {
    if (name.trim().length < 2) {
      Alert.alert('Almost there', 'Please enter your name (min 2 characters).');
      return;
    }
    if (languages.length === 0) {
      Alert.alert('Pick a language', 'Select at least 1 language you speak.');
      return;
    }
    if (interests.length === 0) {
      Alert.alert('Pick an interest', 'Select at least 1 interest/passion.');
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
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    } catch (e) {
      Alert.alert('Error', 'Could not save profile. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.wrap} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Welcome to YapNow 👋</Text>
        <Text style={styles.sub}>Mock login + quick profile. No password needed for demo.</Text>

        <Text style={styles.label}>Your name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Himanshu"
          value={name}
          onChangeText={setName}
          maxLength={30}
        />

        <Text style={styles.label}>Location</Text>
        <View style={styles.chipWrap}>
          {LOCATIONS.map((c) => (
            <Chip key={c} label={c} selected={location === c} onPress={() => setLocation(c)} />
          ))}
        </View>

        <Text style={styles.label}>Languages you speak (pick 1+)</Text>
        <View style={styles.chipWrap}>
          {LANGUAGES.map((l) => (
            <Chip
              key={l}
              label={l}
              selected={languages.includes(l)}
              onPress={() => toggle(languages, setLanguages, l)}
            />
          ))}
        </View>

        <Text style={styles.label}>Interests / passions (pick 1+)</Text>
        <View style={styles.chipWrap}>
          {INTERESTS.map((i) => (
            <Chip
              key={i}
              label={i}
              selected={interests.includes(i)}
              onPress={() => toggle(interests, setInterests, i)}
            />
          ))}
        </View>

        <PrimaryButton title="Continue →" onPress={handleContinue} loading={saving} />
        <Text style={styles.hint}>Stored locally on device (AsyncStorage). No account needed.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: '900', color: COLORS.text, marginTop: 20 },
  sub: { color: COLORS.muted, marginTop: 6, marginBottom: 16, lineHeight: 20 },
  label: { fontWeight: '800', color: COLORS.text, marginTop: 16, marginBottom: 8, fontSize: 15 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 14,
    fontSize: 16,
    color: COLORS.text,
  },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap' },
  hint: { textAlign: 'center', color: COLORS.muted, fontSize: 12, marginTop: 10 },
});
