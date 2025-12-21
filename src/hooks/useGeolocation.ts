import { useState, useCallback } from 'react';

export const useGeolocation = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCurrentPosition = useCallback((): Promise<[number, number]> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('浏览器不支持定位'));
        return;
      }

      setIsLoading(true);
      setError(null);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setIsLoading(false);
          resolve([position.coords.latitude, position.coords.longitude]);
        },
        (err) => {
          setIsLoading(false);
          const errorMessage = err.message || '定位失败';
          setError(errorMessage);
          reject(err);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    });
  }, []);

  return { getCurrentPosition, isLoading, error };
};




