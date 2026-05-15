import { useState, useEffect } from 'react';

export const useHederaNativeId = (address) => {
  const [nativeId, setNativeId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!address) {
      setNativeId(null);
      return;
    }

    const fetchNativeId = async () => {
      setLoading(true);
      try {
        const response = await fetch(`https://testnet.mirrornode.hedera.com/api/v1/accounts/${address}`);
        if (response.ok) {
          const data = await response.json();
          setNativeId(data.account);
        } else {
          console.error('Failed to fetch native ID');
          setNativeId(null);
        }
      } catch (error) {
        console.error('Error fetching native ID:', error);
        setNativeId(null);
      } finally {
        setLoading(false);
      }
    };

    fetchNativeId();
  }, [address]);

  return { nativeId, loading };
};
