import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS } from '../theme';

export default function PrimaryButton({ title, onPress, variant = 'primary', loading = false, disabled = false }) {
  const isSecondary = variant === 'secondary';
  return (
    <TouchableOpacity
      style={[
        styles.btn,
        isSecondary ? styles.secondary : styles.primary,
        disabled && styles.disabled,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator color={isSecondary ? COLORS.primary : '#fff'} />
      ) : (
        <Text style={[styles.text, isSecondary ? styles.textSecondary : styles.textPrimary]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderRadius: 16,
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
  },
  primary: { backgroundColor: COLORS.primary },
  secondary: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  disabled: { opacity: 0.5 },
  text: { fontSize: 16, fontWeight: '700' },
  textPrimary: { color: '#fff' },
  textSecondary: { color: COLORS.primary },
});
