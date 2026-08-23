import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { Stethoscope, Clock, Calendar, ShieldCheck, Mail, ArrowRight } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const DoctorPublicProfile = () => {
  const { id } = useParams();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        const { data } = await api.get(`/doctors/${id}`);
        setDoctor(data.data);
      } catch (err) {
        setError(err.message || 'Failed to load doctor profile');
      } finally {
        setLoading(false);
      }
    };
    fetchDoctor();
  }, [id]);

  if (loading) return <LoadingSpinner label="Loading doctor details..." />;
  if (error || !doctor) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center">
        <p className="text-sm font-semibold text-rose-600 mb-4">{error || 'Doctor not found'}</p>
        <Link
          to="/doctors"
          className="px-4 py-2 text-xs font-bold bg-primary-600 text-white rounded-xl"
        >
          Back to Doctors
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Profile Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-8 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-primary-600 to-tealAccent-500 text-white flex items-center justify-center text-3xl font-extrabold shadow-md shadow-primary-500/20">
            {doctor.name.replace('Dr. ', '').charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-slate-900">{doctor.name}</h1>
              <ShieldCheck className="w-5 h-5 text-tealAccent-600" />
            </div>
            <p className="text-sm font-semibold text-primary-600 mt-0.5">{doctor.specialisation}</p>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              {doctor.email}
            </p>
          </div>
        </div>

        <Link
          to={`/patient/book/${doctor._id}`}
          className="w-full md:w-auto px-6 py-3.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold rounded-2xl shadow-md shadow-primary-600/30 transition flex items-center justify-center gap-2"
        >
          <span>Book Appointment</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Profile Details & Timings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Biography */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">About Doctor</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              {doctor.bio || 'Experienced practitioner dedicated to delivering patient-centric medical advice and evidence-based clinical treatments.'}
            </p>
          </div>

          {/* Consultation Process */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Consultation Protocol</h3>
            <div className="space-y-2 text-xs text-slate-600">
              <p className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-500"></span>
                Enter reported symptoms during booking to generate AI pre-visit clinical triage.
              </p>
              <p className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-500"></span>
                Receive email confirmation & optional Google Calendar sync.
              </p>
              <p className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-500"></span>
                Post-consultation digital prescription and AI patient summary generated automatically.
              </p>
            </div>
          </div>
        </div>

        {/* Schedule & Working Hours Sidebar */}
        <div className="space-y-6">
          <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-lg space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-primary-400">Practice Schedule</h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-primary-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-slate-400">Daily Working Hours</p>
                  <p className="font-bold text-white text-sm">
                    {doctor.startTime} - {doctor.endTime}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {doctor.slotDuration} min consultation slots
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 pt-3 border-t border-slate-800">
                <Calendar className="w-4 h-4 text-tealAccent-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-slate-400">Operating Days</p>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {doctor.workingDays?.map((d) => (
                      <span key={d} className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px] font-semibold">
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <Link
              to={`/patient/book/${doctor._id}`}
              className="w-full mt-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5"
            >
              <span>Schedule Visit</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorPublicProfile;
