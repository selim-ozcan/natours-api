const express = require('express');
const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');
const reviewRouter = require('./reviewRoutes');
const router = express.Router();

router.use('/:tourId/reviews', reviewRouter);


router.use(authController.requireAuthentication);

router
    .route('/top-5-cheap')
    .get(tourController.aliasTopTours, tourController.getAllTours);

router
    .route('/stats')
    .get(tourController.getTourStats);

router
    .route('/monthly-plan/:year')
    .get(authController.restrictTo('admin', 'lead-guide', 'guide'), tourController.getMonthlyPlan);


router.use(authController.restrictTo('admin', 'lead-guide'));

router
    .route('/')
    .get(tourController.getAllTours)
    .post(tourController.createTour);

router
    .route('/:id')
    .get(tourController.getTour)
    .patch(tourController.uploadTourImages, tourController.resizeTourImages, tourController.updateTour)
    .delete(tourController.deleteTour);

module.exports = router;