const passport = require('passport');
const markdown = require('markdown').markdown;

const userQueries = require('../db/queries/users');
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
          let sharedWikis = null;
          let publicWikis = null;

          if (req.user)
          {
            // separate  wikis
            userWikis = wikis.filter((wiki) =>
            {
              return wiki.userId === req.user.id;
            });

            sharedWikis = wikis.filter(wiki => wiki.isCollaborator(req.user));

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
            sharedWikis,
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
    (async () =>
    {
      try
      {
        const wiki = await wikiQueries.getWiki(req.params.slug);

        const authorizer = new Authorizer(req.user, wiki);
        const authorized = authorizer.show();

        if (authorized)
        {
          wiki.body = markdown.toHTML(wiki.body);

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
      catch(err)
      {
        console.log(err);
        res.redirect(500, '/');
      }
    })();
  },
  edit(req, res, next)
  {
    (async () =>
    {
      try
      {
        const wiki = await wikiQueries.getWiki(req.params.slug);

        const authorizer = new Authorizer(req.user, wiki);
        const authorized = authorizer.edit();

        if (authorized)
        {
          wiki.bodyMarkdown = markdown.toHTML(wiki.body);

          res.render('wikis/edit', 
          {
            wiki,
            policy: authorizer
          });
        }
        else
        {
          policyHelpers.handleFailed(req, res);
          res.redirect(`/wiki/${req.params.slug}`);
        }
      }
      catch(err)
      {
        res.redirect(500, '/');
      }
    })();
  },
  update(req, res, net)
  {
    (async () =>
    {
      try
      {
        const wiki = await wikiQueries.getWiki(req.params.slug);

        const authorizer = new Authorizer(req.user, wiki);
        const authorized = authorizer.update();

        if (authorized)
        {
          const private = authorizer.updatePrivate() ? (req.body.private != undefined) : wiki.private;
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
          res.redirect(`/wiki/${req.params.slug}`);
        }
      }
      catch(err)
      {
        res.redirect(500, '/');
      }
    })();
  },
  collaborators(req, res, next)
  {
    (async () =>
    {
      try
      {
        const wiki = await wikiQueries.getWiki(req.params.slug);

        const authorizer = new Authorizer(req.user, wiki);
        const authorized = authorizer.collaborators();

        if (authorized)
        {
          const collaborators = await wikiQueries.getWikiCollaborators(wiki);

          const users = await userQueries.getUsers()
            .filter(user => user.id !== req.user.id)
            .filter(user => !collaborators.map(user => user.id).includes(user.id));
          
          res.render('wikis/collaborators',
          {
            wiki,
            users,
            collaborators
          });
        }
        else
        {
          policyHelpers.handleFailed(req, res);
          res.redirect(`/wiki/${req.params.slug}`);
        }
      }
      catch(err)
      {
        res.redirect(500, '/');
      }
    })();
  },
  addCollaborator(req, res, next)
  {
    (async () =>
    {
      try
      {
        const wiki = await wikiQueries.getWiki(req.params.slug);

        const authorizer = new Authorizer(req.user, wiki);
        const authorized = authorizer.addCollaborator();
  
        if (authorized)
        {
          const newCollaborator = await userQueries.getUser(req.body.collaborator);
          const collaborators = await wikiQueries.addWikiCollaborator(wiki, newCollaborator);
  
          res.redirect('back');
        }
        else
        {
          policyHelpers.handleFailed(req, res);
          res.redirect(`/wiki/${req.params.slug}`);
        }
      }
      catch(err)
      {
        res.redirect(500, '/');
      }
    })();
  },
  removeCollaborator(req, res, next)
  {
    (async () =>
    {
      try
      {
        const wiki = await wikiQueries.getWiki(req.params.slug);

        const authorizer = new Authorizer(req.user, wiki);
        const authorized = authorizer.removeCollaborator();
  
        if (authorized)
        {
          const existingCollaborator = await userQueries.getUser(req.params.collaboratorId);
          const collaborators = await wikiQueries.removeWikiCollaborator(wiki, existingCollaborator);
  
          res.redirect('back');
        }
        else
        {
          policyHelpers.handleFailed(req, res);
          res.redirect(`/wiki/${req.params.slug}`);
        }
      }
      catch(err)
      {
        console.log(err);
        res.redirect(500, '/');
      }
    })();
  },
  destroy(req, res, net)
  {
    (async () =>
    {
      try
      {
        const wiki = await wikiQueries.getWiki(req.params.slug);

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
          res.redirect(`/wiki/${req.params.slug}`);
        }
      }
      catch(err)
      {
        res.redirect(500, '/');
      }
    })();
  }
};