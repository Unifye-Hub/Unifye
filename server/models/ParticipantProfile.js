const mongoose = require('mongoose');

const participantProfileSchema = new mongoose.Schema(
  {
    profile_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    full_name: {
      type: String,
      required: [true, 'Please provide your full name'],
      trim: true,
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [500, 'Bio cannot be more than 500 characters'],
    },
    portfolio_url: {
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
    profile_pic_url: {
      type: String,
      default: 'default_pic.png',
    },
    skills_list: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

const ParticipantProfile = mongoose.model('ParticipantProfile', participantProfileSchema);
module.exports = ParticipantProfile;
