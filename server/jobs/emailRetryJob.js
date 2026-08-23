const Notification = require('../models/Notification');
const nodemailer = require('nodemailer');

const runEmailRetryJob = async () => {
  try {
    const failedNotifications = await Notification.find({
      status: 'FAILED',
      retryCount: { $lt: 3 }
    }).limit(20);

    if (failedNotifications.length === 0) {
      return;
    }

    console.log(`[Email Retry Job] Found ${failedNotifications.length} failed notifications to retry.`);

    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASSWORD;
    const port = parseInt(process.env.SMTP_PORT, 10) || 587;

    let transporter;
    if (host && user && pass && user !== 'your_email@gmail.com') {
      transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass }
      });
    } else {
      transporter = {
        sendMail: async (opts) => {
          console.log(`[Simulated Retry Email] Resent to ${opts.to}: ${opts.subject}`);
          return { messageId: `mock-retry-${Date.now()}` };
        }
      };
    }

    const fromAddress = process.env.EMAIL_FROM || '"HealthCare Appointments" <noreply@healthcare.com>';

    for (const notif of failedNotifications) {
      try {
        await transporter.sendMail({
          from: fromAddress,
          to: notif.recipientEmail,
          subject: notif.subject,
          html: notif.message,
          text: notif.message.replace(/<[^>]*>?/gm, '')
        });

        notif.status = 'SENT';
        await notif.save();
        console.log(`[Email Retry Job] Notification ${notif._id} successfully sent on retry ${notif.retryCount + 1}`);
      } catch (err) {
        notif.retryCount += 1;
        if (notif.retryCount >= 3) {
          console.warn(`[Email Retry Job] Notification ${notif._id} reached max retries (3). Marked permanent failure.`);
        }
        await notif.save();
      }
    }
  } catch (error) {
    console.error('[Email Retry Job] Job encountered an error:', error.message);
  }
};

module.exports = runEmailRetryJob;
