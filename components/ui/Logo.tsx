import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'light' | 'dark';
  showText?: boolean;
  className?: string;
}

export default function Logo({ 
  size = 'md', 
  variant = 'light', 
  showText = true, 
  className = '' 
}: LogoProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  const iconSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const textColor = variant === 'light' ? 'text-white' : 'text-black';
  const bgColor = variant === 'light' ? 'bg-white' : 'bg-black';
  const iconColor = variant === 'light' ? 'text-black' : 'text-white';

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Logo Icon */}
      <div className={`${sizeClasses[size]} ${bgColor} rounded-xl flex items-center justify-center shadow-lg`}>
        <div className="relative">
          {/* AI Symbol */}
          <span className={`font-bold ${iconSizeClasses[size]} ${iconColor} tracking-tight`}>
            Ai
          </span>
        </div>
      </div>
      
      {/* Logo Text */}
      {showText && (
        <span className={`font-bold ${textSizeClasses[size]} ${textColor} tracking-tight`}>
          AiAppy
        </span>
      )}
    </div>
  );
}
