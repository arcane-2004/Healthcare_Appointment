import React from 'react';

export const StatusBadge = ({ status }) => {
  const normalized = (status || '').toUpperCase();

  const styles = {
    BOOKED: 'bg-blue-50 text-blue-700 border-blue-200',
    COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    CANCELLED: 'bg-rose-50 text-rose-700 border-rose-200',
    RESCHEDULED: 'bg-amber-50 text-amber-700 border-amber-200'
  };

  const style = styles[normalized] || 'bg-slate-100 text-slate-700 border-slate-200';

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${style}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 fill-current bg-current opacity-70"></span>
      {normalized}
    </span>
  );
};

export const UrgencyBadge = ({ level }) => {
  const normalized = (level || 'Unknown').toLowerCase();

  let style = 'bg-slate-100 text-slate-700 border-slate-200';
  if (normalized.includes('high')) {
    style = 'bg-rose-100 text-rose-800 border-rose-300 font-bold';
  } else if (normalized.includes('med')) {
    style = 'bg-amber-100 text-amber-800 border-amber-300 font-medium';
  } else if (normalized.includes('low')) {
    style = 'bg-emerald-100 text-emerald-800 border-emerald-300 font-medium';
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs border ${style}`}
    >
      Urgency: {level || 'Unknown'}
    </span>
  );
};
