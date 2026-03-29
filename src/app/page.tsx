'use client';

import { useState, useEffect, useCallback } from 'react';
import SplashScreen from '@/components/SplashScreen';
import HomePage from '@/components/home/HomePage';

export default function Page() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Ne montrer le splash qu'une fois par session
    const seen = sessionStorage.getItem('flatearth_splash');
    if (seen) setShowSplash(false);
  }, []);

  const handleSplashComplete = useCallback(() => {
    sessionStorage.setItem('flatearth_splash', '1');
    setShowSplash(false);
  }, []);

  return (
    <>
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
      {!showSplash && <HomePage />}
    </>
  );
}
