const passport = require('passport');
const sendgrid = require('@sendgrid/mail');

const User = require('../db/models').User;
const userQueries = require('../db/queries/users');

module.exports = 
{
  signUp(req, res, next)
  {
    res.render('users/sign_up');
  },
  create(req, res, next)
  {
    let newUser =
    {
      username: req.body.username,
      email: req.body.email,
      password: req.body.password,
      passwordConfirmation: req.body.passwordConfirmation
    };

    userQueries.createUser(newUser, (err, user) =>
    {
      if (err)
      {
        req.flash('errors', err.errors[0].message);
        req.flash('form', newUser);

        res.redirect(303, req.headers.referer);
      }
      else
      {
        passport.authenticate('local')(req, res, () =>
        {
          const msg = {
            to: newUser.email,
            from: 'info@blocipedia.com',
            subject: 'Blocipedia Registration',
            text: 'Welcome to Blocipedia!'
          };
          sendgrid.send(msg);

          req.flash('notice', "You've successfully signed in!");
          res.redirect('/');
        });
      }
    });
  },
  signInForm(req, res, next)
  {
    res.render('users/sign_in');
  },
  signIn(req, res, next)
  {
    passport.authenticate('local', (err, user, info) =>
    {
      if (err) 
      { 
        return next(err); 
      }

      if (user)
      {
        req.login(user, (err) => 
        {
          if (err) 
          { 
            return next(err); 
          }

          req.flash('notice', "You've successfully signed in!");
          res.redirect('/');
        });
      }
      else
      {
        let form =
        {
          username: req.body.username,
          password: req.body.password
        };
        
        req.flash('notice', 'Sign in failed. Please try again.');
        req.flash('form', form);

        res.redirect('/users/sign_in');
      }
    })(req, res, next);
  },
  signOut(req, res, next)
  {
    req.logout();
    req.flash('notice', "You've successfully signed out!");
    res.redirect('/');
  },
  profile(req, res, next)
  {
    res.render('users/profile');
  },
  upgrade(req, res, next)
  {
    // Set your secret key: remember to change this to your live secret key in production
    // See your keys here: https://dashboard.stripe.com/account/apikeys
    var stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

    // Token is created using Checkout or Elements!
    // Get the payment token ID submitted by the form:
    const token = req.body.stripeToken; // Using Express
    
    (async () => {
      const charge = await stripe.charges.create({
        amount: Math.round(process.env.PREMIUM_PRICE * 100),
        currency: 'cad',
        description: 'Premium User Upgrade',
        source: token,
        receipt_email: req.body.stripeEmail
      });

      if (charge.failure_message != null)
      {
        req.flash('errors', charge.failure_message);
      }
      else if (!charge.paid)
      {
        req.flash('errors', "Account upgrade failed!");
      }
      else if (charge.paid)
      {
        userQueries.updateUser({role: User.ROLE_PREMIUM}, req.user, (err, user) =>
        {
          if (err || user == null)
          {
            req.flash('errors', "Account upgrade failed!");
          }
          else
          {
            req.flash('notice', "Account upgraded to premium!");
          }
        });
      }
      
      res.redirect('/wikis');
    })();
  }
};