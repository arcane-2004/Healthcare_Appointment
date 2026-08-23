const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const slotService = require('../services/slotService');
const aiService = require('../services/aiService');
const {
  sendNotificationEmail,
  generateBookingEmailHtml,
  generateDoctorBookingNoticeHtml,
  generateCancellationEmailHtml,
  generateRescheduleEmailHtml
} = require('../services/emailService');
const calendarService = require('../services/calendarService');

// @desc    Book a new appointment
// @route   POST /api/appointments
// @access  Private (Patient/Admin)
const bookAppointment = async (req, res, next) => {
  try {
    const { doctorId, date, startTime, symptoms } = req.body;
    const patientId = req.user.role === 'admin' && req.body.patientId ? req.body.patientId : req.user.id;

    if (!doctorId || !date || !startTime || !symptoms) {
      return res.status(400).json({
        success: false,
        message: 'Please provide doctorId, date (YYYY-MM-DD), startTime (HH:mm), and symptoms.'
      });
    }

    // 1. Validate Doctor
    const doctor = await Doctor.findById(doctorId).populate('userId', 'name email');
    if (!doctor || !doctor.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found or currently inactive.'
      });
    }

    // 2. Validate Slot Availability
    const isAvailable = await slotService.isSlotAvailable(doctorId, date, startTime);
    if (!isAvailable) {
      return res.status(409).json({
        success: false,
        message: 'This slot has already been booked or is not available.'
      });
    }

    // Calculate endTime based on slotDuration
    const startMin = slotService.timeToMinutes(startTime);
    const endMin = startMin + (doctor.slotDuration || 30);
    const endTime = slotService.minutesToTime(endMin);

    // 3. Generate AI Pre-Visit Symptom Summary (Decoupled with resilient fallback)
    let aiSummary = null;
    let urgency = 'Unknown';
    try {
      aiSummary = await aiService.generatePreVisitSummary(symptoms);
      if (aiSummary && aiSummary.urgencyLevel) {
        urgency = aiSummary.urgencyLevel;
      }
    } catch (aiErr) {
      console.warn('[Appointment Controller] AI pre-visit summary failed, proceeding with booking:', aiErr.message);
      aiSummary = {
        urgencyLevel: 'Unknown',
        chiefComplaint: 'Automated AI triage unavailable.',
        suggestedQuestions: []
      };
    }

    // 4. Save Appointment to Database
    let appointment;
    try {
      appointment = await Appointment.create({
        patientId,
        doctorId: doctor._id,
        date,
        startTime,
        endTime,
        status: 'BOOKED',
        symptoms,
        preVisitSummary: aiSummary,
        urgencyLevel: urgency
      });
    } catch (dbErr) {
      // Catch MongoDB Compound Unique Index Collision (code 11000)
      if (dbErr.code === 11000) {
        return res.status(409).json({
          success: false,
          message: 'This slot has already been booked.'
        });
      }
      throw dbErr;
    }

    const patient = await User.findById(patientId);

    // 5. Google Calendar Event Creation (Non-blocking)
    calendarService
      .createEvent(patientId, {
        doctorName: doctor.name,
        patientName: patient.name,
        specialisation: doctor.specialisation,
        date,
        startTime,
        endTime,
        symptoms
      })
      .then(async (eventId) => {
        if (eventId) {
          appointment.calendarEventId = eventId;
          await appointment.save();
        }
      })
      .catch((calErr) => console.warn('[Appointment Booking] Calendar creation error:', calErr.message));

    // 6. Asynchronous Email Confirmation (Non-blocking)
    // To Patient:
    const patientEmailHtml = generateBookingEmailHtml({
      patientName: patient.name,
      doctorName: doctor.name,
      specialisation: doctor.specialisation,
      date,
      startTime,
      endTime,
      symptoms
    });

    sendNotificationEmail({
      userId: patient._id,
      recipientEmail: patient.email,
      type: 'BOOKING_CONFIRMATION',
      subject: `Appointment Confirmed with Dr. ${doctor.name} on ${date}`,
      message: patientEmailHtml,
      metadata: { appointmentId: appointment._id, doctorId: doctor._id }
    }).catch((emailErr) => console.warn('[Appointment Booking] Patient email error:', emailErr.message));

    // To Doctor:
    if (doctor.email) {
      const doctorEmailHtml = generateDoctorBookingNoticeHtml({
        doctorName: doctor.name,
        patientName: patient.name,
        date,
        startTime,
        endTime,
        symptoms,
        urgencyLevel: urgency
      });

      sendNotificationEmail({
        userId: doctor.userId?._id || doctor.userId,
        recipientEmail: doctor.email,
        type: 'BOOKING_CONFIRMATION',
        subject: `New Appointment: ${patient.name} on ${date} at ${startTime}`,
        message: doctorEmailHtml,
        metadata: { appointmentId: appointment._id, patientId: patient._id }
      }).catch((emailErr) => console.warn('[Appointment Booking] Doctor email error:', emailErr.message));
    }

    // 7. Return 201 Response
    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully.',
      data: appointment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all appointments (Role filtered)
