import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  User,
  Mail,
  Phone,
  Calendar,
  CheckCircle2,
  AlertCircle,
  LogOut,
  ExternalLink,
  Trash2
} from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const PatientProfile = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();

  const [calendarStatus, setCalendarStatus] = useState({ connected: false, googleEmail: null });
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  const fetchCalendarStatus = async () => {
    try {
      const { data } = await api.get('/calendar/status');
      setCalendarStatus(data.data || { connected: false });
    } catch (err) {
      console.warn('Calendar status fetch failed:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarStatus();

    // Check if redirected from Google OAuth callback
    if (searchParams.get('calendar_connected')) {
      showToast('Google Calendar connected successfully!', 'success');
      fetchCalendarStatus();
    } else if (searchParams.get('calendar_error')) {
      showToast(`Google Calendar error: ${searchParams.get('calendar_error')}`, 'error');
    }
  }, [searchParams]);

  const handleConnectCalendar = async () => {
    setConnecting(true);
    try {
      const { data } = await api.get('/calendar/google');
      if (data.url) {
        window.location.href = data.url;
      } else {
        showToast(
          data.message || 'Google Calendar is not configured on the server.',
          'info'
        );
      }
    } catch (err) {
      showToast(err.message || 'Failed to initialize Google Calendar OAuth.', 'error');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnectCalendar = async () => {
    if (!window.confirm('Disconnect Google Calendar? Future appointments will not sync.')) return;
    try {
      await api.delete('/calendar/google');
      showToast('Google Calendar disconnected.', 'info');
      setCalendarStatus({ connected: false, googleEmail: null });
    } catch (err) {
      showToast(err.message || 'Failed to disconnect calendar.', 'error');
    }
  };

  if (loading) return <LoadingSpinner label="Loading profile and integrations..." />;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Account & Integrations</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage your personal patient profile and Google Calendar synchronization.
        </p>
      </div>

      {/* User Information Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary-600 to-tealAccent-500 text-white flex items-center justify-center font-bold text-2xl shadow-xs">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">{user?.name}</h2>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-primary-50 text-primary-700 border border-primary-100">
              {user?.role} Account
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <p className="text-[11px] font-semibold text-slate-400 uppercase flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" /> Email Address
            </p>
            <p className="text-xs font-bold text-slate-800">{user?.email}</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <p className="text-[11px] font-semibold text-slate-400 uppercase flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" /> Phone Number
            </p>
            <p className="text-xs font-bold text-slate-800">{user?.phone || 'Not provided'}</p>
          </div>
        </div>
      </div>

      {/* Google Calendar Integration Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Google Calendar Integration</h3>
              <p className="text-xs text-slate-500">
                Sync appointments directly with your personal Google Calendar
              </p>
            </div>
          </div>

          {calendarStatus.connected ? (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" /> Connected
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
              Not Connected
            </span>
          )}
        </div>

        {calendarStatus.connected ? (
          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-emerald-900">
              <p className="font-bold">Active Connection</p>
              <p className="text-[11px] text-emerald-700">
                Synchronized with Google account: {calendarStatus.googleEmail || user?.email}
              </p>
            </div>
            <button
              onClick={handleDisconnectCalendar}
              className="px-3 py-1.5 rounded-xl bg-white border border-emerald-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold transition flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" /> Disconnect
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              When connected, any booked appointments will automatically create Google Calendar events with email and popup reminders. If you reschedule or cancel, the calendar updates seamlessly.
            </p>

            <button
              type="button"
              onClick={handleConnectCalendar}
              disabled={connecting}
              className="px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold transition shadow-xs flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              <span>{connecting ? 'Redirecting to Google...' : 'Connect Google Calendar'}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientProfile;
