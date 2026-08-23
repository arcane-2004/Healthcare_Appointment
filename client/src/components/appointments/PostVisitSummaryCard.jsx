import React from 'react';
import { Sparkles, CheckCircle2 } from 'lucide-react';
import Markdown from 'react-markdown';

const PostVisitSummaryCard = ({ summary }) => {
  if (!summary) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      <div className="px-6 py-4 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Patient-Friendly Post-Visit Summary</h3>
            <p className="text-[11px] text-slate-500">AI-Generated Guidance from Clinical Notes</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5" /> Completed Visit
        </span>
      </div>

      <div className="p-6">
        <div className="prose prose-sm max-w-none text-slate-700 leading-relaxed">
          <Markdown>{summary}</Markdown>
        </div>
      </div>
    </div>
  );
};

export default PostVisitSummaryCard;
