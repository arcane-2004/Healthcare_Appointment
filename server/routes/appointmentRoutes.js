const express = require('express');
const router = express.Router();
const {
  bookAppointment,
  getAppointments,
  getAppointmentById,
  rescheduleAppointment,
  cancelAppointment,
  addConsultationNotes,
  addPrescription,
  completeAppointment
} = require('../controllers/appointmentController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/rbacMiddleware');

// General appointment routes
router.post('/', protect, bookAppointment);
router.get('/', protect, getAppointments);
router.get('/:id', protect, getAppointmentById);
router.patch('/:id/reschedule', protect, rescheduleAppointment);
router.post('/:id/cancel', protect, cancelAppointment);

// Doctor consultation routes
router.post('/:id/notes', protect, authorize('doctor', 'admin'), addConsultationNotes);
router.post('/:id/prescription', protect, authorize('doctor', 'admin'), addPrescription);
router.post('/:id/complete', protect, authorize('doctor', 'admin'), completeAppointment);

module.exports = router;
