import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Calendar,
  Stethoscope,
  User,
  Users,
  PlusCircle,
  FileText,
  LogOut,
  Activity,
  Shield,
  Clock,
  CalendarDays
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getNavLinks = () => {
    if (!user) return [];

    if (user.role === 'patient') {
      return [
        { name: 'Dashboard', path: '/patient/dashboard', icon: LayoutDashboard },
        { name: 'Find Doctors', path: '/patient/doctors', icon: Stethoscope },
        { name: 'My Appointments', path: '/patient/appointments', icon: Calendar },
        { name: 'Profile & Calendar', path: '/patient/profile', icon: User }
      ];
    }

    if (user.role === 'doctor') {
      return [
        { name: 'Dashboard', path: '/doctor/dashboard', icon: LayoutDashboard },
        { name: 'Appointments', path: '/doctor/appointments', icon: CalendarDays },
        { name: 'Schedule & Profile', path: '/doctor/profile', icon: Clock }
      ];
    }

    if (user.role === 'admin') {
      return [
        { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
        { name: 'Manage Doctors', path: '/admin/doctors', icon: Users },
        { name: 'Add Doctor', path: '/admin/doctors/create', icon: PlusCircle },
        { name: 'All Appointments', path: '/admin/appointments', icon: FileText }
      ];
    }

    return [];
  };

  const links = getNavLinks();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Brand Header */}
          <div className="h-16 px-6 flex items-center gap-2.5 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-600 to-tealAccent-500 flex items-center justify-center text-white shadow-sm">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-slate-900">
                Care<span className="text-primary-600">Sync</span>
              </span>
            </div>
          </div>

          {/* Role Pill */}
          <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Workspace
            </span>
            <span
              className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                user?.role === 'admin'
                  ? 'bg-amber-100 text-amber-800'
                  : user?.role === 'doctor'
                  ? 'bg-teal-100 text-teal-800'
                  : 'bg-primary-100 text-primary-800'
              }`}
            >
              {user?.role}
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.path}
                  to={link.path}
                  onClick={() => onClose && onClose()}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-primary-50 text-primary-700 font-semibold shadow-xs'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{link.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Footer User Profile & Logout */}
        <div className="p-4 border-t border-slate-100">
          <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-slate-900 truncate">{user?.name}</p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
