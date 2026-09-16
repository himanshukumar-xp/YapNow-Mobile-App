import React, { createContext, useContext, useEffect, useState } from 'react';
import { loadUser, saveUser, clearUser, getOrCreateDeviceId } from '../utils/storage';

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeMatch, setActiveMatch] = useState(null);
  const [deviceId, setDeviceId] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [saved, did] = await Promise.all([loadUser(), getOrCreateDeviceId()]);
        if (saved) setUser(saved);
        setDeviceId(did);
      } catch (e) {
        console.log('loadUser error', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const saveProfile = async (profile) => {
    const full = { id: 'me', ...profile, createdAt: Date.now() };
    await saveUser(full);
    setUser(full);
  };

  const logout = async () => {
    await clearUser();
    setUser(null);
    setActiveMatch(null);
  };

  return (
    <UserContext.Provider
      value={{ user, setUser, loading, saveProfile, logout, activeMatch, setActiveMatch, deviceId }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
