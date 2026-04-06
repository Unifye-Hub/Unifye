const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema(
  {
    participant_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    event_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true,
    },
    registration_date: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['registered', 'waitlisted', 'cancelled'],
      default: 'registered',
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate registrations
registrationSchema.index({ participant_id: 1, event_id: 1 }, { unique: true });

const Registration = mongoose.model('Registration', registrationSchema);
module.exports = Registration;
