import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Activity, User, LogOut, Calendar, Stethoscope, Shield } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getDashboardPath = () => {
    if (!user) return '/login';
    if (user.role === 'admin') return '/admin/dashboard';
    if (user.role === 'doctor') return '/doctor/dashboard';
    return '/patient/dashboard';
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-600 to-tealAccent-500 flex items-center justify-center text-white shadow-md shadow-primary-500/20 group-hover:scale-105 transition-transform">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Care<span className="text-primary-600">Sync</span>
            </span>
            <span className="hidden sm:inline-block ml-2 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 border border-primary-200">
              Healthcare
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <Link to="/" className="hover:text-primary-600 transition">Home</Link>
          <Link to="/doctors" className="hover:text-primary-600 transition flex items-center gap-1">
            <Stethoscope className="w-4 h-4 text-primary-500" />
            Find Doctors
          </Link>
        </nav>

        {/* User CTA / Profile */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <Link
                to={getDashboardPath()}
                className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg bg-primary-50 text-primary-700 hover:bg-primary-100 transition border border-primary-200"
              >
                {user.role === 'admin' ? (
                  <Shield className="w-4 h-4 text-primary-600" />
                ) : user.role === 'doctor' ? (
                  <Stethoscope className="w-4 h-4 text-primary-600" />
                ) : (
                  <Calendar className="w-4 h-4 text-primary-600" />
                )}
                <span>Dashboard</span>
              </Link>
              <button
                onClick={handleLogout}
                className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-primary-600 transition"
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-primary-600 text-white hover:bg-primary-700 shadow-sm shadow-primary-600/30 transition hover:shadow"
              >
                Book Appointment
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
