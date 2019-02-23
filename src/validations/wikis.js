validateCreate = (req, res, next) =>
{
  if (req.method === 'POST')
  {
    req.checkBody('title', 'must be at least 3 characters in length').isLength({min: 3});
    req.checkBody('body', 'must be at least 50 characters in length').isLength({min: 50});
  }

  const errors = req.validationErrors();

  if (errors)
  {
    const form = 
    {
      title: req.body.title,
      body: req.body.body
    };

    req.flash('errors', errors);
    req.flash('form', form);
    
    return res.redirect(303, req.headers.referer);
  }
  else
  {
    return next();
  }
};

module.exports =
{
  validateCreate,
  validateUpdate(req, res, next)
  {
    return validateCreate(req, res, next);
  }
};