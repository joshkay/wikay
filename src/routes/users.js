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

module.exports = router;