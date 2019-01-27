const sequelize = require('../../src/db/models/index').sequelize;

const User = require('../../src/db/models').User;

describe('User', () =>
{
  beforeEach((done) =>
  {
    sequelize.sync({force: true})
    .then(() =>
    {
      done();
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
        done()
      })
      .catch((err) =>
      {
        console.log(err);
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
});