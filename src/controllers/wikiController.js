const passport = require('passport');

const wikiQueries = require('../db/queries/wikis');
const Authorizer = require('../policies/wiki');

const authHelpers = require('../policies/helpers');

module.exports = 
{
  list(req, res, next)
  {
    const authorized = new Authorizer(req.user).list();

    if (authorized)
    {
      wikiQueries.getAllWikis((err, wikis) =>
      {
        if (err)
        {
          console.log(err);
          res.redirect(500, '/');
        }
        else
        {
          res.render('wikis/index', {wikis});
        }
      });
    }
    else
    {
      authHelpers.handleFailed(req, res);
      res.redirect('/');
    }
  },
  new(req, res, next)
  {
    const authorized = new Authorizer(req.user).new();

    if (authorized)
    {
      res.render('wikis/new');
    }
    else
    {
      authHelpers.handleFailed(req, res);
      res.redirect('/');
    }
  },
  create(req, res, next)
  {
    const authorized = new Authorizer(req.user).create();

    if (authorized)
    {
      let newWiki =
      {
        title: req.body.title,
        body: req.body.body,
        userId: req.user.id
      };

      wikiQueries.addWiki(newWiki, (err, wiki) =>
      {
        if (err || wiki == null)
        {
          console.log(err);
          res.redirect(500, '/');
        }
        else
        {
          res.redirect(`/wiki/${wiki.slug}`);
        }
      });
    }
    else
    {
      authHelpers.handleFailed(req, res);
      res.redirect('/');
    }
  },
  show(req, res, next)
  {
    wikiQueries.getWiki(req.params.id, (err, wiki) =>
    {
      if (err || wiki == null)
      {
        res.redirect(500, '/');
      }
      else
      {
        const authorized = new Authorizer(req.user, wiki).show();

        if (authorized)
        {
          res.render('wikis/show', {wiki});
        }
        else
        {
          authHelpers.handleFailed(req, res);
          res.redirect('/');
        }
      }
    });
  },
  edit(req, res, next)
  {
    wikiQueries.getWiki(req.params.id, (err, wiki) =>
    {
      if (err || wiki == null)
      {
        res.redirect(500, '/');
      }
      else
      {
        const authorized = new Authorizer(req.user, wiki).edit();

        if (authorized)
        {
          res.render('wikis/edit', {wiki});
        }
        else
        {
          authHelpers.handleFailed(req, res);
          res.redirect(`/wiki/${req.params.id}`);
        }
      }
    });
  },
  update(req, res, net)
  {
    wikiQueries.getWiki(req.params.id, (err, wiki) =>
    {
      if (err || wiki == null)
      {
        res.redirect(500, '/');
      }
      else
      {
        const authorized = new Authorizer(req.user, wiki).update();

        if (authorized)
        {
          const updatedWikiData =
          {
            title: req.body.title,
            body: req.body.body
          };

          wikiQueries.updateWiki(updatedWikiData, wiki, (err, updatedWiki) =>
          {
            if (err || updatedWiki == null)
            {
              console.log(err);
              res.redirect(500, '/');
            }
            else
            {
              res.redirect(`/wiki/${updatedWiki.slug}`);
            }
          });
        }
        else
        {
          authHelpers.handleFailed(req, res);
          res.redirect(`/wiki/${req.params.id}`);
        }
      }
    });
  },
  destroy(req, res, net)
  {
    wikiQueries.getWiki(req.params.id, (err, wiki) =>
    {
      if (err || wiki == null)
      {
        res.redirect(500, '/');
      }
      else
      {
        const authorized = new Authorizer(req.user, wiki).destroy();

        if (authorized)
        {
          wikiQueries.deleteWiki(wiki, (err) =>
          {
            if (err)
            {
              console.log(err);
              res.redirect(500, '/');
            }
            else
            {
              res.redirect(`/wikis`);
            }
          });
        }
        else
        {
          authHelpers.handleFailed(req, res);
          res.redirect(`/wiki/${req.params.id}`);
        }
      }
    });
  }
};