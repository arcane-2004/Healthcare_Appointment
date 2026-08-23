const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Notification = require('../models/Notification');

// @desc    Get Admin Dashboard Stats & Metrics
// @route   GET /api/admin/stats
// @access  Private/Admin
const getAdminStats = async (req, res, next) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];

    const [
      totalDoctors,
      totalPatients,
      todayAppointments,
      cancelledAppointments,
      completedAppointments,
      totalAppointments,
      recentAppointments,
      pendingNotificationsCount
    ] = await Promise.all([
      Doctor.countDocuments(),
      User.countDocuments({ role: 'patient' }),
      Appointment.countDocuments({ date: todayStr }),
      Appointment.countDocuments({ status: 'CANCELLED' }),
      Appointment.countDocuments({ status: 'COMPLETED' }),
      Appointment.countDocuments(),
      Appointment.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('patientId', 'name email phone')
        .populate('doctorId', 'name specialisation'),
      Notification.countDocuments({ status: 'FAILED' })
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalDoctors,
        totalPatients,
        todayAppointments,
        cancelledAppointments,
        completedAppointments,
        totalAppointments,
        pendingNotificationsCount,
        recentAppointments
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminStats
};
