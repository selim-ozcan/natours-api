const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError')
const multer = require('multer');
const sharp = require('sharp');

// const multerStorage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, 'public/img/users')
//     },
//     filename: (req, file, cb) => {
//         const extension = file.mimetype.split('/')[1];
//         const userId = req.user._id;
//         const date = Date.now();
//         const fileName = `user-${userId}-${date}.${extension}`;
//         cb(null, fileName);
//     }
// });

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) cb(null, true);
    else cb(new AppError('Not an image! Please upload only images!', 400), false);
};

const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
    if (!req.file) return next();

    const userId = req.user._id;
    const date = Date.now();
    const fileName = `user-${userId}-${date}.jpeg`;

    req.file.filename = fileName;

    await sharp(req.file.buffer)
        .resize(500, 500)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/users/${fileName}`);

    next();
});

exports.getMe = catchAsync(async (req, res, next) => {
    req.params.id = req.user._id;
    next();
});

exports.updateMe = catchAsync(async (req, res, next) => {
    if (req.body.password || req.body.passwordConfirm) return next(new AppError('This route is not for password updates!', 400));

    const updatedUser = await User.findByIdAndUpdate(req.user._id, { name: req.body.name, email: req.body.email, photo: req.file?.filename }, { new: true, runValidators: true });

    res.status(200).json({
        status: 'success',
        data: {
            user: updatedUser
        }
    });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
    await User.findByIdAndUpdate(req.user._id, { active: false });
    res.status(204).json({
        status: 'success',
        data: null
    })
});

exports.createUser = catchAsync(async (req, res) => {
    const user = await User.create(req.body);
});

exports.getUser = catchAsync(async (req, res, next) => {
    const user = await User.find(req.params.id);

    res.status(200).json({
        status: 'success',
        data: {
            user
        }
    });
});

exports.getAllUsers = catchAsync(async (req, res, next) => {
    const users = await User.find();
    res.status(200).json({
        status: 'success',
        results: users.length,
        data: {
            users
        }
    });
});
exports.updateUser = catchAsync(async (req, res) => {
    const newUser = await User.findOneAndUpdate({ _id: req.params.id }, req.body);
    res.status(200).send({
        status: 'ok',
        data: {
            newUser
        }
    })
});

exports.deleteUser = (req, res) => {

}