// Firebase init for YapNow 2-phone realtime.
// NOTE: No getAnalytics here — it crashes in Expo Go / React Native.
// Web apiKey is public by design; lock down via Firestore rules + API restrictions.

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyCiuXzMRUIs4JPDGfbWmGot3rvtqKvCWqw',
  authDomain: 'yapnow-5e2a3.firebaseapp.com',
  projectId: 'yapnow-5e2a3',
  storageBucket: 'yapnow-5e2a3.firebasestorage.app',
  messagingSenderId: '574888529535',
  appId: '1:574888529535:web:aced50471f57eb0cb3f94a',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const db = getFirestore(app);
