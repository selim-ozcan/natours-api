const Tour = require('../models/tourModel');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');
const multer = require('multer');
const sharp = require('sharp')

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) cb(null, true);
    else cb(new AppError('Not an image! Please upload only images!', 400), false);
};

const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

exports.uploadTourImages = upload.fields([
    { name: 'imageCover', maxCount: 1 },
    { name: 'images', maxCount: 3 }
]);

exports.resizeTourImages = catchAsync(async (req, res, next) => {
    if (!req.files || !req.files.imageCover || !req.files.images) return next();

    const tourId = req.params.id;

    if (req.files.imageCover) {
        const imageCoverFileName = `tour-${tourId}-${Date.now()}-cover.jpeg`;

        await sharp(req.files.imageCover[0].buffer)
            .resize(2000, 1333)
            .toFormat('jpeg')
            .jpeg({ quality: 90 })
            .toFile(`public/img/tours/${imageCoverFileName}`);

        req.body.imageCover = imageCoverFileName;
    };

    if (req.files.images) {
        req.body.images = [];
        await Promise.all(req.files.images.map(async (field, index) => {
            const imageFileName = `tour-${tourId}-${Date.now()}-${index + 1}.jpeg`;
            await sharp(field.buffer)
                .resize(500, 500)
                .toFormat('jpeg')
                .jpeg({ quality: 90 })
                .toFile(`public/img/tours/${imageFileName}`);

            req.body.images.push(imageFileName);
        }));
    };

    next();
});

exports.aliasTopTours = (req, res, next) => {
    req.query.limit = 5;
    req.query.sort = '-ratingsAverage price';
    req.query.fields = 'names price ratingsAverage summary difficulty';
    next();
};

exports.getAllTours = catchAsync(async (req, res, next) => {
    const features = new APIFeatures(Tour.find(), req.query).filter().sort().limitFields().applyPaging();
    const tours = await features.query;

    res.status(200).json({
        status: 'success',
        results: tours.length,
        data: { tours }
    });
});

exports.getTour = catchAsync(async (req, res, next) => {
    const tour = await Tour.findById(req.params.id).populate('reviews');
    if (!tour) return next(new AppError('Tour does not exists', 404));

    res.status(200).json({
        status: 'success',
        data: {
            tour
        }
    });
});

exports.createTour = catchAsync(async (req, res, next) => {
    const newTour = await Tour.create(req.body);

    res.status(201).json({
        status: 'success',
        data: {
            tour: newTour
        }
    });
});

exports.updateTour = catchAsync(async (req, res, next) => {
    const updatedTour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    if (!updatedTour) return next(new AppError('Tour does not exists', 404));

    res.status(200).json({
        tour: updatedTour
    })
});

exports.deleteTour = catchAsync(async (req, res, next) => {
    const tour = await Tour.findByIdAndDelete(req.params.id);

    if (!tour) return next(new AppError('Tour does not exists', 404));

    res.status(204).json({
        status: 'success',
        data: null
    });
});

exports.getTourStats = catchAsync(async (req, res, next) => {
    const stats = await Tour.aggregate([
        {
            $match: { 'ratingsAverage': { $gte: 4.5 } }
        },
        {
            $group: {
                _id: '$difficulty', quantity: { $sum: 1 }, avgPrice: { $avg: '$price' }, avgRatings: { $avg: '$ratingsAverage' },
                minPrice: { $min: '$price' }, maxPrice: { $max: '$price' }
            }
        },
        {
            $sort: { avgPrice: 1 }
        },
    ]);

    res.status(200).json({
        status: 'success',
        data: stats
    })
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
    const stats = await Tour.aggregate([
        {
            $unwind: '$startDates'
        },
        {
            $match: {
                $expr: {
                    $eq: [{ $substr: ['$startDates', 0, 4] }, req.params.year]
                }

            }
        },
        {
            $project: {
                startMonth: {
                    $arrayElemAt: [
                        ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
                        { $month: "$startDates" }]
                }
            }
        },
        {
            $group: {
                _id: "$startMonth",
                numberOfTours: { $sum: 1 }
            }
        },
        {
            $addFields: {
                month: '$_id'
            }
        },
        { $project: { '_id': 0 } },
        { $sort: { numberOfTours: -1 } }
    ]);

    res.status(200).json({
        stasus: 'success',
        data: { stats }
    })
});
