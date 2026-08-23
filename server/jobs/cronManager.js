const cron = require('node-cron');
const runEmailRetryJob = require('./emailRetryJob');
const runMedicationReminderJob = require('./medicationReminderJob');

const initCronJobs = () => {
  console.log('[Cron Manager] Initializing scheduled background tasks...');

  // 1. Email Retry Job - Runs every 2 minutes ('*/2 * * * *')
  cron.schedule('*/2 * * * *', async () => {
    try {
      await runEmailRetryJob();
    } catch (err) {
      console.error('[Cron Manager] Email retry task error:', err.message);
    }
  });

  // 2. Medication Reminder Job - Runs daily at 08:00 AM ('0 8 * * *') and on startup in dev
  cron.schedule('0 8 * * *', async () => {
    try {
      await runMedicationReminderJob();
    } catch (err) {
      console.error('[Cron Manager] Medication reminder task error:', err.message);
    }
  });

  console.log('[Cron Manager] Background cron schedules established.');
};

module.exports = { initCronJobs };
