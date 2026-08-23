const express = require('express');
const router = express.Router();
const {
  getDoctors,
  getDoctorById,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  getDoctorSlots,
  addDoctorLeave,
  removeDoctorLeave
} = require('../controllers/doctorController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/rbacMiddleware');

router.get('/', getDoctors);
router.get('/:id', getDoctorById);
router.post('/', protect, authorize('admin'), createDoctor);
router.patch('/:id', protect, authorize('admin', 'doctor'), updateDoctor);
router.delete('/:id', protect, authorize('admin'), deleteDoctor);

// Slots & Leave Management
router.get('/:id/slots', getDoctorSlots);
router.post('/:id/leave', protect, authorize('admin', 'doctor'), addDoctorLeave);
router.delete('/:id/leave/:leaveId', protect, authorize('admin', 'doctor'), removeDoctorLeave);

module.exports = router;
