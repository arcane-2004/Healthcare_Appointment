const mongoose = require('mongoose');

const prescriptionItemSchema = new mongoose.Schema(
  {
    medicine: {
      type: String,
      required: [true, 'Medicine name is required'],
      trim: true
    },
    dosage: {
      type: String,
      required: [true, 'Dosage is required (e.g. 1 tablet, 5ml)'],
      trim: true
    },
    frequency: {
      type: String,
      required: [true, 'Frequency is required (e.g. Once daily, Twice daily)'],
      trim: true
    },
    duration: {
      type: String,
      required: [true, 'Duration is required (e.g. 5 days, 2 weeks)'],
      trim: true
    },
    instructions: {
      type: String,
      default: '',
      trim: true
    }
  },
  { _id: false }
);

const appointmentSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Patient ID is required']
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: [true, 'Doctor ID is required']
    },
    date: {
      type: String, // Format: YYYY-MM-DD
      required: [true, 'Appointment date is required'],
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD']
    },
    startTime: {
      type: String, // Format: HH:mm
      required: [true, 'Start time is required'],
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Start time must be formatted as HH:mm']
    },
    endTime: {
      type: String, // Format: HH:mm
      required: [true, 'End time is required'],
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'End time must be formatted as HH:mm']
    },
    status: {
      type: String,
      enum: ['BOOKED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED'],
      default: 'BOOKED'
    },
    symptoms: {
      type: String,
      required: [true, 'Patient symptoms are required'],
      trim: true
    },
    preVisitSummary: {
      urgencyLevel: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Unknown'],
        default: 'Unknown'
      },
      chiefComplaint: {
        type: String,
        default: ''
      },
      suggestedQuestions: {
        type: [String],
        default: []
      }
    },
    urgencyLevel: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Unknown'],
      default: 'Unknown'
    },
    visitNotes: {
      type: String,
      default: ''
    },
    prescription: [prescriptionItemSchema],
    postVisitSummary: {
      type: String,
      default: ''
    },
    calendarEventId: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Compound unique index for Double Booking Prevention:
// Active appointments (BOOKED, COMPLETED, RESCHEDULED) cannot have duplicate doctor + date + startTime
appointmentSchema.index(
  { doctorId: 1, date: 1, startTime: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ['BOOKED', 'COMPLETED', 'RESCHEDULED'] }
    }
  }
);

appointmentSchema.index({ patientId: 1, date: 1 });
appointmentSchema.index({ doctorId: 1, date: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
