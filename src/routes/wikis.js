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
router.get('/wiki/:slug', wikiController.show);
router.get('/wiki/:slug/edit', 
  authHelpers.ensureAuthenticated,
  wikiController.edit
);
router.post('/wiki/:slug/update',
  authHelpers.ensureAuthenticated,
  validation.validateUpdate,
  wikiController.update
);
router.get('/wiki/:slug/collaborators',
  authHelpers.ensureAuthenticated,
  wikiController.collaborators
);
router.post('/wiki/:slug/collaborator/add',
  authHelpers.ensureAuthenticated,
  wikiController.addCollaborator
);
router.post('/wiki/:slug/collaborator/:collaboratorId/remove',
  authHelpers.ensureAuthenticated,
  wikiController.removeCollaborator
);
router.post('/wiki/:slug/destroy',
  authHelpers.ensureAuthenticated,
  wikiController.destroy
);

module.exports = router;