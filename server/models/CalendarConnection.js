const mongoose = require('mongoose');

const calendarConnectionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    accessToken: {
      type: String,
      required: true,
      select: false // Protected from generic API responses
    },
    refreshToken: {
      type: String,
      select: false // Protected from generic API responses
    },
    expiryDate: {
      type: Number
    },
    googleEmail: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('CalendarConnection', calendarConnectionSchema);
