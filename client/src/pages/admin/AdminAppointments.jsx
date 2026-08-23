import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
  Calendar,
  Clock,
  Search,
  Filter,
  User,
  Stethoscope,
  Sparkles,
  FileText,
  CheckCircle2,
  XCircle,
  RefreshCw
} from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { StatusBadge, UrgencyBadge } from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import PreVisitSummaryCard from '../../components/appointments/PreVisitSummaryCard';
import PostVisitSummaryCard from '../../components/appointments/PostVisitSummaryCard';

const AdminAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [urgencyFilter, setUrgencyFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const { showToast } = useToast();

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/appointments');
      setAppointments(data.data || []);
    } catch (err) {
      showToast(err.message || 'Failed to load appointments', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const filtered = appointments.filter((appt) => {
    const matchesStatus = statusFilter === 'ALL' || appt.status === statusFilter;
    const matchesUrgency = urgencyFilter === 'ALL' || appt.urgencyLevel === urgencyFilter;
    const matchesSearch =
      !searchTerm ||
      appt.patientId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appt.doctorId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appt.symptoms?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesStatus && matchesUrgency && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          System Appointments Registry
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Comprehensive overview of patient bookings, clinical summaries, and consultation statuses.
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search patient, doctor, symptoms..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-primary-500 bg-slate-50/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Status filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold uppercase text-slate-400">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs py-1.5 px-2.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-700"
            >
              <option value="ALL">All Statuses</option>
              <option value="BOOKED">Booked</option>
              <option value="COMPLETED">Completed</option>
              <option value="RESCHEDULED">Rescheduled</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* Urgency filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold uppercase text-slate-400">Urgency:</span>
            <select
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value)}
              className="text-xs py-1.5 px-2.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-700"
            >
              <option value="ALL">All Urgencies</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
              <option value="Unknown">Unknown</option>
            </select>
          </div>
        </div>
      </div>

      {/* Appointments Table */}
      {loading ? (
        <LoadingSpinner label="Loading all appointments..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No Appointments Found"
          description="No appointments found matching your current search filters."
        />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-6">Patient</th>
                  <th className="py-3.5 px-6">Doctor</th>
                  <th className="py-3.5 px-6">Date & Time</th>
                  <th className="py-3.5 px-6">Urgency</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filtered.map((appt) => (
                  <tr key={appt._id} className="hover:bg-slate-50/60 transition">
                    <td className="py-4 px-6">
                      <p className="font-bold text-slate-900">{appt.patientId?.name || 'Unknown Patient'}</p>
                      <p className="text-[11px] text-slate-400">{appt.patientId?.email}</p>
                    </td>

                    <td className="py-4 px-6">
                      <p className="font-bold text-slate-900">{appt.doctorId?.name || 'Unknown Doctor'}</p>
                      <p className="text-[11px] text-primary-600 font-semibold">{appt.doctorId?.specialisation}</p>
                    </td>

                    <td className="py-4 px-6">
                      <p className="font-bold text-slate-800">{appt.date}</p>
                      <p className="text-[11px] text-slate-400">{appt.startTime} - {appt.endTime}</p>
                    </td>

                    <td className="py-4 px-6">
                      <UrgencyBadge level={appt.urgencyLevel} />
                    </td>

                    <td className="py-4 px-6">
                      <StatusBadge status={appt.status} />
                    </td>

                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => setSelectedAppointment(appt)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Appointment Inspector Modal */}
      {selectedAppointment && (
        <Modal
          isOpen={Boolean(selectedAppointment)}
          onClose={() => setSelectedAppointment(null)}
          title={`Appointment Details - ${selectedAppointment.date}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <StatusBadge status={selectedAppointment.status} />
                <UrgencyBadge level={selectedAppointment.urgencyLevel} />
              </div>
              <span className="text-xs text-slate-400">ID: {selectedAppointment._id}</span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="font-semibold text-slate-400 uppercase text-[10px]">Patient</p>
                <p className="font-bold text-slate-900 text-sm mt-0.5">{selectedAppointment.patientId?.name}</p>
                <p className="text-slate-500">{selectedAppointment.patientId?.email}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="font-semibold text-slate-400 uppercase text-[10px]">Doctor</p>
                <p className="font-bold text-slate-900 text-sm mt-0.5">{selectedAppointment.doctorId?.name}</p>
                <p className="text-primary-600 font-semibold">{selectedAppointment.doctorId?.specialisation}</p>
              </div>
            </div>

            {/* Reported Symptoms */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Symptoms</h4>
              <p className="text-xs text-slate-700 p-3 bg-slate-50 rounded-xl border border-slate-100">
                {selectedAppointment.symptoms}
              </p>
            </div>

            {/* Pre-Visit Triage */}
            <PreVisitSummaryCard
              summary={selectedAppointment.preVisitSummary}
              urgencyLevel={selectedAppointment.urgencyLevel}
              rawSymptoms={selectedAppointment.symptoms}
            />

            {/* Prescriptions if any */}
            {selectedAppointment.prescription && selectedAppointment.prescription.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Prescription Items</h4>
                <div className="space-y-1.5 text-xs">
                  {selectedAppointment.prescription.map((p, i) => (
                    <div key={i} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex justify-between">
                      <span className="font-bold text-slate-800">{p.medicine} ({p.dosage})</span>
                      <span className="text-slate-500">{p.frequency} &bull; {p.duration}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Post-Visit Summary */}
            {selectedAppointment.postVisitSummary && (
              <PostVisitSummaryCard summary={selectedAppointment.postVisitSummary} />
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminAppointments;
