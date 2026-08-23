import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
  Stethoscope,
  PlusCircle,
  Edit2,
  Trash2,
  Calendar,
  Clock,
  Search,
  CheckCircle2,
  XCircle,
  Plus,
  AlertTriangle
} from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';

const AdminDoctorList = () => {
  const [doctors, setDoctors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedDoctorForLeave, setSelectedDoctorForLeave] = useState(null);
  const [leaveDate, setLeaveDate] = useState('');
  const [leaveReason, setLeaveReason] = useState('Doctor administrative leave');
  const [submittingLeave, setSubmittingLeave] = useState(false);
  const { showToast } = useToast();

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/doctors?activeOnly=false');
      setDoctors(data.data || []);
    } catch (err) {
      showToast(err.message || 'Failed to load doctor list', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const handleToggleActive = async (doctor) => {
    try {
      await api.patch(`/doctors/${doctor._id}`, { isActive: !doctor.isActive });
      showToast(
        `Doctor ${doctor.isActive ? 'deactivated' : 'activated'} successfully.`,
        'success'
      );
      fetchDoctors();
    } catch (err) {
      showToast(err.message || 'Failed to update status', 'error');
    }
  };

  const handleAddLeave = async (e) => {
    e.preventDefault();
    if (!selectedDoctorForLeave || !leaveDate) return;

    setSubmittingLeave(true);
    try {
      const { data } = await api.post(`/doctors/${selectedDoctorForLeave._id}/leave`, {
        date: leaveDate,
        reason: leaveReason
      });

      showToast(
        data.message ||
          `Leave scheduled. ${data.affectedAppointmentsCount || 0} conflicting appointments cancelled and notified.`,
        'success'
      );
      setLeaveDate('');
      setSelectedDoctorForLeave(null);
      fetchDoctors();
    } catch (err) {
      showToast(err.message || 'Failed to schedule leave date', 'error');
    } finally {
      setSubmittingLeave(false);
    }
  };

  const handleRemoveLeave = async (doctorId, leaveId) => {
    try {
      await api.delete(`/doctors/${doctorId}/leave/${leaveId}`);
      showToast('Leave date removed successfully.', 'info');
      fetchDoctors();
    } catch (err) {
      showToast(err.message || 'Failed to remove leave.', 'error');
    }
  };

  const filtered = doctors.filter(
    (d) =>
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.specialisation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Doctor Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure specialist profiles, working hours, active statuses, and leave schedules.
          </p>
        </div>

        <Link
          to="/admin/doctors/create"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold transition shadow-xs self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add New Doctor</span>
        </Link>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Search by doctor name, specialty, or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-primary-500 bg-white"
        />
      </div>

      {/* Doctor Table */}
      {loading ? (
        <LoadingSpinner label="Loading doctor roster..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Stethoscope}
          title="No Doctors Registered"
          description="Create doctor profiles to enable patient appointments."
          actionText="Create Doctor"
          onAction={() => window.location.assign('/admin/doctors/create')}
        />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-6">Doctor Details</th>
                  <th className="py-3.5 px-6">Specialisation</th>
                  <th className="py-3.5 px-6">Working Hours & Days</th>
                  <th className="py-3.5 px-6">Leave Dates</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filtered.map((doc) => (
                  <tr key={doc._id} className="hover:bg-slate-50/60 transition">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-600 to-tealAccent-500 text-white flex items-center justify-center font-bold text-sm shadow-xs flex-shrink-0">
                          {doc.name.replace('Dr. ', '').charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{doc.name}</p>
                          <p className="text-[11px] text-slate-400">{doc.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 border border-primary-100">
                        {doc.specialisation}
                      </span>
                    </td>

                    <td className="py-4 px-6">
                      <p className="font-bold text-slate-800">
                        {doc.startTime} - {doc.endTime} ({doc.slotDuration}m)
                      </p>
                      <p className="text-[11px] text-slate-400 truncate max-w-xs">
                        {doc.workingDays?.join(', ')}
                      </p>
                    </td>

                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">
                          {doc.leaveDates?.length || 0} date(s)
                        </span>
                        <button
                          onClick={() => setSelectedDoctorForLeave(doc)}
                          className="p-1 rounded-md text-primary-600 hover:bg-primary-50 transition"
                          title="Manage Leave Dates"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <button
                        onClick={() => handleToggleActive(doc)}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition ${
                          doc.isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {doc.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>

                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/admin/doctors/${doc._id}/edit`}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-primary-600 hover:bg-slate-100 transition"
                          title="Edit Doctor Settings"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Leave Date Manager Modal */}
      {selectedDoctorForLeave && (
        <Modal
          isOpen={Boolean(selectedDoctorForLeave)}
          onClose={() => setSelectedDoctorForLeave(null)}
          title={`Manage Leave Dates - ${selectedDoctorForLeave.name}`}
          maxWidth="max-w-xl"
        >
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Automated Conflict Resolution</p>
                <p className="mt-0.5 text-[11px] text-amber-800">
                  Any existing booked appointments on the selected date will be cancelled, deleted from Google Calendar, and affected patients will receive cancellation notifications.
                </p>
              </div>
            </div>

            {/* Add Leave Form */}
            <form onSubmit={handleAddLeave} className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <h4 className="text-xs font-bold text-slate-700">Schedule New Leave</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Leave Date *</label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={leaveDate}
                    onChange={(e) => setLeaveDate(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Reason</label>
                  <input
                    type="text"
                    value={leaveReason}
                    onChange={(e) => setLeaveReason(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={submittingLeave}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition"
                >
                  {submittingLeave ? 'Applying Leave...' : 'Add Leave & Notify Patients'}
                </button>
              </div>
            </form>

            {/* Existing Leaves List */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Scheduled Leaves ({selectedDoctorForLeave.leaveDates?.length || 0})
              </h4>
              {selectedDoctorForLeave.leaveDates?.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No leaves scheduled.</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedDoctorForLeave.leaveDates.map((l) => (
                    <div
                      key={l._id || l.date}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-slate-900">{l.date}</span>
                        <span className="text-slate-500 ml-2">&bull; {l.reason}</span>
                      </div>
                      <button
                        onClick={() => handleRemoveLeave(selectedDoctorForLeave._id, l._id || l.date)}
                        className="text-rose-600 hover:text-rose-800 p-1"
                        title="Remove leave"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminDoctorList;
