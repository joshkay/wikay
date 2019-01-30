const express = require('express');

const userController = require('../controllers/userController');

const userValidation = require('../validations/users');

const router = express.Router();

router.get('/users/sign_up', userController.signUp);
router.post(
  '/users', 
  userValidation.validateCreate,
  userController.create
);
router.get('/users/sign_in', userController.signInForm);
router.post(
  '/users/sign_in',
  userValidation.validateSignIn,
  userController.signIn
);
router.get('/users/sign_out', userController.signOut);

module.exports = router;