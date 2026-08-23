import React from 'react';

const StatCard = ({ title, value, icon: Icon, color = 'blue', subtitle }) => {
  const colorSchemes = {
    blue: 'bg-primary-50 text-primary-600 border-primary-100',
    teal: 'bg-tealAccent-50 text-tealAccent-600 border-tealAccent-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100'
  };

  const scheme = colorSchemes[color] || colorSchemes.blue;

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between hover:border-slate-300 transition">
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
        <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{value}</p>
        {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
      </div>
      {Icon && (
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${scheme}`}>
          <Icon className="w-6 h-6" />
        </div>
      )}
    </div>
  );
};

export default StatCard;
