import React, { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import Sidebar from '../components/common/Sidebar';
import { useAuth } from '../context/AuthContext';
import { Menu, Bell, Calendar, Stethoscope, Shield, CheckCircle2 } from 'lucide-react';

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 md:pl-64">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-slate-200 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 md:hidden focus:outline-hidden"
              aria-label="Open Sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:block">
              <h2 className="text-sm font-bold text-slate-800">
                {user?.role === 'patient' && 'Patient Portal'}
                {user?.role === 'doctor' && 'Doctor Clinical Console'}
                {user?.role === 'admin' && 'System Administration'}
              </h2>
              <p className="text-[11px] text-slate-400">Welcome back, {user?.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user?.role === 'patient' && (
              <Link
                to="/patient/doctors"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-50 text-primary-700 text-xs font-semibold hover:bg-primary-100 transition border border-primary-200"
              >
                <Stethoscope className="w-3.5 h-3.5" />
                Book Doctor
              </Link>
            )}

            <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary-600 to-tealAccent-500 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-bold text-slate-900 leading-tight">{user?.name}</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">{user?.role}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
