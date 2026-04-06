const mongoose = require('mongoose');

const ratingReviewSchema = new mongoose.Schema(
  {
    participant_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    event_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true,
    },
    score: {
      type: Number,
      min: 1,
      max: 5,
      required: [true, 'Rating score is required'],
    },
    review_text: {
      type: String,
      trim: true,
      maxlength: [1000, 'Review cannot be more than 1000 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// Prevent user from reviewing the same event twice
ratingReviewSchema.index({ participant_id: 1, event_id: 1 }, { unique: true });

const RatingReview = mongoose.model('RatingReview', ratingReviewSchema);
module.exports = RatingReview;
