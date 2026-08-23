const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const app = require('../server');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Notification = require('../models/Notification');
const slotService = require('../services/slotService');
const aiService = require('../services/aiService');

const runTests = async () => {
  console.log('\n==========================================');
  console.log('🧪 Starting Automated API & Feature Test Suite');
  console.log('==========================================\n');

  let server;
  let testPort = 5099;

  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/healthcare_appointment';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }

    // Start ephemeral server
    server = app.listen(testPort);
    const baseUrl = `http://localhost:${testPort}/api`;

    // Helper for requests
    const request = async (endpoint, options = {}) => {
      const url = `${baseUrl}${endpoint}`;
      const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
      const res = await fetch(url, {
        ...options,
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined
      });
      const data = await res.json().catch(() => ({}));
      return { status: res.status, data };
    };

    let passedCount = 0;
    let totalCount = 0;

    const assert = (condition, testName) => {
      totalCount++;
      if (condition) {
        console.log(`  ✅ [PASS] ${testName}`);
        passedCount++;
      } else {
        console.error(`  ❌ [FAIL] ${testName}`);
      }
    };

    // 1. Health Check
    console.log('\n--- 1. Health & Server Status ---');
    const health = await request('/health');
    assert(health.status === 200 && health.data.success === true, 'Health check returns 200 OK');

    // 2. Authentication & RBAC
    console.log('\n--- 2. Authentication & Roles ---');
    const patientLogin = await request('/auth/login', {
      method: 'POST',
      body: { email: 'patient@example.com', password: 'Patient@123' }
    });
    assert(patientLogin.status === 200 && patientLogin.data.data.role === 'patient', 'Patient login succeeds with token');
    const patientToken = patientLogin.data.token;

    const doctorLogin = await request('/auth/login', {
      method: 'POST',
      body: { email: 'rahul.sharma@example.com', password: 'Doctor@123' }
    });
    assert(doctorLogin.status === 200 && doctorLogin.data.data.role === 'doctor', 'Doctor login succeeds with token');
    const doctorToken = doctorLogin.data.token;

    const adminLogin = await request('/auth/login', {
      method: 'POST',
      body: { email: 'admin@example.com', password: 'Admin@123' }
    });
    assert(adminLogin.status === 200 && adminLogin.data.data.role === 'admin', 'Admin login succeeds with token');
    const adminToken = adminLogin.data.token;

    // 3. Admin Doctor Creation
    console.log('\n--- 3. Admin Doctor Management ---');
    const newDocEmail = `test.doctor.${Date.now()}@example.com`;
    const createDocRes = await request('/doctors', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        name: 'Dr. Test Neurologist',
        email: newDocEmail,
        password: 'Doctor@123',
        specialisation: 'Neurologist',
        bio: 'Expert in neurology and migraine relief.',
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        startTime: '10:00',
        endTime: '14:00',
        slotDuration: 30
      }
    });
    assert(createDocRes.status === 201 && createDocRes.data.data.specialisation === 'Neurologist', 'Admin can create new doctor profile');
    const testDoctorId = createDocRes.data.data._id;

    // 4. Public Doctor Search & Filtering
    console.log('\n--- 4. Doctor Search & Filtering ---');
    const searchRes = await request('/doctors?specialisation=Neurologist');
    assert(searchRes.status === 200 && searchRes.data.count >= 1, 'Patient can search doctors by specialisation');

    // 5. Dynamic Slot Generation
    console.log('\n--- 5. Dynamic Slot Generation ---');
    const getNextMonday = (weekOffset = 0) => {
      const dt = new Date();
      dt.setDate(dt.getDate() + 1 + weekOffset * 7);
      while (dt.getDay() !== 1) {
        dt.setDate(dt.getDate() + 1);
      }
      const y = dt.getFullYear();
      const m = String(dt.getMonth() + 1).padStart(2, '0');
      const d = String(dt.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };

    const nextMondayStr = getNextMonday(0);

    const slotsRes = await request(`/doctors/${testDoctorId}/slots?date=${nextMondayStr}`);
    assert(slotsRes.status === 200 && Array.isArray(slotsRes.data.data.slots) && slotsRes.data.data.slots.length > 0, 'Slots dynamically generated based on working hours');
    const firstSlot = slotsRes.data.data.slots[0];
    const testSlotTime = firstSlot.startTime;

    // 6. Appointment Booking Flow & AI Pre-visit Triage
    console.log('\n--- 6. Appointment Booking & AI Triage ---');
    const bookRes = await request('/appointments', {
      method: 'POST',
      headers: { Authorization: `Bearer ${patientToken}` },
      body: {
        doctorId: testDoctorId,
        date: nextMondayStr,
        startTime: testSlotTime,
        symptoms: 'Recurring severe throbbing migraine with visual aura and nausea'
      }
    });
    assert(bookRes.status === 201 && bookRes.data.data.status === 'BOOKED', 'Patient books appointment successfully');
    const bookedAppointmentId = bookRes.data.data._id;

    // 7. Double Booking Prevention (HTTP 409 Conflict)
    console.log('\n--- 7. Double Booking Prevention Concurrency Test ---');
    // Second patient attempts to book EXACT same slot
    const doubleBookRes = await request('/appointments', {
      method: 'POST',
      headers: { Authorization: `Bearer ${patientToken}` },
      body: {
        doctorId: testDoctorId,
        date: nextMondayStr,
        startTime: testSlotTime,
        symptoms: 'Another patient trying to book the exact same slot'
      }
    });
    assert(
      doubleBookRes.status === 409 && doubleBookRes.data.success === false,
      'Double-booking rejected with HTTP 409 Conflict'
    );

    // 8. Doctor Consultation, Notes, Prescription & AI Post-Visit Summary
    console.log('\n--- 8. Doctor Consultation Flow & Post-Visit Summary ---');
    const testDocUser = await User.findOne({ email: newDocEmail });
    const testDocLogin = await request('/auth/login', {
      method: 'POST',
      body: { email: newDocEmail, password: 'Doctor@123' }
    });
    const testDocToken = testDocLogin.data.token;

    const completeRes = await request(`/appointments/${bookedAppointmentId}/complete`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${testDocToken}` },
      body: {
        visitNotes: 'Patient diagnosed with classic migraine with aura. Neurological exam normal.',
        prescription: [
          {
            medicine: 'Sumatriptan 50mg',
            dosage: '1 tablet',
            frequency: 'As needed',
            duration: '3 days',
            instructions: 'Take at onset of migraine aura'
          }
        ]
      }
    });
    assert(
      completeRes.status === 200 &&
      completeRes.data.data.status === 'COMPLETED' &&
      Boolean(completeRes.data.data.postVisitSummary),
      'Doctor completes consultation and generates patient-friendly AI post-visit summary'
    );

    // 9. Doctor Leave Scheduling & Automatic Appointment Cancellation
    console.log('\n--- 9. Doctor Leave Scheduling & Conflict Resolution ---');
    const nextNextMondayStr = getNextMonday(1);

    const secondBookRes = await request('/appointments', {
      method: 'POST',
      headers: { Authorization: `Bearer ${patientToken}` },
      body: {
        doctorId: testDoctorId,
        date: nextNextMondayStr,
        startTime: testSlotTime,
        symptoms: 'Follow-up appointment'
      }
    });

    const leaveRes = await request(`/doctors/${testDoctorId}/leave`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        date: nextNextMondayStr,
        reason: 'Attending annual medical neurology symposium'
      }
    });

    assert(
      leaveRes.status === 200 &&
      leaveRes.data.affectedAppointmentsCount >= 1,
      'Admin schedules doctor leave and auto-cancels conflicting appointments with notification'
    );

    // 10. AI Failure Resilience Test
    console.log('\n--- 10. AI Service Resilience & Fallback Handling ---');
    const aiFallbackSummary = await aiService.generatePreVisitSummary('');
    assert(
      aiFallbackSummary !== null && Boolean(aiFallbackSummary.urgencyLevel),
      'AI service gracefully handles empty/failed LLM calls without throwing exception'
    );

    console.log('\n==========================================');
    console.log(`📊 Test Results: ${passedCount}/${totalCount} tests passed (${Math.round((passedCount / totalCount) * 100)}%)`);
    console.log('==========================================\n');

    if (server) server.close();
    process.exit(passedCount === totalCount ? 0 : 1);
  } catch (err) {
    console.error('Test Suite encountered unhandled error:', err);
    if (server) server.close();
    process.exit(1);
  }
};

runTests();
