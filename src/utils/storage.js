import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_KEY = 'yapnow_user_v1';
const HISTORY_KEY = 'yapnow_history_v1';
const DEVICE_KEY = 'yapnow_device_id_v1';
const chatKey = (matchId) => `yapnow_chat_${matchId}`;

export async function getOrCreateDeviceId() {
  const existing = await AsyncStorage.getItem(DEVICE_KEY);
  if (existing) return existing;
  const fresh = `d_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  await AsyncStorage.setItem(DEVICE_KEY, fresh);
  return fresh;
}

export async function saveUser(user) {
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
}

export async function loadUser() {
  const raw = await AsyncStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function clearUser() {
  await AsyncStorage.removeItem(USER_KEY);
}

export async function saveMessages(matchId, messages) {
  await AsyncStorage.setItem(chatKey(matchId), JSON.stringify(messages));
}

export async function loadMessages(matchId) {
  const raw = await AsyncStorage.getItem(chatKey(matchId));
  return raw ? JSON.parse(raw) : [];
}

export async function loadHistory() {
  const raw = await AsyncStorage.getItem(HISTORY_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function saveHistoryItem(item) {
  const prev = await loadHistory();
  const next = [item, ...prev.filter((x) => x.peer.id !== item.peer.id)].slice(0, 20);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(next));
}
