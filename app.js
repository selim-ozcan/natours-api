const express = require("express");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitizer = require("express-mongo-sanitize");
const hpp = require("hpp");
const xssClean = require("xss-clean");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const globalErrorHandler = require("./controllers/errorController");
const AppError = require("./utils/appError");
const tourRouter = require("./routes/tourRoutes");
const userRouter = require("./routes/userRoutes");
const bookingRouter = require("./routes/bookingRoutes");
const reviewRouter = require("./routes/reviewRoutes");
const cors = require("cors");
const { filterRequestQueries } = require("./utils/queryHelper");

const app = express();

// middlewares

// Implement CORS
app.use(cors()); // This sets the Access-Control-Allow-Origin header to *
// If we want to allow cors for a set of specific domains.
// app.use(
//   cors({
//     origin: "https://natours.com",
//   })
// );

app.options("*", cors());

// serve static files.
app.use(express.static("./public"));

// logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// set security HTTP headers
app.use(helmet());

// limit requests
app.use(
  "/api",
  rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000,
    handler: function (req, res, next, options) {
      next(
        new AppError(
          "Too many requests from this IP! Please try again in an hour.",
          options.statusCode
        )
      );
    },
  })
);

// parse request body
// limit request body payload
app.use(express.json({ limit: "10kb" }));

app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// parse cookies
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitizer());

// Data sanitization agains XSS
app.use(xssClean());

// Compress JSON and text
app.use(compression());

// remove unaccepted queries from the request
app.use(filterRequestQueries);

// prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      "duration",
      "ratingsQuantiy",
      "ratingsAverage",
      "maxGroupSize",
      "difficulty",
      "price",
    ],
  })
);

// routes
app.use("/api/v1/tours", tourRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/reviews", reviewRouter);
app.use("/api/v1/bookings", bookingRouter);

// wildcard route handling
app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

// global error handling middleware
app.use(globalErrorHandler);

module.exports = app;
