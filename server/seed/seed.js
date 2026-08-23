const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Notification = require('../models/Notification');
const CalendarConnection = require('../models/CalendarConnection');

// Load environment variables
dotenv.config();

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/healthcare_appointment';
    console.log(`[Seed] Connecting to MongoDB: ${mongoUri}`);
    await mongoose.connect(mongoUri);

    console.log('[Seed] Clearing existing collections...');
    await Promise.all([
      User.deleteMany({}),
      Doctor.deleteMany({}),
      Appointment.deleteMany({}),
      Notification.deleteMany({}),
      CalendarConnection.deleteMany({})
    ]);

    console.log('[Seed] Seeding Admin user...');
    const adminUser = await User.create({
      name: 'System Admin',
      email: 'admin@example.com',
      password: 'Admin@123',
      role: 'admin',
      phone: '+1 (555) 000-0001'
    });

    console.log('[Seed] Seeding Patient user...');
    const patientUser = await User.create({
      name: 'John Doe',
      email: 'patient@example.com',
      password: 'Patient@123',
      role: 'patient',
      phone: '+1 (555) 234-5678'
    });

    console.log('[Seed] Seeding Doctors...');
    const doctorsConfig = [
      {
        name: 'Dr. Rahul Sharma',
        email: 'rahul.sharma@example.com',
        password: 'Doctor@123',
        phone: '+1 (555) 111-2222',
        specialisation: 'Cardiologist',
        bio: 'Senior Cardiologist with 12+ years experience in preventive heart care, hypertension management, and non-invasive cardiovascular diagnostics.',
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        startTime: '09:00',
        endTime: '17:00',
        slotDuration: 30
      },
      {
        name: 'Dr. Priya Singh',
        email: 'priya.singh@example.com',
        password: 'Doctor@123',
        phone: '+1 (555) 333-4444',
        specialisation: 'Dermatologist',
        bio: 'Board-certified Dermatologist specialising in chronic skin conditions, dermatitis, acne management, and cosmetic dermatology.',
        workingDays: ['Monday', 'Wednesday', 'Friday', 'Saturday'],
        startTime: '10:00',
        endTime: '16:00',
        slotDuration: 30
      },
      {
        name: 'Dr. Amit Verma',
        email: 'amit.verma@example.com',
        password: 'Doctor@123',
        phone: '+1 (555) 555-6666',
        specialisation: 'General Physician',
        bio: 'Experienced General Physician focused on comprehensive adult health, acute viral infections, routine diagnostics, and diabetes control.',
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        startTime: '08:30',
        endTime: '15:30',
        slotDuration: 30
      }
    ];

    const createdDoctors = [];
    for (const doc of doctorsConfig) {
      const user = await User.create({
        name: doc.name,
        email: doc.email,
        password: doc.password,
        role: 'doctor',
        phone: doc.phone
      });

      const doctorProfile = await Doctor.create({
        userId: user._id,
        name: doc.name,
        email: doc.email,
        specialisation: doc.specialisation,
        bio: doc.bio,
        workingDays: doc.workingDays,
        startTime: doc.startTime,
        endTime: doc.endTime,
        slotDuration: doc.slotDuration,
        isActive: true
      });

      createdDoctors.push({ user, doctor: doctorProfile });
    }

    // Helper for tomorrow & yesterday dates (YYYY-MM-DD)
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    console.log('[Seed] Seeding Sample Appointments...');
    // 1. Upcoming Booked Appointment
    await Appointment.create({
      patientId: patientUser._id,
      doctorId: createdDoctors[0].doctor._id,
      date: tomorrowStr,
      startTime: '10:00',
      endTime: '10:30',
      status: 'BOOKED',
      symptoms: 'Experiencing mild chest heaviness during morning jogging and occasional palpitations after coffee.',
      urgencyLevel: 'Medium',
      preVisitSummary: {
        urgencyLevel: 'Medium',
        chiefComplaint: 'Chest heaviness with exertion and caffeine-associated palpitations',
        suggestedQuestions: [
          'How long do the palpitations typically last?',
          'Do you have a personal or family history of high blood pressure or heart disease?',
          'Does rest immediately relieve the heaviness?'
        ]
      }
    });

    // 2. Past Completed Appointment with Prescription & Post-Visit Summary
    await Appointment.create({
      patientId: patientUser._id,
      doctorId: createdDoctors[2].doctor._id,
      date: yesterdayStr,
      startTime: '09:00',
      endTime: '09:30',
      status: 'COMPLETED',
      symptoms: 'Dry cough and mild seasonal allergy flare-ups with sinus pressure.',
      urgencyLevel: 'Low',
      preVisitSummary: {
        urgencyLevel: 'Low',
        chiefComplaint: 'Dry cough and sinus congestion',
        suggestedQuestions: [
          'Any fever, chills, or difficulty breathing?',
          'Have you tried any over-the-counter antihistamines?'
        ]
      },
      visitNotes: 'Patient presented with seasonal allergic rhinitis. Lungs clear to auscultation. Advised to stay hydrated, avoid dust exposure, and use saline nasal spray daily.',
      prescription: [
        {
          medicine: 'Cetirizine 10mg',
          dosage: '1 tablet',
          frequency: 'Once daily',
          duration: '7 days',
          instructions: 'Take at bedtime'
        },
        {
          medicine: 'Fluticasone Nasal Spray',
          dosage: '2 sprays per nostril',
          frequency: 'Once daily',
          duration: '14 days',
          instructions: 'Administer in the morning'
        }
      ],
      postVisitSummary: '## Patient Visit Summary\n\n### Doctor Discussion\nDr. Amit Verma examined your symptoms and identified seasonal allergic rhinitis (allergies). Your lungs are clear and healthy.\n\n### Important Instructions\n- Stay well hydrated throughout the day.\n- Avoid known dust or outdoor allergen triggers.\n- Use saline nasal rinses as needed.\n\n### Medication Schedule\n1. **Cetirizine 10mg**: Take 1 tablet once daily at bedtime for 7 days.\n2. **Fluticasone Nasal Spray**: Spray twice in each nostril every morning for 14 days.\n\n### Follow-up Steps\nIf symptoms persist beyond 2 weeks or if you develop a fever, please schedule a follow-up consultation.'
    });

    console.log('\n==========================================');
    console.log('✅ Database Seeded Successfully!');
    console.log('==========================================');
    console.log('Test Credentials:');
    console.log('1. Admin:   admin@example.com        / Admin@123');
    console.log('2. Patient: patient@example.com      / Patient@123');
    console.log('3. Doctor:  rahul.sharma@example.com / Doctor@123 (Cardiologist)');
    console.log('4. Doctor:  priya.singh@example.com  / Doctor@123 (Dermatologist)');
    console.log('5. Doctor:  amit.verma@example.com   / Doctor@123 (General Physician)');
    console.log('==========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('[Seed] Error during seeding:', error);
    process.exit(1);
  }
};

seedData();
