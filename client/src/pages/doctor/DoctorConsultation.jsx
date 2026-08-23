import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
  User,
  Calendar,
  Clock,
  FileText,
  Pill,
  Sparkles,
  CheckCircle2,
  ArrowLeft,
  Save,
  AlertCircle
} from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { StatusBadge, UrgencyBadge } from '../../components/common/Badge';
import PreVisitSummaryCard from '../../components/appointments/PreVisitSummaryCard';
import PostVisitSummaryCard from '../../components/appointments/PostVisitSummaryCard';
import PrescriptionBuilder from '../../components/appointments/PrescriptionBuilder';

const DoctorConsultation = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [appointment, setAppointment] = useState(null);
  const [visitNotes, setVisitNotes] = useState('');
  const [prescription, setPrescription] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchAppointment = async () => {
    try {
      const { data } = await api.get(`/appointments/${id}`);
      setAppointment(data.data);
      setVisitNotes(data.data.visitNotes || '');
      setPrescription(data.data.prescription || []);
    } catch (err) {
      showToast(err.message || 'Failed to load appointment details.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointment();
  }, [id]);

  const handleSaveNotesAndPrescription = async () => {
    try {
      await api.post(`/appointments/${id}/notes`, { visitNotes });
      await api.post(`/appointments/${id}/prescription`, { prescription });
      showToast('Clinical notes & prescription saved as draft.', 'success');
      fetchAppointment();
    } catch (err) {
      showToast(err.message || 'Failed to save updates.', 'error');
    }
  };

  const handleCompleteAppointment = async () => {
    if (!visitNotes.trim() && prescription.length === 0) {
      showToast('Please add consultation notes or medications before completing.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await api.post(`/appointments/${id}/complete`, {
        visitNotes,
        prescription
      });
      showToast('Appointment completed! AI patient-friendly summary generated.', 'success');
      setAppointment(data.data);
    } catch (err) {
      showToast(err.message || 'Failed to complete appointment.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner label="Loading consultation workspace..." />;
  if (!appointment) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center">
        <p className="text-sm font-semibold text-rose-600 mb-4">Appointment not found</p>
        <Link to="/doctor/appointments" className="px-4 py-2 bg-primary-600 text-white rounded-xl text-xs font-bold">
          Back to Appointments
        </Link>
      </div>
    );
  }

  const isCompleted = appointment.status === 'COMPLETED';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Header & Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          to="/doctor/appointments"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Patient Queue</span>
        </Link>
        <div className="flex items-center gap-2">
          <StatusBadge status={appointment.status} />
          <UrgencyBadge level={appointment.urgencyLevel} />
        </div>
      </div>

      {/* Patient Overview Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-tealAccent-600 to-primary-600 text-white flex items-center justify-center font-bold text-xl shadow-xs">
              {appointment.patientId?.name?.charAt(0) || 'P'}
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900">{appointment.patientId?.name}</h1>
              <p className="text-xs text-slate-500">{appointment.patientId?.email} &bull; {appointment.patientId?.phone || 'No phone'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100 font-medium">
            <span className="flex items-center gap-1 text-slate-700">
              <Calendar className="w-4 h-4 text-primary-500" />
              {appointment.date}
            </span>
            <span className="text-slate-300">|</span>
            <span className="flex items-center gap-1 text-slate-700">
              <Clock className="w-4 h-4 text-tealAccent-600" />
              {appointment.startTime} - {appointment.endTime}
            </span>
          </div>
        </div>
      </div>

      {/* AI Pre-Visit Triage & Reported Symptoms Card */}
      <PreVisitSummaryCard
        summary={appointment.preVisitSummary}
        urgencyLevel={appointment.urgencyLevel}
        rawSymptoms={appointment.symptoms}
      />

      {/* Doctor Consultation Workspace Editor */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Clinical Consultation Notes</h2>
            <p className="text-xs text-slate-500">Record diagnostic observations, findings, and follow-up advice.</p>
          </div>
          {isCompleted && (
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Consultation Finalized
            </span>
          )}
        </div>

        {/* Notes Textarea */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-primary-500" />
            Clinical Notes & Diagnosis
          </label>
          <textarea
            rows={5}
            value={visitNotes}
            onChange={(e) => setVisitNotes(e.target.value)}
            placeholder="Enter medical evaluation, vitals, diagnosis, and non-pharmacological instructions..."
            className="w-full text-xs sm:text-sm p-4 rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-primary-500 bg-slate-50/50"
          />
        </div>

        {/* Dynamic Prescription Builder */}
        <div className="pt-4 border-t border-slate-100">
          <PrescriptionBuilder items={prescription} onChange={setPrescription} />
        </div>

        {/* Action Bar */}
        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleSaveNotesAndPrescription}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition flex items-center justify-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Draft</span>
          </button>

          <button
            type="button"
            disabled={submitting}
            onClick={handleCompleteAppointment}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition flex items-center justify-center gap-2"
          >
            {submitting ? (
              'Generating AI Summary & Finalizing...'
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>{isCompleted ? 'Update & Regenerate AI Summary' : 'Complete Visit & Generate AI Summary'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* AI Post-Visit Patient Summary Preview */}
      {appointment.postVisitSummary && (
        <PostVisitSummaryCard summary={appointment.postVisitSummary} />
      )}
    </div>
  );
};

export default DoctorConsultation;
