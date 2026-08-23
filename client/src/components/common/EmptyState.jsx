import React from 'react';
import { CalendarX } from 'lucide-react';

const EmptyState = ({
  icon: Icon = CalendarX,
  title = 'No items found',
  description = 'There are no records matching your current criteria.',
  actionText,
  onAction
}) => {
  return (
    <div className="p-10 text-center bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col items-center justify-center max-w-lg mx-auto">
      <div className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mb-4 border border-slate-100">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-base font-bold text-slate-900 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mb-6">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 text-sm font-semibold rounded-xl bg-primary-600 text-white hover:bg-primary-700 transition shadow-xs"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
