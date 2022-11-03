const AppError = require('../utils/appError');

module.exports = (req, res, next) => {
    if (!req.body.passwordConfirm) return next(new AppError('Please include passwordConfirm on your request!'));
    if (req.body.password !== req.body.passwordConfirm) {
        return next(new AppError('Passwords does not match.', 401));
    }

    next();
}
