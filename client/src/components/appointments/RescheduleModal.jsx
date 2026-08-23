import React, { useState } from 'react';
import Modal from '../common/Modal';
import SlotPicker from './SlotPicker';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

const RescheduleModal = ({ isOpen, onClose, appointment, onRescheduled }) => {
  const [newDate, setNewDate] = useState(
    appointment ? appointment.date : new Date().toISOString().split('T')[0]
  );
  const [newSlot, setNewSlot] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  if (!appointment) return null;

  const doctorId = appointment.doctorId?._id || appointment.doctorId;

  const handleReschedule = async (e) => {
    e.preventDefault();
    if (!newDate || !newSlot) {
      showToast('Please select both a date and a time slot.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await api.patch(`/appointments/${appointment._id}/reschedule`, {
        date: newDate,
        startTime: newSlot
      });
      showToast('Appointment rescheduled successfully!', 'success');
      if (onRescheduled) onRescheduled(data.data);
      onClose();
    } catch (err) {
      showToast(err.message || 'Failed to reschedule appointment.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Reschedule Appointment" maxWidth="max-w-2xl">
      <form onSubmit={handleReschedule} className="space-y-6">
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
          <p className="font-semibold text-slate-800">Current Schedule:</p>
          <p>
            {appointment.date} at {appointment.startTime} with Dr.{' '}
            {appointment.doctorId?.name || 'Assigned Doctor'}
          </p>
        </div>

        <SlotPicker
          doctorId={doctorId}
          selectedDate={newDate}
          onDateChange={setNewDate}
          selectedSlot={newSlot}
          onSlotSelect={setNewSlot}
        />

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!newSlot || submitting}
            className="px-5 py-2 text-xs font-semibold rounded-xl bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 transition shadow-xs"
          >
            {submitting ? 'Updating...' : 'Confirm Reschedule'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default RescheduleModal;
