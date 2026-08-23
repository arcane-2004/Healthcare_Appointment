import React from 'react';
import { Sparkles, AlertTriangle, HelpCircle, FileText } from 'lucide-react';
import { UrgencyBadge } from '../common/Badge';

const PreVisitSummaryCard = ({ summary, urgencyLevel, rawSymptoms }) => {
  const urgency = urgencyLevel || summary?.urgencyLevel || 'Unknown';
  const complaint = summary?.chiefComplaint || rawSymptoms || 'No symptoms specified';
  const questions = summary?.suggestedQuestions || [];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      {/* Header Bar */}
      <div className="px-6 py-4 bg-gradient-to-r from-primary-50 to-tealAccent-50 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary-600 text-white flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">AI Pre-Visit Triage & Insights</h3>
            <p className="text-[11px] text-slate-500">Google Gemini Clinical Assistant</p>
          </div>
        </div>
        <UrgencyBadge level={urgency} />
      </div>

      <div className="p-6 space-y-4">
        {/* Reported Symptoms / Chief Complaint */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-primary-500" />
            Chief Complaint & Summary
          </h4>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-sm text-slate-800 leading-relaxed font-medium">
            {complaint}
          </div>
        </div>

        {/* Suggested Questions for Doctor */}
        {questions && questions.length > 0 && (
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-tealAccent-600" />
              Suggested Exploratory Questions
            </h4>
            <div className="space-y-2">
              {questions.map((q, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 p-3 rounded-xl bg-tealAccent-50/50 border border-tealAccent-100 text-xs text-slate-700"
                >
                  <span className="w-5 h-5 rounded-full bg-tealAccent-600 text-white flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="font-medium">{q}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Disclaimer */}
        <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-100/80 flex items-start gap-2 text-[11px] text-amber-800">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
          <span>
            AI triage is an automated supportive tool and does not replace medical judgment.
          </span>
        </div>
      </div>
    </div>
  );
};

export default PreVisitSummaryCard;
