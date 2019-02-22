const express = require('express');

const userController = require('../controllers/userController');

const userValidation = require('../validations/users');
const authHelpers = require('../auth/helpers');

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
router.post(
  '/users/upgrade',
  authHelpers.ensureAuthenticated,
  userController.upgrade
);
router.get('/profile',
  authHelpers.ensureAuthenticated,
  userController.profile
);

module.exports = router;