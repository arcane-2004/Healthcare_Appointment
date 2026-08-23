import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
  Stethoscope,
  ArrowLeft,
  Save,
  Clock,
  Calendar,
  User,
  Mail,
  Lock,
  Phone
} from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const AdminDoctorForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Doctor@123');
  const [phone, setPhone] = useState('');
  const [specialisation, setSpecialisation] = useState('General Physician');
  const [bio, setBio] = useState('');
  const [workingDays, setWorkingDays] = useState(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [slotDuration, setSlotDuration] = useState(30);

  useEffect(() => {
    if (isEdit) {
      const fetchDoctor = async () => {
        try {
          const { data } = await api.get(`/doctors/${id}`);
          const doc = data.data;
          setName(doc.name);
          setEmail(doc.email);
          setPhone(doc.userId?.phone || '');
          setSpecialisation(doc.specialisation);
          setBio(doc.bio || '');
          setWorkingDays(doc.workingDays || []);
          setStartTime(doc.startTime || '09:00');
          setEndTime(doc.endTime || '17:00');
          setSlotDuration(doc.slotDuration || 30);
        } catch (err) {
          showToast(err.message || 'Failed to load doctor', 'error');
          navigate('/admin/doctors');
        } finally {
          setLoading(false);
        }
      };
      fetchDoctor();
    }
  }, [id, isEdit]);

  const toggleDay = (day) => {
    if (workingDays.includes(day)) {
      setWorkingDays(workingDays.filter((d) => d !== day));
    } else {
      setWorkingDays([...workingDays, day]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !specialisation) {
      showToast('Please fill in required doctor details', 'warning');
      return;
    }

    if (workingDays.length === 0) {
      showToast('Please select at least one working day', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      if (isEdit) {
        await api.patch(`/doctors/${id}`, {
          name,
          phone,
          specialisation,
          bio,
          workingDays,
          startTime,
          endTime,
          slotDuration: Number(slotDuration)
        });
        showToast('Doctor updated successfully!', 'success');
      } else {
        await api.post('/doctors', {
          name,
          email,
          password,
          phone,
          specialisation,
          bio,
          workingDays,
          startTime,
          endTime,
          slotDuration: Number(slotDuration)
        });
        showToast('Doctor registered successfully!', 'success');
      }
      navigate('/admin/doctors');
    } catch (err) {
      showToast(err.message || 'Operation failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner label="Loading doctor details..." />;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb Header */}
      <div className="flex items-center justify-between">
        <Link
          to="/admin/doctors"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Doctor Roster</span>
        </Link>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">
            {isEdit ? `Edit ${name}` : 'Register New Doctor'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure clinical credentials, working days, and dynamic slot duration settings.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic User Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Doctor Full Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Rahul Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-primary-500 bg-slate-50/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  disabled={isEdit}
                  placeholder="doctor@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-primary-500 bg-slate-50/50 disabled:bg-slate-100 disabled:text-slate-500"
                />
              </div>
            </div>

            {!isEdit && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Initial Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="Doctor@123"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-primary-500 bg-slate-50/50"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="tel"
                  placeholder="+91 992XXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-primary-500 bg-slate-50/50"
                />
              </div>
            </div>
          </div>

          {/* Specialty & Bio */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Specialisation *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Cardiologist, Dermatologist"
                value={specialisation}
                onChange={(e) => setSpecialisation(e.target.value)}
                className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-primary-500 bg-slate-50/50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Slot Duration (Minutes)
              </label>
              <select
                value={slotDuration}
                onChange={(e) => setSlotDuration(e.target.value)}
                className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-primary-500 bg-slate-50/50"
              >
                <option value="15">15 Minutes</option>
                <option value="20">20 Minutes</option>
                <option value="30">30 Minutes (Standard)</option>
                <option value="45">45 Minutes</option>
                <option value="60">60 Minutes</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Doctor Biography
            </label>
            <textarea
              rows={3}
              placeholder="Clinical experience, certifications, and hospital affiliations..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full p-3 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-primary-500 bg-slate-50/50"
            />
          </div>

          {/* Working Days */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              Working Days *
            </label>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((d) => {
                const active = workingDays.includes(d);
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleDay(d)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition ${
                      active
                        ? 'bg-primary-600 text-white border-primary-600 shadow-2xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Timings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Shift Start Time (HH:mm)
              </label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-primary-500 bg-slate-50/50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Shift End Time (HH:mm)
              </label>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-primary-500 bg-slate-50/50"
              />
            </div>
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
            <Link
              to="/admin/doctors"
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold shadow-md shadow-primary-600/30 transition flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{submitting ? 'Saving...' : isEdit ? 'Update Doctor' : 'Create Doctor'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminDoctorForm;
