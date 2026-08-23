const express = require('express');
const router = express.Router();
const {
  getGoogleAuthUrl,
  googleAuthCallback,
  getCalendarStatus,
  disconnectCalendar
} = require('../controllers/calendarController');
const { protect } = require('../middleware/authMiddleware');

router.get('/google', protect, getGoogleAuthUrl);
router.get('/google/callback', googleAuthCallback);
router.get('/status', protect, getCalendarStatus);
router.delete('/google', protect, disconnectCalendar);

module.exports = router;
