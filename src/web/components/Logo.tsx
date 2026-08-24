import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', showTagline = true }) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-2xl',
  };

  return (
    <div className="flex items-center space-x-2.5 group cursor-pointer select-none">
      
      {/* Sober Executive Shield Icon */}
      <div className={`relative ${iconSizes[size]} shrink-0 flex items-center justify-center`}>
        <svg viewBox="0 0 100 100" fill="none" className="w-full h-full text-slate-100">
          <path 
            d="M50 6 L88 22 V50 C88 74 50 94 50 94 C50 94 12 74 12 50 V22 L50 6 Z" 
            fill="#111827" 
            stroke="#94a3b8" 
            strokeWidth="3.5" 
          />
          {/* Minimalist Scales of Justice */}
          <path d="M50 22 V70 M30 36 H70 M30 36 L24 54 H36 L30 36 Z M70 36 L64 54 H76 L70 36 Z" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="50" cy="36" r="3.5" fill="#f8fafc" />
        </svg>
      </div>

      {/* Brand Typography */}
      <div>
        <div className="flex items-center space-x-1.5 leading-none">
          <span className={`font-bold tracking-tight text-white ${textSizes[size]} font-sans`}>
            Comply<span className="font-extrabold text-slate-200">PRO</span>
          </span>
          <span className="px-1.5 py-0.5 text-[9px] font-bold font-mono uppercase rounded bg-slate-800 text-slate-300 border border-slate-700">
            .PT
          </span>
        </div>
        {showTagline && (
          <span className="block text-[8.5px] font-semibold text-slate-400 tracking-wider uppercase mt-1">
            AI & Regulatory Governance
          </span>
        )}
      </div>
    </div>
  );
};
