const sequelize = require('../../src/db/models/index').sequelize;

const User = require('../../src/db/models').User;
const Wiki = require('../../src/db/models').Wiki;

describe('User', () =>
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
    it('should create a User object with a valid username, email and password', (done) =>
    {
      User.create({
        username: 'exampleuser',
        email: 'user@example.com',
        password: '1234567890'
      })
      .then((user) =>
      {
        expect(user.username).toBe('exampleuser');
        expect(user.email).toBe('user@example.com');
        expect(user.password).toBe('1234567890');
        done();
      })
      .catch((err) =>
      {
        console.log(err);
        done();
      });
    });

    it('should default the user role to standard', (done) =>
    {
      User.create({
        username: 'exampleuser',
        email: 'user@example.com',
        password: '1234567890'
      })
      .then((user) =>
      {
        expect(user.role).toBe(User.ROLE_STANDARD);
        done();
      })
      .catch((err) =>
      {
        expect(err).toBeNull();
        done();
      });
    });

    it('should not create a user with an invalid email', (done) =>
    {
      User.create({
        username: 'invaliduser',
        email: 'invalidemail',
        password: '1234567890'
      })
      .then((user) =>
      {
        done();
      })
      .catch((err) =>
      {
        expect(err.message).toContain('Validation error: must be a valid email');
        done();
      });
    });

    it('should not create a user with an email already taken', (done) =>
    {
      User.create({
        username: 'exampleuser',
        email: 'user@example.com',
        password: '1234567890'
      })
      .then((user) =>
      {
        User.create({
          username: 'exampleuser1',
          email: 'user@example.com',
          password: 'nanananananananana BATMAN!'
        })
        .then((user) =>
        {
          expect(user).toBeNull();
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
        done();
      });
    });

    it('should not create a user with a username already taken', (done) =>
    {
      User.create({
        username: 'exampleuser',
        email: 'user@example.com',
        password: '1234567890'
      })
      .then((user) =>
      {
        User.create({
          username: 'exampleuser',
          email: 'user1@example.com',
          password: '1234567890'
        })
        .then((user) =>
        {
          expect(user).toBeNull();
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
        done();
      });
    });
  });

  describe('#destroy()', () =>
  {
    it("should delete the user", (done) =>
    {
      User.findAll()
      .then((users) =>
      {
        expect(users.length).toBe(1);

        this.user.destroy()
        .then(() =>
        {
          User.findAll()
          .then((users) =>
          {
            expect(users.length).toBe(0);
            done();
          });
        })
        .catch((err) =>
        {
          expect(err).toBeNull();
          done();
        })
      });
    });
      
    it("should delete the user's wikis", (done) =>
    {
      User.create({
        username: 'testuser2',
        email: 'testuser2@example.com',
        password: '1234567890',
        wikis: [
          {
            title: 'Test Wiki 2',
            body: 'Test Wiki 2 Body'
          }
        ]
      }, {
        include: [{
          model: Wiki,
          as: 'wikis'
        }]
      })
      .then((user) =>
      {
        Wiki.findAll()
        .then((wikis) =>
        {
          expect(wikis.length).toBe(2);

          user.destroy()
          .then(() =>
          {
            Wiki.findAll()
            .then((wikis) =>
            {
              expect(wikis.length).toBe(1);
              done();
            });
          });
        });
      });
    });
  });

  describe('#getWikis()', () =>
  {
    it('should get all wikis that are associated with a user', (done) =>
    {
      User.create({
        username: 'testuser2',
        email: 'testuser2@example.com',
        password: '1234567890',
        wikis: [
          {
            title: 'Test Wiki 2',
            body: 'Test Wiki 2 Body'
          }
        ]
      }, {
        include: [{
          model: Wiki,
          as: 'wikis'
        }]
      })
      .then((user) =>
      {
        user.getWikis()
        .then((wikis) =>
        {
          expect(wikis.length).toBe(1);
          expect(wikis[0].title).toBe('Test Wiki 2');
          done();
        });
      })
      .catch((err) =>
      {
        expect(err).toBeNull();
        console.log(err);
        done();
      });
    });
  });

  describe('#addWiki()', () =>
  {
    it('should associate a wiki with a user', (done) =>
    {
      User.create({
        username: 'testuser2',
        email: 'testuser2@example.com',
        password: '1234567890',
      })
      .then((user) =>
      {
        user.getWikis()
        .then((wikis) =>
        {
          expect(wikis.length).toBe(0);
  
          user.addWiki(this.wiki)
          .then((userWiki) =>
          {
            user.getWikis()
            .then((wikis) =>
            {
              expect(wikis.length).toBe(1);
              expect(wikis[0].id).toBe(this.wiki.id);
              done();
            });
          })
          .catch((err) =>
          {
            console.log(err);
            done();
          });
        });
      });
    });
  });

  describe('#isStandard()', () =>
  {
    it('should return true if the user has the default role of standard', (done) =>
    {
      User.create({
        username: 'standarduser',
        email: 'standarduser@example.com',
        password: '1234567890',
        role: User.ROLE_STANDARD
      })
      .then((user) =>
      {
        expect(user.isStandard()).toBe(true);
        done();
      })
      .catch((err) =>
      {
        expect(err).toBeNull();
        done();
      });
    });

    it('should return false if the user has a different role than standard', (done) =>
    {
      User.create({
        username: 'standarduser',
        email: 'standarduser@example.com',
        password: '1234567890',
        role: User.ROLE_ADMIN
      })
      .then((user) =>
      {
        expect(user.isStandard()).toBe(false);
        done();
      })
      .catch((err) =>
      {
        expect(err).toBeNull();
        done();
      });
    });
  });

  describe('#isPremium()', () =>
  {
    it('should return true if the user has the role of premium', (done) =>
    {
      User.create({
        username: 'premiumuser',
        email: 'premiumuser@example.com',
        password: '1234567890',
        role: User.ROLE_PREMIUM
      })
      .then((user) =>
      {
        expect(user.isPremium()).toBe(true);
        done();
      })
      .catch((err) =>
      {
        expect(err).toBeNull();
        done();
      });
    });

    it('should return false if the user has a different role than premium', (done) =>
    {
      User.create({
        username: 'premiumuser',
        email: 'premiumuser@example.com',
        password: '1234567890',
        role: User.ROLE_ADMIN
      })
      .then((user) =>
      {
        expect(user.isPremium()).toBe(false);
        done();
      })
      .catch((err) =>
      {
        expect(err).toBeNull();
        done();
      });
    });
  });

  describe('#isAdmin()', () =>
  {
    it('should return true if the user has the role of admin', (done) =>
    {
      User.create({
        username: 'adminuser',
        email: 'adminuser@example.com',
        password: '1234567890',
        role: User.ROLE_ADMIN
      })
      .then((user) =>
      {
        expect(user.isAdmin()).toBe(true);
        done();
      })
      .catch((err) =>
      {
        expect(err).toBeNull();
        done();
      });
    });

    it('should return false if the user has a different role than admin', (done) =>
    {
      User.create({
        username: 'adminuser',
        email: 'adminuser@example.com',
        password: '1234567890',
        role: User.ROLE_STANDARD
      })
      .then((user) =>
      {
        expect(user.isAdmin()).toBe(false);
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