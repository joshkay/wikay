const request = require('request');
const server = require('../../src/server');
const sequelize = require('../../src/db/models/index').sequelize;
const bcrypt = require('bcryptjs');

const User = require('../../src/db/models').User;

const app = require('../../src/app');
const base = `http://localhost:${app.get('port')}`;
const loginUrl = `${base}/users/sign_in`;

describe('routes : static', () =>
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
  })

  describe('guest', () =>
  {
    beforeEach((done) =>
    {
      this.jar = request.jar();
      done();
    });

    describe('GET /', () =>
    {
      const options =
      {
        url: `${base}/`,
        jar: this.jar
      };

      it('should not render link to sign out', (done) =>
      {
        request.get(options, (err, res, body) =>
        {
          expect(body).not.toContain('Sign out');
          expect(body).not.toContain('/users/sign_out');
          done();
        });
      });

      it('should render link to sign in and up', (done) =>
      {
        request.get(options, (err, res, body) =>
        {
          expect(body).toContain('Sign up');
          expect(body).toContain('/users/sign_up');
          expect(body).toContain('Sign in');
          expect(body).toContain('/users/sign_in');
          done();
        });
      });

      it('should return status code 200', (done) =>
      {
        request.get(options, (err, res, body) =>
        {
          expect(res.statusCode).toBe(200);
          done();
        });
      });
    });
  });

  describe('member', () =>
  {
    beforeEach((done) =>
    {
      const salt = bcrypt.genSaltSync();

      this.jar = request.jar();
      this.userPassword = '123456789';

      User.create({
        username: 'loginuser',
        email: 'loginuser@wiki.com',
        password: bcrypt.hashSync(this.userPassword, salt)
      })
      .then((user) =>
      {
        this.user = user;

        const options =
        {
          url: loginUrl,
          form:
          {
            username: this.user.username,
            password: this.userPassword
          },
          jar: this.jar
        };
        
        request.post(options, (err, res, body) =>
        {
          done();
        });
      });
    });

    describe('GET /', () =>
    {
      it('should not render link to sign in and sign up', (done) =>
      {
        const options =
        {
          url: `${base}/`,
          jar: this.jar
        };

        request.get(options, (err, res, body) =>
        {
          expect(body).not.toContain('Sign in');
          expect(body).not.toContain('/users/sign_in');
          expect(body).not.toContain('Sign up');
          expect(body).not.toContain('/users/sign_up');
          done();
        });
      });

      it('should render link to sign out', (done) =>
      {
        const options =
        {
          url: `${base}/`,
          jar: this.jar
        };

        request.get(options, (err, res, body) =>
        {
          expect(body).toContain('Sign out');
          expect(body).toContain('/users/sign_out');
          done();
        });
      });

      it('should return status code 200', (done) =>
      {
        const options =
        {
          url: `${base}/`,
          jar: this.jar
        };

        request.get(options, (err, res, body) =>
        {
          expect(res.statusCode).toBe(200);
          done();
        });
      });
    });
  });
});