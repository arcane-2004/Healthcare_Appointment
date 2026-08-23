const Appointment = require('../models/Appointment');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Notification = require('../models/Notification');
const { sendNotificationEmail, generateMedicationReminderEmailHtml } = require('../services/emailService');

/**
 * Extract duration in days from string like "5 days", "1 week", "10 days"
 */
const parseDurationDays = (durationStr) => {
  if (!durationStr) return 7;
  const match = durationStr.match(/(\d+)/);
  if (!match) return 7;
  const num = parseInt(match[1], 10);
  if (durationStr.toLowerCase().includes('week')) return num * 7;
  if (durationStr.toLowerCase().includes('month')) return num * 30;
  return num;
};

const runMedicationReminderJob = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find completed appointments that have prescriptions
    const completedAppointments = await Appointment.find({
      status: 'COMPLETED',
      'prescription.0': { $exists: true }
    }).populate('patientId', 'name email').populate('doctorId', 'name specialisation');

    if (completedAppointments.length === 0) return;

    for (const appt of completedAppointments) {
      if (!appt.patientId || !appt.patientId.email) continue;

      const apptDate = new Date(appt.date);
      apptDate.setHours(0, 0, 0, 0);

      // Check max duration of the prescription items
      const maxDays = Math.max(
        ...appt.prescription.map((p) => parseDurationDays(p.duration))
      );

      const daysDiff = Math.floor((today - apptDate) / (1000 * 60 * 60 * 24));

      // If appointment is within duration window (e.g. within 0 to maxDays)
      if (daysDiff >= 0 && daysDiff <= maxDays) {
        // Check if a reminder has already been sent today for this appointment
        const existingReminderToday = await Notification.findOne({
          userId: appt.patientId._id,
          type: 'MEDICATION_REMINDER',
          'metadata.appointmentId': appt._id,
          createdAt: { $gte: today }
        });

        if (!existingReminderToday) {
          console.log(`[Medication Reminder Job] Dispatching reminder to ${appt.patientId.email} for appointment ${appt._id}`);
          
          const emailHtml = generateMedicationReminderEmailHtml({
            patientName: appt.patientId.name,
            doctorName: appt.doctorId?.name || 'Your Doctor',
            prescription: appt.prescription
          });

          await sendNotificationEmail({
            userId: appt.patientId._id,
            recipientEmail: appt.patientId.email,
            type: 'MEDICATION_REMINDER',
            subject: `Medication Reminder - Dr. ${appt.doctorId?.name || 'Healthcare'}`,
            message: emailHtml,
            metadata: {
              appointmentId: appt._id,
              dayNumber: daysDiff + 1
            }
          });
        }
      }
    }
  } catch (error) {
    console.error('[Medication Reminder Job] Error running medication reminders:', error.message);
  }
};

module.exports = runMedicationReminderJob;
