module.exports =
{
  validateCreate(req, res, next)
  {
    if (req.method === 'POST')
    {
      req.checkBody('username', 'must be at least 6 characters in length').isLength({min: 6});
      req.checkBody('username', 'must not contain spaces')
        .custom(value => !/\s/.test(value));
      req.checkBody('email', 'must be valid').isEmail();
      req.checkBody('password', 'must be at least 6 characters in length').isLength({min: 6});
      req.checkBody('passwordConfirmation', 'must match password provided').matches(req.body.password);
    }

    const errors = req.validationErrors();

    if (errors)
    {
      const form = 
      {
        username: req.body.username,
        email: req.body.email,
        password: req.body.password,
        passwordConfirmation: req.body.passwordConfirmation
      };

      req.flash('errors', errors);
      req.flash('form', form);
      
      return res.redirect(303, req.headers.referer);
    }
    else
    {
      return next();
    }
  },
  validateSignIn(req, res, next)
  {
    if (req.method === 'POST')
    {
      req.checkBody('username', 'must be at least 6 characters in length').isLength({min: 6});
      req.checkBody('username', 'must not contain spaces')
        .custom(value => !/\s/.test(value));
      req.checkBody('password', 'must be at least 6 characters in length').isLength({min: 6});
    }

    const errors = req.validationErrors();

    if (errors)
    {
      const form = 
      {
        username: req.body.username,
        password: req.body.password
      };

      req.flash('errors', errors);
      req.flash('form', form);
      
      return res.redirect(303, req.headers.referer);
    }
    else
    {
      return next();
    }
  }
};