import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';

export const useXP = () => {
  const { address } = useAccount();
  const [xp, setXp] = useState(0);

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
  };

  return { xp, addXP };
};
