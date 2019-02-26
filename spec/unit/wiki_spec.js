const sequelize = require('../../src/db/models/index').sequelize;

const Wiki = require('../../src/db/models').Wiki;
const User = require('../../src/db/models').User;

describe('Wiki', () =>
{
  beforeEach((done) =>
  {
    sequelize.sync({force: true})
    .then(() =>
    {
      User.create({
        username: 'testuser1',
        email: 'testuser1@example.com',
        password: '1234567890'
      })
      .then((user) =>
      {
        this.user = user;

        Wiki.create({
          title: 'Test Wiki',
          body: 'Test Wiki Body',
          userId: user.id
        })
        .then((wiki) =>
        {
          this.wiki = wiki;
          done();
        });
      });
    })
    .catch((err) =>
    {
      console.log(err);
      done();
    });
  });

  describe('#create()', () =>
  {
    it('should create a Wiki object with valid title and body attributes', (done) =>
    {
      Wiki.create({
        title: 'Example Wiki',
        body: 'This is a test wiki body',
        userId: this.user.id
      })
      .then((wiki) =>
      {
        expect(wiki.title).toBe('Example Wiki');
        expect(wiki.body).toBe('This is a test wiki body');
        done();
      })
      .catch((err) =>
      {
        console.log(err);
        expect(err).toBeNull();
        done();
      });
    });

    it('should create a Wiki object with valid title, body, and private attributes', (done) =>
    {
      Wiki.create({
        title: 'Example Wiki',
        body: 'This is a test wiki body',
        private: true,
        userId: this.user.id
      })
      .then((wiki) =>
      {
        expect(wiki.title).toBe('Example Wiki');
        expect(wiki.body).toBe('This is a test wiki body');
        expect(wiki.private).toBeTruthy();
        done();
      })
      .catch((err) =>
      {
        console.log(err);
        expect(err).toBeNull();
        done();
      });
    });

    it('should default the private attribute to false if it is not provided', (done) =>
    {
      Wiki.create({
        title: 'Example Wiki',
        body: 'This is a test wiki body',
        userId: this.user.id
      })
      .then((wiki) =>
      {
        expect(wiki.private).toBeFalsy();
        done();
      })
      .catch((err) =>
      {
        console.log(err);
        expect(err).toBeNull();
        done();
      });
    });

    it('should not create a wiki with a title that already exists', (done) =>
    {
      Wiki.create({
        title: 'Example Wiki',
        body: 'This is a test wiki body',
        userId: this.user.id
      })
      .then((wiki) =>
      {
        Wiki.create({
          title: 'Example Wiki',
          body: 'This is another test wiki body',
          userId: this.user.id
        })
        .then((wiki) =>
        {
          expect(wiki).toBeNull();
          done();
        })
        .catch((err) =>
        {
          expect(err.message).toContain('Validation error');
          done();
        });
      })
      .catch((err) =>
      {
        console.log(err);
        expect(err).toBeNull();
        done();
      });
    });
  });

  describe('#update()', () =>
  {
    it('should update the wiki with new values', (done) =>
    {
      let updatedWiki = 
      {
        title: 'Test Wiki New',
        body: 'Test Wiki New Body'
      };

      this.wiki.update(
        updatedWiki,
        {fields: Object.keys(updatedWiki)}
      )
      .then((wiki) =>
      {
        expect(wiki.title).toBe('Test Wiki New');
        expect(wiki.body).toBe('Test Wiki New Body');
        done();
      })
      .catch((err) =>
      {
        expect(err).toBeNull();
        done();
      });
    });
  });

  describe('#destroy()', () =>
  {
    it('should destroy the wiki', (done) =>
    {
      Wiki.findAll()
      .then((wikis) =>
      {
        expect(wikis.length).toBe(1);

        this.wiki.destroy()
        .then(() =>
        {
          Wiki.findAll()
          .then((wikis) =>
          {
            expect(wikis.length).toBe(0);
            done();
          });
        })
        .catch((err) =>
        {
          expect(err).toBeNull();
          done();
        });
      });
    });

    it('should not destroy the collaborators', (done) =>
    {
      (async () =>
      {
        try 
        {
          let wiki = await Wiki.create({
            title: 'Example Wiki',
            body: 'This is a test wiki body',
            userId: this.user.id
          });

          let user2 = await User.create({
            username: 'testuser2',
            email: 'testuser2@example.com',
            password: '1234567890'
          });

          let user3 = await User.create({
            username: 'testuser3',
            email: 'testuser3@example.com',
            password: '1234567890'
          });

          await wiki.addCollaborator(user2);
          await wiki.addCollaborator(user3);

          let collaborators = await wiki.getCollaborators();

          expect(collaborators.length).toBe(2); 

          let users = await User.findAll();

          expect(users.length).toBe(3);

          await wiki.destroy();

          users = await User.findAll();
          expect(users.length).toBe(3);
          
          done();
        }
        catch(err)
        {
          expect(err).toBeNull();
          done();
        }
      })();
    });
  });

  describe('#getUser()', () =>
  {
    it('should get the user that owns a wiki', (done) =>
    {
      Wiki.create({
        title: 'Test Wiki 2',
        body: 'Test Wiki 2 Body',
        userId: -1,
        user: {
          username: 'testuser2',
          email: 'testuser2@example.com',
          password: '1234567890'
        }
      }, {
        include: [{
          model: User,
          as: 'user'
        }]
      })
      .then((wiki) =>
      {
        expect(wiki.userId).not.toBe(-1);
        
        wiki.getUser()
        .then((user) =>
        {
          expect(user.username).toBe('testuser2');
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

  describe('#setUser()', () =>
  {
    it('should set the owner of the wiki', (done) =>
    {
      User.create({
        username: 'testuser2',
        email: 'testuser2@example.com',
        password: '1234567890'
      })
      .then((user) =>
      {
        this.wiki.setUser(user)
        .then((wiki) =>
        {
          expect(wiki.userId).toBe(user.id);

          wiki.getUser()
          .then((user) =>
          {
            expect(user.username).toBe('testuser2');
            done();
          });
        })
        .catch((err) =>
        {
          expect(err).toBeNull();
          done();
        });
      });
    });
  });

  describe('#getCollaborators()', () =>
  {
    it('should get all collaborators that are associated with a wiki', (done) =>
    {
      (async () =>
      {
        try 
        {
          let wiki = await Wiki.create({
            title: 'Example Wiki',
            body: 'This is a test wiki body',
            userId: this.user.id,
            collaborators:
            [
              {
                username: 'testuser2',
                email: 'testuser2@example.com',
                password: '1234567890'
              },
              {
                username: 'testuser3',
                email: 'testuser3@example.com',
                password: '1234567890'
              }
            ]
          }, {
            include: [{
              model: User,
              as: 'collaborators'
            }]
          });

          let collaborators = await wiki.getCollaborators();

          expect(collaborators.length).toBe(2);
          expect(collaborators[0].username).toBe('testuser2');
          
          done();
        }
        catch(err)
        {
          expect(err).toBeNull();
          done();
        }
      })();
    });
  });

  describe('#addCollaborator()', () =>
  {
    it('should associate a wiki with a user', (done) =>
    {
      (async () =>
      {
        try 
        {
          let wiki = await Wiki.create({
            title: 'Example Wiki',
            body: 'This is a test wiki body',
            userId: this.user.id
          });

          let collaborators = await wiki.getCollaborators();
          expect(collaborators.length).toBe(0);

          let collaborator1 = await User.create({
            username: 'testuser2',
            email: 'testuser2@example.com',
            password: '1234567890'
          });

          await wiki.addCollaborator(collaborator1);

          collaborators = await wiki.getCollaborators();

          expect(collaborators.length).toBe(1);

          done();
        }
        catch(err)
        {
          expect(err).toBeNull();
          done();
        }
      })();
    });
  });
});