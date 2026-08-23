const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema(
  {
    date: {
      type: String, // Format: YYYY-MM-DD
      required: true
    },
    reason: {
      type: String,
      default: 'Doctor unavailable'
    }
  },
  { _id: true, timestamps: true }
);

const doctorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    name: {
      type: String,
      required: [true, 'Doctor name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Doctor email is required'],
      lowercase: true,
      trim: true
    },
    specialisation: {
      type: String,
      required: [true, 'Specialisation is required'],
      trim: true
    },
    bio: {
      type: String,
      default: ''
    },
    workingDays: {
      type: [String],
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    },
    startTime: {
      type: String,
      default: '09:00',
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter valid startTime format HH:mm']
    },
    endTime: {
      type: String,
      default: '17:00',
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter valid endTime format HH:mm']
    },
    slotDuration: {
      type: Number,
      default: 30, // in minutes
      min: [10, 'Slot duration must be at least 10 minutes'],
      max: [120, 'Slot duration cannot exceed 120 minutes']
    },
    leaveDates: [leaveSchema],
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Helpful index for quick search by specialisation and active status
doctorSchema.index({ specialisation: 1, isActive: 1 });
doctorSchema.index({ name: 'text', specialisation: 'text', bio: 'text' });

module.exports = mongoose.model('Doctor', doctorSchema);
