const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');

// Helper to convert "HH:mm" to minutes from midnight
const timeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

// Helper to convert minutes from midnight to "HH:mm"
const minutesToTime = (totalMinutes) => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

// Day name helper for date (e.g. 'Monday')
const getDayName = (dateStr) => {
  // dateStr is 'YYYY-MM-DD'
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[d.getDay()];
};

/**
 * Dynamically generate available time slots for a doctor on a specific date
 * @param {string} doctorId - Doctor's ObjectId
 * @param {string} dateStr - Date formatted as YYYY-MM-DD
 * @returns {Promise<Array<{ startTime: string, endTime: string, available: boolean }>>}
 */
const getAvailableSlots = async (doctorId, dateStr) => {
  const doctor = await Doctor.findById(doctorId);
  if (!doctor || !doctor.isActive) {
    return [];
  }

  // 1. Check if the date is on doctor's leave list
  const isLeave = doctor.leaveDates.some((leave) => leave.date === dateStr);
  if (isLeave) {
    return [];
  }

  // 2. Check if the day of week is in doctor's working days
  const dayName = getDayName(dateStr);
  if (!doctor.workingDays.includes(dayName)) {
    return [];
  }

  // 3. Generate all potential slots based on working hours and duration
  const startMin = timeToMinutes(doctor.startTime || '09:00');
  const endMin = timeToMinutes(doctor.endTime || '17:00');
  const duration = doctor.slotDuration || 30;

  const generatedSlots = [];
  let currentMin = startMin;

  while (currentMin + duration <= endMin) {
    const slotStart = minutesToTime(currentMin);
    const slotEnd = minutesToTime(currentMin + duration);
    generatedSlots.push({
      startTime: slotStart,
      endTime: slotEnd,
      available: true
    });
    currentMin += duration;
  }

  if (generatedSlots.length === 0) {
    return [];
  }

  // 4. Query active appointments for this doctor on this date
  const bookedAppointments = await Appointment.find({
    doctorId: doctor._id,
    date: dateStr,
    status: { $in: ['BOOKED', 'COMPLETED', 'RESCHEDULED'] }
  }).select('startTime endTime');

  const bookedStartTimes = new Set(bookedAppointments.map((appt) => appt.startTime));

  // 5. Mark availability (or filter out booked slots)
  // Check if date is today and slot has already passed
  const todayStr = new Date().toISOString().split('T')[0];
  const now = new Date();
  const currentMinutesNow = now.getHours() * 60 + now.getMinutes();

  return generatedSlots.map((slot) => {
    let isBooked = bookedStartTimes.has(slot.startTime);
    let isPast = false;

    if (dateStr === todayStr && timeToMinutes(slot.startTime) <= currentMinutesNow) {
      isPast = true;
    }

    return {
      startTime: slot.startTime,
      endTime: slot.endTime,
      available: !isBooked && !isPast,
      isBooked,
      isPast
    };
  });
};

/**
 * Validate whether a given slot is available for booking
 * @param {string} doctorId
 * @param {string} dateStr
 * @param {string} startTime
 * @returns {Promise<boolean>}
 */
const isSlotAvailable = async (doctorId, dateStr, startTime) => {
  const slots = await getAvailableSlots(doctorId, dateStr);
  const match = slots.find((s) => s.startTime === startTime && s.available);
  return Boolean(match);
};

module.exports = {
  getAvailableSlots,
  isSlotAvailable,
  timeToMinutes,
  minutesToTime,
  getDayName
};
