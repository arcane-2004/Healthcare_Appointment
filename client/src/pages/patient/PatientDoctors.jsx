import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Search, Stethoscope, Clock, Calendar, ArrowRight } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';

const SPECIALISATIONS = [
  'All',
  'Cardiologist',
  'Dermatologist',
  'General Physician',
  'Neurologist',
  'Pediatrician',
  'Orthopedic'
];

const PatientDoctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');
  const [loading, setLoading] = useState(true);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      let query = '?activeOnly=true';
      if (searchTerm) query += `&search=${encodeURIComponent(searchTerm)}`;
      if (selectedSpecialty !== 'All') query += `&specialisation=${encodeURIComponent(selectedSpecialty)}`;
      const { data } = await api.get(`/doctors${query}`);
      setDoctors(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, [selectedSpecialty]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchDoctors();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Available Specialists</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Select a physician to view their real-time calendar and schedule an appointment.
        </p>
      </div>

      {/* Search & Specialty Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <form onSubmit={handleSearch} className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by doctor name or specialty..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-primary-500 bg-white"
          />
        </form>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          {SPECIALISATIONS.map((spec) => (
            <button
              key={spec}
              onClick={() => setSelectedSpecialty(spec)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition border ${
                selectedSpecialty === spec
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {spec}
            </button>
          ))}
        </div>
      </div>

      {/* Doctors Grid */}
      {loading ? (
        <LoadingSpinner label="Loading available doctors..." />
      ) : doctors.length === 0 ? (
        <EmptyState
          icon={Stethoscope}
          title="No Doctors Found"
          description="Try clearing your search term or selecting a different specialty."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {doctors.map((doc) => (
            <div
              key={doc._id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between hover:border-primary-300 transition"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-600 to-tealAccent-500 text-white flex items-center justify-center font-bold text-sm">
                    {doc.name.replace('Dr. ', '').charAt(0)}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 border border-primary-100">
                    {doc.specialisation}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900">{doc.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{doc.bio || 'General clinical consultation'}</p>
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-1 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-primary-500" />
                    <span>{doc.startTime} - {doc.endTime} ({doc.slotDuration} min)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-tealAccent-600" />
                    <span className="truncate">{doc.workingDays?.join(', ')}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <Link
                  to={`/doctors/${doc._id}`}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-900"
                >
                  Details
                </Link>
                <Link
                  to={`/patient/book/${doc._id}`}
                  className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-primary-600 text-white text-xs font-bold hover:bg-primary-700 transition shadow-2xs"
                >
                  <span>Book Slot</span>
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

export default PatientDoctors;
