const request = require('request');
const server = require('../../src/server');

const app = require('../../src/app');
const base = `http://localhost:${app.get('port')}`;
const authBase = `${base}/auth/fake`;

describe('routes : static', () =>
{
  describe('guest user performing', () =>
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

    describe('GET /', () =>
    {
      it('should not render link to sign out', (done) =>
      {
        request.get(`${base}/`, (err, res, body) =>
        {
          expect(body).not.toContain('Sign out');
          expect(body).not.toContain('/users/sign_out');
          done();
        });
      });

      it('should render link to sign in and up', (done) =>
      {
        request.get(`${base}/`, (err, res, body) =>
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
        request.get(`${base}/`, (err, res, body) =>
        {
          expect(res.statusCode).toBe(200);
          done();
        });
      });
    });
  });

  describe('member performing', () =>
  {
    beforeEach((done) =>
    {
      request.get({
        url: authBase,
        form:
        {
          userId: 1,
          username: 'testmember'
        }
      }, (err, res, body) =>
      {
        done();
      });
    });

    describe('GET /', () =>
    {
      it('should not render link to sign in and sign up', (done) =>
      {
        request.get(`${base}/`, (err, res, body) =>
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
        request.get(`${base}/`, (err, res, body) =>
        {
          expect(body).toContain('Sign out');
          expect(body).toContain('/users/sign_out');
          done();
        });
      });

      it('should return status code 200', (done) =>
      {
        request.get(`${base}/`, (err, res, body) =>
        {
          expect(res.statusCode).toBe(200);
          done();
        });
      });
    });
  });
});