const calendarService = require('../services/calendarService');
const CalendarConnection = require('../models/CalendarConnection');

// @desc    Get Google OAuth consent URL
// @route   GET /api/calendar/google
// @access  Private
const getGoogleAuthUrl = async (req, res, next) => {
  try {
    const authUrl = calendarService.getAuthUrl(req.user.id);
    if (!authUrl) {
      return res.status(200).json({
        success: false,
        message: 'Google Calendar credentials are not configured on the server.'
      });
    }

    res.status(200).json({
      success: true,
      url: authUrl
    });
  } catch (error) {
    next(error);
  }
};

// @desc    OAuth Callback from Google
// @route   GET /api/calendar/google/callback
// @access  Public
const googleAuthCallback = async (req, res) => {
  const { code, state: userId, error } = req.query;
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

  if (error || !code) {
    return res.redirect(`${clientUrl}/patient/profile?calendar_error=${encodeURIComponent(error || 'Access denied')}`);
  }

  try {
    await calendarService.handleAuthCallback(code, userId);
    res.redirect(`${clientUrl}/patient/profile?calendar_connected=true`);
  } catch (err) {
    console.error('[Calendar Controller] Callback error:', err.message);
    res.redirect(`${clientUrl}/patient/profile?calendar_error=${encodeURIComponent(err.message)}`);
  }
};

// @desc    Get current user calendar connection status
// @route   GET /api/calendar/status
// @access  Private
const getCalendarStatus = async (req, res, next) => {
  try {
    const connection = await CalendarConnection.findOne({ userId: req.user.id });
    res.status(200).json({
      success: true,
      data: {
        connected: Boolean(connection),
        googleEmail: connection ? connection.googleEmail : null
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Disconnect Google Calendar
// @route   DELETE /api/calendar/google
// @access  Private
const disconnectCalendar = async (req, res, next) => {
  try {
    await CalendarConnection.deleteOne({ userId: req.user.id });
    res.status(200).json({
      success: true,
      message: 'Google Calendar disconnected successfully.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getGoogleAuthUrl,
  googleAuthCallback,
  getCalendarStatus,
  disconnectCalendar
};
