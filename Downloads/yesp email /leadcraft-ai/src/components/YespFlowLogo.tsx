import React from "react";

export function YespFlowLogo({ className = "w-8 h-8", animated = false }: { className?: string; animated?: boolean }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} ${animated ? "animate-pulse-subtle" : ""}`}
    >
      <defs>
        <linearGradient id="yespFlowGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="50%" stopColor="#4F46E5" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
        <linearGradient id="yespFlowGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>
        <filter id="yespGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Outer rounded hexagon/shield base */}
      <rect x="8" y="8" width="84" height="84" rx="24" fill="url(#yespFlowGrad1)" />

      {/* Dynamic Flow Nodes & Interlocking Y-Paths */}
      <path
        d="M30 28 C45 28, 50 42, 50 52 L50 74"
        stroke="white"
        strokeWidth="9"
        strokeLinecap="round"
      />
      <path
        d="M70 28 C55 28, 50 42, 50 52"
        stroke="url(#yespFlowGrad2)"
        strokeWidth="9"
        strokeLinecap="round"
      />

      {/* Glowing AI Flow Node Orbs */}
      <circle cx="30" cy="28" r="6" fill="#FFFFFF" filter="url(#yespGlow)" />
      <circle cx="70" cy="28" r="6" fill="#93C5FD" filter="url(#yespGlow)" />
      <circle cx="50" cy="74" r="6" fill="#38BDF8" filter="url(#yespGlow)" />
      <circle cx="50" cy="48" r="4.5" fill="#FFFFFF" />
    </svg>
  );
}
