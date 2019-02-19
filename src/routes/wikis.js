const express = require('express');

const wikiController = require('../controllers/wikiController');
const validation = require('../validations/wikis');
const authHelpers = require('../auth/helpers');

const router = express.Router();

router.get('/wikis', wikiController.list);
router.get('/wiki/new', 
  authHelpers.ensureAuthenticated, 
  wikiController.new
);
router.post('/wiki/create', 
  authHelpers.ensureAuthenticated, 
  validation.validateCreate,
  wikiController.create
);
router.get('/wiki/:id', wikiController.show);
router.get('/wiki/:id/edit', 
  authHelpers.ensureAuthenticated,
  wikiController.edit
);
router.post('/wiki/:id/update',
  authHelpers.ensureAuthenticated,
  validation.validateUpdate,
  wikiController.update
);
router.post('/wiki/:id/destroy',
  authHelpers.ensureAuthenticated,
  wikiController.destroy
);

module.exports = router;