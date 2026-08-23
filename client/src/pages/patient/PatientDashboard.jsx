import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Calendar,
  Clock,
  Stethoscope,
  FileText,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  CalendarCheck,
  Activity,
  AlertCircle
} from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { StatusBadge, UrgencyBadge } from '../../components/common/Badge';
import PostVisitSummaryCard from '../../components/appointments/PostVisitSummaryCard';

const PatientDashboard = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [calendarStatus, setCalendarStatus] = useState({ connected: false, googleEmail: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [apptRes, calRes] = await Promise.all([
          api.get('/appointments'),
          api.get('/calendar/status').catch(() => ({ data: { data: { connected: false } } }))
        ]);
        setAppointments(apptRes.data.data || []);
        setCalendarStatus(calRes.data?.data || { connected: false });
      } catch (err) {
        console.error('Error loading patient dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) return <LoadingSpinner label="Loading your healthcare dashboard..." />;

  // Filter upcoming booked appointment
  const upcomingAppointment = appointments.find(
    (a) => a.status === 'BOOKED' || a.status === 'RESCHEDULED'
  );

  // Filter most recent completed visit
  const recentCompleted = appointments.find((a) => a.status === 'COMPLETED');

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-primary-700 via-primary-600 to-tealAccent-700 rounded-3xl p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-primary-200">
            CareSync Patient Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome, {user?.name || 'Patient'}
          </h1>
          <p className="text-xs sm:text-sm text-primary-100/90 leading-relaxed">
            Manage your medical appointments, review AI symptom pre-triage, and track medication schedules in one place.
          </p>
        </div>
      </div>

      {/* Google Calendar Connection Reminder Banner if not connected */}
      {!calendarStatus.connected && (
        <div className="p-4 bg-primary-50 border border-primary-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-600 text-white flex items-center justify-center flex-shrink-0">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Sync with Google Calendar</p>
              <p className="text-[11px] text-slate-500">
                Connect your Google account to automatically synchronize bookings and reminders.
              </p>
            </div>
          </div>
          <Link
            to="/patient/profile"
            className="px-4 py-2 rounded-xl bg-white text-primary-700 border border-primary-200 hover:bg-primary-100 text-xs font-bold transition text-center"
          >
            Connect Calendar
          </Link>
        </div>
      )}

      {/* Upcoming Appointment Spotlight Card */}
      {upcomingAppointment ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Upcoming Appointment
              </h3>
            </div>
            <StatusBadge status={upcomingAppointment.status} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary-600 to-tealAccent-500 text-white flex items-center justify-center font-bold text-xl shadow-xs">
                {upcomingAppointment.doctorId?.name?.replace('Dr. ', '').charAt(0) || 'D'}
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-900">
                  {upcomingAppointment.doctorId?.name}
                </h4>
                <p className="text-xs font-semibold text-primary-600">
                  {upcomingAppointment.doctorId?.specialisation}
                </p>
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="flex items-center gap-2 font-medium">
                <Calendar className="w-4 h-4 text-primary-500" />
                <span className="font-bold text-slate-800">{upcomingAppointment.date}</span>
              </div>
              <div className="flex items-center gap-2 font-medium">
                <Clock className="w-4 h-4 text-tealAccent-600" />
                <span>
                  {upcomingAppointment.startTime} - {upcomingAppointment.endTime}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 justify-end">
              <Link
                to={`/patient/appointments/${upcomingAppointment._id}`}
                className="px-5 py-2.5 rounded-xl bg-primary-600 text-white text-xs font-bold hover:bg-primary-700 transition text-center shadow-xs"
              >
                View Appointment & AI Triage
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 bg-white rounded-3xl border border-slate-200/80 shadow-xs text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center mx-auto">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Upcoming Appointments</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You currently have no scheduled consultations. Find a doctor to book your next slot.
          </p>
          <Link
            to="/patient/doctors"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary-600 text-white text-xs font-bold hover:bg-primary-700 transition"
          >
            <Stethoscope className="w-3.5 h-3.5" />
            <span>Find & Book Doctor</span>
          </Link>
        </div>
      )}

      {/* Quick Action Navigation Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to="/patient/doctors"
          className="p-6 bg-white rounded-2xl border border-slate-200/80 hover:border-primary-400 hover:shadow-xs transition group text-left space-y-2"
        >
          <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Stethoscope className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-slate-900 group-hover:text-primary-600 transition">
            Find Doctor
          </h4>
          <p className="text-xs text-slate-500">
            Browse specialists by department and select real-time appointment slots.
          </p>
        </Link>

        <Link
          to="/patient/appointments"
          className="p-6 bg-white rounded-2xl border border-slate-200/80 hover:border-primary-400 hover:shadow-xs transition group text-left space-y-2"
        >
          <div className="w-10 h-10 rounded-xl bg-tealAccent-50 text-tealAccent-600 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Calendar className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-slate-900 group-hover:text-primary-600 transition">
            My Appointments
          </h4>
          <p className="text-xs text-slate-500">
            View booking status, reschedule or cancel visits, and read AI pre-visit insights.
          </p>
        </Link>

        <Link
          to="/patient/profile"
          className="p-6 bg-white rounded-2xl border border-slate-200/80 hover:border-primary-400 hover:shadow-xs transition group text-left space-y-2"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-slate-900 group-hover:text-primary-600 transition">
            Profile & Calendar
          </h4>
          <p className="text-xs text-slate-500">
            Manage contact information and connect your Google Calendar account.
          </p>
        </Link>
      </div>

      {/* Recent Completed Visit Summary */}
      {recentCompleted && recentCompleted.postVisitSummary && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            Recent Visit Follow-up & Prescription Summary
          </h3>
          <PostVisitSummaryCard summary={recentCompleted.postVisitSummary} />
        </div>
      )}
    </div>
  );
};

export default PatientDashboard;
