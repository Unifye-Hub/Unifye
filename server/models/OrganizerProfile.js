const mongoose = require('mongoose');

const organizerProfileSchema = new mongoose.Schema(
  {
    organizer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    company_name: {
      type: String,
      required: [true, 'Please provide a company name'],
      trim: true,
    },
    logo_url: {
      type: String,
      default: 'default_logo.png', // Or cloudinary default
    },
    description: {
      type: String,
    },
    github_url: {
      type: String,
    },
    linkedin_url: {
      type: String,
    },
    x_url: {
      type: String,
    },
    x_public: {
      type: Boolean,
      default: false,
    },
    medium_url: {
      type: String,
    },
    medium_public: {
      type: Boolean,
      default: false,
    },
    instagram_url: {
      type: String,
    },
    instagram_public: {
      type: Boolean,
      default: false,
    },
    average_rating: {
      type: Number,
      default: 0,
      min: [0, 'Rating must be above 0'],
      max: [5, 'Rating must be below 5.0'],
      set: (val) => Math.round(val * 10) / 10,
    },
  },
  {
    timestamps: true,
  }
);

const OrganizerProfile = mongoose.model('OrganizerProfile', organizerProfileSchema);
module.exports = OrganizerProfile;
