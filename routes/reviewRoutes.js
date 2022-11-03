const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

const router = express.Router({ mergeParams: true });

router.use(authController.requireAuthentication);

router
    .route('/')
    .get(reviewController.getAllReviews)
    .post(authController.restrictTo('admin', 'user'), reviewController.createReview);

router
    .route('/:id')
    .patch(reviewController.updateReview)
    .delete(reviewController.deleteReview);

module.exports = router;