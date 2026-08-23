const nodemailer = require('nodemailer');
const Notification = require('../models/Notification');

// Setup Transporter
let transporter = null;

const getTransporter = async () => {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  const port = parseInt(process.env.SMTP_PORT, 10) || 587;

  if (host && user && pass && user !== 'your_email@gmail.com') {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass
      }
    });
  } else {
    // Development fallback: mock / console logger or ethereal
    console.log('[Email Service] SMTP not configured. Emails will be logged to console and saved as SENT/simulated.');
    transporter = {
      sendMail: async (options) => {
        console.log('\n--- [SIMULATED EMAIL DISPATCH] ---');
        console.log(`To: ${options.to}`);
        console.log(`Subject: ${options.subject}`);
        console.log(`Body (Preview):\n${options.text || options.html?.replace(/<[^>]*>?/gm, '')}`);
        console.log('----------------------------------\n');
        return { messageId: `mock-${Date.now()}` };
      }
    };
  }

  return transporter;
};

/**
 * Dispatch an email notification and record status in the Notification collection
 * @param {Object} params
 * @param {string} params.userId - User recipient ObjectId
 * @param {string} params.recipientEmail - Email address
 * @param {string} params.type - Notification type
 * @param {string} params.subject - Email subject
 * @param {string} params.message - HTML/Text message
 * @param {Object} [params.metadata] - Extra metadata
 * @returns {Promise<Object>} Created Notification document
 */
const sendNotificationEmail = async ({
  userId,
  recipientEmail,
  type,
  subject,
  message,
  metadata = {}
}) => {
  let notificationRecord;

  try {
    // 1. Create PENDING notification record in DB
    notificationRecord = await Notification.create({
      userId,
      recipientEmail,
      type,
      subject,
      message,
      status: 'PENDING',
      retryCount: 0,
      metadata
    });

    // 2. Attempt dispatch
    const mailClient = await getTransporter();
    const fromAddress = process.env.EMAIL_FROM || '"HealthCare Appointments" <noreply@healthcare.com>';

    await mailClient.sendMail({
      from: fromAddress,
      to: recipientEmail,
      subject,
      html: message,
      text: message.replace(/<[^>]*>?/gm, '')
    });

    // 3. Mark SENT on success
    notificationRecord.status = 'SENT';
    await notificationRecord.save();
    console.log(`[Email Service] Notification (${type}) sent successfully to ${recipientEmail}`);
  } catch (error) {
    console.error(`[Email Service] Failed to send email to ${recipientEmail}:`, error.message);
    if (notificationRecord) {
      notificationRecord.status = 'FAILED';
      notificationRecord.retryCount = 0;
      await notificationRecord.save();
    }
  }

  return notificationRecord;
};

// --- Template Generators ---

const generateBookingEmailHtml = ({ patientName, doctorName, specialisation, date, startTime, endTime, symptoms }) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #0284c7; margin-top: 0;">Appointment Confirmed</h2>
      <p>Hello <strong>${patientName}</strong>,</p>
      <p>Your healthcare appointment has been successfully scheduled.</p>
      
      <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #0284c7;">
        <p style="margin: 6px 0;"><strong>Doctor:</strong> ${doctorName} (${specialisation})</p>
        <p style="margin: 6px 0;"><strong>Date:</strong> ${date}</p>
        <p style="margin: 6px 0;"><strong>Time:</strong> ${startTime} - ${endTime}</p>
        <p style="margin: 6px 0;"><strong>Reported Symptoms:</strong> ${symptoms || 'None specified'}</p>
      </div>

      <p>If you need to reschedule or cancel, please log in to your patient portal in advance.</p>
      <p style="color: #64748b; font-size: 13px; margin-top: 30px;">Healthcare Appointment Manager &copy; 2026</p>
    </div>
  `;
};

const generateDoctorBookingNoticeHtml = ({ doctorName, patientName, date, startTime, endTime, symptoms, urgencyLevel }) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #0f766e; margin-top: 0;">New Appointment Scheduled</h2>
      <p>Hello <strong>${doctorName}</strong>,</p>
      <p>A new appointment has been scheduled by a patient.</p>
      
      <div style="background-color: #f0fdfa; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #0f766e;">
        <p style="margin: 6px 0;"><strong>Patient:</strong> ${patientName}</p>
        <p style="margin: 6px 0;"><strong>Date:</strong> ${date}</p>
        <p style="margin: 6px 0;"><strong>Time:</strong> ${startTime} - ${endTime}</p>
        <p style="margin: 6px 0;"><strong>Urgency Level:</strong> <span style="font-weight:bold; color: ${urgencyLevel === 'High' ? '#dc2626' : urgencyLevel === 'Medium' ? '#d97706' : '#16a34a'}">${urgencyLevel || 'Unknown'}</span></p>
        <p style="margin: 6px 0;"><strong>Symptoms:</strong> ${symptoms || 'None'}</p>
      </div>

      <p>Please review your doctor portal for full AI pre-visit insights.</p>
      <p style="color: #64748b; font-size: 13px; margin-top: 30px;">Healthcare Appointment Manager &copy; 2026</p>
    </div>
  `;
};

