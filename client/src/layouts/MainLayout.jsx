import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import { Activity, ShieldCheck, HeartHandshake, Sparkles } from 'lucide-react';

const MainLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="bg-white border-t border-slate-200 py-10 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white">
                <Activity className="w-4 h-4" />
              </div>
              <span className="font-bold text-slate-800">CareSync</span>
              <span className="text-xs text-slate-500">| Healthcare Appointment & Follow-up Platform</span>
            </div>
            <div className="flex items-center gap-6 text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-primary-500" /> Powered by Gemini AI</span>
              <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> HIPAA Compliant Architecture</span>
            </div>
          </div>
          <div className="text-center md:text-left text-xs text-slate-400 mt-6 pt-6 border-t border-slate-100">
            &copy; {new Date().getFullYear()} CareSync Healthcare Management. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
