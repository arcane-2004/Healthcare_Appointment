import React from 'react';

const LoadingSpinner = ({ label = 'Loading...' }) => {
  return (
    <div className="py-12 flex flex-col items-center justify-center text-center">
      <div className="w-9 h-9 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
      <p className="text-sm font-medium text-slate-500 mt-3">{label}</p>
    </div>
  );
};

export default LoadingSpinner;
