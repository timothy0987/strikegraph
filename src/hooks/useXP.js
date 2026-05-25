import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { db } from '../firebase';
import { ref, set } from 'firebase/database';
import { useHederaNativeId } from './useHederaNativeId';

export const useXP = () => {
  const { address } = useAccount();
  const [xp, setXp] = useState(0);

  const { nativeId } = useHederaNativeId(address);
  const storageKey = address ? `strikegraph_xp_${address}` : null;

  useEffect(() => {
    if (storageKey) {
      const savedXp = localStorage.getItem(storageKey);
      if (savedXp) {
        setXp(parseInt(savedXp, 10));
      } else {
        setXp(0);
      }
    }
  }, [storageKey]);

  const addXP = (amount) => {
    if (!storageKey) return;
    const newXp = xp + amount;
    setXp(newXp);
    localStorage.setItem(storageKey, newXp.toString());

    // Sync to Firebase (sanitize dots to underscores for paths)
    if (nativeId) {
      const safeNativeId = nativeId.replace(/\./g, '_');
      set(ref(db, 'leaderboard/' + safeNativeId), newXp);
    }
  };

  return { xp, addXP };
};
