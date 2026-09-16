# YapNow — Talk to Someone New, Right Now

Simple React Native (Expo + JavaScript) mobile app for onboarding, connecting two users, and 1-to-1 communication.

✅ Login / Onboarding (mock, no password)
✅ Connect to Random Person (12 mock users, smart-random matching)
✅ 1-to-1 Chat — single-phone mock + 2-phone realtime via Firebase
✅ Bonus: Voice Call — mock UI + 2-phone synced ringing/connected/ended via Firebase
✅ Optional AI: conversation starter / icebreaker from shared interests

Mobile only. Firebase Firestore backend for rooms. No website.

---

## Demo

- App: Expo Go (`npx expo start`, scan QR)
- Single-phone flow (90 sec):
  1. Onboarding → enter name, location, languages, interests → Continue
  2. Home → Connect to Random Person → wait 1.5s → Match screen
  3. Show match reason + AI starter → Shuffle → Use as first message
  4. Chat → send 2 messages → show typing + auto-reply
  5. Back → Voice Call → show connecting → timer → mute → end
- Two-phone flow (Firebase):
  1. Firebase Console → Firestore Database → Create database → Test mode
  2. `npx expo start` → open Expo Go on Phone A + Phone B
  3. Phone A onboard as Aarav → Home → Create Private Room → share code e.g. `KQ7X2P`
  4. Phone B onboard as Priya → Home → enter code → Join
  5. Both in Room Chat → send messages → appear realtime both sides
  6. A: Switch to voice call → B gets Incoming call alert → Accept → both timers sync → End

> Add your links here before submitting:
> - GitHub repo: `<!-- paste repo URL -->`
> - Demo video: `<!-- paste drive/youtube URL -->`

## Setup

Requires Node 22+, npm, Expo Go app on your Android/iPhone.

```bash
# 1. Clone
git clone <your-repo-url>
cd yapnow

# 2. Install (uses Expo SDK 57 pinned versions)
npm install

# 3. Run
npx expo start
# then press `a` for Android emulator, or scan QR with Expo Go

# 4. Reset demo data (optional)
# On device: Home → Log out. Or clear app storage.
```

Built and verified with:
- Expo ~57.0.23, React 19.2.3, React Native 0.86.3
- `@react-navigation/native-stack`, `async-storage`, `expo-haptics`, `firebase`
- `npx expo export --platform android` passes

See https://docs.expo.dev/versions/v57.0.0/ for the exact SDK version used.

## Firebase Setup (2-phone)

1. Console https://console.firebase.google.com → project `yapnow-5e2a3` → Build → Firestore Database → Create database → Test mode (any region).
2. Rules tab → paste contents of `firestore.rules` → Publish.
3. Config already in `src/utils/firebase.js` (no `getAnalytics` — crashes in RN, intentionally omitted).
4. No `google-services.json` needed — this uses the Firebase Web JS SDK which works in Expo Go.

Data model:
```
rooms/{CODE} { members[], lastMessage, call: { state, byDeviceId, byName, at } }
rooms/{CODE}/messages/{id} { senderId, senderName, text, createdAt, clientTs }
```

## How It Works

```
Splash → Onboarding → Home → Match → Chat / Call
```

| File | What |
|---|---|
| `src/data/mockUsers.js` | 12 mock users (name, languages, location, interests, bio) |
| `src/data/options.js` | Chip options for onboarding |
| `src/utils/match.js` | `findRandomMatch()` — scores by `sharedInterests×2 + sharedLang×1 + sameCity`, picks randomly among top-5 |
| `src/utils/icebreakers.js` | Local rule-based AI: interest → language → city → generic. Plus `getMockReply()` for simulated chat |
| `src/utils/storage.js` | AsyncStorage: `yapnow_user_v1`, `yapnow_device_id_v1`, `yapnow_chat_<matchId>`, `yapnow_history_v1` |
| `src/utils/firebase.js` | `initializeApp` + `getFirestore` (no analytics) |
| `src/utils/rooms.js` | `createRoom/joinRoom/subscribeMessages/sendRoomMessage/setCallState/remoteMatch` |
| `src/context/UserContext.js` | User session + `deviceId` + active match |
| `src/screens/` | Splash, Onboarding, Home (random + rooms), Match, Chat (mock + realtime), Call (mock + synced) |

### Matching example

User A (Hindi, Delhi, [Cricket, Music]) matches with mock pool → top scorers surface first, random pick among top-5 keeps "Random" honest but relevant. Reason shown: "You both love Cricket · speak Hindi".

### AI starter example

Shared `Coding` → "What are you building or learning in code right now?" with reason `Shared interest: Coding`. Shuffle gives 5 options. "Use as first message" sends it directly.

### Chat

- Mock mode: custom FlatList, persists per `matchId` in AsyncStorage, peer reply after 1.4s with typing indicator.
- Remote mode (`isRemote`): `onSnapshot(rooms/{code}/messages orderBy createdAt)` realtime, `sendRoomMessage()` with `serverTimestamp()+clientTs` fallback. Mock reply disabled.

### Voice call

- Mock mode: connecting → timer, mute/speaker, vibration, labelled `SIMULATED CALL`.
- Remote mode: synced via `rooms/{code}.call { state, byDeviceId, at }` — `ringing → connected → ended` visible on both phones, timer derived from `at`, labelled `SYNCED CALL — state is real, mic audio is simulated`. No WebRTC (would need dev-client + EAS, fails in Expo Go).

## Limitations (honest)

- Mock login only; identity = onboarding name + random `deviceId`.
- Remote call syncs state/timer, not real mic audio (chosen for Expo Go reliability).
- Firestore rules in `firestore.rules` are open (`allow read, write: if true`) for demo — lock with Auth for production.

## Project Structure

```
App.js
firestore.rules
src/
  theme.js
  navigation/AppNavigator.js
  context/UserContext.js
  data/mockUsers.js, options.js
  utils/match.js, icebreakers.js, storage.js, firebase.js, rooms.js
  components/PrimaryButton.js, Chips.js, Avatar.js, MatchCard.js, ChatBubble.js, IcebreakerCard.js
  screens/SplashScreen.js, OnboardingScreen.js, HomeScreen.js, MatchScreen.js, ChatScreen.js, CallScreen.js
```

## Submission Checklist

- [x] JavaScript + React Native (Expo managed, JS only)
- [x] Mobile app only
- [x] Login / onboarding completed
- [x] Connect two users
- [x] 1-to-1 Chat + bonus Voice Call
- [x] Optional AI starter
- [ ] GitHub repository link (paste above)
- [ ] Recording / demo video link (paste above)
- [x] README with setup + implementation notes
