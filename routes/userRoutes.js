const express = require('express')
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const checkPasswordConfirmation = require('../utils/checkPasswordConfirmation');


const router = express.Router();

router.post('/signup', checkPasswordConfirmation, authController.signup);
router.post('/login', authController.login);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', checkPasswordConfirmation, authController.resetPassword);

router.use(authController.requireAuthentication);

router.patch('/updateMyPassword', checkPasswordConfirmation, authController.updatePassword);
router.get('/me', userController.getMe, userController.getUser);
router.patch('/updateMe', userController.uploadUserPhoto, userController.resizeUserPhoto, userController.updateMe);
router.delete('/deleteMe', userController.deleteMe);

router
    .route('/')
    .get(userController.getAllUsers)
    .post(userController.createUser);

router
    .route('/:id')
    .get(userController.getUser)
    .patch(userController.updateUser)
    .delete(userController.deleteUser);

module.exports = router