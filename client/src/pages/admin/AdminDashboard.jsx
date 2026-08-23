import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import {
  Users,
  UserCheck,
  Calendar,
  XCircle,
  CheckCircle2,
  Stethoscope,
  PlusCircle,
  FileText,
  Shield,
  ArrowRight
} from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatCard from '../../components/common/StatCard';
import { StatusBadge, UrgencyBadge } from '../../components/common/Badge';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/admin/stats');
      setStats(data.data);
    } catch (err) {
      console.error('Failed to load admin metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) return <LoadingSpinner label="Loading administration overview..." />;

  return (
    <div className="space-y-8">
      {/* Admin Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-primary-950 rounded-3xl p-8 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
            System Administration
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Platform Analytics & Operations
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Monitor real-time system appointments, manage doctors, and handle clinical leave schedules.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admin/doctors/create"
            className="px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Doctor</span>
          </Link>
          <Link
            to="/admin/doctors"
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition"
          >
            Manage Doctors
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Doctors"
          value={stats?.totalDoctors || 0}
          icon={Stethoscope}
          color="blue"
          subtitle="Registered specialists"
        />
        <StatCard
          title="Total Patients"
          value={stats?.totalPatients || 0}
          icon={Users}
          color="teal"
          subtitle="Registered patient accounts"
        />
        <StatCard
          title="Today's Appointments"
          value={stats?.todayAppointments || 0}
          icon={Calendar}
          color="emerald"
          subtitle="Scheduled for today"
        />
        <StatCard
          title="Cancelled Visits"
          value={stats?.cancelledAppointments || 0}
          icon={XCircle}
          color="rose"
          subtitle="Total cancellations"
        />
      </div>

      {/* Recent Appointments Activity */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Recent Appointments</h3>
            <p className="text-xs text-slate-500">Real-time consultation bookings across all departments.</p>
          </div>
          <Link
            to="/admin/appointments"
            className="text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1"
          >
            <span>View All Records</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {!stats?.recentAppointments || stats.recentAppointments.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">No recent appointment activity.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-y border-slate-100">
                <tr>
                  <th className="py-3 px-4">Patient</th>
                  <th className="py-3 px-4">Doctor</th>
                  <th className="py-3 px-4">Schedule</th>
                  <th className="py-3 px-4">Urgency</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {stats.recentAppointments.map((appt) => (
                  <tr key={appt._id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{appt.patientId?.name || 'Unknown'}</p>
                      <p className="text-[11px] text-slate-400">{appt.patientId?.email}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{appt.doctorId?.name || 'Unknown'}</p>
                      <p className="text-[11px] text-primary-600">{appt.doctorId?.specialisation}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-800">{appt.date}</p>
                      <p className="text-[11px] text-slate-400">{appt.startTime}</p>
                    </td>
                    <td className="py-3 px-4">
                      <UrgencyBadge level={appt.urgencyLevel} />
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={appt.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
