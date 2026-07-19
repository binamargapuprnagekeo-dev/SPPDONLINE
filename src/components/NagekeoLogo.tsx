import React from 'react';

interface NagekeoLogoProps {
  className?: string;
  size?: number;
}

export default function NagekeoLogo({ className = '', size = 56 }: NagekeoLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      id="nagekeo-logo-svg"
    >
      {/* Drop Shadow for modern container feels */}
      <defs>
        <filter id="logo-shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.15" />
        </filter>
        <clipPath id="shield-clip">
          <path d="M50 5 C53 5, 86 6, 88 40 C90 70, 74 85, 50 95 C26 85, 10 70, 12 40 C14 6, 47 5, 50 5 Z" />
        </clipPath>
      </defs>

      {/* 1. Main Shield Shape */}
      <g filter="url(#logo-shadow)">
        {/* Outer Golden Border */}
        <path
          d="M50 4 C54 4, 88 5, 90 40 C92 72, 75 88, 50 98 C25 88, 8 72, 10 40 C12 5, 46 4, 50 4 Z"
          fill="#FFF"
        />
        {/* Secondary Golden line */}
        <path
          d="M50 5 C53 5, 86 6, 88 40 C90 70, 74 85, 50 95 C26 85, 10 70, 12 40 C14 6, 47 5, 50 5 Z"
          fill="#5BC0BE" /* Light Blue background of the shield */
          stroke="#F2C94C" /* Gold Border */
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
      </g>

      {/* All contents inside are clipped by the shield or placed relative to it */}
      <g clipPath="url(#shield-clip)">
        {/* Shield sky gradient backdrop */}
        <rect x="0" y="0" width="100" height="100" fill="#5EBCF3" />

        {/* 2. Mount Ebulobo (Volcano) in background */}
        <path
          d="M20 75 L50 35 L80 75 Z"
          fill="#1C4B82"
          stroke="#0F2B52"
          strokeWidth="0.5"
        />
        {/* Volcano ridge detail */}
        <path
          d="M50 35 Q52 55 58 75"
          stroke="#2A5D9E"
          strokeWidth="1"
          fill="none"
        />

        {/* 3. Paddy field / agricultural waves at the bottom (green & yellow stripes) */}
        <path
          d="M12 70 C30 73, 70 73, 88 70 L88 95 L12 95 Z"
          fill="#27AE60"
        />
        {/* Yellow crop stripes */}
        <path d="M35 71 L30 95 H38 L42 71 Z" fill="#F2C94C" opacity="0.8" />
        <path d="M65 71 L70 95 H62 L58 71 Z" fill="#F2C94C" opacity="0.8" />

        {/* 4. Golden Triangle at bottom center */}
        <path
          d="M50 68 L36 90 L64 90 Z"
          fill="#F2C94C"
          stroke="#D4AF37"
          strokeWidth="1"
        />

        {/* 5. Traditional "Peo" Wooden Post (Sacrificial Horn) */}
        {/* Base steps of stone */}
        <rect x="42" y="61" width="16" height="3" fill="#BDC3C7" stroke="#2C3E50" strokeWidth="0.5" rx="0.5" />
        <rect x="39" y="64" width="22" height="3.5" fill="#95A5A6" stroke="#2C3E50" strokeWidth="0.5" rx="0.5" />
        <rect x="36" y="67.5" width="28" height="4.5" fill="#7F8C8D" stroke="#2C3E50" strokeWidth="0.5" rx="0.5" />

        {/* Peo Trunk & Curved Horns */}
        <path
          d="M48 61 L48 42 C48 38, 41 26, 41 22 C44 23, 47 30, 49 34 L49.5 40 L50.5 40 L51 34 C53 30, 56 23, 59 22 C59 26, 52 38, 52 42 L52 61 Z"
          fill="#8E4A21" /* Brown Peo wood */
          stroke="#4D2206"
          strokeWidth="1"
          strokeLinejoin="round"
        />
        {/* Traditional yellow patterns carved on Peo trunk */}
        <circle cx="50" cy="45" r="1" fill="#F2C94C" />
        <circle cx="50" cy="50" r="1" fill="#F2C94C" />
        <circle cx="50" cy="55" r="1" fill="#F2C94C" />
        <rect x="49" y="47" width="2" height="1.5" fill="#F2C94C" />
        <rect x="49" y="52" width="2" height="1.5" fill="#F2C94C" />
        <rect x="49" y="57" width="2" height="1.5" fill="#F2C94C" />

        {/* 6. Interlocking Rings (Unity of Domains) at the bottom */}
        <g stroke="#F2C94C" strokeWidth="0.8" fill="none">
          <circle cx="46" cy="81" r="2.5" />
          <circle cx="50" cy="81" r="2.5" />
          <circle cx="54" cy="81" r="2.5" />
        </g>

        {/* 7. Year "2006" */}
        <text
          x="50"
          y="88"
          fill="#1A2530"
          fontSize="5"
          fontFamily="system-ui, sans-serif"
          fontWeight="bold"
          textAnchor="middle"
        >
          2006
        </text>

        {/* 8. Left side: Yellow Padi (Rice Stalk) */}
        <g fill="#F2D13D" stroke="#9A7D0A" strokeWidth="0.3">
          {/* Leaves/grains curving up the left margin */}
          <path d="M21 78 Q18 60, 26 40" stroke="#F2C94C" strokeWidth="0.8" fill="none" />
          <circle cx="21" cy="74" r="1.5" />
          <circle cx="20" cy="70" r="1.5" />
          <circle cx="19" cy="66" r="1.5" />
          <circle cx="19" cy="62" r="1.5" />
          <circle cx="20" cy="58" r="1.5" />
          <circle cx="21" cy="54" r="1.5" />
          <circle cx="22" cy="50" r="1.5" />
          <circle cx="24" cy="46" r="1.5" />
          <circle cx="26" cy="42" r="1.5" />
        </g>

        {/* 9. Right side: Green/White Kapas (Cotton Stalk) */}
        <g stroke="#1E5C35" strokeWidth="0.3">
          <path d="M79 78 Q82 60, 74 40" stroke="#27AE60" strokeWidth="0.8" fill="none" />
          {/* Cotton blossoms (white with green sepals) */}
          <circle cx="79" cy="74" r="1.8" fill="#FFF" />
          <circle cx="80" cy="70" r="1.8" fill="#FFF" />
          <circle cx="81" cy="66" r="1.8" fill="#FFF" />
          <circle cx="81" cy="62" r="1.8" fill="#FFF" />
          <circle cx="80" cy="58" r="1.8" fill="#FFF" />
          <circle cx="79" cy="54" r="1.8" fill="#FFF" />
          <circle cx="78" cy="50" r="1.8" fill="#FFF" />
          <circle cx="76" cy="46" r="1.8" fill="#FFF" />
          <circle cx="74" cy="42" r="1.8" fill="#FFF" />
        </g>

        {/* 10. Red Ribbon / Banner at top with "KABUPATEN NAGEKEO" */}
        <g>
          {/* Ribbon Tail Left */}
          <path d="M23 20 L30 14 L30 22 Z" fill="#96130B" />
          {/* Ribbon Tail Right */}
          <path d="M77 20 L70 14 L70 22 Z" fill="#96130B" />
          
          {/* Main Ribbon Body */}
          <path
            d="M28 17 C40 14, 60 14, 72 17 L71 23 C59 20, 41 20, 29 23 Z"
            fill="#E1251B"
            stroke="#FFF"
            strokeWidth="0.4"
          />
          {/* Text inside the curved ribbon */}
          <text
            x="50"
            y="20.5"
            fill="#FFF"
            fontSize="3"
            fontWeight="900"
            fontFamily="system-ui, sans-serif"
            textAnchor="middle"
            letterSpacing="0.2"
          >
            KABUPATEN NAGEKEO
          </text>
        </g>

        {/* 11. Golden Star at the very top */}
        <g transform="translate(50, 9)">
          <path
            d="M0 -3.5 L1 -1 L3.5 -1 L1.5 0.8 L2.2 3.3 L0 1.8 L-2.2 3.3 L-1.5 0.8 L-3.5 -1 L-1 -1 Z"
            fill="#F2C94C"
            stroke="#D4AF37"
            strokeWidth="0.4"
          />
        </g>
      </g>
    </svg>
  );
}

