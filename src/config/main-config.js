require('dotenv').config();

const path = require('path');
const bodyParser = require('body-parser');
const expressValidator = require('express-validator');
const session = require('express-session');
const flash = require('express-flash');
const logger = require('morgan');
const passportConfig = require('./passport-config');
const sendgrid = require('@sendgrid/mail');

const viewsFolder = path.join(__dirname, '..', 'views');

module.exports =
{
  init(app, express)
  {
    app.set('views', viewsFolder);
    app.set('view engine', 'ejs');
    app.use(bodyParser.urlencoded({extended: true}));
    app.use(expressValidator());
    app.use(session({
      secret: process.env.COOKIE_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: { maxAge: 1.21e+9 } // set cookie to expire in 14 days
    }));
    app.use(flash());
    //app.use(logger('dev'));
    
    passportConfig.init(app);

    if (process.env.NODE_ENV === 'test')
    {
      const mockAuth = require('../../spec/support/mock-auth');
      mockAuth.fakeIt(app);
    }

    app.use((req, res, next) =>
    {
      res.locals.user = req.user;
      if (next)
      {
        next();
      }
    });

    sendgrid.setApiKey(process.env.SENDGRID_API_KEY);
    
    app.use(express.static(path.join(__dirname, '..', 'assets')));
  }
};