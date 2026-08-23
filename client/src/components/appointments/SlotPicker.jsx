import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Clock, Calendar, AlertCircle } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';

const SlotPicker = ({ doctorId, selectedDate, onDateChange, selectedSlot, onSlotSelect }) => {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch slots whenever doctorId or selectedDate changes
  useEffect(() => {
    if (!doctorId || !selectedDate) return;

    const fetchSlots = async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await api.get(`/doctors/${doctorId}/slots?date=${selectedDate}`);
        setSlots(data.data.slots || []);
      } catch (err) {
        setError(err.message || 'Failed to load time slots.');
        setSlots([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSlots();
  }, [doctorId, selectedDate]);

  // Generate date options (today + next 14 days)
  const getUpcomingDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const iso = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNum = d.getDate();
      const month = d.toLocaleDateString('en-US', { month: 'short' });
      dates.push({ iso, dayName, dayNum, month });
    }
    return dates;
  };

  const dateList = getUpcomingDates();

  return (
    <div className="space-y-6">
      {/* 1. Date Picker Horizontal Carousel */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
          Select Appointment Date
        </label>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {dateList.map((d) => {
            const isSelected = selectedDate === d.iso;
            return (
              <button
                key={d.iso}
                type="button"
                onClick={() => {
                  onDateChange(d.iso);
                  onSlotSelect(null); // Reset slot
                }}
                className={`flex-shrink-0 flex flex-col items-center justify-center w-20 py-3 px-2 rounded-xl border text-center transition-all ${
                  isSelected
                    ? 'bg-primary-600 border-primary-600 text-white shadow-md shadow-primary-600/20'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-primary-300 hover:bg-primary-50/50'
                }`}
              >
                <span className={`text-[11px] font-medium uppercase ${isSelected ? 'text-primary-100' : 'text-slate-400'}`}>
                  {d.dayName}
                </span>
                <span className="text-lg font-bold my-0.5">{d.dayNum}</span>
                <span className={`text-[11px] ${isSelected ? 'text-primary-100' : 'text-slate-500'}`}>
                  {d.month}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Slot Selection Grid */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
            Available Time Slots
          </label>
          <span className="text-xs text-slate-400">
            {slots.filter((s) => s.available).length} slots available
          </span>
        </div>

        {loading ? (
          <div className="p-8 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center">
            <LoadingSpinner label="Calculating available slots..." />
          </div>
        ) : error ? (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        ) : slots.length === 0 ? (
          <div className="p-6 bg-amber-50/60 border border-amber-200 rounded-2xl text-center">
            <Calendar className="w-6 h-6 text-amber-600 mx-auto mb-1.5" />
            <p className="text-xs font-semibold text-amber-900">No Slots Available</p>
            <p className="text-[11px] text-amber-700 mt-0.5">
              The doctor is either off-duty, on scheduled leave, or fully booked on this date.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
            {slots.map((slot) => {
              const isSelected = selectedSlot === slot.startTime;
              const isAvailable = slot.available;

              return (
                <button
                  key={slot.startTime}
                  type="button"
                  disabled={!isAvailable}
                  onClick={() => onSlotSelect(slot.startTime)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all ${
                    !isAvailable
                      ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed line-through opacity-60'
                      : isSelected
                      ? 'bg-primary-600 border-primary-600 text-white shadow-sm shadow-primary-600/30'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-primary-500 hover:text-primary-600 hover:bg-primary-50/30'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>{slot.startTime}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SlotPicker;
