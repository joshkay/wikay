const passport = require('passport');
const sendgrid = require('@sendgrid/mail');

const User = require('../db/models').User;
const userQueries = require('../db/queries/users');
const wikiQueries = require('../db/queries/wikis');

module.exports = 
{
  signUp(req, res, next)
  {
    res.render('users/signup');
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
    res.render('users/login');
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

        res.redirect('/login');
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
    if (!req.user.isStandard())
    {
      req.flash('error', "Only Standard users can upgrade!");
      res.redirect('back');
    }
    else if (req.user.upgraded)
    {
      // user has already been upgraded, upgrade for free
      const userUpdates =
      {
        role: User.ROLE_PREMIUM
      };

      userQueries.updateUser(userUpdates, req.user, (err, user) =>
      {
        if (err || user == null)
        {
          req.flash('error', "Account upgrade failed!");
        }
        else
        {
          req.flash('notice', "Account upgraded to premium!");
        }
        res.redirect('back');
      });
    }
    else
    {
      var stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
      
      const token = req.body.stripeToken;
      
      (async () => {
        try {
          const charge = await stripe.charges.create({
            amount: Math.round(process.env.PREMIUM_PRICE * 100),
            currency: 'cad',
            description: 'Premium User Upgrade',
            source: token,
            receipt_email: req.body.stripeEmail
          });

          if (charge.failure_message != null)
          {
            req.flash('error', charge.failure_message);
            res.redirect('back');
          }
          else if (!charge.paid)
          {
            req.flash('error', "Account upgrade failed!");
            res.redirect('back');
          }
          else if (charge.paid)
          {
            const userUpdates =
            {
              role: User.ROLE_PREMIUM,
              upgraded: true,
              amountPaid: charge.amount,
              datePaid: new Date()
            };

            userQueries.updateUser(userUpdates, req.user, (err, user) =>
            {
              if (err || user == null)
              {
                req.flash('error', "Account upgrade failed!");
              }
              else
              {
                req.flash('notice', "Account upgraded to premium!");
              }
              res.redirect('back');
            });
          }
        }
        catch (err)
        {
          req.flash('error', err.message);
          res.redirect('back');
        }
      })();
    }
  },
  downgrade(req, res, next)
  {
    if (!req.user.isPremium())
    {
      req.flash('error', "Only Premium users can downgrade!");
      res.redirect('back');
    }
    else
    {
      const userUpdates =
      {
        role: User.ROLE_STANDARD
      };

      userQueries.updateUser(userUpdates, req.user, (err, user) =>
      {
        if (err || user == null)
        {
          req.flash('error', "Account downgrade failed!");
          res.redirect('back');
        }
        else
        {
          (async () =>
          {
            await wikiQueries.updateUserWikisPublic(req.user);

            req.flash('notice', "Account downgraded to standard!");
            res.redirect('back');
          })();
        }
      });
    }
  }
};