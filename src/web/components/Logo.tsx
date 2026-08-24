import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', showTagline = true }) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  return (
    <div className="flex items-center space-x-3 group cursor-pointer select-none">
      
      {/* Sleek SVG Vector Shield Icon */}
      <div className={`relative ${iconSizes[size]} shrink-0 transition-transform duration-300 group-hover:scale-105`}>
        <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500 to-purple-600 rounded-xl blur-[8px] opacity-60 group-hover:opacity-100 transition-opacity" />
        <svg viewBox="0 0 100 100" fill="none" className="relative w-full h-full drop-shadow-md">
          <defs>
            <linearGradient id="logoShield" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#22d3ee" />
              <stop offset="50%" stop-color="#3b82f6" />
              <stop offset="100%" stop-color="#a855f7" />
            </linearGradient>
          </defs>
          <path d="M50 8 L85 24 V52 C85 74 50 92 50 92 C50 92 15 74 15 52 V24 L50 8 Z" fill="#0b1020" stroke="url(#logoShield)" strokeWidth="4" />
          
          {/* Circuit Lines & Scale */}
          <path d="M50 20 V42 M50 42 L32 50 M50 42 L68 50 M32 50 V64 M68 50 V64 M50 42 V78" stroke="url(#logoShield)" strokeWidth="2.5" strokeLinecap="round" />
          
          {/* Balance Pans */}
          <path d="M24 64 L40 64 L32 72 Z" fill="#06b6d4" fillOpacity="0.6" stroke="#06b6d4" strokeWidth="2" />
          <path d="M60 64 L76 64 L68 72 Z" fill="#a855f7" fillOpacity="0.6" stroke="#a855f7" strokeWidth="2" />
          
          {/* Central AI Node */}
          <circle cx="50" cy="42" r="4.5" fill="#22d3ee" stroke="#ffffff" strokeWidth="1.5" />
          <circle cx="32" cy="50" r="3" fill="#06b6d4" />
          <circle cx="68" cy="50" r="3" fill="#a855f7" />
        </svg>
      </div>

      {/* Brand Typography with .pt TLD badge */}
      <div>
        <div className="flex items-center space-x-1.5 leading-none">
          <span className={`font-black tracking-tight text-white ${textSizes[size]} font-sans`}>
            Comply<span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">PRO</span>
          </span>
          <span className="px-1.5 py-0.5 text-[9px] font-black font-mono uppercase rounded bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-300 border border-cyan-500/40">
            .pt
          </span>
        </div>

        {showTagline && (
          <span className="text-[10px] text-slate-400 tracking-wider uppercase font-medium block mt-0.5">
            AI & Regulatory Governance
          </span>
        )}
      </div>

    </div>
  );
};
