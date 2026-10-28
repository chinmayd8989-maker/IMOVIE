import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

const ErrorMessage = ({
  title = 'Something went wrong',
  message = 'Failed to load movie information. Please check your connection.',
  onRetry,
}) => {
  return (
    <div className="bg-[#121622] border border-red-500/30 rounded-2xl p-6 max-w-xl mx-auto my-8 text-center shadow-xl">
      <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
        <AlertCircle className="w-6 h-6 text-[#E50914]" />
      </div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-slate-400 text-sm mb-6 leading-relaxed">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1E2638] hover:bg-[#E50914] text-white rounded-xl text-sm font-semibold transition-all duration-200"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
