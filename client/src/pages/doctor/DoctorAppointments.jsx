import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
  Calendar,
  Clock,
  User,
  Search,
  FileEdit,
  Sparkles,
  ArrowRight,
  Filter
} from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { StatusBadge, UrgencyBadge } from '../../components/common/Badge';

const DoctorAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
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

  const filtered = appointments.filter((appt) => {
    const matchesStatus = statusFilter === 'ALL' || appt.status === statusFilter;
    const matchesSearch =
      !searchTerm ||
      appt.patientId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appt.symptoms?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Patient Consultations & Queue
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Review patient symptom triage, manage clinical notes, and prescribe medications.
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by patient name or symptoms..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-primary-500 bg-white"
          />
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

      {/* Consultations List */}
      {loading ? (
        <LoadingSpinner label="Loading consultation list..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No Appointments Found"
          description="No appointments found for the selected filter criteria."
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
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span>
                    Consultation: <strong className="text-slate-700">{appt.date}</strong> at{' '}
                    <strong className="text-slate-700">{appt.startTime}</strong>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                {/* Patient Information */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-tealAccent-600 to-primary-600 text-white flex items-center justify-center font-bold text-base shadow-xs flex-shrink-0">
                    {appt.patientId?.name?.charAt(0) || 'P'}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{appt.patientId?.name}</h3>
                    <p className="text-xs text-slate-500">{appt.patientId?.email}</p>
                    {appt.patientId?.phone && (
                      <p className="text-[11px] text-slate-400">{appt.patientId.phone}</p>
                    )}
                  </div>
                </div>

                {/* Symptoms / Chief Complaint */}
                <div className="md:col-span-2 space-y-1 text-xs text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <p className="font-semibold text-slate-500 uppercase text-[10px] tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-primary-500" />
                    Patient Reported Symptoms & AI Triage
                  </p>
                  <p className="font-medium">{appt.symptoms}</p>
                  {appt.preVisitSummary?.chiefComplaint && (
                    <p className="text-slate-500 italic text-[11px]">
                      Chief Complaint: {appt.preVisitSummary.chiefComplaint}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="flex items-center justify-end pt-3 border-t border-slate-100">
                <Link
                  to={`/doctor/appointments/${appt._id}`}
                  className="px-4 py-2 rounded-xl bg-primary-600 text-white text-xs font-bold hover:bg-primary-700 transition flex items-center gap-1.5 shadow-2xs"
                >
                  <FileEdit className="w-3.5 h-3.5" />
                  <span>
                    {appt.status === 'COMPLETED' ? 'Review Consultation & Prescription' : 'Open Consultation Workspace'}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DoctorAppointments;
