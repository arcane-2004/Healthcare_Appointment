import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Calendar,
  Sparkles,
  ShieldCheck,
  Clock,
  HeartPulse,
  Activity,
  ArrowRight,
  CheckCircle2,
  Stethoscope
} from 'lucide-react';

const SPECIALTIES = [
  { name: 'Cardiologist', count: 'Heart & Vascular', icon: HeartPulse, color: 'bg-rose-50 text-rose-600 border-rose-100' },
  { name: 'Dermatologist', count: 'Skin & Allergies', icon: Activity, color: 'bg-teal-50 text-teal-600 border-teal-100' },
  { name: 'General Physician', count: 'Primary Healthcare', icon: Stethoscope, color: 'bg-blue-50 text-blue-600 border-blue-100' },
  { name: 'Neurologist', count: 'Brain & Nerves', icon: Sparkles, color: 'bg-purple-50 text-purple-600 border-purple-100' }
];

const Home = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/doctors?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/doctors');
    }
  };

  return (
    <div className="space-y-20 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 bg-gradient-to-b from-primary-50/70 via-white to-slate-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-100 text-primary-800 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-primary-600" />
              AI-Powered Healthcare Appointment System
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Smarter Healthcare Consultations & Seamless Follow-ups
            </h1>

            <p className="text-lg text-slate-600 leading-relaxed">
              Book verified specialists in real-time, get intelligent pre-visit symptom triage powered by Google Gemini, and receive clear post-visit medication follow-ups.
            </p>

            {/* Quick Search Form */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto flex flex-col sm:flex-row gap-2.5 p-2 bg-white rounded-2xl shadow-lg border border-slate-200/80">
              <div className="relative flex-1 flex items-center">
                <Search className="w-5 h-5 text-slate-400 absolute left-3.5" />
                <input
                  type="text"
                  placeholder="Search doctor by name or specialty (e.g. Cardiologist)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 text-sm rounded-xl focus:outline-hidden text-slate-800 placeholder-slate-400"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold rounded-xl shadow-md shadow-primary-600/30 transition flex items-center justify-center gap-2"
              >
                <span>Find Doctors</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 font-medium pt-2">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Instant Real-time Slots
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Zero Double-Booking Guarantee
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Google Calendar Sync
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Specialties Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Consult Top Clinical Specialists
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Filter doctors by medical discipline and book directly into their working hours.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {SPECIALTIES.map((spec) => {
            const Icon = spec.icon;
            return (
              <Link
                key={spec.name}
                to={`/doctors?specialisation=${encodeURIComponent(spec.name)}`}
                className="p-6 rounded-2xl bg-white border border-slate-200/80 hover:border-primary-400 hover:shadow-md transition group text-left flex flex-col justify-between"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border mb-4 ${spec.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-primary-600 transition">
                    {spec.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">{spec.count}</p>
                </div>
                <div className="mt-4 flex items-center text-xs font-semibold text-primary-600 gap-1 group-hover:translate-x-1 transition-transform">
                  <span>View Doctors</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Key Features Highlights */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-tr from-slate-900 to-slate-800 text-white rounded-3xl p-8 sm:p-12 shadow-xl">
          <div className="max-w-2xl mb-10">
            <span className="text-xs uppercase font-bold tracking-widest text-primary-400">
              Modern Clinical Workflow
            </span>
            <h2 className="text-3xl font-extrabold mt-2 tracking-tight">
              Designed for Patient Comfort and Doctor Precision
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-primary-500/20 border border-primary-500/30 flex items-center justify-center text-primary-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold">AI Pre-Visit Triage</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Gemini analyzes patient symptoms prior to the visit, prioritizing urgency (Low, Medium, High) and proposing targeted exploratory questions for the physician.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-tealAccent-500/20 border border-tealAccent-500/30 flex items-center justify-center text-tealAccent-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold">Guaranteed Slot Integrity</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Database-level compound unique indexing prevents double-booking race conditions, with dynamic slot calculation according to leave schedules and working days.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold">Post-Visit Summaries & Reminders</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Translates dense doctor notes into clear, patient-friendly action items with automated cron email notifications for daily medication schedules.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
