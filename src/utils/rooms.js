// Firestore rooms backend for 2-phone chat + synced call UI.
// Model:
//   rooms/{CODE} -> { createdAt, createdByDeviceId, createdByName, members[], lastMessage, updatedAt, call: {state, byDeviceId, byName, at} }
//   rooms/{CODE}/messages/{id} -> { senderId, senderName, text, createdAt (server), clientTs }

import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

export function newRoomCode() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export function normalizeCode(raw) {
  return String(raw || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
}

export async function createRoom({ deviceId, name }) {
  const code = newRoomCode();
  const ref = doc(db, 'rooms', code);
  await setDoc(ref, {
    createdAt: serverTimestamp(),
    createdByDeviceId: deviceId,
    createdByName: name,
    members: [{ deviceId, name, joinedAt: Date.now() }],
    lastMessage: '',
    updatedAt: Date.now(),
    call: { state: 'idle', byDeviceId: '', byName: '', at: 0 },
  });
  return code;
}

export async function joinRoom({ code, deviceId, name }) {
  const clean = normalizeCode(code);
  if (clean.length !== 6) throw new Error('Room code must be 6 characters.');
  const ref = doc(db, 'rooms', clean);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Room not found. Check the code.');
  const data = snap.data();
  const members = Array.isArray(data.members) ? [...data.members] : [];
  if (!members.some((m) => m.deviceId === deviceId)) {
    members.push({ deviceId, name, joinedAt: Date.now() });
    await updateDoc(ref, { members, updatedAt: Date.now() });
  }
  return { code: clean, data: { ...data, members } };
}

export function subscribeRoom(code, cb, onError) {
  const ref = doc(db, 'rooms', normalizeCode(code));
  return onSnapshot(ref, (snap) => cb(snap.exists() ? { code, ...snap.data() } : null), onError);
}

export function subscribeMessages(code, cb, onError) {
  const col = collection(db, 'rooms', normalizeCode(code), 'messages');
  const q = query(col, orderBy('createdAt', 'asc'));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => {
        const v = d.data();
        return {
          id: d.id,
          senderId: v.senderId,
          senderName: v.senderName,
          text: v.text,
          // serverTimestamp may be null on first render — fallback to clientTs
          ts: v.createdAt?.toMillis ? v.createdAt.toMillis() : v.clientTs || Date.now(),
        };
      });
      cb(list);
    },
    onError
  );
}

export async function sendRoomMessage({ code, deviceId, name, text }) {
  const clean = normalizeCode(code);
  const col = collection(db, 'rooms', clean, 'messages');
  const body = text.trim().slice(0, 500);
  if (!body) return;
  await addDoc(col, {
    senderId: deviceId,
    senderName: name,
    text: body,
    createdAt: serverTimestamp(),
    clientTs: Date.now(),
  });
  await updateDoc(doc(db, 'rooms', clean), {
    lastMessage: body.slice(0, 80),
    updatedAt: Date.now(),
  });
}

export async function setCallState({ code, state, deviceId, name }) {
  await updateDoc(doc(db, 'rooms', normalizeCode(code)), {
    call: { state, byDeviceId: deviceId, byName: name, at: Date.now() },
    updatedAt: Date.now(),
  });
}

// Build a remote activeMatch object compatible with Chat/Call screens
export function remoteMatch({ code, peerName = 'Partner', members = [], deviceId }) {
  const others = members.filter((m) => m.deviceId !== deviceId);
  const peer = {
    id: others[0]?.deviceId || 'remote-peer',
    name: others[0]?.name || peerName,
    age: '',
    location: `Room ${code}`,
    languages: [],
    interests: [],
    bio: 'Connected via private room code.',
    color: '#0EA5E9',
  };
  return {
    id: `room_${code}`,
    isRemote: true,
    roomCode: code,
    peer,
    sharedInterests: [],
    sharedLanguages: [],
    sameCity: 0,
    score: 0,
    createdAt: Date.now(),
  };
}
