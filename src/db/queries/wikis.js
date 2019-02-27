const slugify = require('slugify');

const Wiki = require('../models').Wiki;
const User = require('../models').User;

module.exports =
{
  getAllWikis(callback)
  {
    return Wiki.findAll({
      include: [{
        model: User,
        as: 'collaborators'
      }]
    })
    .then((wikis) =>
    {
      callback(null, wikis);
    })
    .catch((err) =>
    {
      callback(err);
    });
  },
  getAllPublicWikis(callback)
  {
    return Wiki.scope(Wiki.SCOPE_PUBLIC).findAll()
    .then((wikis) =>
    {
      callback(null, wikis);
    })
    .catch((err) =>
    {
      callback(err);
    });
  },
  addWiki(newWiki, callback)
  {
    return Wiki.create({
      title: newWiki.title,
      body: newWiki.body,
      slug: slugify(newWiki.title, {
        replacement: '_',
        lower: true
      }),
      private: newWiki.private,
      userId: newWiki.userId
    })
    .then((wiki) =>
    {
      callback(null, wiki);
    })
    .catch((err) =>
    {
      callback(err);
    });
  },
  getWiki(wikiSlug)
  {
    return Wiki.findOne({
      where: {slug: wikiSlug},
      include: [{
        model: User,
        as: 'collaborators'
      }]
    });
  },
  updateWiki(updatedWiki, wiki, callback)
  {
    return wiki.update(
      updatedWiki,
      {fields: Object.keys(updatedWiki)}
    )
    .then((wiki) =>
    {
      callback(null, wiki);
    })
    .catch((err) =>
    {
      callback(err);
    });
  },
  updateUserWikisPublic(user)
  {
    return Wiki.update(
    {
      private: false
    },
    {
      where: { userId: user.id },
      fields: ['private']
    });
  },
  deleteWiki(wiki, callback)
  {
    return wiki.destroy()
    .then(() =>
    {
      callback(null);
    })
    .catch((err) =>
    {
      callback(err);
    });
  },
  getWikiCollaborators(wiki)
  {
    return wiki.getCollaborators();
  },
  addWikiCollaborator(wiki, user)
  {
    return wiki.addCollaborator(user);
  },
  removeWikiCollaborator(wiki, user)
  {
    return wiki.removeCollaborator(user);
  }
}