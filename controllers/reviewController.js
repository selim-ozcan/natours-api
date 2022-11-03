const Review = require('../models/reviewModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.createReview = catchAsync(async (req, res, next) => {
    // Allow nested request
    if (!req.body.tour) {
        if (req.params.tourId) req.body.tour = req.params.tourId;
        else return next(new AppError('Tour id is missing in the request', 400));
    }

    if (!req.body.user) {
        if (req.user) req.body.user = req.user._id;
        else return next(new AppError('User id is missing in the request', 400));
    }

    const review = await Review.create(req.body);
    // await Review.calcAverageRatings(review.tour); // Doing this in a post save hook is cleaner.

    res.status(201).json({
        status: 'success',
        data: {
            review
        }
    });
});

exports.getReview = catchAsync(async (req, res, next) => {
    const review = await Review.findById(req.body._id);

    res.status(200).json({
        status: 'success',
        data: {
            review
        }
    })
});

exports.getAllReviews = catchAsync(async (req, res, next) => {
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };

    const reviews = await Review.find(filter);

    res.status(201).json({
        status: 'success',
        results: reviews.length,
        data: {
            reviews
        }
    });
});

exports.updateReview = catchAsync(async (req, res, next) => {
    const review = await Review.findByIdAndUpdate(req.params.id, { review: req.body.review, rating: req.body.rating }, { new: true });

    res.status(200).json({
        status: 'success',
        data: { review }
    });
});

exports.deleteReview = catchAsync(async (req, res, next) => {
    await Review.findByIdAndDelete(req.params.id);

    res.status(204).json({});
});