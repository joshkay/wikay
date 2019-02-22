const express = require('express');

const userController = require('../controllers/userController');

const userValidation = require('../validations/users');
const authHelpers = require('../auth/helpers');

const router = express.Router();

router.get('/signup', userController.signUp);
router.post(
  '/user/create', 
  userValidation.validateCreate,
  userController.create
);
router.get('/login', userController.signInForm);
router.post(
  '/login',
  userValidation.validateSignIn,
  userController.signIn
);
router.get('/logout', userController.signOut);
router.post(
  '/user/upgrade',
  authHelpers.ensureAuthenticated,
  userController.upgrade
);
router.post(
  '/user/downgrade',
  authHelpers.ensureAuthenticated,
  userController.downgrade
);
router.get('/profile',
  authHelpers.ensureAuthenticated,
  userController.profile
);

module.exports = router;