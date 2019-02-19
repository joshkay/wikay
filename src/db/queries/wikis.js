const slugify = require('slugify');

const Wiki = require('../models').Wiki;

module.exports =
{
  getAllWikis(callback)
  {
    return Wiki.findAll()
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
  getWiki(wikiSlug, callback)
  {
    return Wiki.findOne({
      where: {slug: wikiSlug}
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
  }
}