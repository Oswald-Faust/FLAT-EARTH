'use client';

import { useEffect, useRef, useState } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
}

interface Star {
  width: number;
  height: number;
  left: number;
  top: number;
  opacity: number;
  duration: number;
  delay: number;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [phase, setPhase] = useState<'loading' | 'fadeout'>('loading');
  const [progress, setProgress] = useState(0);
  const [stars, setStars] = useState<Star[]>([]);
  // Ref pour éviter que le changement de référence de onComplete ne relance les timers
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    // Générer les étoiles côté client uniquement (évite hydration mismatch)
    setStars(
      Array.from({ length: 80 }).map(() => ({
        width: Math.random() * 2 + 1,
        height: Math.random() * 2 + 1,
        left: Math.random() * 100,
        top: Math.random() * 100,
        opacity: Math.random() * 0.7 + 0.3,
        duration: Math.random() * 3 + 2,
        delay: Math.random() * 3,
      }))
    );
  }, []);

  useEffect(() => {
    // Progression du chargement
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          return 100;
        }
        return p + 2;
      });
    }, 50);

    // Fade out après 3.2s
    const fadeTimer = setTimeout(() => setPhase('fadeout'), 3200);

    // Transition complète après 3.8s
    const doneTimer = setTimeout(() => onCompleteRef.current(), 3800);

    return () => {
      clearInterval(interval);
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        background: 'radial-gradient(ellipse at center, #1a2060 0%, #0d1035 50%, #070b22 100%)',
        opacity: phase === 'fadeout' ? 0 : 1,
        transition: 'opacity 0.6s ease',
        pointerEvents: phase === 'fadeout' ? 'none' : 'auto',
      }}
    >
      {/* Étoiles de fond */}
      <div className="absolute inset-0 overflow-hidden">
        {stars.map((star, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: `${star.width}px`,
              height: `${star.height}px`,
              left: `${star.left}%`,
              top: `${star.top}%`,
              opacity: star.opacity,
              animation: `pulse ${star.duration}s ease-in-out infinite`,
              animationDelay: `${star.delay}s`,
            }}
          />
        ))}
      </div>

      <div className="relative flex flex-col items-center gap-10">
        {/* Système solaire Terre plate */}
        <div
          className="relative flex items-center justify-center"
          style={{ width: 300, height: 300 }}
        >
          {/* Orbite (ellipse) */}
          <div
            className="absolute"
            style={{
              width: 260,
              height: 100,
              border: '1.5px solid rgba(255,255,255,0.15)',
              borderRadius: '50%',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              boxShadow: '0 0 20px rgba(255,215,0,0.1)',
            }}
          />

          {/* Terre plate — centre fixe */}
          <div
            className="absolute z-10"
            style={{
              width: 140,
              height: 70,
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              animation: 'float 4s ease-in-out infinite',
            }}
          >
            <FlatEarthSVG />
          </div>

          {/* Soleil sur orbite */}
          <div
            className="absolute"
            style={{
              width: 26,
              height: 26,
              top: '50%',
              left: '50%',
              marginTop: -13,
              marginLeft: -13,
              animation: 'orbitSun 5s linear infinite',
              transformOrigin: '0 0',
            }}
          >
            <SunSVG />
          </div>

          {/* Lune sur orbite (décalée de 180°) */}
          <div
            className="absolute"
            style={{
              width: 20,
              height: 20,
              top: '50%',
              left: '50%',
              marginTop: -10,
              marginLeft: -10,
              animation: 'orbitMoon 5s linear infinite',
              transformOrigin: '0 0',
            }}
          >
            <MoonSVG />
          </div>
        </div>

        {/* Logo + texte */}
        <div className="flex flex-col items-center gap-3" style={{ animation: 'fadeInUp 0.8s ease 0.3s both' }}>
          <h1
            className="text-4xl font-black tracking-widest uppercase"
            style={{ color: '#fff', letterSpacing: '0.3em', textShadow: '0 0 30px rgba(0,230,118,0.5)' }}
          >
            FLATEARTH
          </h1>
          <p style={{ color: '#8892c4', fontSize: 14, letterSpacing: '0.15em' }}>
            Chargement de l&apos;univers...
          </p>
        </div>

        {/* Barre de progression */}
        <div
          className="rounded-full overflow-hidden"
          style={{ width: 200, height: 3, background: 'rgba(255,255,255,0.1)', animation: 'fadeInUp 0.8s ease 0.5s both' }}
        >
          <div
            className="h-full rounded-full transition-all duration-100"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #00e676, #4fc3f7)',
              boxShadow: '0 0 10px #00e676',
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes orbitSun {
          from { transform: rotate(0deg) translateX(130px) rotate(0deg); }
          to   { transform: rotate(360deg) translateX(130px) rotate(-360deg); }
        }
        @keyframes orbitMoon {
          from { transform: rotate(180deg) translateX(130px) rotate(-180deg); }
          to   { transform: rotate(540deg) translateX(130px) rotate(-540deg); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%,100% { transform: translate(-50%,-50%) translateY(0); }
          50%      { transform: translate(-50%,-50%) translateY(-8px); }
        }
        @keyframes pulse {
          0%,100% { opacity: 0.3; }
          50%      { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function FlatEarthSVG() {
  return (
    <svg viewBox="0 0 140 80" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 0 20px rgba(79,195,247,0.6))' }}>
      {/* Ombre dessous */}
      <ellipse cx="70" cy="72" rx="50" ry="6" fill="rgba(0,0,0,0.4)" />
      {/* Roche en dessous */}
      <path d="M30 55 Q70 70 110 55 L115 72 Q70 82 25 72 Z" fill="#5d3a1a" />
      <path d="M32 57 Q70 67 108 57 L110 65 Q70 75 30 65 Z" fill="#7a4d2a" />
      {/* Disque eau */}
      <ellipse cx="70" cy="42" rx="54" ry="18" fill="#1565c0" />
      {/* Continents */}
      <ellipse cx="70" cy="40" rx="52" ry="16" fill="#1976d2" />
      <path d="M45 35 Q52 28 62 32 Q70 28 76 33 Q82 30 88 35 Q84 42 76 40 Q70 44 62 40 Q52 44 45 35 Z" fill="#388e3c" />
      <path d="M88 33 Q96 32 100 38 Q96 44 88 42 Q84 38 88 33 Z" fill="#388e3c" />
      <path d="M50 40 Q56 44 60 42 Q58 48 50 46 Q46 44 50 40 Z" fill="#2e7d32" />
      {/* Bord blanc */}
      <ellipse cx="70" cy="42" rx="54" ry="18" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />
      {/* Reflet */}
      <ellipse cx="58" cy="36" rx="12" ry="4" fill="rgba(255,255,255,0.15)" transform="rotate(-15,58,36)" />
    </svg>
  );
}

function SunSVG() {
  return (
    <svg viewBox="0 0 26 26" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="sunGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff9c4" />
          <stop offset="40%" stopColor="#ffd700" />
          <stop offset="100%" stopColor="#ff6f00" />
        </radialGradient>
      </defs>
      {/* Halo */}
      <circle cx="13" cy="13" r="12" fill="rgba(255,200,0,0.15)" />
      <circle cx="13" cy="13" r="9" fill="rgba(255,200,0,0.2)" />
      {/* Corps */}
      <circle cx="13" cy="13" r="7" fill="url(#sunGrad)" style={{ filter: 'drop-shadow(0 0 6px #ffd700)' }} />
    </svg>
  );
}

function MoonSVG() {
  return (
    <svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="moonGrad" cx="40%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#b0bec5" />
        </radialGradient>
      </defs>
      {/* Croissant */}
      <circle cx="10" cy="10" r="8" fill="url(#moonGrad)" style={{ filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.8))' }} />
      <circle cx="14" cy="8" r="7" fill="#0d1035" />
    </svg>
  );
}
