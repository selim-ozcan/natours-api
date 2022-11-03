const mongoose = require('mongoose');
const AppError = require('../utils/appError');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema({
    review: {
        type: String,
        required: true
    },
    rating: {
        type: Number,
        min: 1,
        max: 5
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    tour: {
        type: mongoose.Schema.ObjectId,
        ref: 'Tour',
        required: true
    }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    id: false,
    timestamps: true
});

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

// reviewSchema.pre('save', async function (next) {
//     const tour = await Review.findOne({ tour: this.tour });
//     if (tour) next(new AppError('User already reviewed the tour', 400));
// });

reviewSchema.pre(/^find/, function (next) {
    this.populate({
        path: 'user',
        select: 'name'
    });

    next();
});

reviewSchema.statics.calcAverageRatings = async function (tourId) {
    const stat = await this.aggregate([
        {
            $match: {
                'tour': { $eq: tourId }
            }
        },
        {
            $group:
            {
                _id: '$tour',
                averageRatings: { $avg: '$rating' },
                numberOfRatings: { $sum: 1 }
            }
        }
    ]);

    if (stat.length > 0) {
        await Tour.findByIdAndUpdate(tourId, {
            ratingsAverage: stat[0].averageRatings,
            ratingsQuantity: stat[0].numberOfRatings
        });
    } else {
        await Tour.findByIdAndUpdate(tourId, {
            ratingsAverage: 4.5,
            ratingsQuantity: 0
        });
    }
};

reviewSchema.post(/save|^findOneAnd/, async function (doc, next) {
    await doc.constructor.calcAverageRatings(doc.tour);
    next()
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;