const { google } = require('googleapis');
const CalendarConnection = require('../models/CalendarConnection');

// Initialize Google OAuth2 client safely
const getOAuth2Client = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/calendar/google/callback';

  if (!clientId || !clientSecret || clientId.includes('your_google_client_id')) {
    return null;
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
};

/**
 * Generate Google OAuth Consent URL
 * @param {string} userId - User identifier to pass in state
 * @returns {string|null}
 */
const getAuthUrl = (userId) => {
  const oauth2Client = getOAuth2Client();
  if (!oauth2Client) return null;

  const scopes = [
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/userinfo.email'
  ];

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: scopes,
    state: userId
  });
};

/**
 * Exchange authorization code for tokens and save to DB
 * @param {string} code - OAuth code from callback
 * @param {string} userId - User ID
 */
const handleAuthCallback = async (code, userId) => {
  const oauth2Client = getOAuth2Client();
  if (!oauth2Client) {
    throw new Error('Google Calendar is not configured on the server.');
  }

  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  // Get Google user email if available
  let googleEmail = '';
  try {
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    googleEmail = userInfo.data.email || '';
  } catch (err) {
    console.warn('[Calendar Service] Could not fetch Google userinfo email:', err.message);
  }

  const updateData = {
    userId,
    accessToken: tokens.access_token,
    expiryDate: tokens.expiry_date,
    googleEmail
  };

  if (tokens.refresh_token) {
    updateData.refreshToken = tokens.refresh_token;
  }

  await CalendarConnection.findOneAndUpdate(
    { userId },
    { $set: updateData },
    { upsert: true, new: true }
  );

  return { success: true, googleEmail };
};

/**
 * Get authenticated Google Calendar client for a user
 * @param {string} userId
 * @returns {Promise<google.calendar_v3.Calendar|null>}
 */
const getCalendarForUser = async (userId) => {
  const connection = await CalendarConnection.findOne({ userId }).select('+accessToken +refreshToken');
  if (!connection) return null;

  const oauth2Client = getOAuth2Client();
  if (!oauth2Client) return null;

  oauth2Client.setCredentials({
    access_token: connection.accessToken,
    refresh_token: connection.refreshToken,
    expiry_date: connection.expiryDate
  });

  // Handle token refresh automatically
  oauth2Client.on('tokens', async (newTokens) => {
    try {
      const updates = { accessToken: newTokens.access_token, expiryDate: newTokens.expiry_date };
      if (newTokens.refresh_token) {
        updates.refreshToken = newTokens.refresh_token;
      }
      await CalendarConnection.updateOne({ userId }, { $set: updates });
    } catch (err) {
      console.error('[Calendar Service] Error saving refreshed token:', err.message);
    }
  });

  return google.calendar({ version: 'v3', auth: oauth2Client });
};

/**
 * Create a Google Calendar event for an appointment
 * @param {string} userId - Patient or Doctor user ID
 * @param {Object} appointmentData
 * @returns {Promise<string|null>} Created event ID or null
 */
const createEvent = async (userId, { doctorName, patientName, specialisation, date, startTime, endTime, symptoms }) => {
  try {
    const calendar = await getCalendarForUser(userId);
    if (!calendar) {
      // User hasn't connected Google Calendar or credentials missing
      return null;
    }

    const startDateTime = new Date(`${date}T${startTime}:00`).toISOString();
    const endDateTime = new Date(`${date}T${endTime}:00`).toISOString();

    const event = {
      summary: `Healthcare Appointment with Dr. ${doctorName}`,
      description: `Doctor: Dr. ${doctorName} (${specialisation})\nPatient: ${patientName}\nSymptoms: ${symptoms || 'None'}\n\nManaged by Healthcare Appointment Manager`,
      start: {
        dateTime: startDateTime,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
      },
      end: {
        dateTime: endDateTime,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 30 }
        ]
      }
    };

    const res = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event
    });

    console.log(`[Calendar Service] Event created on Google Calendar: ${res.data.id}`);
    return res.data.id;
  } catch (error) {
    console.error('[Calendar Service] Failed to create Google Calendar event:', error.message);
    return null;
  }
};

/**
 * Update an existing Google Calendar event
 */
const updateEvent = async (userId, eventId, { doctorName, patientName, date, startTime, endTime }) => {
  if (!eventId) return null;

  try {
    const calendar = await getCalendarForUser(userId);
    if (!calendar) return null;

    const startDateTime = new Date(`${date}T${startTime}:00`).toISOString();
    const endDateTime = new Date(`${date}T${endTime}:00`).toISOString();

    const res = await calendar.events.patch({
      calendarId: 'primary',
      eventId: eventId,
      requestBody: {
        summary: `Healthcare Appointment with Dr. ${doctorName} (Rescheduled)`,
        start: { dateTime: startDateTime },
        end: { dateTime: endDateTime }
      }
    });

    console.log(`[Calendar Service] Event updated on Google Calendar: ${eventId}`);
    return res.data.id;
  } catch (error) {
    console.error(`[Calendar Service] Failed to update Google Calendar event ${eventId}:`, error.message);
    return null;
  }
};

/**
 * Delete a Google Calendar event
 */
const deleteEvent = async (userId, eventId) => {
  if (!eventId) return;

  try {
    const calendar = await getCalendarForUser(userId);
    if (!calendar) return;

    await calendar.events.delete({
      calendarId: 'primary',
      eventId: eventId
    });

    console.log(`[Calendar Service] Event deleted from Google Calendar: ${eventId}`);
  } catch (error) {
    console.error(`[Calendar Service] Failed to delete Google Calendar event ${eventId}:`, error.message);
  }
};

/**
 * Check if a user has an active Google Calendar connection
 */
const isConnected = async (userId) => {
  const connection = await CalendarConnection.findOne({ userId });
  return Boolean(connection);
};

module.exports = {
  getAuthUrl,
  handleAuthCallback,
  createEvent,
  updateEvent,
  deleteEvent,
  isConnected
};
