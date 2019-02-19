const AUTHORIZATION_MESSAGE = 'You are not authorized to do that.';

module.exports =
{
  AUTHORIZATION_MESSAGE,
  handleFailed(req, res)
  {
    req.flash('notice', AUTHORIZATION_MESSAGE);
  }
};