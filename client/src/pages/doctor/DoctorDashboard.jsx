import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Calendar,
  Clock,
  CheckCircle2,
  Users,
  AlertCircle,
  Stethoscope,
  Sparkles,
  ArrowRight,
  FileEdit,
  Activity
} from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatCard from '../../components/common/StatCard';
import { StatusBadge, UrgencyBadge } from '../../components/common/Badge';

const DoctorDashboard = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAppointments = async () => {
    try {
      const { data } = await api.get('/appointments');
      setAppointments(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  if (loading) return <LoadingSpinner label="Loading clinical schedule..." />;

  const todayStr = new Date().toISOString().split('T')[0];

  const todayAppointments = appointments.filter((a) => a.date === todayStr);
  const upcomingCount = appointments.filter(
    (a) => a.status === 'BOOKED' || a.status === 'RESCHEDULED'
  ).length;
  const completedCount = appointments.filter((a) => a.status === 'COMPLETED').length;
  const cancelledCount = appointments.filter((a) => a.status === 'CANCELLED').length;

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-tealAccent-700 via-primary-700 to-slate-900 rounded-3xl p-8 text-white shadow-md">
        <div className="max-w-2xl space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-tealAccent-200">
            Doctor Clinical Console
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Good day, {user?.name || 'Doctor'}
          </h1>
          <p className="text-xs sm:text-sm text-tealAccent-100/90 leading-relaxed">
            You have <strong className="text-white font-bold">{todayAppointments.length} appointments</strong> scheduled for today. Review AI symptom triage prior to patient consultation.
          </p>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today's Appointments"
          value={todayAppointments.length}
          icon={Calendar}
          color="blue"
          subtitle="Scheduled for today"
        />
        <StatCard
          title="Upcoming Queue"
          value={upcomingCount}
          icon={Clock}
          color="teal"
          subtitle="Active future visits"
        />
        <StatCard
          title="Completed Visits"
          value={completedCount}
          icon={CheckCircle2}
          color="emerald"
          subtitle="Finished consultations"
        />
        <StatCard
          title="Cancelled"
          value={cancelledCount}
          icon={AlertCircle}
          color="rose"
          subtitle="Rescheduled / Cancelled"
        />
      </div>

      {/* Today's Schedule Timeline */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Today&apos;s Schedule</h3>
            <p className="text-xs text-slate-500">{todayStr}</p>
          </div>
          <Link
            to="/doctor/appointments"
            className="text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1"
          >
            <span>View All Appointments</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {todayAppointments.length === 0 ? (
          <div className="p-8 bg-slate-50 rounded-2xl border border-slate-100 text-center text-xs text-slate-500">
            No consultations scheduled for today. Check upcoming appointments in your queue.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {todayAppointments.map((appt) => (
              <div
                key={appt._id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <div className="w-16 py-2 rounded-xl bg-slate-100 text-slate-800 text-center font-bold text-xs flex flex-col justify-center flex-shrink-0">
                    <span>{appt.startTime}</span>
                    <span className="text-[10px] text-slate-400 font-normal">{appt.endTime}</span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">{appt.patientId?.name}</h4>
                      <StatusBadge status={appt.status} />
                      <UrgencyBadge level={appt.urgencyLevel} />
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-1">
                      <strong>Symptoms:</strong> {appt.symptoms}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <Link
                    to={`/doctor/appointments/${appt._id}`}
                    className="px-4 py-2 rounded-xl bg-primary-600 text-white text-xs font-bold hover:bg-primary-700 transition flex items-center gap-1.5 shadow-2xs"
                  >
                    <FileEdit className="w-3.5 h-3.5" />
                    <span>
                      {appt.status === 'COMPLETED' ? 'Review Summary' : 'Start Consultation'}
                    </span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorDashboard;
