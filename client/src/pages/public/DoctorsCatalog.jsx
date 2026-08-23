import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { Search, Stethoscope, Clock, Calendar, ArrowRight, UserCheck } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';

const SPECIALISATION_LIST = [
  'All',
  'Cardiologist',
  'Dermatologist',
  'General Physician',
  'Neurologist',
  'Pediatrician',
  'Orthopedic'
];

const DoctorsCatalog = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  const initialSpecialty = searchParams.get('specialisation') || 'All';

  const [doctors, setDoctors] = useState([]);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedSpecialty, setSelectedSpecialty] = useState(initialSpecialty);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDoctors = async (search, spec) => {
    setLoading(true);
    setError('');
    try {
      let query = '?activeOnly=true';
      if (search) query += `&search=${encodeURIComponent(search)}`;
      if (spec && spec !== 'All') query += `&specialisation=${encodeURIComponent(spec)}`;

      const { data } = await api.get(`/doctors${query}`);
      setDoctors(data.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch doctors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors(searchTerm, selectedSpecialty);
  }, [selectedSpecialty]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchParams({ search: searchTerm, specialisation: selectedSpecialty });
    fetchDoctors(searchTerm, selectedSpecialty);
  };

  const handleSpecialtyChange = (spec) => {
    setSelectedSpecialty(spec);
    setSearchParams({ search: searchTerm, specialisation: spec });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-primary-900 via-primary-800 to-slate-900 text-white rounded-3xl p-8 sm:p-10 shadow-lg">
        <div className="max-w-2xl space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-primary-300">
            CareSync Specialists
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Find and Book Verified Doctors
          </h1>
          <p className="text-sm text-primary-100/90 leading-relaxed">
            Select a specialist, explore their real-time working schedule, and secure an instant appointment with AI pre-visit intake.
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="mt-6 flex flex-col sm:flex-row gap-2 max-w-xl">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search by doctor name or keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white text-slate-800 text-sm rounded-xl focus:outline-hidden"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white text-xs font-bold rounded-xl shadow-xs transition"
          >
            Search
          </button>
        </form>
      </div>

      {/* Specialization Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {SPECIALISATION_LIST.map((spec) => (
          <button
            key={spec}
            type="button"
            onClick={() => handleSpecialtyChange(spec)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
              selectedSpecialty === spec
                ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:border-primary-300 hover:bg-primary-50/50'
            }`}
          >
            {spec}
          </button>
        ))}
      </div>

      {/* Doctor Grid */}
      {loading ? (
        <LoadingSpinner label="Finding available specialists..." />
      ) : error ? (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm text-center">
          {error}
        </div>
      ) : doctors.length === 0 ? (
        <EmptyState
          icon={Stethoscope}
          title="No Doctors Found"
          description="We couldn't find any active doctors matching your search filters. Try adjusting your specialty or keywords."
          actionText="Reset Filters"
          onAction={() => {
            setSearchTerm('');
            setSelectedSpecialty('All');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((doctor) => (
            <div
              key={doctor._id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-primary-300 transition-all flex flex-col justify-between overflow-hidden"
            >
              <div className="p-6 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-primary-600 to-tealAccent-500 text-white flex items-center justify-center font-bold text-base shadow-xs flex-shrink-0">
                    {doctor.name.replace('Dr. ', '').charAt(0)}
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-primary-50 text-primary-700 border border-primary-100">
                    {doctor.specialisation}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900">{doctor.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {doctor.bio || 'Experienced medical professional offering comprehensive clinical consultations.'}
                  </p>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs text-slate-600 font-medium">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-primary-500" />
                    <span>
                      {doctor.startTime} - {doctor.endTime} ({doctor.slotDuration} min slots)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-tealAccent-600" />
                    <span className="truncate">
                      {doctor.workingDays?.join(', ') || 'Mon - Fri'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <Link
                  to={`/doctors/${doctor._id}`}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
                >
                  View Profile
                </Link>
                <Link
                  to={`/patient/book/${doctor._id}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-600 text-white text-xs font-bold hover:bg-primary-700 shadow-xs transition"
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

export default DoctorsCatalog;
