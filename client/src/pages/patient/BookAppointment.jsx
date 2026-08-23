import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import SlotPicker from '../../components/appointments/SlotPicker';
import {
  Stethoscope,
  Sparkles,
  AlertCircle,
  FileText,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const BookAppointment = () => {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [doctor, setDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [symptoms, setSymptoms] = useState('');
  const [loadingDoctor, setLoadingDoctor] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch Doctor Details
  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        const { data } = await api.get(`/doctors/${doctorId}`);
        setDoctor(data.data);
      } catch (err) {
        setErrorMsg(err.message || 'Failed to load doctor information.');
      } finally {
        setLoadingDoctor(false);
      }
    };

    if (doctorId) fetchDoctor();
  }, [doctorId]);

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!selectedDate || !selectedSlot) {
      showToast('Please select a date and an available time slot.', 'warning');
      return;
    }

    if (!symptoms.trim()) {
      showToast('Please describe your symptoms before booking.', 'warning');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const { data } = await api.post('/appointments', {
        doctorId,
        date: selectedDate,
        startTime: selectedSlot,
        symptoms: symptoms.trim()
      });

      showToast('Appointment booked successfully! AI pre-visit triage completed.', 'success');
      navigate(`/patient/appointments/${data.data._id}`);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to complete appointment booking.');
      showToast(err.message || 'Booking failed.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingDoctor) return <LoadingSpinner label="Loading doctor availability..." />;

  if (!doctor) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center">
        <p className="text-sm font-semibold text-rose-600 mb-4">{errorMsg || 'Doctor not found'}</p>
        <Link to="/patient/doctors" className="px-4 py-2 bg-primary-600 text-white rounded-xl text-xs font-bold">
          Back to Doctors
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Book Appointment with {doctor.name}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Select your desired date, choose an available time slot, and enter your symptoms for AI pre-visit summary.
        </p>
      </div>

      {/* Doctor Summary Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary-600 to-tealAccent-500 text-white flex items-center justify-center font-bold text-xl shadow-xs">
            {doctor.name.replace('Dr. ', '').charAt(0)}
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">{doctor.name}</h3>
            <p className="text-xs font-semibold text-primary-600">{doctor.specialisation}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Working Hours: {doctor.startTime} - {doctor.endTime} ({doctor.slotDuration} min consultations)
            </p>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Booking Form */}
      <form onSubmit={handleBooking} className="space-y-8">
        {/* 1. Interactive Slot Picker */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
          <SlotPicker
            doctorId={doctor._id}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            selectedSlot={selectedSlot}
            onSlotSelect={setSelectedSlot}
          />
        </div>

        {/* 2. Symptom Intake with AI Pre-visit note */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Describe Your Symptoms *
              </label>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Provide details such as duration, severity, and any associated conditions.
              </p>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-50 text-primary-700 text-[10px] font-bold border border-primary-100">
              <Sparkles className="w-3 h-3 text-primary-600" /> AI Pre-Triage Enabled
            </span>
          </div>

          <textarea
            required
            rows={4}
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            placeholder="e.g. Experiencing persistent migraine with visual sensitivity and mild nausea for the past 3 days..."
            className="w-full text-xs sm:text-sm p-4 rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-primary-500 bg-slate-50/50"
          />

          <div className="p-3 bg-primary-50/50 border border-primary-100 rounded-xl flex items-start gap-2.5 text-[11px] text-primary-900">
            <Sparkles className="w-4 h-4 text-primary-600 flex-shrink-0 mt-0.5" />
            <span>
              Google Gemini will process your symptoms into an urgency level assessment and generate suggested exploratory questions for your physician prior to the consultation.
            </span>
          </div>
        </div>

        {/* 3. Booking Submit Action */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-slate-900 text-white rounded-2xl shadow-lg">
          <div className="text-left w-full sm:w-auto">
            <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Selected Slot</p>
            <p className="text-sm font-bold text-white">
              {selectedDate} &bull; {selectedSlot ? `${selectedSlot}` : 'Please choose a slot'}
            </p>
          </div>

          <button
            type="submit"
            disabled={!selectedSlot || !symptoms.trim() || submitting}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-primary-500 hover:bg-primary-600 disabled:opacity-40 text-white text-xs sm:text-sm font-bold shadow-md transition flex items-center justify-center gap-2"
          >
            {submitting ? (
              'Confirming & Generating AI Triage...'
            ) : (
              <>
                <span>Confirm & Book Appointment</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BookAppointment;
