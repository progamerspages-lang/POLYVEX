import React from 'react';

interface PolyvexLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  showWordmark?: boolean;
  showTagline?: boolean;
  className?: string;
  wordmarkClassName?: string;
  taglineClassName?: string;
  href?: string;
  onClick?: () => void;
}

const SIZE_MAP = {
  xs: 24,
  sm: 32,
  md: 44,
  lg: 64,
  xl: 88,
};

export const PolyvexLogo: React.FC<PolyvexLogoProps> = ({
  size = 'md',
  showWordmark = false,
  showTagline = false,
  className = '',
  wordmarkClassName = '',
  taglineClassName = '',
  onClick,
}) => {
  const pixelSize = typeof size === 'number' ? size : SIZE_MAP[size] || 44;

  const content = (
    <div
      className={`inline-flex items-center gap-3 select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      <img
        src="/assets/aistudio/AaFvlbeHeQWL4ZujC4mUCw-AaFvlbeHMJmL6yCvAt9X9g.jpg-removebg-preview_db85c46e.png"
        alt="POLYVEX Logo"
        width={pixelSize}
        height={pixelSize}
        className="shrink-0 object-contain drop-shadow-[0_0_12px_rgba(53,242,208,0.25)] transition-transform duration-200"
        style={{ width: `${pixelSize}px`, height: `${pixelSize}px` }}
      />

      {(showWordmark || showTagline) && (
        <div className="flex flex-col justify-center leading-none">
          {showWordmark && (
            <div className={`font-black tracking-widest text-[#F5F7FA] font-sans uppercase ${wordmarkClassName || (pixelSize >= 48 ? 'text-2xl' : pixelSize >= 36 ? 'text-xl' : 'text-base')}`}>
              POLY<span className="text-[#35F2D0]">VEX</span>
            </div>
          )}
          {showTagline && (
            <span className={`text-[#A1A8B3] text-xs font-medium tracking-tight mt-1 ${taglineClassName}`}>
              Your potential. Without limits.
            </span>
          )}
        </div>
      )}
    </div>
  );

  return content;
};
