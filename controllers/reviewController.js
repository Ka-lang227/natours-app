const Review = require('../models/reviewModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');


exports.setTourUserIds = (req, res, next) => {
    // Allow nested routes - get tour and user IDs from URL params
    if (!req.body.tour) req.body.tour = req.params.tourId;
    if (!req.body.user) req.body.user = req.user.id; // Assuming you have authentication middleware
    next();
};

// Middleware to check if user has already reviewed this tour
exports.checkExistingReview = catchAsync(async (req, res, next) => {
    // Get tour and user IDs (they should be set by setTourUserIds middleware)
    const tourId = req.body.tour || req.params.tourId;
    const userId = req.body.user || req.user.id;
    
    // Check if a review already exists for this user and tour combination
    const existingReview = await Review.findOne({ tour: tourId, user: userId });
    
    if (existingReview) {
        return next(new AppError('You have already reviewed this tour. You can only submit one review per tour.', 400));
    }
    
    next();
});

exports.getAllReviews = factory.getAll(Review);

exports.getReview = factory.getOne(Review, { path: 'tour user' });

exports.createReview = factory.createOne(Review)

exports.updateReview = factory.updateOne(Review);

exports.deleteReview = factory.deleteOne(Review);