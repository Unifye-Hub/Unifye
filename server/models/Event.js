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
  },
  {
    timestamps: true,
  }
);

// Indexes for text search on title
eventSchema.index({ title: 'text' });
eventSchema.index({ type: 1, status: 1 });
eventSchema.index({ date_time: 1 });

const Event = mongoose.model('Event', eventSchema);
module.exports = Event;
