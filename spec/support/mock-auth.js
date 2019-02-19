const User = require('../../src/db/models').User;

module.exports = 
{
  fakeIt(app)
  {
    let id;
    let username;

    function middleware(req, res, next)
    {
      id = req.body.userId || id;
      username = req.body.username || username;

      if (id && id != 0)
      {
        req.user = new User();
        req.user.id = parseInt(id);
        req.user.username = username;
      }
      else if (id == 0)
      {
        delete req.user;
      }

      if (next)
      {
        next();
      }
    }

    function route(req, res)
    {
      res.redirect('/');
    }

    app.use(middleware);
    app.get('/auth/fake', route);
  }
};