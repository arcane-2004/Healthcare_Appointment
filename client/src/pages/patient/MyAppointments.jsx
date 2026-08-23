import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
  Calendar,
  Clock,
  Stethoscope,
  Sparkles,
  ArrowRight,
  RefreshCw,
  XCircle,
  Eye,
  FileText
} from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { StatusBadge, UrgencyBadge } from '../../components/common/Badge';
import RescheduleModal from '../../components/appointments/RescheduleModal';

const MyAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const { showToast } = useToast();

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/appointments');
      setAppointments(data.data || []);
    } catch (err) {
      showToast(err.message || 'Failed to load appointments.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      await api.post(`/appointments/${id}/cancel`, { reason: 'Cancelled by patient' });
      showToast('Appointment cancelled successfully.', 'info');
      fetchAppointments();
    } catch (err) {
      showToast(err.message || 'Failed to cancel appointment.', 'error');
    }
  };

  const filtered = appointments.filter((appt) => {
    if (statusFilter === 'ALL') return true;
    return appt.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header & Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">My Appointments</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Review your upcoming consultations, past prescriptions, and AI summaries.
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-slate-200 shadow-2xs overflow-x-auto">
          {['ALL', 'BOOKED', 'COMPLETED', 'CANCELLED'].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                statusFilter === tab
                  ? 'bg-primary-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {tab === 'ALL' ? 'All' : tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Appointments List */}
      {loading ? (
        <LoadingSpinner label="Loading your appointments..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No Appointments Found"
          description={
            statusFilter === 'ALL'
              ? "You haven't booked any appointments yet."
              : `No appointments found in ${statusFilter.toLowerCase()} status.`
          }
          actionText="Find & Book Doctor"
          onAction={() => window.location.assign('/patient/doctors')}
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((appt) => (
            <div
              key={appt._id}
              className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs hover:border-slate-300 transition space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <StatusBadge status={appt.status} />
                  <UrgencyBadge level={appt.urgencyLevel} />
                </div>
                <span className="text-xs font-semibold text-slate-400">
                  Booked on {new Date(appt.createdAt).toLocaleDateString()}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                {/* Doctor info */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-primary-600 to-tealAccent-500 text-white flex items-center justify-center font-bold text-base shadow-xs flex-shrink-0">
                    {appt.doctorId?.name?.replace('Dr. ', '').charAt(0) || 'D'}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{appt.doctorId?.name}</h3>
                    <p className="text-xs font-semibold text-primary-600">
                      {appt.doctorId?.specialisation}
                    </p>
                  </div>
                </div>

                {/* Date & Time */}
                <div className="space-y-1 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-primary-500" />
                    <span className="font-bold text-slate-800">{appt.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-tealAccent-600" />
                    <span>
                      {appt.startTime} - {appt.endTime}
                    </span>
                  </div>
                </div>

                {/* Symptoms / Chief Complaint snippet */}
                <div className="text-xs text-slate-600">
                  <p className="font-semibold text-slate-700 mb-0.5">Symptoms:</p>
                  <p className="line-clamp-2 italic text-slate-500">&quot;{appt.symptoms}&quot;</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  {(appt.status === 'BOOKED' || appt.status === 'RESCHEDULED') && (
                    <>
                      <button
                        onClick={() => setRescheduleTarget(appt)}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Reschedule
                      </button>
                      <button
                        onClick={() => handleCancel(appt._id)}
                        className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition flex items-center gap-1"
                      >
                        <XCircle className="w-3 h-3" />
                        Cancel
                      </button>
                    </>
                  )}
                </div>

                <Link
                  to={`/patient/appointments/${appt._id}`}
                  className="px-4 py-2 rounded-xl bg-primary-600 text-white text-xs font-bold hover:bg-primary-700 transition flex items-center gap-1.5 shadow-2xs"
                >
                  <span>View Details & Summary</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reschedule Modal */}
      {rescheduleTarget && (
        <RescheduleModal
          isOpen={Boolean(rescheduleTarget)}
          onClose={() => setRescheduleTarget(null)}
          appointment={rescheduleTarget}
          onRescheduled={fetchAppointments}
        />
      )}
    </div>
  );
};

export default MyAppointments;
