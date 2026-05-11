'use client';

export function GoldBarIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 9 L19 9 L22 15 L2 15 Z" fill="#C88A08"/>
      <rect x="2" y="15" width="20" height="5" rx="1.5" fill="#A87006"/>
      <rect x="2" y="9" width="20" height="6" fill="#F6C344"/>
      <rect x="4" y="10" width="9" height="2" rx="1" fill="#FFE878" opacity="0.75"/>
      <rect x="2" y="9" width="20" height="1" fill="#FFD700" opacity="0.4"/>
    </svg>
  );
}

export function SilverBarIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 9 L19 9 L22 15 L2 15 Z" fill="#909090"/>
      <rect x="2" y="15" width="20" height="5" rx="1.5" fill="#787878"/>
      <rect x="2" y="9" width="20" height="6" fill="#C0C0C0"/>
      <rect x="4" y="10" width="9" height="2" rx="1" fill="#F0F0F0" opacity="0.75"/>
      <rect x="2" y="9" width="20" height="1" fill="#E8E8E8" opacity="0.4"/>
    </svg>
  );
}

export function EyeIcon({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

export function EyeOffIcon({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}
