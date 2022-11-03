const { promisify } = require("util");
const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const jsonwebtoken = require("jsonwebtoken");
const Email = require("../utils/email");
const crypto = require("crypto");

const signToken = (id) => {
  return jsonwebtoken.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createAndSendToken = (user, statusCode, res) => {
  const jwt = signToken(user._id);

  const cookieOptions = {
    httpOnly: true,
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
  };

  if (process.env.NODE_ENV === "production") cookieOptions.secure = true;
  res.cookie("jwt", jwt, cookieOptions);

  user.password = undefined;
  res.status(statusCode).json({
    status: "success",
    token: jwt,
    data: {
      user,
    },
  });
};

exports.login = catchAsync(async (req, res, next) => {
  if (!(req.body.email && req.body.password))
    return next(new AppError("Please provide both email and password", 400));

  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.checkPassword(password, user.password))) {
    return next(new AppError("Email or password is incorrect.", 401));
  }

  createAndSendToken(user, 200, res);
});

exports.signup = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  const newUser = await User.create({
    name: req.body.name,
    email: email,
    password: password,
  });

  const url = `${req.protocol}://${req.get("host")}/me`;
  await new Email(newUser, url).sendWelcome();

  createAndSendToken(newUser, 201, res);
});

exports.requireAuthentication = catchAsync(async (req, res, next) => {
  let token;
  const authenticationHeader = req.get("Authorization");
  if (authenticationHeader) {
    const [headerPrefix, authenticationHeaderToken] =
      authenticationHeader.split(" ");
    if (headerPrefix !== "Bearer")
      return next(new AppError("Invalid token", 401));
    if (!authenticationHeaderToken)
      return next(
        new AppError("You are not logged in. Please login to get access", 401)
      );

    token = authenticationHeaderToken;
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  } else {
    return next(
      new AppError("You don't have permissions to access this resource", 401)
    );
  }

  const payload = await new Promise((resolve, reject) => {
    jsonwebtoken.verify(token, process.env.JWT_SECRET, (error, payload) => {
      if (error) return reject(error);
      resolve(payload);
    });
  });

  // Check if the user is deleted after the token was issued
  const user = await User.findById(payload.id);
  if (!user)
    return next(new AppError("Bearer of the token does not exist!", 401));

  const tokenIssueDate = new Date(payload.iat * 1000);

  // check if user info updated after the token was issued.
  if (user.eupdatedAt && user.updatedAt > tokenIssueDate)
    return next(
      new AppError("User information updated. Please login again!", 401)
    );

  req.user = user;
  next();
});

// this middleware must always run after requireAuthentication middleware!
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role))
      return next(
        new AppError("You do not have permissions to perform this action", 403)
      );
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user)
    return next(
      new AppError("A user with the given email does not exist!", 400)
    );

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to : ${resetUrl}. If you did not forget your password, please ignore this email!`;

  try {
    await new Email(user, resetUrl).sendPasswordReset();

    res.status(200).json({
      status: "success",
      data: {
        message: "Token sent to email.",
      },
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        "There was an error sending the email! Try again later.",
        500
      )
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  const token = req.params.token;
  const { password } = req.body;

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({ passwordResetToken: hashedToken });
  if (!user || user.passwordResetExpires < new Date())
    return next(new AppError("Token is invalid or has expired!", 401));

  user.password = password;

  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  createAndSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id).select("+password");
  const { passwordCurrent, password } = req.body;

  if (!(await user.checkPassword(passwordCurrent, user.password)))
    return next(new AppError("Current password is incorrect!", 400));
  user.password = password;

  await user.save();

  createAndSendToken(user, 200, res);
});
