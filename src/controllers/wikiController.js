const passport = require('passport');

const wikiQueries = require('../db/queries/wikis');
const Authorizer = require('../policies/wiki');

const policyHelpers = require('../policies/helpers');

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
          let userWikis = null;
          let publicWikis = null;

          if (req.user)
          {
            // separate  wikis
            userWikis = wikis.filter((wiki) =>
            {
              return wiki.userId === req.user.id;
            });

            publicWikis = wikis.filter((wiki) =>
            {
              return wiki.private === false &&
                wiki.userId !== req.user.id;
            });
          }
          else
          {
            publicWikis = wikis.filter((wiki) =>
            {
              return wiki.private === false;
            });
          }

          res.render('wikis/index', 
          {
            userWikis,
            publicWikis
          });
        }
      });
    }
    else
    {
      policyHelpers.handleFailed(req, res);
      res.redirect('/');
    }
  },
  new(req, res, next)
  {
    const authorizer = new Authorizer(req.user);
    const authorized = authorizer.new();

    if (authorized)
    {
      res.render('wikis/new',
      {
        policy: authorizer
      });
    }
    else
    {
      policyHelpers.handleFailed(req, res);
      res.redirect('/');
    }
  },
  create(req, res, next)
  {
    const authorizer = new Authorizer(req.user);
    const authorized = authorizer.create();

    if (authorized)
    {
      const private = authorizer.createPrivate() ? (req.body.private != undefined) : false;
      let newWiki =
      {
        title: req.body.title,
        body: req.body.body,
        private: private,
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
      policyHelpers.handleFailed(req, res);
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
        const authorizer = new Authorizer(req.user, wiki);
        const authorized = authorizer.show();

        if (authorized)
        {
          res.render('wikis/show',
          {
            wiki,
            policy: authorizer
          });
        }
        else
        {
          policyHelpers.handleFailed(req, res);
          return res.redirect('/wikis');
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
        const authorizer = new Authorizer(req.user, wiki);
        const authorized = authorizer.edit();

        if (authorized)
        {
          res.render('wikis/edit', 
          {
            wiki,
            policy: authorizer
          });
        }
        else
        {
          policyHelpers.handleFailed(req, res);
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
        const authorizer = new Authorizer(req.user, wiki);
        const authorized = authorizer.update();

        if (authorized)
        {
          const private = authorizer.updatePrivate() ? (req.body.private != undefined) : false;
          const updatedWikiData =
          {
            title: req.body.title,
            body: req.body.body,
            private: private
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
          policyHelpers.handleFailed(req, res);
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
          policyHelpers.handleFailed(req, res);
          res.redirect(`/wiki/${req.params.id}`);
        }
      }
    });
  }
};