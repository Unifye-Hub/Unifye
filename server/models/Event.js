const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    organizer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['hackathon', 'bootcamp', 'competition', 'workshop', 'seminar'],
      required: [true, 'Event type is required'],
    },
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
    },
    cover_image: {
      type: String, // Cloudinary URL
      required: [true, 'Event cover image is required'],
    },
    date_time: {
      type: Date,
      required: [true, 'Event date and time is required'],
    },
    description: {
      type: String,
      trim: true
    },
    location: {
      type: String,
      required: [true, 'Event location is required'],
      trim: true,
      default: 'Main Auditorium'
    },
    status: {
      type: String,
      enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
      default: 'upcoming',
    },
    capacity: {
      type: Number,
      required: [true, 'Event capacity is required'],
      min: [1, 'Capacity must be at least 1'],
    },
    current_registrations: {
      type: Number,
      default: 0,
    },

    // ─── Group Participation Fields ───────────────────────────────────────────
    eventType: {
      type: String,
      enum: ['INDIVIDUAL', 'GROUP', 'BOTH'],
      default: 'INDIVIDUAL',
    },
    groupConfig: {
      minMembers: {
        type: Number,
        min: [2, 'Minimum group size must be at least 2'],
      },
      maxMembers: {
        type: Number,
      },
    },
    // ─────────────────────────────────────────────────────────────────────────
  },
  {
    timestamps: true,
  }
);

// ─── groupConfig Validation ───────────────────────────────────────────────────
eventSchema.pre('validate', function () {
  const mode = this.eventType;

  if (mode === 'GROUP' || mode === 'BOTH') {
    // groupConfig must be present
    if (!this.groupConfig || !this.groupConfig.minMembers || !this.groupConfig.maxMembers) {
      this.invalidate('groupConfig', 'groupConfig with minMembers and maxMembers is required for GROUP or BOTH event types');
      return;
    }

    // minMembers must be >= 2
    if (this.groupConfig.minMembers < 2) {
      this.invalidate('groupConfig.minMembers', 'minMembers must be at least 2');
      return;
    }

    // maxMembers must be >= minMembers
    if (this.groupConfig.maxMembers < this.groupConfig.minMembers) {
      this.invalidate('groupConfig.maxMembers', 'maxMembers must be greater than or equal to minMembers');
      return;
    }
  }

  // For INDIVIDUAL events, strip groupConfig if accidentally provided
  if (mode === 'INDIVIDUAL') {
    this.groupConfig = undefined;
  }
});
// ─────────────────────────────────────────────────────────────────────────────

// Indexes for text search on title
eventSchema.index({ title: 'text' });
eventSchema.index({ type: 1, status: 1 });
eventSchema.index({ date_time: 1 });
eventSchema.index({ eventType: 1 });

const Event = mongoose.model('Event', eventSchema);
module.exports = Event;
