const bcrypt = require('bcryptjs');

const AUTH_MESSAGE = 'You must be signed in to do that.';

module.exports =
{
  AUTH_MESSAGE,
  ensureAuthenticated(req, res, next)
  {
    if (!req.user)
    {
      req.flash('notice', AUTH_MESSAGE);
      return res.redirect('/users/sign_in');
    }
    else
    {
      next();
    }
  },
  comparePass(userPassword, databasePassword)
  {
    return bcrypt.compareSync(userPassword, databasePassword);
  }
};