import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
  Calendar,
  Clock,
  Stethoscope,
  Pill,
  FileText,
  Sparkles,
  ArrowLeft,
  RefreshCw,
  XCircle,
  Mail,
  CheckCircle2
} from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { StatusBadge, UrgencyBadge } from '../../components/common/Badge';
import PreVisitSummaryCard from '../../components/appointments/PreVisitSummaryCard';
import PostVisitSummaryCard from '../../components/appointments/PostVisitSummaryCard';
import RescheduleModal from '../../components/appointments/RescheduleModal';

const AppointmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);

  const fetchAppointment = async () => {
    try {
      const { data } = await api.get(`/appointments/${id}`);
      setAppointment(data.data);
    } catch (err) {
      showToast(err.message || 'Failed to load appointment details.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointment();
  }, [id]);

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      await api.post(`/appointments/${id}/cancel`, { reason: 'Cancelled by patient' });
      showToast('Appointment cancelled.', 'info');
      fetchAppointment();
    } catch (err) {
      showToast(err.message || 'Failed to cancel.', 'error');
    }
  };

  if (loading) return <LoadingSpinner label="Loading appointment details..." />;
  if (!appointment) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <p className="text-sm font-semibold text-rose-600">Appointment not found</p>
        <Link to="/patient/appointments" className="px-4 py-2 bg-primary-600 text-white rounded-xl text-xs font-bold">
          Back to Appointments
        </Link>
      </div>
    );
  }

  const isActionable = appointment.status === 'BOOKED' || appointment.status === 'RESCHEDULED';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          to="/patient/appointments"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My Appointments</span>
        </Link>

        {isActionable && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setRescheduleOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reschedule
            </button>
            <button
              onClick={handleCancel}
              className="px-3.5 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold hover:bg-rose-100 transition flex items-center gap-1.5"
            >
              <XCircle className="w-3.5 h-3.5" />
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Appointment Overview Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary-600 to-tealAccent-500 text-white flex items-center justify-center font-bold text-xl shadow-xs">
              {appointment.doctorId?.name?.replace('Dr. ', '').charAt(0) || 'D'}
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900">{appointment.doctorId?.name}</h1>
              <p className="text-xs font-semibold text-primary-600">{appointment.doctorId?.specialisation}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={appointment.status} />
            <UrgencyBadge level={appointment.urgencyLevel} />
          </div>
        </div>

        {/* Schedule Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
            <Calendar className="w-5 h-5 text-primary-600" />
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase">Consultation Date</p>
              <p className="text-sm font-bold text-slate-800">{appointment.date}</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
            <Clock className="w-5 h-5 text-tealAccent-600" />
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase">Allocated Time</p>
              <p className="text-sm font-bold text-slate-800">
                {appointment.startTime} - {appointment.endTime}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Reported Symptoms */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-primary-500" />
          Reported Symptoms
        </h3>
        <p className="text-sm text-slate-700 leading-relaxed font-medium">
          {appointment.symptoms}
        </p>
      </div>

      {/* AI Pre-Visit Triage Card */}
      <PreVisitSummaryCard
        summary={appointment.preVisitSummary}
        urgencyLevel={appointment.urgencyLevel}
        rawSymptoms={appointment.symptoms}
      />

      {/* Doctor Consultation Notes (if completed) */}
      {appointment.visitNotes && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-tealAccent-600" />
            Doctor Clinical Notes
          </h3>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
            {appointment.visitNotes}
          </p>
        </div>
      )}

      {/* Prescribed Medications Card (if any) */}
      {appointment.prescription && appointment.prescription.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Pill className="w-3.5 h-3.5 text-primary-600" />
            Prescribed Medications ({appointment.prescription.length})
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {appointment.prescription.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-900">{item.medicine}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-100 text-primary-800">
                    {item.dosage}
                  </span>
                </div>
                <div className="text-xs text-slate-600 space-y-0.5">
                  <p>
                    <strong className="text-slate-700">Frequency:</strong> {item.frequency}
                  </p>
                  <p>
                    <strong className="text-slate-700">Duration:</strong> {item.duration}
                  </p>
                  {item.instructions && (
                    <p className="italic text-slate-500">
                      <strong className="text-slate-700 not-italic">Notes:</strong> {item.instructions}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Post-Visit Patient Summary */}
      <PostVisitSummaryCard summary={appointment.postVisitSummary} />

      {/* Reschedule Modal */}
      {rescheduleOpen && (
        <RescheduleModal
          isOpen={rescheduleOpen}
          onClose={() => setRescheduleOpen(false)}
          appointment={appointment}
          onRescheduled={fetchAppointment}
        />
      )}
    </div>
  );
};

export default AppointmentDetail;
