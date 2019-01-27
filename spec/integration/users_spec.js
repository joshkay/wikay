const request = require('request');
const server = require('../../src/server');
const sequelize = require('../../src/db/models/index').sequelize;

const User = require('../../src/db/models').User;

const app = require('../../src/app');
const base = `http://localhost:${app.get('port')}/users`;

describe('routes : users', () =>
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

  describe('GET /users/sign_up', () =>
  {
    const url = `${base}/sign_up`;

    it('should return status code 200', (done) =>
    {
      request.get(url, (err, res, body) =>
      {
        expect(res.statusCode).toBe(200);
        done();
      });
    });

    it('should contain the text "Sign Up"', (done) =>
    {
      request.get(url, (err, res, body) =>
      {
        expect(res.body).toContain('Sign up');
        done();
      });
    });
  });

  describe('POST /users', () =>
  {
    describe('with valid user information', () =>
    {
      const options =
      {
        url: `${base}/`,
        form:
        {
          username: 'exampleuser',
          email: 'user@example.com',
          password: '123456789',
          passwordConfirmation: '123456789',
        }
      };
      
      it('should create a new user with valid values', (done) =>
      {
        request.post(options, (err, res, body) =>
        {
          User.findOne({
            where: {email: 'user@example.com'}
          })
          .then((user) =>
          {
            expect(user).not.toBeNull();
            expect(user.username).toBe('exampleuser');
            expect(user.email).toBe('user@example.com');
            expect(user.id).toBe(1);
            done();
          })
          .catch((err) =>
          {
            console.log(err);
            done();
          });
        });
      });

      it('should redirect after user creation', (done) =>
      {
        request.post(options, (err, res, body) =>
        {
          expect(res.statusCode).toBe(302);
          done();
        });
      });

      it("should not store the user's password in plain text", (done) =>
      {
        request.post(options, (err, res, body) =>
        {
          User.findOne({
            where: {email: 'user@example.com'}
          })
          .then((user) =>
          {
            expect(user).not.toBeNull();
            expect(user.email).toBe('user@example.com');
            expect(user.id).toBe(1);
            expect(user.password).not.toBe('123456789');
            done();
          })
          .catch((err) =>
          {
            console.log(err);
            done();
          });
        });
      });
    });
    
    describe('with invalid email', () =>
    {
      const options = 
      {
        url: `${base}/`,
        form:
        {
          username: 'invaliduser',
          email: 'invalid',
          password: '123456789',
          passwordConfirmation: '123456789'
        }
      };

      it('should not create a new user', (done) =>
      {
        request.post(options, (err, res, body) =>
        {
          User.findOne({
            where: {email: 'invalid'}
          })
          .then((user) =>
          {
            expect(user).toBeNull();
            done();
          })
          .catch((err) =>
          {
            console.log(err);
            done();
          });
        });
      });

      it('should redirect after failed user creation', (done) =>
      {
        request.post(options, (err, res, body) =>
        {
          expect(res.statusCode).toBe(303);
          done();
        });
      });
    });

    describe('with invalid username', () =>
    {
      const options = 
      {
        url: `${base}/`,
        form:
        {
          username: 'short',
          email: 'test@123.com',
          password: '123456789',
          passwordConfirmation: '123456789'
        }
      };

      it('should not create a new user', (done) =>
      {
        request.post(options, (err, res, body) =>
        {
          User.findOne({
            where: {username: 'short'}
          })
          .then((user) =>
          {
            expect(user).toBeNull();
            done();
          })
          .catch((err) =>
          {
            console.log(err);
            done();
          });
        });
      });

      it('should redirect after failed user creation', (done) =>
      {
        request.post(options, (err, res, body) =>
        {
          expect(res.statusCode).toBe(303);
          done();
        });
      });
    });

    describe('with invalid password', () =>
    {
      const options = 
      {
        url: `${base}/`,
        form:
        {
          username: 'testuser123',
          email: 'test@123.com',
          password: 'short',
          passwordConfirmation: 'short'
        }
      };

      it('should not create a new user', (done) =>
      {
        request.post(options, (err, res, body) =>
        {
          User.findOne({
            where: {username: 'testuser123'}
          })
          .then((user) =>
          {
            expect(user).toBeNull();
            done();
          })
          .catch((err) =>
          {
            console.log(err);
            done();
          });
        });
      });

      it('should redirect after failed user creation', (done) =>
      {
        request.post(options, (err, res, body) =>
        {
          expect(res.statusCode).toBe(303);
          done();
        });
      });
    });

    describe('without matching passwords', () =>
    {
      const options = 
      {
        url: `${base}/`,
        form:
        {
          username: 'testuser123',
          email: 'test@123.com',
          password: 'password123',
          passwordConfirmation: 'password124'
        }
      };

      it('should not create a new user', (done) =>
      {
        request.post(options, (err, res, body) =>
        {
          User.findOne({
            where: {username: 'testuser123'}
          })
          .then((user) =>
          {
            expect(user).toBeNull();
            done();
          })
          .catch((err) =>
          {
            console.log(err);
            done();
          });
        });
      });

      it('should redirect after failed user creation', (done) =>
      {
        request.post(options, (err, res, body) =>
        {
          expect(res.statusCode).toBe(303);
          done();
        });
      });
    });
  });
});