const generateCancellationEmailHtml = ({ recipientName, doctorName, patientName, date, startTime, reason }) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #e11d48; margin-top: 0;">Appointment Cancelled</h2>
      <p>Hello <strong>${recipientName}</strong>,</p>
      <p>The appointment scheduled for <strong>${date} at ${startTime}</strong> has been cancelled.</p>
      ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
      <div style="background-color: #fff1f2; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #e11d48;">
        <p style="margin: 6px 0;"><strong>Doctor:</strong> ${doctorName}</p>
        <p style="margin: 6px 0;"><strong>Patient:</strong> ${patientName}</p>
        <p style="margin: 6px 0;"><strong>Date & Time:</strong> ${date} at ${startTime}</p>
      </div>
      <p>If this was unexpected, you may book a new slot through your dashboard.</p>
      <p style="color: #64748b; font-size: 13px; margin-top: 30px;">Healthcare Appointment Manager &copy; 2026</p>
    </div>
  `;
};

const generateRescheduleEmailHtml = ({ patientName, doctorName, oldDate, oldTime, newDate, newTime }) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #2563eb; margin-top: 0;">Appointment Rescheduled</h2>
      <p>Hello <strong>${patientName}</strong>,</p>
      <p>Your appointment with <strong>${doctorName}</strong> has been updated.</p>
      
      <div style="background-color: #eff6ff; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #2563eb;">
        <p style="margin: 6px 0; color: #64748b; text-decoration: line-through;"><strong>Previous:</strong> ${oldDate} at ${oldTime}</p>
        <p style="margin: 6px 0; font-size: 16px; color: #1e3a8a;"><strong>New Date & Time:</strong> ${newDate} at ${newTime}</p>
      </div>

      <p>Please reach out if you have any questions.</p>
      <p style="color: #64748b; font-size: 13px; margin-top: 30px;">Healthcare Appointment Manager &copy; 2026</p>
    </div>
  `;
};

const generateMedicationReminderEmailHtml = ({ patientName, doctorName, prescription }) => {
  const items = prescription.map(
    (item) => `
      <li style="margin-bottom: 8px;">
        <strong>${item.medicine}</strong>: ${item.dosage} (${item.frequency}) - <em>${item.instructions || 'As prescribed'}</em>
      </li>
    `
  ).join('');

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #059669; margin-top: 0;">Medication Reminder</h2>
      <p>Hello <strong>${patientName}</strong>,</p>
      <p>This is a friendly reminder to take your prescribed medication from your recent visit with <strong>${doctorName}</strong>:</p>
      
      <div style="background-color: #ecfdf5; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #059669;">
        <ul style="padding-left: 20px; margin: 0;">
          ${items}
        </ul>
      </div>

      <p>Remember to follow your doctor's specific intake instructions.</p>
      <p style="color: #64748b; font-size: 13px; margin-top: 30px;">Healthcare Appointment Manager &copy; 2026</p>
    </div>
  `;
};

module.exports = {
  sendNotificationEmail,
  generateBookingEmailHtml,
  generateDoctorBookingNoticeHtml,
  generateCancellationEmailHtml,
  generateRescheduleEmailHtml,
  generateMedicationReminderEmailHtml
};
