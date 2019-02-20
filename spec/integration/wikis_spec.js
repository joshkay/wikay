const request = require('request');
const server = require('../../src/server');
const sequelize = require('../../src/db/models/index').sequelize;
const slugify = require('slugify');

const User = require('../../src/db/models').User;
const Wiki = require('../../src/db/models').Wiki;

const app = require('../../src/app');
const base = `http://localhost:${app.get('port')}`;
const loginBase = `${base}/users/sign_in`;
const authBase = `${base}/auth/fake`;
const wikiBase = `${base}/wiki`;

const AUTH_MESSAGE = require('../../src/auth/helpers').AUTH_MESSAGE;
const AUTHORIZATION_MESSAGE = require('../../src/policies/helpers').AUTHORIZATION_MESSAGE;

describe('routes : wikis', () =>
{
  beforeEach((done) =>
  {
    sequelize.sync({force: true})
    .then(() =>
    {
      User.create({
        username: 'testuser',
        email: 'testuser@test.com',
        password: '123456789'
      })
      .then((user) =>
      {
        Wiki.create({
          title: 'Listings',
          body: '',
          slug: slugify('Listings'),
          userId: user.id
        })
        .then((wiki) =>
        {
          User.create({
            username: 'testuser2',
            email: 'testuser2@test.com',
            password: '123456789'
          })
          .then((user) =>
          {
            this.user = user;

            Wiki.create({
              title: 'Test Wiki',
              body: 'Long Test Wiki Body :)',
              slug: slugify('Test Wiki'),
              userId: this.user.id
            })
            .then((wiki) =>
            {
              this.wiki = wiki;
              done();
            });
          });
        });
      });
    })
    .catch((err) =>
    {
      console.log(err);
      done();
    });
  });

  describe('guest', () =>
  {
    beforeEach((done) =>
    {
      request.get({
        url: authBase,
        form:
        {
          userId: 0
        }
      }, (err, res, body) =>
      {
        done();
      });
    });

    describe('GET /wikis', () =>
    {
      const url = `${wikiBase}s`;

      it('should return status code 200', (done) =>
      {
        request.get(url, (err, res, body) =>
        {
          expect(res.statusCode).toBe(200);
          done();
        });
      });

      it('should contain all wikis', (done) =>
      {
        request.get(url, (err, res, body) =>
        {
          expect(res.body).toContain('Listings');
          expect(res.body).toContain('Test Wiki');

          done();
        });
      });

      it('should not show new wiki button', (done) =>
      {
        request.get(url, (err, res, body) =>
        {
          expect(res.body).not.toContain('New Wiki');
          expect(res.body).not.toContain(`${wikiBase}/new`);
          done();
        });
      });
    });

    describe('GET /wiki/new', () =>
    {
      const url = `${wikiBase}/new`;

      it('should not render a new wiki form and redirect to sign in', (done) =>
      {
        request.get(url, (err, res, body) =>
        {
          expect(res.statusCode).toBe(200);
          expect(res.body).not.toContain('New Wiki');
          expect(res.body).not.toContain('/wiki/create');
          expect(body).toContain('Sign In');
          done();
        });
      });
    });

    describe('POST /wiki/create', () =>
    {
      const options =
      {
        url: `${wikiBase}/create`,
        form:
        {
          title: 'Failed Wiki',
          body: 'Description for Failed Wiki. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.'
        }
      };

      it('should not create a new wiki', (done) =>
      {
        request.post(options, (err, res, body) =>
        {
          expect(res.statusCode).toBe(302);
          
          Wiki.findOne({
            where: {title: 'Failed Wiki'}
          })
          .then((wiki) =>
          {
            expect(wiki).toBeNull();
            done();
          })
          .catch((err) =>
          {
            expect(err).toBeNull();
            done();
          });
        });
      });
    });

    describe('GET /wiki/:id', () =>
    {
      it('should render a view with the selected wiki', (done) =>
      {
        request.get(`${wikiBase}/${this.wiki.slug}`, (err, res, body) =>
        {
          expect(res.statusCode).toBe(200);
          expect(body).toContain('Test Wiki');
          expect(body).toContain('Long Test Wiki Body :)');
          expect(body).not.toContain('Edit');
          expect(body).not.toContain(`/wiki/${this.wiki.slug}/edit`);
          expect(body).not.toContain('Delete');
          expect(body).not.toContain(`/wiki/${this.wiki.slug}/destroy`);
          done();
        });
      });
    });

    describe('GET /wiki/:id/edit', () =>
    {
      it('should redirect to login page with auth error', (done) =>
      {
        const options =
        {
          url: `${wikiBase}/${this.wiki.slug}/edit`,
          jar: request.jar()
        };

        request.get(options, (err, res, body) =>
        {
          expect(res.request._redirect.redirects.length).toBe(1);
          expect(res.request._redirect.redirects[0].statusCode).toBe(302);
          expect(res.request._redirect.redirects[0].redirectUri).toBe(loginBase);
          expect(body).toContain('Sign In');
          expect(body).toContain(AUTH_MESSAGE);
          expect(body).not.toContain('Edit Wiki');
          expect(body).not.toContain(`/wiki/${this.wiki.slug}/update`);
          done();
        });
      });
    });

    describe('POST /wiki/:id/update', () =>
    {
      it('should not update wiki and redirect to login page with auth error', (done) =>
      {
        const options =
        {
          url: `${wikiBase}/${this.wiki.slug}/update`,
          form:
          {
            title: 'Test Wiki Update',
            body: 'Long Test Wiki Updated Body :)',
          },
          followAllRedirects: true,
          jar: request.jar()
        };

        expect(this.wiki.title).toBe('Test Wiki');
        expect(this.wiki.body).toBe('Long Test Wiki Body :)');

        request.post(options, (err, res, body) =>
        {
          expect(body).toContain('Sign In');
          expect(body).toContain(AUTH_MESSAGE);
          expect(body).not.toContain('Wikis');

          Wiki.findByPk(this.wiki.id)
          .then((wiki) =>
          {
            expect(wiki.title).toBe('Test Wiki');
            expect(wiki.body).toBe('Long Test Wiki Body :)');
            done();
          })
          .catch((err) =>
          {
            expect(err).toBeNull();
            done();
          });
        });
      });
    });

    describe('POST /wiki/:id/destroy', () =>
    {
      it('should not delete wiki and redirect to login page with auth error', (done) =>
      {
        const options =
        {
          url: `${wikiBase}/${this.wiki.slug}/destroy`,
          followAllRedirects: true,
          jar: request.jar()
        };

        request.post(options, (err, res, body) =>
        {
          expect(body).toContain('Sign In');
          expect(body).toContain(AUTH_MESSAGE);

          Wiki.findByPk(this.wiki.id)
          .then((wiki) =>
          {
            expect(wiki).not.toBeNull();
            done();
          })
          .catch((err) =>
          {
            expect(err).toBeNull();
            done();
          });
        });
      });
    });
  });

  describe('standard user (not wiki creator)', () =>
  {
    beforeEach((done) =>
    {
      User.create({
        username: 'nonowner',
        email: 'nonowner@test.com',
        password: '123456789'
      })
      .then((user) =>
      {
        this.user = user;
        
        request.get({
          url: authBase,
          form:
          {
            userId: this.user.id,
            username: this.user.username
          }
        }, (err, res, body) =>
        {
          done();
        });
      });
    });

    describe('GET /wiki/:id', () =>
    {
      it('should render a view with the selected wiki', (done) =>
      {
        request.get(`${wikiBase}/${this.wiki.slug}`, (err, res, body) =>
        {
          expect(res.statusCode).toBe(200);
          expect(body).toContain('Test Wiki');
          expect(body).toContain('Long Test Wiki Body :)');
          expect(body).not.toContain('Edit');
          expect(body).not.toContain(`/wiki/${this.wiki.slug}/edit`);
          expect(body).not.toContain('Delete');
          expect(body).not.toContain(`/wiki/${this.wiki.slug}/destroy`);
          done();
        });
      });
    });

    describe('GET /wiki/:id/edit', () =>
    {
      it('should render an edit view for the selected wiki', (done) =>
      {
        request.get(`${wikiBase}/${this.wiki.slug}/edit`, (err, res, body) =>
        {
          expect(res.statusCode).toBe(200);
          expect(body).toContain('Edit Wiki');
          expect(body).toContain(`/wiki/${this.wiki.slug}/update`);
          expect(body).toContain('Title');
          expect(body).toContain(this.wiki.title);
          expect(body).toContain('Body');
          expect(body).toContain(this.wiki.body);
          done();
        });
      });
    });

    describe('POST /wiki/:id/update', () =>
    {
      it('should not update wiki with invalid values', (done) =>
      {
        const options =
        {
          url: `${wikiBase}/${this.wiki.slug}/update`,
          form:
          {
            title: 'Test Wiki Update',
            body: 'Long Test Wiki Updated Body :)',
          },
          headers:
          {
            referer: `${wikiBase}/${this.wiki.slug}/edit`
          },
          followAllRedirects: true,
          jar: request.jar()
        };

        expect(this.wiki.title).toBe('Test Wiki');
        expect(this.wiki.body).toBe('Long Test Wiki Body :)');

        request.post(options, (err, res, body) =>
        {
          expect(res.request.uri.href).toBe(`${wikiBase}/${this.wiki.slug}/edit`);
          expect(body).toContain('Test Wiki Update');
          expect(body).toContain('Long Test Wiki Updated Body :)');
          expect(body).toContain('Validation error')

          Wiki.findByPk(this.wiki.id)
          .then((wiki) =>
          {
            expect(wiki.title).toBe(this.wiki.title);
            expect(wiki.body).toBe(this.wiki.body);
            done();
          })
          .catch((err) =>
          {
            expect(err).toBeNull();
            done();
          });
        });
      });

      it('should update wiki and redirect to the wiki page', (done) =>
      {
        const newWikiTitle = 'Test Wiki Updated';
        const newWikiBody = 'Test Long Test Wiki Body :) Test Long Test Wiki Body :) Test Long Test Wiki Body :) Test Long Test Wiki Body :) Test Long Test Wiki Body :) Test Long Test Wiki Body :)';

        const options =
        {
          url: `${wikiBase}/${this.wiki.slug}/update`,
          form:
          {
            title: newWikiTitle,
            body: newWikiBody
          },
          followAllRedirects: true,
          jar: request.jar()
        };

        expect(this.wiki.title).toBe('Test Wiki');
        expect(this.wiki.body).toBe('Long Test Wiki Body :)');

        request.post(options, (err, res, body) =>
        {
          expect(res.request.uri.href).toBe(`${wikiBase}/${this.wiki.slug}`);
          expect(body).toContain(newWikiTitle);
          expect(body).toContain(newWikiBody);

          Wiki.findByPk(this.wiki.id)
          .then((wiki) =>
          {
            expect(wiki.title).toBe(newWikiTitle);
            expect(wiki.body).toBe(newWikiBody);
            done();
          })
          .catch((err) =>
          {
            expect(err).toBeNull();
            done();
          });
        });
      });
    });

    describe('POST /wiki/:id/destroy', () =>
    {
      it('should not delete wiki and redirect to wiki page with auth error', (done) =>
      {
        const options =
        {
          url: `${wikiBase}/${this.wiki.slug}/destroy`,
          followAllRedirects: true,
          jar: request.jar()
        };

        request.post(options, (err, res, body) =>
        {
          expect(body).toContain(AUTHORIZATION_MESSAGE);
          expect(body).toContain(this.wiki.title);
          expect(body).toContain(this.wiki.body);

          Wiki.findByPk(this.wiki.id)
          .then((wiki) =>
          {
            expect(wiki).not.toBeNull();
            done();
          })
          .catch((err) =>
          {
            expect(err).toBeNull();
            done();
          });
        });
      });
    });
  });

  describe('standard user (wiki creator)', () =>
  {
    beforeEach((done) =>
    {
      request.get({
        url: authBase,
        form:
        {
          userId: this.user.id,
          username: this.user.username
        }
      }, (err, res, body) =>
      {
        done();
      });
    });

    describe('GET /wikis', () =>
    {
      const url = `${wikiBase}s`;

      it('should show new wiki button', (done) =>
      {
        request.get(url, (err, res, body) =>
        {
          expect(res.body).toContain('New Wiki');
          expect(res.body).toContain('/wiki/new');
          done();
        });
      });
    });

    describe('GET /wiki/new', () =>
    {
      const url = `${wikiBase}/new`;

      it('should render a new wiki form', (done) =>
      {
        request.get(url, (err, res, body) =>
        {
          expect(res.statusCode).toBe(200);
          expect(res.body).toContain('wiki/create');
          expect(res.body).toContain('New Wiki');
          expect(res.body).toContain('Title');
          expect(res.body).toContain('Body');
          done();
        });
      });
    });

    describe('POST /wiki/create', () =>
    {
      const options =
      {
        url: `${wikiBase}/create`,
        form:
        {
          title: 'Hockey Wiki',
          body: 'Description for Hockey Wiki. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.'
        }
      };

      it('should create a new wiki', (done) =>
      {
        request.post(options, (err, res, body) =>
        {
          Wiki.findOne({
            where: {title: 'Hockey Wiki'}
          })
          .then((wiki) =>
          {
            expect(wiki).not.toBeNull();
            expect(wiki.title).toBe('Hockey Wiki');
            expect(wiki.body).toBe('Description for Hockey Wiki. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.');
            expect(wiki.slug).toBe('hockey_wiki');

            done();
          })
          .catch((err) =>
          {
            expect(err).toBeNull();
            done();
          });
        });
      });
    });

    describe('GET /wiki/:id', () =>
    {
      it('should render a view with the selected wiki', (done) =>
      {
        request.get(`${wikiBase}/${this.wiki.slug}`, (err, res, body) =>
        {
          expect(res.statusCode).toBe(200);
          expect(body).toContain('Test Wiki');
          expect(body).toContain('Long Test Wiki Body :)');
          expect(body).toContain('Edit');
          expect(body).toContain(`/wiki/${this.wiki.slug}/edit`);
          expect(body).toContain('Delete');
          expect(body).toContain(`/wiki/${this.wiki.slug}/destroy`);
          done();
        });
      });
    });

    describe('GET /wiki/:id/edit', () =>
    {
      it('should render an edit view for the selected wiki', (done) =>
      {
        request.get(`${wikiBase}/${this.wiki.slug}/edit`, (err, res, body) =>
        {
          expect(res.statusCode).toBe(200);
          expect(body).toContain('Edit Wiki');
          expect(body).toContain(`/wiki/${this.wiki.slug}/update`);
          expect(body).toContain('Title');
          expect(body).toContain(this.wiki.title);
          expect(body).toContain('Body');
          expect(body).toContain(this.wiki.body);
          done();
        });
      });
    });

    describe('POST /wiki/:id/update', () =>
    {
      it('should not update wiki with invalid values', (done) =>
      {
        const options =
        {
          url: `${wikiBase}/${this.wiki.slug}/update`,
          form:
          {
            title: 'Test Wiki Update',
            body: 'Long Test Wiki Updated Body :)',
          },
          headers:
          {
            referer: `${wikiBase}/${this.wiki.slug}/edit`
          },
          followAllRedirects: true,
          jar: request.jar()
        };

        expect(this.wiki.title).toBe('Test Wiki');
        expect(this.wiki.body).toBe('Long Test Wiki Body :)');

        request.post(options, (err, res, body) =>
        {
          expect(res.request.uri.href).toBe(`${wikiBase}/${this.wiki.slug}/edit`);
          expect(body).toContain('Test Wiki Update');
          expect(body).toContain('Long Test Wiki Updated Body :)');
          expect(body).toContain('Validation error')

          Wiki.findByPk(this.wiki.id)
          .then((wiki) =>
          {
            expect(wiki.title).toBe(this.wiki.title);
            expect(wiki.body).toBe(this.wiki.body);
            done();
          })
          .catch((err) =>
          {
            expect(err).toBeNull();
            done();
          });
        });
      });

      it('should update wiki and redirect to the wiki page', (done) =>
      {
        const newWikiTitle = 'Test Wiki Updated';
        const newWikiBody = 'Test Long Test Wiki Body :) Test Long Test Wiki Body :) Test Long Test Wiki Body :) Test Long Test Wiki Body :) Test Long Test Wiki Body :) Test Long Test Wiki Body :)';

        const options =
        {
          url: `${wikiBase}/${this.wiki.slug}/update`,
          form:
          {
            title: newWikiTitle,
            body: newWikiBody
          },
          followAllRedirects: true,
          jar: request.jar()
        };

        expect(this.wiki.title).toBe('Test Wiki');
        expect(this.wiki.body).toBe('Long Test Wiki Body :)');

        request.post(options, (err, res, body) =>
        {
          expect(res.request.uri.href).toBe(`${wikiBase}/${this.wiki.slug}`);
          expect(body).toContain(newWikiTitle);
          expect(body).toContain(newWikiBody);

          Wiki.findByPk(this.wiki.id)
          .then((wiki) =>
          {
            expect(wiki.title).toBe(newWikiTitle);
            expect(wiki.body).toBe(newWikiBody);
            done();
          })
          .catch((err) =>
          {
            expect(err).toBeNull();
            done();
          });
        });
      });
    });

    describe('POST /wiki/:id/destroy', () =>
    {
      it('should delete wiki and redirect to the wikis page', (done) =>
      {
        const options =
        {
          url: `${wikiBase}/${this.wiki.slug}/destroy`,
          followAllRedirects: true,
          jar: request.jar()
        };

        request.post(options, (err, res, body) =>
        {
          expect(body).toContain('Wikis');
          expect(body).not.toContain(this.wiki.title);

          Wiki.findByPk(this.wiki.id)
          .then((wiki) =>
          {
            expect(wiki).toBeNull();
            done();
          })
          .catch((err) =>
          {
            expect(err).toBeNull();
            done();
          });
        });
      });
    });
  });
});