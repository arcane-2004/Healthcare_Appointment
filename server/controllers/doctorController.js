const Doctor = require('../models/Doctor');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const slotService = require('../services/slotService');
const { sendNotificationEmail, generateCancellationEmailHtml } = require('../services/emailService');
const calendarService = require('../services/calendarService');

// @desc    Get all active doctors (with search and filter)
// @route   GET /api/doctors
// @access  Public
const getDoctors = async (req, res, next) => {
  try {
    const { specialisation, search, activeOnly = 'true' } = req.query;
    const filter = {};

    if (activeOnly === 'true') {
      filter.isActive = true;
    }

    if (specialisation) {
      filter.specialisation = new RegExp(`^${specialisation}$`, 'i');
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { specialisation: { $regex: search, $options: 'i' } },
        { bio: { $regex: search, $options: 'i' } }
      ];
    }

    const doctors = await Doctor.find(filter).populate('userId', 'name email phone').sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: doctors.length,
      data: doctors
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single doctor by ID
// @route   GET /api/doctors/:id
// @access  Public
const getDoctorById = async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.params.id).populate('userId', 'name email phone');
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found.'
      });
    }

    res.status(200).json({
      success: true,
      data: doctor
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create doctor (Admin only)
// @route   POST /api/doctors
// @access  Private/Admin
const createDoctor = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password = 'Doctor@123',
      phone,
      specialisation,
      bio,
      workingDays,
      startTime,
      endTime,
      slotDuration
    } = req.body;

    if (!name || !email || !specialisation) {
      return res.status(400).json({
        success: false,
        message: 'Please provide doctor name, email, and specialisation.'
      });
    }

    // Check if user with email already exists
    let user = await User.findOne({ email: email.toLowerCase() });
    if (user) {
      return res.status(409).json({
        success: false,
        message: 'A user with this email already exists.'
      });
    }

    // Create User record
    user = await User.create({
      name,
      email,
      password,
      role: 'doctor',
      phone: phone || ''
    });

    // Create Doctor profile
    const doctor = await Doctor.create({
      userId: user._id,
      name: user.name,
      email: user.email,
      specialisation,
      bio: bio || '',
      workingDays: workingDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      startTime: startTime || '09:00',
      endTime: endTime || '17:00',
      slotDuration: Number(slotDuration) || 30
    });

    res.status(201).json({
      success: true,
      message: 'Doctor created successfully.',
      data: doctor
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update doctor profile / settings
// @route   PATCH /api/doctors/:id
// @access  Private (Admin or Doctor owner)
const updateDoctor = async (req, res, next) => {
  try {
    let doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found.'
      });
    }

    // Check permissions: Admin or Doctor updating their own profile
    if (req.user.role !== 'admin' && doctor.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this doctor profile.'
      });
    }

    const {
      name,
      specialisation,
      bio,
      workingDays,
      startTime,
      endTime,
      slotDuration,
      isActive,
      phone
    } = req.body;

    if (name) doctor.name = name;
    if (specialisation) doctor.specialisation = specialisation;
    if (bio !== undefined) doctor.bio = bio;
    if (workingDays) doctor.workingDays = workingDays;
    if (startTime) doctor.startTime = startTime;
    if (endTime) doctor.endTime = endTime;
    if (slotDuration) doctor.slotDuration = Number(slotDuration);
    if (isActive !== undefined && req.user.role === 'admin') doctor.isActive = isActive;

    await doctor.save();

    // Also update User name & phone if provided
    if (name || phone) {
      const userUpdates = {};
      if (name) userUpdates.name = name;
      if (phone) userUpdates.phone = phone;
      await User.findByIdAndUpdate(doctor.userId, userUpdates);
    }

    res.status(200).json({
      success: true,
      message: 'Doctor updated successfully.',
      data: doctor
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete/Deactivate doctor
// @route   DELETE /api/doctors/:id
// @access  Private/Admin
const deleteDoctor = async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found.'
      });
    }

    // Soft deactivate doctor
    doctor.isActive = false;
    await doctor.save();

    res.status(200).json({
      success: true,
      message: 'Doctor has been deactivated successfully.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get available slots for a doctor on a specific date
// @route   GET /api/doctors/:id/slots
// @access  Public
const getDoctorSlots = async (req, res, next) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date query parameter is required (YYYY-MM-DD).'
      });
    }

    const slots = await slotService.getAvailableSlots(req.params.id, date);

    res.status(200).json({
      success: true,
      data: {
        date,
        doctorId: req.params.id,
        slots
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add leave date for doctor & auto-cancel conflicting appointments
// @route   POST /api/doctors/:id/leave
// @access  Private (Admin or Doctor owner)
const addDoctorLeave = async (req, res, next) => {
  try {
    const { date, reason = 'Doctor unavailable' } = req.body;
    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Leave date is required (YYYY-MM-DD).'
      });
    }

    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found.'
      });
    }

    // Check authorization
    if (req.user.role !== 'admin' && doctor.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to manage leave for this doctor.'
      });
    }

    // Check if leave already exists on this date
    const alreadyLeave = doctor.leaveDates.some((l) => l.date === date);
    if (alreadyLeave) {
      return res.status(400).json({
        success: false,
        message: `Leave date ${date} is already scheduled for this doctor.`
      });
    }

    // Add leave to doctor
    doctor.leaveDates.push({ date, reason });
    await doctor.save();

    // 12. Doctor Leave Handling:
    // Find all active BOOKED appointments on this date
    const affectedAppointments = await Appointment.find({
      doctorId: doctor._id,
      date: date,
      status: 'BOOKED'
    }).populate('patientId', 'name email');

    console.log(`[Doctor Leave] Found ${affectedAppointments.length} booked appointments affected on ${date}`);

    const cancelledList = [];

    // Cancel affected appointments, notify patients, and delete calendar events
    for (const appt of affectedAppointments) {
      appt.status = 'CANCELLED';
      await appt.save();
      cancelledList.push(appt._id);

      // Async email notification to affected patient
      if (appt.patientId && appt.patientId.email) {
        const emailHtml = generateCancellationEmailHtml({
          recipientName: appt.patientId.name,
          doctorName: doctor.name,
          patientName: appt.patientId.name,
          date: appt.date,
          startTime: appt.startTime,
          reason: `Doctor is on leave (${reason})`
        });

        sendNotificationEmail({
          userId: appt.patientId._id,
          recipientEmail: appt.patientId.email,
          type: 'LEAVE_NOTICE',
          subject: `Important: Appointment Cancelled due to Doctor Leave (${date})`,
          message: emailHtml,
          metadata: {
            appointmentId: appt._id,
            doctorId: doctor._id,
            leaveDate: date
          }
        }).catch((err) => console.error('[Doctor Leave] Email error:', err.message));
      }

      // Delete Google Calendar event if present
      if (appt.calendarEventId) {
        calendarService.deleteEvent(appt.patientId._id, appt.calendarEventId).catch((err) =>
          console.error('[Doctor Leave] Calendar deletion error:', err.message)
        );
      }
    }

    res.status(200).json({
      success: true,
      message: `Leave date scheduled. ${affectedAppointments.length} appointment(s) affected and cancelled.`,
      affectedAppointmentsCount: affectedAppointments.length,
      cancelledAppointmentIds: cancelledList,
      leaveDates: doctor.leaveDates
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove leave date
// @route   DELETE /api/doctors/:id/leave/:leaveId
// @access  Private (Admin or Doctor owner)
const removeDoctorLeave = async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found.'
      });
    }

    if (req.user.role !== 'admin' && doctor.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to manage leave for this doctor.'
      });
    }

    doctor.leaveDates = doctor.leaveDates.filter(
      (l) => l._id.toString() !== req.params.leaveId && l.date !== req.params.leaveId
    );
    await doctor.save();

    res.status(200).json({
      success: true,
      message: 'Leave date removed successfully.',
      leaveDates: doctor.leaveDates
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDoctors,
  getDoctorById,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  getDoctorSlots,
  addDoctorLeave,
  removeDoctorLeave
};
