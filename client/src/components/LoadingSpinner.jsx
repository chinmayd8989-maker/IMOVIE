import React from 'react';
import { Film } from 'lucide-react';

const LoadingSpinner = ({ message = 'Loading cinema experience...', fullScreen = false }) => {
  const content = (
    <div className="flex flex-col items-center justify-center space-y-4 py-12">
      <div className="relative">
        {/* Outer glowing pulsing ring */}
        <div className="w-16 h-16 rounded-full border-4 border-[#E50914]/20 border-t-[#E50914] animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Film className="w-6 h-6 text-[#E50914] animate-pulse" />
        </div>
      </div>
      <p className="text-slate-400 text-sm font-medium tracking-wide animate-pulse">{message}</p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center w-full">
        {content}
      </div>
    );
  }

  return content;
};

export default LoadingSpinner;