// @route   GET /api/appointments
// @access  Private
const getAppointments = async (req, res, next) => {
  try {
    const { status, date, urgencyLevel } = req.query;
    const filter = {};

    // Role-based scoping
    if (req.user.role === 'patient') {
      filter.patientId = req.user.id;
    } else if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ userId: req.user.id });
      if (!doctor) {
        return res.status(200).json({ success: true, count: 0, data: [] });
      }
      filter.doctorId = doctor._id;
    }
    // Admin sees all

    if (status) {
      filter.status = status.toUpperCase();
    }

    if (date) {
      filter.date = date;
    }

    if (urgencyLevel) {
      filter.urgencyLevel = urgencyLevel;
    }

    const appointments = await Appointment.find(filter)
      .populate('patientId', 'name email phone')
      .populate('doctorId', 'name specialisation email startTime endTime slotDuration')
      .sort({ date: -1, startTime: 1 });

    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single appointment by ID
// @route   GET /api/appointments/:id
// @access  Private
const getAppointmentById = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patientId', 'name email phone')
      .populate('doctorId', 'name specialisation email bio startTime endTime slotDuration');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found.'
      });
    }

    // Verify Access Permissions
    if (req.user.role === 'patient' && appointment.patientId._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this appointment.'
      });
    }

    if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ userId: req.user.id });
      if (!doctor || appointment.doctorId._id.toString() !== doctor._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view this appointment.'
        });
      }
    }

    res.status(200).json({
      success: true,
      data: appointment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reschedule appointment
// @route   PATCH /api/appointments/:id/reschedule
// @access  Private
const rescheduleAppointment = async (req, res, next) => {
  try {
    const { date, startTime } = req.body;
    if (!date || !startTime) {
      return res.status(400).json({
        success: false,
        message: 'Please provide new date and startTime.'
      });
    }

    const appointment = await Appointment.findById(req.params.id)
      .populate('doctorId', 'name specialisation email slotDuration')
      .populate('patientId', 'name email');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found.'
      });
    }

    if (appointment.status === 'CANCELLED' || appointment.status === 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: `Cannot reschedule a ${appointment.status.toLowerCase()} appointment.`
      });
    }

    // Check slot availability
    const isAvailable = await slotService.isSlotAvailable(appointment.doctorId._id, date, startTime);
    if (!isAvailable) {
      return res.status(409).json({
        success: false,
        message: 'Selected slot is not available for rescheduling.'
      });
    }

    const oldDate = appointment.date;
    const oldTime = appointment.startTime;

    const startMin = slotService.timeToMinutes(startTime);
    const endMin = startMin + (appointment.doctorId.slotDuration || 30);
    const endTime = slotService.minutesToTime(endMin);

    appointment.date = date;
    appointment.startTime = startTime;
    appointment.endTime = endTime;
    appointment.status = 'RESCHEDULED';
    await appointment.save();

    // Update Google Calendar Event if exists
    if (appointment.calendarEventId) {
      calendarService
        .updateEvent(appointment.patientId._id, appointment.calendarEventId, {
          doctorName: appointment.doctorId.name,
          patientName: appointment.patientId.name,
          date,
          startTime,
          endTime
        })
        .catch((calErr) => console.warn('[Appointment Reschedule] Calendar update error:', calErr.message));
    }

    // Send Reschedule Email
    const emailHtml = generateRescheduleEmailHtml({
      patientName: appointment.patientId.name,
      doctorName: appointment.doctorId.name,
      oldDate,
      oldTime,
      newDate: date,
      newTime: startTime
    });

    sendNotificationEmail({
      userId: appointment.patientId._id,
      recipientEmail: appointment.patientId.email,
      type: 'RESCHEDULE',
      subject: `Appointment Rescheduled: Dr. ${appointment.doctorId.name}`,
      message: emailHtml,
      metadata: { appointmentId: appointment._id }
    }).catch((emailErr) => console.warn('[Appointment Reschedule] Email error:', emailErr.message));

    res.status(200).json({
      success: true,
      message: 'Appointment rescheduled successfully.',
      data: appointment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel appointment
// @route   POST /api/appointments/:id/cancel
// @access  Private
const cancelAppointment = async (req, res, next) => {
  try {
    const { reason = 'Cancelled by user' } = req.body;
    const appointment = await Appointment.findById(req.params.id)
      .populate('doctorId', 'name email userId')
      .populate('patientId', 'name email');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found.'
      });
    }

    if (appointment.status === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        message: 'Appointment is already cancelled.'
      });
    }

    appointment.status = 'CANCELLED';
    await appointment.save();

    // Delete Google Calendar Event if exists
    if (appointment.calendarEventId) {
      calendarService
        .deleteEvent(appointment.patientId._id, appointment.calendarEventId)
        .catch((calErr) => console.warn('[Appointment Cancel] Calendar deletion error:', calErr.message));
    }

    // Dispatch Cancellation Emails to Patient and Doctor
    const patientEmailHtml = generateCancellationEmailHtml({
      recipientName: appointment.patientId.name,
      doctorName: appointment.doctorId.name,
      patientName: appointment.patientId.name,
      date: appointment.date,
      startTime: appointment.startTime,
      reason
    });

    sendNotificationEmail({
      userId: appointment.patientId._id,
      recipientEmail: appointment.patientId.email,
      type: 'CANCELLATION',
      subject: `Appointment Cancelled: Dr. ${appointment.doctorId.name} (${appointment.date})`,
      message: patientEmailHtml,
      metadata: { appointmentId: appointment._id }
    }).catch((err) => console.warn('[Appointment Cancel] Patient email error:', err.message));

    res.status(200).json({
      success: true,
      message: 'Appointment cancelled successfully.',
      data: appointment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Doctor add consultation notes
// @route   POST /api/appointments/:id/notes
// @access  Private (Doctor only)
const addConsultationNotes = async (req, res, next) => {
  try {
    const { visitNotes } = req.body;
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found.'
      });
    }

    appointment.visitNotes = visitNotes || '';
    await appointment.save();

    res.status(200).json({
      success: true,
      message: 'Consultation notes updated successfully.',
      data: appointment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Doctor add/update prescription
// @route   POST /api/appointments/:id/prescription
// @access  Private (Doctor only)
const addPrescription = async (req, res, next) => {
  try {
    const { prescription } = req.body;
    if (!Array.isArray(prescription)) {
      return res.status(400).json({
        success: false,
        message: 'Prescription must be an array of medicine objects.'
      });
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found.'
      });
    }

    appointment.prescription = prescription;
    await appointment.save();

    res.status(200).json({
      success: true,
      message: 'Prescription updated successfully.',
      data: appointment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Doctor complete appointment & generate AI post-visit summary
// @route   POST /api/appointments/:id/complete
// @access  Private (Doctor only)
const completeAppointment = async (req, res, next) => {
  try {
    const { visitNotes, prescription } = req.body;
    const appointment = await Appointment.findById(req.params.id)
      .populate('patientId', 'name email')
      .populate('doctorId', 'name specialisation');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found.'
      });
    }

    if (visitNotes !== undefined) {
      appointment.visitNotes = visitNotes;
    }
    if (prescription !== undefined && Array.isArray(prescription)) {
      appointment.prescription = prescription;
    }

    appointment.status = 'COMPLETED';

    // 11. Generate Patient-Friendly AI Post-Visit Summary (Decoupled with graceful fallback)
    try {
      const summary = await aiService.generatePostVisitSummary(
        appointment.visitNotes,
        appointment.prescription
      );
      appointment.postVisitSummary = summary;
    } catch (aiErr) {
      console.warn('[Appointment Complete] Post-visit AI generation failed, using fallback:', aiErr.message);
      appointment.postVisitSummary =
        'Your doctor has completed the visit. Please review the prescription and consultation notes.';
    }

    await appointment.save();

    res.status(200).json({
      success: true,
      message: 'Appointment completed and post-visit summary generated.',
      data: appointment
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  bookAppointment,
  getAppointments,
  getAppointmentById,
  rescheduleAppointment,
  cancelAppointment,
  addConsultationNotes,
  addPrescription,
  completeAppointment
};
