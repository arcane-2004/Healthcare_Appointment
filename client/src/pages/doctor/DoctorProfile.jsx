import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  Clock,
  Calendar,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Stethoscope,
  Mail,
  User
} from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const DoctorProfile = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [specialisation, setSpecialisation] = useState('');
  const [bio, setBio] = useState('');
  const [workingDays, setWorkingDays] = useState([]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [slotDuration, setSlotDuration] = useState(30);

  // Leave Date state
  const [leaveDate, setLeaveDate] = useState('');
  const [leaveReason, setLeaveReason] = useState('Attending medical conference');
  const [submittingLeave, setSubmittingLeave] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  const fetchDoctorProfile = async () => {
    try {
      const { data } = await api.get('/auth/me');
      if (data.data?.doctorProfile) {
        const doc = data.data.doctorProfile;
        setDoctor(doc);
        setSpecialisation(doc.specialisation || '');
        setBio(doc.bio || '');
        setWorkingDays(doc.workingDays || []);
        setStartTime(doc.startTime || '09:00');
        setEndTime(doc.endTime || '17:00');
        setSlotDuration(doc.slotDuration || 30);
      }
    } catch (err) {
      showToast('Failed to load profile details', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctorProfile();
  }, []);

  const handleUpdateSchedule = async (e) => {
    e.preventDefault();
    if (!doctor) return;

    setSavingProfile(true);
    try {
      await api.patch(`/doctors/${doctor._id}`, {
        specialisation,
        bio,
        workingDays,
        startTime,
        endTime,
        slotDuration: Number(slotDuration)
      });
      showToast('Doctor schedule and profile updated successfully!', 'success');
      fetchDoctorProfile();
    } catch (err) {
      showToast(err.message || 'Failed to update schedule.', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const toggleDay = (day) => {
    if (workingDays.includes(day)) {
      setWorkingDays(workingDays.filter((d) => d !== day));
    } else {
      setWorkingDays([...workingDays, day]);
    }
  };

  const handleAddLeave = async (e) => {
    e.preventDefault();
    if (!leaveDate) {
      showToast('Please select a leave date', 'warning');
      return;
    }

    setSubmittingLeave(true);
    try {
      const { data } = await api.post(`/doctors/${doctor._id}/leave`, {
        date: leaveDate,
        reason: leaveReason
      });

      showToast(
        data.message || `Leave added. ${data.affectedAppointmentsCount || 0} conflicting appointments cancelled and notified.`,
        'success'
      );
      setLeaveDate('');
      fetchDoctorProfile();
    } catch (err) {
      showToast(err.message || 'Failed to schedule leave date.', 'error');
    } finally {
      setSubmittingLeave(false);
    }
  };

  const handleRemoveLeave = async (leaveId) => {
    try {
      await api.delete(`/doctors/${doctor._id}/leave/${leaveId}`);
      showToast('Leave date removed.', 'info');
      fetchDoctorProfile();
    } catch (err) {
      showToast(err.message || 'Failed to remove leave.', 'error');
    }
  };

  if (loading) return <LoadingSpinner label="Loading practice settings..." />;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Practice & Schedule Settings</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure your working hours, consultation duration, and manage leave dates with automated patient notifications.
        </p>
      </div>

      {/* Profile & Timings Form */}
      <form onSubmit={handleUpdateSchedule} className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
          <Stethoscope className="w-5 h-5 text-primary-600" />
          Clinical Details & Hours
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Specialisation
            </label>
            <input
              type="text"
              required
              value={specialisation}
              onChange={(e) => setSpecialisation(e.target.value)}
              className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-primary-500 bg-slate-50/50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Slot Duration (Minutes)
            </label>
            <select
              value={slotDuration}
              onChange={(e) => setSlotDuration(e.target.value)}
              className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-primary-500 bg-slate-50/50"
            >
              <option value="15">15 Minutes</option>
              <option value="20">20 Minutes</option>
              <option value="30">30 Minutes (Recommended)</option>
              <option value="45">45 Minutes</option>
              <option value="60">60 Minutes</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
            Professional Biography
          </label>
          <textarea
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-primary-500 bg-slate-50/50"
            placeholder="Share your clinical background, medical qualifications, and specialties..."
          />
        </div>

        {/* Working Days */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
            Working Days
          </label>
          <div className="flex flex-wrap gap-2">
            {DAYS_OF_WEEK.map((day) => {
              const active = workingDays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                    active
                      ? 'bg-primary-600 text-white border-primary-600 shadow-2xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        {/* Start & End Times */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Start Time (HH:mm)
            </label>
            <input
              type="time"
              required
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-primary-500 bg-slate-50/50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              End Time (HH:mm)
            </label>
            <input
              type="time"
              required
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-primary-500 bg-slate-50/50"
            />
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-100">
          <button
            type="submit"
            disabled={savingProfile}
            className="px-6 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold shadow-xs transition"
          >
            {savingProfile ? 'Saving...' : 'Save Schedule Changes'}
          </button>
        </div>
      </form>

      {/* Leave Management Section */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-tealAccent-600" />
            Scheduled Leave Dates & Auto-Cancellation
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Adding a leave date automatically cancels any existing booked appointments for that day, deletes linked calendar events, and sends email notices to affected patients.
          </p>
        </div>

        {/* Add Leave Form */}
        <form onSubmit={handleAddLeave} className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
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
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Reason / Note</label>
            <input
              type="text"
              value={leaveReason}
              onChange={(e) => setLeaveReason(e.target.value)}
              placeholder="e.g. Vacation, Medical Leave"
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={submittingLeave}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{submittingLeave ? 'Scheduling...' : 'Add Leave'}</span>
            </button>
          </div>
        </form>

        {/* Leave Dates List */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            Active Leave Dates ({doctor?.leaveDates?.length || 0})
          </h4>

          {!doctor?.leaveDates || doctor.leaveDates.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No scheduled leave dates on record.</p>
          ) : (
            <div className="space-y-2">
              {doctor.leaveDates.map((l) => (
                <div
                  key={l._id || l.date}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-900">{l.date}</span>
                    <span className="text-slate-500">&bull; {l.reason || 'Doctor unavailable'}</span>
                  </div>
                  <button
                    onClick={() => handleRemoveLeave(l._id || l.date)}
                    className="text-rose-600 hover:text-rose-800 transition p-1"
                    title="Remove leave date"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorProfile;
