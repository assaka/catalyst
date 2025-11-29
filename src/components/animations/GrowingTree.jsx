import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

const GrowingTree = ({
  className,
  autoPlay = true,
  duration = 4000,
  trunkColor = '#8B4513',
  leafColor = '#228B22',
  groundColor = '#654321',
  onComplete
}) => {
  const [isGrowing, setIsGrowing] = useState(autoPlay);

  useEffect(() => {
    if (isGrowing && onComplete) {
      const timer = setTimeout(() => {
        onComplete();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isGrowing, duration, onComplete]);

  const restart = () => {
    setIsGrowing(false);
    setTimeout(() => setIsGrowing(true), 50);
  };

  return (
    <div className={cn("relative w-full max-w-md mx-auto", className)}>
      <svg
        viewBox="0 0 400 400"
        className="w-full h-auto"
        style={{ overflow: 'visible' }}
      >
        <defs>
          {/* Gradient for trunk */}
          <linearGradient id="trunkGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={trunkColor} stopOpacity="0.8" />
            <stop offset="50%" stopColor={trunkColor} />
            <stop offset="100%" stopColor={trunkColor} stopOpacity="0.8" />
          </linearGradient>

          {/* Gradient for leaves */}
          <radialGradient id="leafGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={leafColor} stopOpacity="0.9" />
            <stop offset="100%" stopColor={leafColor} stopOpacity="0.6" />
          </radialGradient>

          {/* Filter for glow effect */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Ground */}
        <ellipse
          cx="200"
          cy="380"
          rx="120"
          ry="20"
          fill={groundColor}
          className={isGrowing ? 'animate-ground' : 'opacity-0'}
        />

        {/* Main trunk */}
        <path
          d="M200 380 Q200 300 200 250"
          stroke="url(#trunkGradient)"
          strokeWidth="20"
          fill="none"
          strokeLinecap="round"
          className={isGrowing ? 'animate-trunk' : ''}
          style={{
            strokeDasharray: 130,
            strokeDashoffset: isGrowing ? 0 : 130,
            transition: `stroke-dashoffset ${duration * 0.25}ms ease-out`,
          }}
        />

        {/* Left main branch */}
        <path
          d="M200 280 Q170 250 130 220"
          stroke="url(#trunkGradient)"
          strokeWidth="12"
          fill="none"
          strokeLinecap="round"
          style={{
            strokeDasharray: 100,
            strokeDashoffset: isGrowing ? 0 : 100,
            transition: `stroke-dashoffset ${duration * 0.2}ms ease-out ${duration * 0.2}ms`,
          }}
        />

        {/* Right main branch */}
        <path
          d="M200 280 Q230 250 270 220"
          stroke="url(#trunkGradient)"
          strokeWidth="12"
          fill="none"
          strokeLinecap="round"
          style={{
            strokeDasharray: 100,
            strokeDashoffset: isGrowing ? 0 : 100,
            transition: `stroke-dashoffset ${duration * 0.2}ms ease-out ${duration * 0.2}ms`,
          }}
        />

        {/* Upper trunk */}
        <path
          d="M200 250 Q200 200 200 160"
          stroke="url(#trunkGradient)"
          strokeWidth="14"
          fill="none"
          strokeLinecap="round"
          style={{
            strokeDasharray: 90,
            strokeDashoffset: isGrowing ? 0 : 90,
            transition: `stroke-dashoffset ${duration * 0.2}ms ease-out ${duration * 0.25}ms`,
          }}
        />

        {/* Upper left branch */}
        <path
          d="M200 200 Q160 170 120 150"
          stroke="url(#trunkGradient)"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          style={{
            strokeDasharray: 100,
            strokeDashoffset: isGrowing ? 0 : 100,
            transition: `stroke-dashoffset ${duration * 0.2}ms ease-out ${duration * 0.35}ms`,
          }}
        />

        {/* Upper right branch */}
        <path
          d="M200 200 Q240 170 280 150"
          stroke="url(#trunkGradient)"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          style={{
            strokeDasharray: 100,
            strokeDashoffset: isGrowing ? 0 : 100,
            transition: `stroke-dashoffset ${duration * 0.2}ms ease-out ${duration * 0.35}ms`,
          }}
        />

        {/* Top branch */}
        <path
          d="M200 160 Q200 120 200 100"
          stroke="url(#trunkGradient)"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          style={{
            strokeDasharray: 60,
            strokeDashoffset: isGrowing ? 0 : 60,
            transition: `stroke-dashoffset ${duration * 0.15}ms ease-out ${duration * 0.45}ms`,
          }}
        />

        {/* Small branches */}
        <g style={{
          opacity: isGrowing ? 1 : 0,
          transition: `opacity ${duration * 0.2}ms ease-out ${duration * 0.4}ms`,
        }}>
          <path d="M130 220 Q110 200 90 190" stroke={trunkColor} strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M130 220 Q120 240 100 250" stroke={trunkColor} strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M270 220 Q290 200 310 190" stroke={trunkColor} strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M270 220 Q280 240 300 250" stroke={trunkColor} strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M120 150 Q100 130 80 120" stroke={trunkColor} strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M120 150 Q110 170 90 180" stroke={trunkColor} strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M280 150 Q300 130 320 120" stroke={trunkColor} strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M280 150 Q290 170 310 180" stroke={trunkColor} strokeWidth="3" fill="none" strokeLinecap="round" />
        </g>

        {/* Leaf clusters */}
        <g filter="url(#glow)">
          {/* Bottom left leaves */}
          <g style={{
            transform: isGrowing ? 'scale(1)' : 'scale(0)',
            transformOrigin: '100px 230px',
            transition: `transform ${duration * 0.3}ms cubic-bezier(0.34, 1.56, 0.64, 1) ${duration * 0.5}ms`,
          }}>
            <ellipse cx="90" cy="200" rx="35" ry="30" fill="url(#leafGradient)" />
            <ellipse cx="70" cy="230" rx="30" ry="25" fill="url(#leafGradient)" />
            <ellipse cx="110" cy="250" rx="28" ry="24" fill="url(#leafGradient)" />
          </g>

          {/* Bottom right leaves */}
          <g style={{
            transform: isGrowing ? 'scale(1)' : 'scale(0)',
            transformOrigin: '300px 230px',
            transition: `transform ${duration * 0.3}ms cubic-bezier(0.34, 1.56, 0.64, 1) ${duration * 0.55}ms`,
          }}>
            <ellipse cx="310" cy="200" rx="35" ry="30" fill="url(#leafGradient)" />
            <ellipse cx="330" cy="230" rx="30" ry="25" fill="url(#leafGradient)" />
            <ellipse cx="290" cy="250" rx="28" ry="24" fill="url(#leafGradient)" />
          </g>

          {/* Middle left leaves */}
          <g style={{
            transform: isGrowing ? 'scale(1)' : 'scale(0)',
            transformOrigin: '80px 150px',
            transition: `transform ${duration * 0.3}ms cubic-bezier(0.34, 1.56, 0.64, 1) ${duration * 0.6}ms`,
          }}>
            <ellipse cx="70" cy="130" rx="32" ry="28" fill="url(#leafGradient)" />
            <ellipse cx="50" cy="160" rx="28" ry="24" fill="url(#leafGradient)" />
            <ellipse cx="90" cy="175" rx="26" ry="22" fill="url(#leafGradient)" />
          </g>

          {/* Middle right leaves */}
          <g style={{
            transform: isGrowing ? 'scale(1)' : 'scale(0)',
            transformOrigin: '320px 150px',
            transition: `transform ${duration * 0.3}ms cubic-bezier(0.34, 1.56, 0.64, 1) ${duration * 0.65}ms`,
          }}>
            <ellipse cx="330" cy="130" rx="32" ry="28" fill="url(#leafGradient)" />
            <ellipse cx="350" cy="160" rx="28" ry="24" fill="url(#leafGradient)" />
            <ellipse cx="310" cy="175" rx="26" ry="22" fill="url(#leafGradient)" />
          </g>

          {/* Top center leaves */}
          <g style={{
            transform: isGrowing ? 'scale(1)' : 'scale(0)',
            transformOrigin: '200px 80px',
            transition: `transform ${duration * 0.3}ms cubic-bezier(0.34, 1.56, 0.64, 1) ${duration * 0.7}ms`,
          }}>
            <ellipse cx="200" cy="70" rx="40" ry="35" fill="url(#leafGradient)" />
            <ellipse cx="170" cy="95" rx="30" ry="26" fill="url(#leafGradient)" />
            <ellipse cx="230" cy="95" rx="30" ry="26" fill="url(#leafGradient)" />
            <ellipse cx="200" cy="110" rx="35" ry="30" fill="url(#leafGradient)" />
          </g>

          {/* Extra top leaves for fullness */}
          <g style={{
            transform: isGrowing ? 'scale(1)' : 'scale(0)',
            transformOrigin: '200px 120px',
            transition: `transform ${duration * 0.25}ms cubic-bezier(0.34, 1.56, 0.64, 1) ${duration * 0.75}ms`,
          }}>
            <ellipse cx="150" cy="120" rx="25" ry="22" fill="url(#leafGradient)" />
            <ellipse cx="250" cy="120" rx="25" ry="22" fill="url(#leafGradient)" />
            <ellipse cx="130" cy="145" rx="22" ry="20" fill="url(#leafGradient)" />
            <ellipse cx="270" cy="145" rx="22" ry="20" fill="url(#leafGradient)" />
          </g>
        </g>

        {/* Small decorative elements - birds or particles */}
        <g style={{
          opacity: isGrowing ? 1 : 0,
          transition: `opacity ${duration * 0.2}ms ease-out ${duration * 0.85}ms`,
        }}>
          <circle cx="60" cy="80" r="3" fill={leafColor} opacity="0.6" className="animate-float" />
          <circle cx="340" cy="90" r="2" fill={leafColor} opacity="0.5" className="animate-float-delayed" />
          <circle cx="180" cy="50" r="2" fill={leafColor} opacity="0.4" className="animate-float" />
        </g>
      </svg>

      {/* Replay button */}
      <button
        onClick={restart}
        className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors shadow-lg"
      >
        Replay Animation
      </button>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }

        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }

        @keyframes ground-appear {
          0% { transform: scaleX(0); opacity: 0; }
          100% { transform: scaleX(1); opacity: 1; }
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .animate-float-delayed {
          animation: float-delayed 4s ease-in-out infinite 1s;
        }

        .animate-ground {
          animation: ground-appear 0.5s ease-out forwards;
          transform-origin: center;
        }
      `}</style>
    </div>
  );
};

export default GrowingTree;
