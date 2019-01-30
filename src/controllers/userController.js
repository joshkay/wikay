const passport = require('passport');
const sendgrid = require('@sendgrid/mail');

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
  }
};