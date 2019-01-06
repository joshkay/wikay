const express = require('express');

const appConfig = require('./config/main-config');
const routeConfig = require('./config/route-config');

const app = express();

appConfig.init(app, express);
routeConfig.init(app);

module.exports = app;