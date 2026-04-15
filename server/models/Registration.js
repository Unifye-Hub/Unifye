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

    // ─── Group Registration Fields ──────────────────────────────────────────
    registration_type: {
      type: String,
      enum: ['individual', 'group'],
      default: 'individual',
    },
    group_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      default: null,
    },
    // ───────────────────────────────────────────────────────────────────────
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate registrations (one entry per participant per event)
registrationSchema.index({ participant_id: 1, event_id: 1 }, { unique: true });

const Registration = mongoose.model('Registration', registrationSchema);
module.exports = Registration;
