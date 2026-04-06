const reviewService = require('../services/reviewService');
const catchAsync = require('../utils/catchAsync');

exports.createReview = catchAsync(async (req, res, next) => {
  const { score, review_text } = req.body;
  
  const review = await reviewService.createReview(
    req.params.id, // event id
    req.user._id, // participant id
    score,
    review_text
  );

  res.status(201).json({
    status: 'success',
    data: {
      review,
    },
  });
});

exports.getOrganizerReviews = catchAsync(async (req, res, next) => {
  const reviews = await reviewService.getOrganizerReviews(req.params.id);

  res.status(200).json({
    status: 'success',
    results: reviews.length,
    data: {
      reviews,
    },
  });
});
