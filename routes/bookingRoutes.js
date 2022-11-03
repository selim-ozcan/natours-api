const express = require("express");
const bookingController = require("../controllers/bookingController");
const authController = require("../controllers/authController");

const router = express.Router();

router.use(authController.requireAuthentication);
router.get("/checkout-session/:tourId", bookingController.getCheckoutSession);

module.exports = router;
