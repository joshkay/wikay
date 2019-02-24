const request = require('request');
const server = require('../../src/server');
const sequelize = require('../../src/db/models/index').sequelize;
const slugify = require('slugify');
const markdown = require('markdown').markdown;
const bcrypt = require('bcryptjs');

const User = require('../../src/db/models').User;
const Wiki = require('../../src/db/models').Wiki;

const app = require('../../src/app');
const base = `http://localhost:${app.get('port')}`;

const wikiBase = `${base}/wiki`;
const loginUrl = `${base}/login`;
const logoutUrl = `${base}/logout`;

const AUTH_MESSAGE = require('../../src/auth/helpers').AUTH_MESSAGE;
const AUTHORIZATION_MESSAGE = require('../../src/policies/helpers').AUTHORIZATION_MESSAGE;

describe('routes : wikis', () =>
{
  beforeEach((done) =>
  {
    (async () => {
      try 
      {
        await sequelize.sync({force: true});
        
        const salt = bcrypt.genSaltSync();
        this.userPassword = '123456789';

        this.user1 = await User.create({
          username: 'testuser1',
          email: 'testuser1@test.com',
          password: bcrypt.hashSync(this.userPassword, salt),
          role: User.ROLE_STANDARD
        });

        const wiki1Title = 'Test Wiki 1';
        this.wiki1 = await Wiki.create({
          title: wiki1Title,
          body: 'Test Wiki 1 Body',
          slug: slugify(wiki1Title),
          userId: this.user1.id
        });

        const wikiPrivate1Title = 'Test P Wiki 1';
        this.wikiPrivate1 = await Wiki.create({
          title: wikiPrivate1Title,
          body: 'Test P Wiki 1 Body',
          slug: slugify(wikiPrivate1Title),
          userId: this.user1.id,
          private: true
        });

        this.user2 = await User.create({
          username: 'testuser2',
          email: 'testuser2@test.com',
          password: bcrypt.hashSync(this.userPassword, salt)
        });

        const wiki2Title = 'Test Wiki 2';
        this.wiki2 = await Wiki.create({
          title: wiki2Title,
          body: 'Test Wiki 2 Body',
          slug: slugify(wiki2Title),
          userId: this.user2.id
        });

        const wikiPrivate2Title = 'Test P Wiki 2';
        this.wikiPrivate2 = await Wiki.create({
          title: wikiPrivate2Title,
          body: 'Test P Wiki 2 Body',
          slug: slugify(wikiPrivate2Title),
          userId: this.user2.id,
          private: true
        });
        
        done();
      }
      catch (err)
      {
        expect(err).toBeNull();
        done();
      }
    })();
  });

  describe('guest', () =>
  {
    beforeEach((done) =>
    {
      this.jar = request.jar();
      done();
    });

    describe('GET /wikis', () =>
    {
      const options = 
      {
        url: `${wikiBase}s`,
        jar: this.jar
      };

      it('should return status code 200', (done) =>
      {
        request.get(options, (err, res, body) =>
        {
          expect(res.statusCode).toBe(200);
          done();
        });
      });

      it('should contain all public wikis and no private wikis', (done) =>
      {
        request.get(options, (err, res, body) =>
        {
          expect(res.body).toContain(this.wiki1.title);
          expect(res.body).toContain(this.wiki2.title);
          expect(res.body).not.toContain(this.wikiPrivate1.title);
          expect(res.body).not.toContain(this.wikiPrivate2.title);
          expect(res.body).not.toContain('Your Wikis');

          done();
        });
      });

      it('should not show new wiki button', (done) =>
      {
        request.get(options, (err, res, body) =>
        {
          expect(res.body).not.toContain('New Wiki');
          expect(res.body).not.toContain(`${wikiBase}/new`);
          done();
        });
      });
    });

    describe('GET /wiki/new', () =>
    {
      const options = 
      {
        url:`${wikiBase}/new`,
        jar: this.jar 
      };

      it('should not render a new wiki form and redirect to sign in', (done) =>
      {
        request.get(options, (err, res, body) =>
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
        },
        jar: this.jar
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
        const options =
        {
          url: `${wikiBase}/${this.wiki1.slug}`,
          jar: this.jar
        };
        
        request.get(options, (err, res, body) =>
        {
          expect(res.statusCode).toBe(200);
          expect(body).toContain(this.wiki1.title);
          expect(body).toContain(this.wiki1.body);
          expect(body).not.toContain('Edit');
          expect(body).not.toContain(`/wiki/${this.wiki1.slug}/edit`);
          expect(body).not.toContain('Delete');
          expect(body).not.toContain(`/wiki/${this.wiki1.slug}/destroy`);
          done();
        });
      });

      it('should not show a private wiki and redirect to wikis', (done) =>
      {
        const options =
        {
          url: `${wikiBase}/${this.wikiPrivate1.slug}`,
          jar: this.jar
        };
        
        request.get(options, (err, res, body) =>
        {
          expect(res.request.uri.href).toBe(`${wikiBase}s`);
          expect(body).toContain(AUTHORIZATION_MESSAGE);
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
          url: `${wikiBase}/${this.wiki1.slug}/edit`,
          jar: this.jar
        };

        request.get(options, (err, res, body) =>
        {
          expect(res.request._redirect.redirects.length).toBe(1);
          expect(res.request._redirect.redirects[0].statusCode).toBe(302);
          expect(res.request._redirect.redirects[0].redirectUri).toBe(loginUrl);
          expect(body).toContain('Sign In');
          expect(body).toContain(AUTH_MESSAGE);
          expect(body).not.toContain('Edit Wiki');
          expect(body).not.toContain(`/wiki/${this.wiki1.slug}/update`);
          done();
        });
      });
    });

    describe('POST /wiki/:id/update', () =>
    {
      it('should not update wiki and redirect to login page with auth error', (done) =>
      {
        const newWikiTitle = 'Test Wiki 1 Update';
        const newWikiBody = 'Long Test Wiki Updated Body :)';

        const options =
        {
          url: `${wikiBase}/${this.wiki1.slug}/update`,
          form:
          {
            title: newWikiTitle,
            body: newWikiBody,
          },
          followAllRedirects: true,
          jar: this.jar
        };

        request.post(options, (err, res, body) =>
        {
          expect(res.request.uri.href).toBe(loginUrl);
          expect(body).toContain('Sign In');
          expect(body).toContain(AUTH_MESSAGE);

          Wiki.findByPk(this.wiki1.id)
          .then((wiki) =>
          {
            expect(wiki.title).toBe(this.wiki1.title);
            expect(wiki.body).toBe(this.wiki1.body);
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
          url: `${wikiBase}/${this.wiki1.slug}/destroy`,
          followAllRedirects: true,
          jar: this.jar
        };

        request.post(options, (err, res, body) =>
        {
          expect(body).toContain('Sign In');
          expect(body).toContain(AUTH_MESSAGE);

          Wiki.findByPk(this.wiki1.id)
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

  describe('standard user', () =>
  {
    beforeEach((done) =>
    {
      const salt = bcrypt.genSaltSync();

      this.jar = request.jar();

      const options =
      {
        url: loginUrl,
        form:
        {
          username: this.user1.username,
          password: this.userPassword
        },
        jar: this.jar
      };
      
      request.post(options, (err, res, body) =>
      {
        done();
      });
    });

    describe('GET /wikis', () =>
    {
      beforeEach((done) =>
      {
        (async () =>
        {
          this.wikiPrivate1 = await this.wikiPrivate1.update(
            {userId: this.user2.id},
            {fields: ['userId']}
          );

          done();
        })();
      });

      it("should show new wiki button", (done) =>
      {
        const options = 
        {
          url: `${wikiBase}s`,
          jar: this.jar
        };
        
        request.get(options, (err, res, body) =>
        {
          expect(res.body).toContain('New Wiki');
          expect(res.body).toContain('/wiki/new');
          done();
        });
      });

      it("should list user's wikis and other public wikis separately", (done) =>
      {
        const options = 
        {
          url: `${wikiBase}s`,
          jar: this.jar
        };
        
        request.get(options, (err, res, body) =>
        {
          expect(res.body).toContain('Your Wikis');
          expect(res.body).toContain(this.wiki1.title);
          expect(res.body).toContain('Wikis');
          expect(res.body).toContain(this.wiki2.title);
          expect(res.body).not.toContain(this.wikiPrivate1.title);
          expect(res.body).not.toContain(this.wikiPrivate2.title);
          expect(res.body).not.toContain('Private');
          done();
        });
      });

      it('should show premium upgrade prompt', (done) =>
      {
        const options = 
        {
          url: `${wikiBase}s`,
          jar: this.jar
        };
        
        request.get(options, (err, res, body) =>
        {
          expect(res.body).toContain('Upgrade to Premium');
          done();
        });
      });

      it('should not show premium upgrade prompt if user has previously paid', (done) =>
      {
        (async () =>
        {
          await this.user1.update(
            {upgraded: true},
            {fields: ['upgraded']}
          );

          const options = 
          {
            url: `${wikiBase}s`,
            jar: this.jar
          };
          
          request.get(options, (err, res, body) =>
          {
            expect(res.body).not.toContain('Upgrade to Premium');
            done();
          });
        })();
      });
    });

    describe('POST /wiki/create', () =>
    {
      it('should create a new public wiki', (done) =>
      {
        const wikiTitle = 'Hockey Wiki';
        const wikiBody = 'Description for Hockey Wiki. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.';

        const options =
        {
          url: `${wikiBase}/create`,
          form:
          {
            title: wikiTitle,
            body: wikiBody
          },
          jar: this.jar
        };
        
        request.post(options, (err, res, body) =>
        {
          Wiki.findOne({
            where: {title: wikiTitle}
          })
          .then((wiki) =>
          {
            expect(wiki).not.toBeNull();
            expect(wiki.title).toBe(wikiTitle);
            expect(wiki.body).toBe(wikiBody);
            expect(wiki.slug).toBe('hockey_wiki');
            expect(wiki.private).toBe(false);

            done();
          })
          .catch((err) =>
          {
            expect(err).toBeNull();
            done();
          });
        });
      });

      it('should create a public wiki if user attempts to create a private wiki', (done) =>
      {
        const wikiTitle = 'Hockey Wiki';
        const wikiBody = 'Description for Hockey Wiki. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.';

        const options =
        {
          url: `${wikiBase}/create`,
          form:
          {
            title: wikiTitle,
            body: wikiBody,
            private: true
          },
          jar: this.jar
        };
        
        request.post(options, (err, res, body) =>
        {
          Wiki.findOne({
            where: {title: wikiTitle}
          })
          .then((wiki) =>
          {
            expect(wiki).not.toBeNull();
            expect(wiki.title).toBe(wikiTitle);
            expect(wiki.body).toBe(wikiBody);
            expect(wiki.slug).toBe('hockey_wiki');
            expect(wiki.private).toBe(false);

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

    describe('GET /wiki/new', () =>
    {
      it('should render a new wiki form without a private option', (done) =>
      {
        const options = 
        {
          url: `${wikiBase}/new`,
          jar: this.jar
        };
        
        request.get(options, (err, res, body) =>
        {
          expect(res.statusCode).toBe(200);
          expect(res.body).toContain('wiki/create');
          expect(res.body).toContain('New Wiki');
          expect(res.body).toContain('Title');
          expect(res.body).toContain('Body');
          expect(res.body).not.toContain('Private');
          done();
        });
      });

      it('should show a preview window', (done) =>
      {
        const options = 
        {
          url: `${wikiBase}/new`,
          jar: this.jar
        };
        
        request.get(options, (err, res, body) =>
        {
          expect(res.body).toContain('Preview');
          done();
        });
      });
    });

    describe('GET /wiki/:id', () =>
    {
      describe('(wiki creator)', () =>
      {
        it('should render a view with the selected wiki and allow edit/delete', (done) =>
        {
          const options = 
          {
            url: `${wikiBase}/${this.wiki1.slug}`,
            jar: this.jar
          };
  
          request.get(options, (err, res, body) =>
          {
            expect(res.statusCode).toBe(200);
            expect(body).toContain(this.wiki1.title);
            expect(body).toContain(this.wiki1.body);
            expect(body).not.toContain('Private');
            expect(body).toContain('Edit');
            expect(body).toContain(`/wiki/${this.wiki1.slug}/edit`);
            expect(body).toContain('Delete');
            expect(body).toContain(`/wiki/${this.wiki1.slug}/destroy`);
            done();
          });
        });

        it('should show the body contents as html', (done) =>
        {
          (async () =>
          {
            this.wiki1 = await this.wiki1.update(
              { body: '#Test Header\n' + this.wiki1.body },
              { fields: ['body'] }
            );

            const options = 
            {
              url: `${wikiBase}/${this.wiki1.slug}`,
              jar: this.jar
            };
            
            request.get(options, (err, res, body) =>
            {
              expect(res.body).not.toContain(this.wiki1.body);
              expect(res.body).toContain(markdown.toHTML(this.wiki1.body));
              done();
            });
          })();
        });
      });

      describe('(not wiki creator)', () => 
      {
        it('should render a view with the selected wiki and allow edit not delete', (done) =>
        {
          const options =
          {
            url: `${wikiBase}/${this.wiki2.slug}`,
            jar: this.jar
          };

          request.get(options, (err, res, body) =>
          {
            expect(res.statusCode).toBe(200);
            expect(body).toContain(this.wiki2.title);
            expect(body).toContain(this.wiki2.body);
            expect(body).toContain('Edit');
            expect(body).toContain(`/wiki/${this.wiki2.slug}/edit`);
            expect(body).not.toContain('Delete');
            expect(body).not.toContain(`/wiki/${this.wiki2.slug}/destroy`);
            done();
          });
        });

        it('should not show a private wiki and redirect to wikis', (done) =>
        {
          const options =
          {
            url: `${wikiBase}/${this.wikiPrivate2.slug}`,
            jar: this.jar
          };
          
          request.get(options, (err, res, body) =>
          {
            expect(res.request._redirect.redirects.length).toBe(1);
            expect(res.request._redirect.redirects[0].statusCode).toBe(302);
            expect(res.request._redirect.redirects[0].redirectUri).toBe(`${wikiBase}s`);
            expect(body).toContain(AUTHORIZATION_MESSAGE);
            done();
          });
        });
      });
    });

    describe('GET /wiki/:id/edit', () =>
    {
      describe('(wiki creator)', () =>
      {
        it('should render an edit view for the selected wiki with correct values set', (done) =>
        {
          const options = 
          {
            url: `${wikiBase}/${this.wiki1.slug}/edit`,
            jar: this.jar
          };
  
          request.get(options, (err, res, body) =>
          {
            expect(res.statusCode).toBe(200);
            expect(body).toContain('Edit Wiki');
            expect(body).toContain(`/wiki/${this.wiki1.slug}/update`);
            expect(body).toContain('Title');
            expect(body).toContain(this.wiki1.title);
            expect(body).toContain('Body');
            expect(body).toContain(this.wiki1.body);
            expect(body).not.toContain('Private');
            done();
          });
        });

        it('should show the body contents as markdown plain text and a preview as html', (done) =>
        {
          (async () =>
          {
            this.wiki1 = await this.wiki1.update(
              { body: '#Test Header\n' + this.wiki1.body },
              { fields: ['body'] }
            );

            const options = 
            {
              url: `${wikiBase}/${this.wiki1.slug}/edit`,
              jar: this.jar
            };
            
            request.get(options, (err, res, body) =>
            {
              expect(body).toContain(this.wiki1.body);
              expect(body).toContain('Preview');
              expect(body).toContain(markdown.toHTML(this.wiki1.body));
              done();
            });
          })();
        });
      });

      describe('(not wiki creator)', () =>
      {
        it('should render an edit view for the selected wiki', (done) =>
        {
          const options = 
          {
            url: `${wikiBase}/${this.wiki2.slug}/edit`,
            jar: this.jar
          };
  
          request.get(options, (err, res, body) =>
          {
            expect(res.statusCode).toBe(200);
            expect(body).toContain('Edit Wiki');
            expect(body).toContain(`/wiki/${this.wiki2.slug}/update`);
            expect(body).toContain('Title');
            expect(body).toContain(this.wiki2.title);
            expect(body).toContain('Body');
            expect(body).toContain(this.wiki2.body);
            expect(body).not.toContain('Private');
            done();
          });
        });
      });
    });

    describe('POST /wiki/:id/update', () =>
    {
      describe('(wiki creator)', () =>
      {
        it('should not update wiki with invalid values and not reset form fields', (done) =>
        {
          const newWikiTitle = 'Test Wiki Update';
          const newWikiBody = 'Too Short';

          const options =
          {
            url: `${wikiBase}/${this.wiki1.slug}/update`,
            form:
            {
              title: newWikiTitle,
              body: newWikiBody,
            },
            headers:
            {
              referer: `${wikiBase}/${this.wiki1.slug}/edit`
            },
            followAllRedirects: true,
            jar: this.jar
          };

          request.post(options, (err, res, body) =>
          {
            expect(res.request.uri.href).toBe(`${wikiBase}/${this.wiki1.slug}/edit`);
            expect(body).toContain(newWikiTitle);
            expect(body).toContain(newWikiBody);
            expect(body).toContain('Validation error')

            Wiki.findByPk(this.wiki1.id)
            .then((wiki) =>
            {
              expect(wiki.title).toBe(this.wiki1.title);
              expect(wiki.body).toBe(this.wiki1.body);
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

      describe('(not wiki creator)', () =>
      {
        it('should update wiki and redirect to the wiki page', (done) =>
        {
          const newWikiTitle = 'Test Wiki Updated';
          const newWikiBody = 'Test Long Test Wiki Body :) Test Long Test Wiki Body :) Test Long Test Wiki Body :) Test Long Test Wiki Body :) Test Long Test Wiki Body :) Test Long Test Wiki Body :)';

          const options =
          {
            url: `${wikiBase}/${this.wiki2.slug}/update`,
            form:
            {
              title: newWikiTitle,
              body: newWikiBody
            },
            followAllRedirects: true,
            jar: this.jar
          };

          request.post(options, (err, res, body) =>
          {
            expect(res.request.uri.href).toBe(`${wikiBase}/${this.wiki2.slug}`);
            expect(body).toContain(newWikiTitle);
            expect(body).toContain(newWikiBody);

            Wiki.findByPk(this.wiki2.id)
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

        it('should not update wiki private status and redirect to the wiki page', (done) =>
        {
          const newWikiTitle = 'Test Wiki Updated';
          const newWikiBody = 'Test Long Test Wiki Body :) Test Long Test Wiki Body :) Test Long Test Wiki Body :) Test Long Test Wiki Body :) Test Long Test Wiki Body :) Test Long Test Wiki Body :)';

          const options =
          {
            url: `${wikiBase}/${this.wiki2.slug}/update`,
            form:
            {
              title: newWikiTitle,
              body: newWikiBody,
              private: true
            },
            followAllRedirects: true,
            jar: this.jar
          };

          request.post(options, (err, res, body) =>
          {
            expect(res.request.uri.href).toBe(`${wikiBase}/${this.wiki2.slug}`);
            expect(body).toContain(newWikiTitle);
            expect(body).toContain(newWikiBody);
            expect(body).not.toContain('Private');

            Wiki.findByPk(this.wiki2.id)
            .then((wiki) =>
            {
              expect(wiki.title).toBe(newWikiTitle);
              expect(wiki.body).toBe(newWikiBody);
              expect(wiki.private).toBe(false);
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

    describe('POST /wiki/:id/destroy', () =>
    {
      describe('(wiki creator)', () =>
      {
        it('should delete wiki and redirect to the wikis page', (done) =>
        {
          const options =
          {
            url: `${wikiBase}/${this.wiki1.slug}/destroy`,
            followAllRedirects: true,
            jar: this.jar
          };

          request.post(options, (err, res, body) =>
          {
            expect(body).toContain('Wikis');
            expect(body).not.toContain(this.wiki1.title);

            Wiki.findByPk(this.wiki1.id)
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

      describe('(not wiki creator)', () =>
      {
        it('should not delete wiki and redirect to wiki page with auth error', (done) =>
        {
          const options =
          {
            url: `${wikiBase}/${this.wiki2.slug}/destroy`,
            followAllRedirects: true,
            jar: this.jar
          };

          request.post(options, (err, res, body) =>
          {
            expect(body).toContain(AUTHORIZATION_MESSAGE);
            expect(body).toContain(this.wiki2.title);
            expect(body).toContain(this.wiki2.body);

            Wiki.findByPk(this.wiki2.id)
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
  });

  describe('premium user', () =>
  {
    beforeEach((done) =>
    {
      const salt = bcrypt.genSaltSync();

      this.jar = request.jar();

      (async () =>
      {
        this.user1 = await this.user1.update(
          { role: User.ROLE_PREMIUM },
          { fields: ['role'] }
        );

        const options =
        {
          url: loginUrl,
          form:
          {
            username: this.user1.username,
            password: this.userPassword
          },
          jar: this.jar
        };
        
        request.post(options, (err, res, body) =>
        {
          done();
        });
      })();
    });

    describe('GET /wikis', () =>
    {
      it('should show new wiki button', (done) =>
      {
        const options = 
        {
          url: `${wikiBase}s`,
          jar: this.jar
        };
        
        request.get(options, (err, res, body) =>
        {
          expect(res.body).toContain('New Wiki');
          expect(res.body).toContain('/wiki/new');
          expect(res.body).toContain(this.wiki1.title);
          expect(res.body).toContain(this.wiki2.title);
          done();
        });
      });

      it('should show private wikis that the user created', (done) =>
      {
        const options = 
        {
          url: `${wikiBase}s`,
          jar: this.jar
        };
        
        request.get(options, (err, res, body) =>
        {
          expect(res.body).toContain('Your Wikis');
          expect(res.body).toContain(this.wikiPrivate1.title);
          expect(res.body).toContain('Private');
          expect(res.body).not.toContain(this.wikiPrivate2.title);
          done();
        });
      });
    });

    describe('POST /wiki/create', () =>
    {
      it('should create a new wiki', (done) =>
      {
        const wikiTitle = 'Hockey Wiki';
        const wikiBody = 'Description for Hockey Wiki. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.';

        const options =
        {
          url: `${wikiBase}/create`,
          form:
          {
            title: wikiTitle,
            body: wikiBody
          },
          jar: this.jar
        };
        
        request.post(options, (err, res, body) =>
        {
          Wiki.findOne({
            where: {title: wikiTitle}
          })
          .then((wiki) =>
          {
            expect(wiki).not.toBeNull();
            expect(wiki.title).toBe(wikiTitle);
            expect(wiki.body).toBe(wikiBody);
            expect(wiki.slug).toBe('hockey_wiki');
            expect(wiki.private).toBe(false);

            done();
          })
          .catch((err) =>
          {
            expect(err).toBeNull();
            done();
          });
        });
      });

      it('should create a private wiki', (done) =>
      {
        const wikiTitle = 'Hockey Wiki';
        const wikiBody = 'Description for Hockey Wiki. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.';

        const options =
        {
          url: `${wikiBase}/create`,
          form:
          {
            title: wikiTitle,
            body: wikiBody,
            private: true
          },
          jar: this.jar
        };
        
        request.post(options, (err, res, body) =>
        {
          Wiki.findOne({
            where: {title: wikiTitle}
          })
          .then((wiki) =>
          {
            expect(wiki).not.toBeNull();
            expect(wiki.title).toBe(wikiTitle);
            expect(wiki.body).toBe(wikiBody);
            expect(wiki.slug).toBe('hockey_wiki');
            expect(wiki.private).toBe(true);

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

    describe('GET /wiki/new', () =>
    {
      it('should render a new wiki form with a private option', (done) =>
      {
        const options = 
        {
          url: `${wikiBase}/new`,
          jar: this.jar
        };
        
        request.get(options, (err, res, body) =>
        {
          expect(res.statusCode).toBe(200);
          expect(res.body).toContain('wiki/create');
          expect(res.body).toContain('New Wiki');
          expect(res.body).toContain('Title');
          expect(res.body).toContain('Body');
          expect(res.body).toContain('Private');
          done();
        });
      });
    });

    describe('GET /wiki/:id', () =>
    {
      describe('(wiki creator)', () =>
      {
        it('should render a view with the selected wiki and allow edit/delete', (done) =>
        {
          const options = 
          {
            url: `${wikiBase}/${this.wiki1.slug}`,
            jar: this.jar
          };
  
          request.get(options, (err, res, body) =>
          {
            expect(res.statusCode).toBe(200);
            expect(body).toContain(this.wiki1.title);
            expect(body).toContain(this.wiki1.body);
            expect(body).not.toContain('Private');
            expect(body).toContain('Edit');
            expect(body).toContain(`/wiki/${this.wiki1.slug}/edit`);
            expect(body).toContain('Delete');
            expect(body).toContain(`/wiki/${this.wiki1.slug}/destroy`);
            done();
          });
        });

        it('should render a view with the selected private wiki and allow edit/delete', (done) =>
        {
          const options = 
          {
            url: `${wikiBase}/${this.wikiPrivate1.slug}`,
            jar: this.jar
          };
  
          request.get(options, (err, res, body) =>
          {
            expect(res.statusCode).toBe(200);
            expect(body).toContain(this.wikiPrivate1.title);
            expect(body).toContain(this.wikiPrivate1.body);
            expect(body).toContain('Private');
            expect(body).toContain('Edit');
            expect(body).toContain(`/wiki/${this.wikiPrivate1.slug}/edit`);
            expect(body).toContain('Delete');
            expect(body).toContain(`/wiki/${this.wikiPrivate1.slug}/destroy`);
            done();
          });
        });
      });

      describe('(not wiki creator)', () => 
      {
        it('should render a view with the selected wiki and allow edit not delete', (done) =>
        {
          const options =
          {
            url: `${wikiBase}/${this.wiki2.slug}`,
            jar: this.jar
          };

          request.get(options, (err, res, body) =>
          {
            expect(res.statusCode).toBe(200);
            expect(body).toContain(this.wiki2.title);
            expect(body).toContain(this.wiki2.body);
            expect(body).toContain('Edit');
            expect(body).toContain(`/wiki/${this.wiki2.slug}/edit`);
            expect(body).not.toContain('Delete');
            expect(body).not.toContain(`/wiki/${this.wiki2.slug}/destroy`);
            done();
          });
        });

        it("should not show another user's private wiki and redirect to wikis", (done) =>
        {
          const options =
          {
            url: `${wikiBase}/${this.wikiPrivate2.slug}`,
            jar: this.jar
          };
          
          request.get(options, (err, res, body) =>
          {
            expect(res.statusCode).toBe(200);
            expect(res.request.uri.href).toBe(`${wikiBase}s`);
            expect(body).toContain(AUTHORIZATION_MESSAGE);
            done();
          });
        });
      });
    });

    describe('GET /wiki/:id/edit', () =>
    {
      describe('(wiki creator)', () =>
      {
        it('should render an edit view for the selected wiki', (done) =>
        {
          const options = 
          {
            url: `${wikiBase}/${this.wiki1.slug}/edit`,
            jar: this.jar
          };
  
          request.get(options, (err, res, body) =>
          {
            expect(res.statusCode).toBe(200);
            expect(body).toContain('Edit Wiki');
            expect(body).toContain(`/wiki/${this.wiki1.slug}/update`);
            expect(body).toContain('Title');
            expect(body).toContain(this.wiki1.title);
            expect(body).toContain('Body');
            expect(body).toContain(this.wiki1.body);
            expect(body).toContain('Private');
            expect(body).not.toContain('checked');
            done();
          });
        });

        it('should render an edit view for the selected private wiki with correct values set', (done) =>
        {
          const options = 
          {
            url: `${wikiBase}/${this.wikiPrivate1.slug}/edit`,
            jar: this.jar
          };
  
          request.get(options, (err, res, body) =>
          {
            expect(res.statusCode).toBe(200);
            expect(body).toContain('Edit Wiki');
            expect(body).toContain(`/wiki/${this.wikiPrivate1.slug}/update`);
            expect(body).toContain('Title');
            expect(body).toContain(this.wikiPrivate1.title);
            expect(body).toContain('Body');
            expect(body).toContain(this.wikiPrivate1.body);
            expect(body).toContain('Private');
            expect(body).toContain('checked');
            done();
          });
        });
      });

      describe('(not wiki creator)', () =>
      {
        it('should render an edit view for the selected wiki', (done) =>
        {
          const options = 
          {
            url: `${wikiBase}/${this.wiki2.slug}/edit`,
            jar: this.jar
          };
  
          request.get(options, (err, res, body) =>
          {
            expect(res.statusCode).toBe(200);
            expect(body).toContain('Edit Wiki');
            expect(body).toContain(`/wiki/${this.wiki2.slug}/update`);
            expect(body).toContain('Title');
            expect(body).toContain(this.wiki2.title);
            expect(body).toContain('Body');
            expect(body).toContain(this.wiki2.body);
            expect(body).not.toContain('Private');
            done();
          });
        });

        it("should not render another user's private wiki and redirect to wikis page with auth error", (done) =>
        {
          const options = 
          {
            url: `${wikiBase}/${this.wikiPrivate2.slug}/edit`,
            jar: this.jar
          };
  
          request.get(options, (err, res, body) =>
          {
            expect(res.statusCode).toBe(200);
            expect(res.request.uri.href).toBe(`${wikiBase}s`);
            expect(body).toContain(AUTHORIZATION_MESSAGE);
            expect(body).not.toContain(this.wikiPrivate2.title);

            expect(body).toContain('Wikis');
            done();
          });
        });
      });
    });

    describe('POST /wiki/:id/update', () =>
    {
      describe('(wiki creator)', () =>
      {
        it('should not update wiki with invalid values', (done) =>
        {
          const options =
          {
            url: `${wikiBase}/${this.wiki1.slug}/update`,
            form:
            {
              title: 'Test Wiki Update',
              body: 'Long Test Wiki Updated Body :)',
            },
            headers:
            {
              referer: `${wikiBase}/${this.wiki1.slug}/edit`
            },
            followAllRedirects: true,
            jar: this.jar
          };

          request.post(options, (err, res, body) =>
          {
            expect(res.request.uri.href).toBe(`${wikiBase}/${this.wiki1.slug}/edit`);
            expect(body).toContain('Test Wiki Update');
            expect(body).toContain('Long Test Wiki Updated Body :)');
            expect(body).toContain('Validation error');

            Wiki.findByPk(this.wiki1.id)
            .then((wiki) =>
            {
              expect(wiki.title).toBe(this.wiki1.title);
              expect(wiki.body).toBe(this.wiki1.body);
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
            url: `${wikiBase}/${this.wiki1.slug}/update`,
            form:
            {
              title: newWikiTitle,
              body: newWikiBody
            },
            followAllRedirects: true,
            jar: this.jar
          };

          request.post(options, (err, res, body) =>
          {
            expect(res.request.uri.href).toBe(`${wikiBase}/${this.wiki1.slug}`);
            expect(body).toContain(newWikiTitle);
            expect(body).toContain(newWikiBody);

            Wiki.findByPk(this.wiki1.id)
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

        it('should update wiki along with private status and redirect to the wiki page', (done) =>
        {
          const newWikiTitle = 'Test Wiki Updated';
          const newWikiBody = 'Test Long Test Wiki Body :) Test Long Test Wiki Body :) Test Long Test Wiki Body :) Test Long Test Wiki Body :) Test Long Test Wiki Body :) Test Long Test Wiki Body :)';

          const options =
          {
            url: `${wikiBase}/${this.wiki1.slug}/update`,
            form:
            {
              title: newWikiTitle,
              body: newWikiBody,
              private: true
            },
            followAllRedirects: true,
            jar: this.jar
          };

          request.post(options, (err, res, body) =>
          {
            expect(res.request.uri.href).toBe(`${wikiBase}/${this.wiki1.slug}`);
            expect(body).toContain(newWikiTitle);
            expect(body).toContain(newWikiBody);
            expect(body).toContain('Private');

            Wiki.findByPk(this.wiki1.id)
            .then((wiki) =>
            {
              expect(wiki.title).toBe(newWikiTitle);
              expect(wiki.body).toBe(newWikiBody);
              expect(wiki.private).toBe(true);
              done();
            })
            .catch((err) =>
            {
              expect(err).toBeNull();
              done();
            });
          });
        });

        it('should update wiki along with private status and redirect to the wiki page', (done) =>
        {
          const newWikiTitle = 'Test Wiki Updated';
          const newWikiBody = 'Test Long Test Wiki Body :) Test Long Test Wiki Body :) Test Long Test Wiki Body :) Test Long Test Wiki Body :) Test Long Test Wiki Body :) Test Long Test Wiki Body :)';

          const options =
          {
            url: `${wikiBase}/${this.wikiPrivate1.slug}/update`,
            form:
            {
              title: newWikiTitle,
              body: newWikiBody
            },
            followAllRedirects: true,
            jar: this.jar
          };

          request.post(options, (err, res, body) =>
          {
            expect(res.request.uri.href).toBe(`${wikiBase}/${this.wikiPrivate1.slug}`);
            expect(body).toContain(newWikiTitle);
            expect(body).toContain(newWikiBody);
            expect(body).not.toContain('Private');

            Wiki.findByPk(this.wikiPrivate1.id)
            .then((wiki) =>
            {
              expect(wiki.title).toBe(newWikiTitle);
              expect(wiki.body).toBe(newWikiBody);
              expect(wiki.private).toBe(false);
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

      describe('(not wiki creator)', () =>
      {
        it('should update wiki and redirect to the wiki page', (done) =>
        {
          const newWikiTitle = 'Test Wiki Updated';
          const newWikiBody = 'Test Long Test Wiki Body :) Test Long Test Wiki Body :) Test Long Test Wiki Body :) Test Long Test Wiki Body :) Test Long Test Wiki Body :) Test Long Test Wiki Body :)';

          const options =
          {
            url: `${wikiBase}/${this.wiki2.slug}/update`,
            form:
            {
              title: newWikiTitle,
              body: newWikiBody
            },
            followAllRedirects: true,
            jar: this.jar
          };

          request.post(options, (err, res, body) =>
          {
            expect(res.request.uri.href).toBe(`${wikiBase}/${this.wiki2.slug}`);
            expect(body).toContain(newWikiTitle);
            expect(body).toContain(newWikiBody);

            Wiki.findByPk(this.wiki2.id)
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

        it('should not update wiki private status and redirect to the wiki page', (done) =>
        {
          const newWikiTitle = 'Test Wiki Updated';
          const newWikiBody = 'Test Long Test Wiki Body :) Test Long Test Wiki Body :) Test Long Test Wiki Body :) Test Long Test Wiki Body :) Test Long Test Wiki Body :) Test Long Test Wiki Body :)';

          const options =
          {
            url: `${wikiBase}/${this.wiki2.slug}/update`,
            form:
            {
              title: newWikiTitle,
              body: newWikiBody,
              private: true
            },
            followAllRedirects: true,
            jar: this.jar
          };

          request.post(options, (err, res, body) =>
          {
            expect(res.request.uri.href).toBe(`${wikiBase}/${this.wiki2.slug}`);
            expect(body).toContain(newWikiTitle);
            expect(body).toContain(newWikiBody);
            expect(body).not.toContain('Private');

            Wiki.findByPk(this.wiki2.id)
            .then((wiki) =>
            {
              expect(wiki.title).toBe(newWikiTitle);
              expect(wiki.body).toBe(newWikiBody);
              expect(wiki.private).toBe(false);
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

    describe('POST /wiki/:id/destroy', () =>
    {
      describe('(wiki creator)', () =>
      {
        it('should delete wiki and redirect to the wikis page', (done) =>
        {
          const options =
          {
            url: `${wikiBase}/${this.wiki1.slug}/destroy`,
            followAllRedirects: true,
            jar: this.jar
          };

          request.post(options, (err, res, body) =>
          {
            expect(body).toContain('Wikis');
            expect(body).not.toContain(this.wiki1.title);

            Wiki.findByPk(this.wiki1.id)
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

      describe('(not wiki creator)', () =>
      {
        it('should not delete wiki and redirect to wiki page with auth error', (done) =>
        {
          const options =
          {
            url: `${wikiBase}/${this.wiki2.slug}/destroy`,
            followAllRedirects: true,
            jar: this.jar
          };

          request.post(options, (err, res, body) =>
          {
            expect(body).toContain(AUTHORIZATION_MESSAGE);
            expect(body).toContain(this.wiki2.title);
            expect(body).toContain(this.wiki2.body);

            Wiki.findByPk(this.wiki2.id)
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
  });

  describe('admin user', () =>
  {
    beforeEach((done) =>
    {
      const salt = bcrypt.genSaltSync();

      this.jar = request.jar();

      (async () =>
      {
        this.user1 = await this.user1.update(
          { role: User.ROLE_ADMIN },
          { fields: ['role'] }
        );

        const options =
        {
          url: loginUrl,
          form:
          {
            username: this.user1.username,
            password: this.userPassword
          },
          jar: this.jar
        };
        
        request.post(options, (err, res, body) =>
        {
          done();
        });
      })();
    });

    describe('GET /wikis', () =>
    {
      it('should show new wiki button', (done) =>
      {
        const options = 
        {
          url: `${wikiBase}s`,
          jar: this.jar
        };
        
        request.get(options, (err, res, body) =>
        {
          expect(res.body).toContain('New Wiki');
          expect(res.body).toContain('/wiki/new');
          expect(res.body).toContain(this.wiki1.title);
          expect(res.body).toContain(this.wiki2.title);
          done();
        });
      });

      it('should show private wikis that the user created', (done) =>
      {
        const options = 
        {
          url: `${wikiBase}s`,
          jar: this.jar
        };
        
        request.get(options, (err, res, body) =>
        {
          expect(res.body).toContain('Your Wikis');
          expect(res.body).toContain(this.wikiPrivate1.title);
          expect(res.body).toContain('Private');
          expect(res.body).not.toContain(this.wikiPrivate2.title);
          done();
        });
      });
    });

    describe('POST /wiki/create', () =>
    {
      it('should create a new wiki', (done) =>
      {
        const wikiTitle = 'Hockey Wiki';
        const wikiBody = 'Description for Hockey Wiki. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.';

        const options =
        {
          url: `${wikiBase}/create`,
          form:
          {
            title: wikiTitle,
            body: wikiBody
          },
          jar: this.jar
        };
        
        request.post(options, (err, res, body) =>
        {
          Wiki.findOne({
            where: {title: wikiTitle}
          })
          .then((wiki) =>
          {
            expect(wiki).not.toBeNull();
            expect(wiki.title).toBe(wikiTitle);
            expect(wiki.body).toBe(wikiBody);
            expect(wiki.slug).toBe('hockey_wiki');
            expect(wiki.private).toBe(false);

            done();
          })
          .catch((err) =>
          {
            expect(err).toBeNull();
            done();
          });
        });
      });

      it('should create a private wiki', (done) =>
      {
        const wikiTitle = 'Hockey Wiki';
        const wikiBody = 'Description for Hockey Wiki. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.';

        const options =
        {
          url: `${wikiBase}/create`,
          form:
          {
            title: wikiTitle,
            body: wikiBody,
            private: true
          },
          jar: this.jar
        };
        
        request.post(options, (err, res, body) =>
        {
          Wiki.findOne({
            where: {title: wikiTitle}
          })
          .then((wiki) =>
          {
            expect(wiki).not.toBeNull();
            expect(wiki.title).toBe(wikiTitle);
            expect(wiki.body).toBe(wikiBody);
            expect(wiki.slug).toBe('hockey_wiki');
            expect(wiki.private).toBe(true);

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

    describe('GET /wiki/new', () =>
    {
      it('should render a new wiki form with a private option', (done) =>
      {
        const options = 
        {
          url: `${wikiBase}/new`,
          jar: this.jar
        };
        
        request.get(options, (err, res, body) =>
        {
          expect(res.statusCode).toBe(200);
          expect(res.body).toContain('wiki/create');
          expect(res.body).toContain('New Wiki');
          expect(res.body).toContain('Title');
          expect(res.body).toContain('Body');
          expect(res.body).toContain('Private');
          done();
        });
      });
    });

    describe('GET /wiki/:id', () =>
    {
      describe('(wiki creator)', () =>
      {
        it('should render a view with the selected wiki and allow edit/delete', (done) =>
        {
          const options = 
          {
            url: `${wikiBase}/${this.wiki1.slug}`,
            jar: this.jar
          };
  
          request.get(options, (err, res, body) =>
          {
            expect(res.statusCode).toBe(200);
            expect(body).toContain(this.wiki1.title);
            expect(body).toContain(this.wiki1.body);
            expect(body).not.toContain('Private');
            expect(body).toContain('Edit');
            expect(body).toContain(`/wiki/${this.wiki1.slug}/edit`);
            expect(body).toContain('Delete');
            expect(body).toContain(`/wiki/${this.wiki1.slug}/destroy`);
            done();
          });
        });

        it('should render a view with the selected private wiki and allow edit/delete', (done) =>
        {
          const options = 
          {
            url: `${wikiBase}/${this.wikiPrivate1.slug}`,
            jar: this.jar
          };
  
          request.get(options, (err, res, body) =>
          {
            expect(res.statusCode).toBe(200);
            expect(body).toContain(this.wikiPrivate1.title);
            expect(body).toContain(this.wikiPrivate1.body);
            expect(body).toContain('Private');
            expect(body).toContain('Edit');
            expect(body).toContain(`/wiki/${this.wikiPrivate1.slug}/edit`);
            expect(body).toContain('Delete');
            expect(body).toContain(`/wiki/${this.wikiPrivate1.slug}/destroy`);
            done();
          });
        });
      });

      describe('(not wiki creator)', () => 
      {
        it('should render a view with the selected wiki and show edit and delete', (done) =>
        {
          const options =
          {
            url: `${wikiBase}/${this.wiki2.slug}`,
            jar: this.jar
          };

          request.get(options, (err, res, body) =>
          {
            expect(res.statusCode).toBe(200);
            expect(body).toContain(this.wiki2.title);
            expect(body).toContain(this.wiki2.body);
            expect(body).toContain('Edit');
            expect(body).toContain(`/wiki/${this.wiki2.slug}/edit`);
            expect(body).toContain('Delete');
            expect(body).toContain(`/wiki/${this.wiki2.slug}/destroy`);
            done();
          });
        });

        it("should show another user's private wiki", (done) =>
        {
          const options =
          {
            url: `${wikiBase}/${this.wikiPrivate2.slug}`,
            jar: this.jar
          };
          
          request.get(options, (err, res, body) =>
          {
            expect(res.statusCode).toBe(200);
            expect(body).toContain(this.wikiPrivate2.title);
            expect(body).toContain(this.wikiPrivate2.body);
            expect(body).toContain('Edit');
            expect(body).toContain(`/wiki/${this.wikiPrivate2.slug}/edit`);
            expect(body).toContain('Delete');
            expect(body).toContain(`/wiki/${this.wikiPrivate2.slug}/destroy`);
            done();
          });
        });
      });
    });

    describe('GET /wiki/:id/edit', () =>
    {
      describe('(wiki creator)', () =>
      {
        it('should render an edit view for the selected wiki', (done) =>
        {
          const options = 
          {
            url: `${wikiBase}/${this.wiki1.slug}/edit`,
            jar: this.jar
          };
  
          request.get(options, (err, res, body) =>
          {
            expect(res.statusCode).toBe(200);
            expect(body).toContain('Edit Wiki');
            expect(body).toContain(`/wiki/${this.wiki1.slug}/update`);
            expect(body).toContain('Title');
            expect(body).toContain(this.wiki1.title);
            expect(body).toContain('Body');
            expect(body).toContain(this.wiki1.body);
            expect(body).toContain('Private');
            expect(body).not.toContain('checked');
            done();
          });
        });

        it('should render an edit view for the selected private wiki with correct values set', (done) =>
        {
          const options = 
          {
            url: `${wikiBase}/${this.wikiPrivate1.slug}/edit`,
            jar: this.jar
          };
  
          request.get(options, (err, res, body) =>
          {
            expect(res.statusCode).toBe(200);
            expect(body).toContain('Edit Wiki');
            expect(body).toContain(`/wiki/${this.wikiPrivate1.slug}/update`);
            expect(body).toContain('Title');
            expect(body).toContain(this.wikiPrivate1.title);
            expect(body).toContain('Body');
            expect(body).toContain(this.wikiPrivate1.body);
            expect(body).toContain('Private');
            expect(body).toContain('checked');
            done();
          });
        });
      });

      describe('(not wiki creator)', () =>
      {
        it('should render an edit view for the selected wiki', (done) =>
        {
          const options = 
          {
            url: `${wikiBase}/${this.wiki2.slug}/edit`,
            jar: this.jar
          };
  
          request.get(options, (err, res, body) =>
          {
            expect(res.statusCode).toBe(200);
            expect(body).toContain('Edit Wiki');
            expect(body).toContain(`/wiki/${this.wiki2.slug}/update`);
            expect(body).toContain('Title');
            expect(body).toContain(this.wiki2.title);
            expect(body).toContain('Body');
            expect(body).toContain(this.wiki2.body);
            expect(body).not.toContain('Private');
            done();
          });
        });

        it("should render an edit view for another user's private wiki", (done) =>
        {
          const options = 
          {
            url: `${wikiBase}/${this.wikiPrivate2.slug}/edit`,
            jar: this.jar
          };
  
          request.get(options, (err, res, body) =>
          {
            expect(res.statusCode).toBe(200);
            expect(body).toContain('Edit Wiki');
            expect(body).toContain(`/wiki/${this.wikiPrivate2.slug}/update`);
            expect(body).toContain('Title');
            expect(body).toContain(this.wikiPrivate2.title);
            expect(body).toContain('Body');
            expect(body).toContain(this.wikiPrivate2.body);
            expect(body).not.toContain('Private');
            done();
          });
        });
      });
    });

    describe('POST /wiki/:id/update', () =>
    {
      describe('(wiki creator)', () =>
      {
        it('should not update wiki with invalid values', (done) =>
        {
          const options =
          {
            url: `${wikiBase}/${this.wiki1.slug}/update`,
            form:
            {
              title: 'Test Wiki Update',
              body: 'Long Test Wiki Updated Body :)',
            },
            headers:
            {
              referer: `${wikiBase}/${this.wiki1.slug}/edit`
            },
            followAllRedirects: true,
            jar: this.jar
          };

          request.post(options, (err, res, body) =>
          {
            expect(res.request.uri.href).toBe(`${wikiBase}/${this.wiki1.slug}/edit`);
            expect(body).toContain('Test Wiki Update');
            expect(body).toContain('Long Test Wiki Updated Body :)');
            expect(body).toContain('Validation error');

            Wiki.findByPk(this.wiki1.id)
            .then((wiki) =>
            {
              expect(wiki.title).toBe(this.wiki1.title);
              expect(wiki.body).toBe(this.wiki1.body);
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
            url: `${wikiBase}/${this.wiki1.slug}/update`,
            form:
            {
              title: newWikiTitle,
              body: newWikiBody
            },
            followAllRedirects: true,
            jar: this.jar
          };

          request.post(options, (err, res, body) =>
          {
            expect(res.request.uri.href).toBe(`${wikiBase}/${this.wiki1.slug}`);
            expect(body).toContain(newWikiTitle);
            expect(body).toContain(newWikiBody);

            Wiki.findByPk(this.wiki1.id)
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

        it('should update wiki along with private status and redirect to the wiki page', (done) =>
        {
          const newWikiTitle = 'Test Wiki Updated';
          const newWikiBody = 'Test Long Test Wiki Body :) Test Long Test Wiki Body :) Test Long Test Wiki Body :) Test Long Test Wiki Body :) Test Long Test Wiki Body :) Test Long Test Wiki Body :)';

          const options =
          {
            url: `${wikiBase}/${this.wiki1.slug}/update`,
            form:
            {
              title: newWikiTitle,
              body: newWikiBody,
              private: true
            },
            followAllRedirects: true,
            jar: this.jar
          };

          request.post(options, (err, res, body) =>
          {
            expect(res.request.uri.href).toBe(`${wikiBase}/${this.wiki1.slug}`);
            expect(body).toContain(newWikiTitle);
            expect(body).toContain(newWikiBody);
            expect(body).toContain('Private');

            Wiki.findByPk(this.wiki1.id)
            .then((wiki) =>
            {
              expect(wiki.title).toBe(newWikiTitle);
              expect(wiki.body).toBe(newWikiBody);
              expect(wiki.private).toBe(true);
              done();
            })
            .catch((err) =>
            {
              expect(err).toBeNull();
              done();
            });
          });
        });

        it('should update wiki along with private status and redirect to the wiki page', (done) =>
        {
          const newWikiTitle = 'Test Wiki Updated';
          const newWikiBody = 'Test Long Test Wiki Body :) Test Long Test Wiki Body :) Test Long Test Wiki Body :) Test Long Test Wiki Body :) Test Long Test Wiki Body :) Test Long Test Wiki Body :)';

          const options =
          {
            url: `${wikiBase}/${this.wikiPrivate1.slug}/update`,
            form:
            {
              title: newWikiTitle,
              body: newWikiBody
            },
            followAllRedirects: true,
            jar: this.jar
          };

          request.post(options, (err, res, body) =>
          {
            expect(res.request.uri.href).toBe(`${wikiBase}/${this.wikiPrivate1.slug}`);
            expect(body).toContain(newWikiTitle);
            expect(body).toContain(newWikiBody);
            expect(body).not.toContain('Private');

            Wiki.findByPk(this.wikiPrivate1.id)
            .then((wiki) =>
            {
              expect(wiki.title).toBe(newWikiTitle);
              expect(wiki.body).toBe(newWikiBody);
              expect(wiki.private).toBe(false);
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

      describe('(not wiki creator)', () =>
      {
        it('should update wiki and redirect to the wiki page', (done) =>
        {
          const newWikiTitle = 'Test Wiki Updated';
          const newWikiBody = 'Test Long Test Wiki Body :) Test Long Test Wiki Body :) Test Long Test Wiki Body :) Test Long Test Wiki Body :) Test Long Test Wiki Body :) Test Long Test Wiki Body :)';

          const options =
          {
            url: `${wikiBase}/${this.wiki2.slug}/update`,
            form:
            {
              title: newWikiTitle,
              body: newWikiBody
            },
            followAllRedirects: true,
            jar: this.jar
          };

          request.post(options, (err, res, body) =>
          {
            expect(res.request.uri.href).toBe(`${wikiBase}/${this.wiki2.slug}`);
            expect(body).toContain(newWikiTitle);
            expect(body).toContain(newWikiBody);

            Wiki.findByPk(this.wiki2.id)
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

        it('should not update wiki private status and redirect to the wiki page', (done) =>
        {
          const newWikiTitle = 'Test Wiki Updated';
          const newWikiBody = 'Test Long Test Wiki Body :) Test Long Test Wiki Body :) Test Long Test Wiki Body :) Test Long Test Wiki Body :) Test Long Test Wiki Body :) Test Long Test Wiki Body :)';

          const options =
          {
            url: `${wikiBase}/${this.wiki2.slug}/update`,
            form:
            {
              title: newWikiTitle,
              body: newWikiBody,
              private: true
            },
            followAllRedirects: true,
            jar: this.jar
          };

          request.post(options, (err, res, body) =>
          {
            expect(res.request.uri.href).toBe(`${wikiBase}/${this.wiki2.slug}`);
            expect(body).toContain(newWikiTitle);
            expect(body).toContain(newWikiBody);
            expect(body).not.toContain('Private');

            Wiki.findByPk(this.wiki2.id)
            .then((wiki) =>
            {
              expect(wiki.title).toBe(newWikiTitle);
              expect(wiki.body).toBe(newWikiBody);
              expect(wiki.private).toBe(false);
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

    describe('POST /wiki/:id/destroy', () =>
    {
      describe('(wiki creator)', () =>
      {
        it('should delete wiki and redirect to the wikis page', (done) =>
        {
          const options =
          {
            url: `${wikiBase}/${this.wiki1.slug}/destroy`,
            followAllRedirects: true,
            jar: this.jar
          };

          request.post(options, (err, res, body) =>
          {
            expect(body).toContain('Wikis');
            expect(body).not.toContain(this.wiki1.title);

            Wiki.findByPk(this.wiki1.id)
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

      describe('(not wiki creator)', () =>
      {
        it("should delete another user's wiki and redirect to the wikis page", (done) =>
        {
          const options =
          {
            url: `${wikiBase}/${this.wiki2.slug}/destroy`,
            followAllRedirects: true,
            jar: this.jar
          };

          request.post(options, (err, res, body) =>
          {
            expect(body).toContain('Wikis');
            expect(body).not.toContain(this.wiki2.title);

            Wiki.findByPk(this.wiki2.id)
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

        it("should delete another user's private wiki and redirect to the wikis page", (done) =>
        {
          const options =
          {
            url: `${wikiBase}/${this.wikiPrivate2.slug}/destroy`,
            followAllRedirects: true,
            jar: this.jar
          };

          request.post(options, (err, res, body) =>
          {
            expect(body).toContain('Wikis');
            expect(body).not.toContain(this.wikiPrivate2.title);

            Wiki.findByPk(this.wikiPrivate2.id)
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
});