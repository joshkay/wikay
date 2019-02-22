const request = require('request');
const server = require('../../src/server');
const sequelize = require('../../src/db/models/index').sequelize;
const bcrypt = require('bcryptjs');

const User = require('../../src/db/models').User;

const app = require('../../src/app');
const base = `http://localhost:${app.get('port')}`;
const userBase = `${base}/user`;
const upgradeUrl = `${userBase}/upgrade`;
const downgradeUrl = `${userBase}/downgrade`;
const profileUrl = `${base}/profile`;
const loginUrl = `${base}/login`;
const logoutUrl = `${base}/logout`;
const signupUrl = `${base}/signup`;

const AUTH_MESSAGE = require('../../src/auth/helpers').AUTH_MESSAGE;

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

  describe('guest', () =>
  {
    beforeEach((done) =>
    {
      this.jar = request.jar();
      done();
    });

    describe('GET /signup', () =>
    {
      const url = signupUrl;

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

    describe('POST /user/create', () =>
    {
      describe('with valid user information', () =>
      {
        const options =
        {
          url: `${userBase}/create`,
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
          url: `${userBase}/create`,
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
          url: `${userBase}/create`,
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
          url: `${userBase}/create`,
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
          url: `${userBase}/create`,
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

    describe('GET /login', () =>
    {
      const url = loginUrl;

      it('should return status code 200', (done) =>
      {
        request.get(url, (err, res, body) =>
        {
          expect(res.statusCode).toBe(200);
          done();
        });
      });

      it('should render a view with a sign in form', (done) =>
      {
        request.get(url, (err, res, body) =>
        {
          expect(err).toBeNull();
          expect(body).toContain('Sign in');
          done();
        });
      });
    });

    describe('POST /login', () =>
    {
      beforeEach((done) =>
      {
        const options =
        {
          url: `${userBase}/create`,
          form:
          {
            username: 'exampleuser',
            email: 'user@example.com',
            password: '123456789',
            passwordConfirmation: '123456789',
          }
        };
        
        request.post(options, (err, res, body) =>
        {
          done();
        });
      });

      describe('with valid user information', () =>
      {
        const options =
        {
          url: loginUrl,
          form:
          {
            username: 'exampleuser',
            password: '123456789'
          }
        };
        
        it('should login an existing user', (done) =>
        {
          request.post(
          {
            ...options,
            followAllRedirects: true
          }, 
          (err, res, body) =>
          {
            expect(res.request.uri.href).toBe(`${base}/`);
            expect(res.statusCode).toBe(200);
            done();
          });
        });

        it('should successfully redirect after user login', (done) =>
        {
          request.post(options, (err, res, body) =>
          {
            expect(res.statusCode).toBe(302);
            done();
          });
        });
      });

      describe('with invalid user information', () =>
      {
        const options =
        {
          url: loginUrl,
          form:
          {
            username: 'exampleuser',
            password: '123456789false'
          }
        };
        
        it('should not login', (done) =>
        {
          request.post(
          {
            ...options,
            followAllRedirects: true
          }, (err, res, body) =>
          {
            expect(res.request.uri.href).toBe(loginUrl);
            done();
          });
        });

        it('should redirect after failed login', (done) =>
        {
          request.post(options, (err, res, body) =>
          {
            expect(res.statusCode).toBe(302);
            done();
          });
        });
      });
    });
    
    describe('GET /profile', () =>
    {
      it("should redirect to login page with auth error", (done) =>
      {
        const options =
        {
          url: profileUrl,
          jar: this.jar
        };

        request.get(options, (err, res, body) =>
        {
          expect(res.request.uri.href).toBe(loginUrl);
          expect(body).toContain(AUTH_MESSAGE);
          done();
        });
      });
    });

    describe('POST /user/upgrade', () =>
    {
      it('should redirect to login page with auth error', (done) =>
      {
        const options =
        {
          url: upgradeUrl,
          form: {
            stripeToken: process.env.STRIPE_TEST_TOKEN,
            stripeEmail: 'test@joshkay.ca'
          },
          followAllRedirects: true,
          jar: this.jar
        };

        request.post(options, (err, res, body) =>
        {
          expect(res.request.uri.href).toBe(loginUrl);
          expect(body).toContain(AUTH_MESSAGE);
          done();
        });
      });
    });

    describe('POST /user/downgrade', () =>
    {
      it('should redirect to login page with auth error', (done) =>
      {
        const options =
        {
          url: downgradeUrl,
          followAllRedirects: true,
          jar: this.jar
        };

        request.post(options, (err, res, body) =>
        {
          expect(res.request.uri.href).toBe(loginUrl);
          expect(body).toContain(AUTH_MESSAGE);
          done();
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
      this.userPassword = '123456789';

      User.create({
        username: 'loginuser',
        email: 'loginuser@wiki.com',
        password: bcrypt.hashSync(this.userPassword, salt),
        role: User.ROLE_STANDARD
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
    
    describe('GET /profile', () =>
    {
      it("should show the user's profile page with standard role and display upgrade prompt", (done) =>
      {
        const options =
        {
          url: profileUrl,
          jar: this.jar
        };

        request.get(options, (err, res, body) =>
        {
          expect(res.statusCode).toBe(200);
          expect(body).toContain(this.user.username);
          expect(body).toContain(this.user.email);
          expect(body).toContain(User.getRoleText(User.ROLE_STANDARD));
          expect(body).toContain('Upgrade to Premium');
          expect(body).not.toContain('Downgrade to Standard');
          done();
        });
      });
    });

    describe('POST /user/upgrade', () =>
    {
      it('should successfully upgrade user and redirect to profile page', (done) =>
      {
        const options =
        {
          url: upgradeUrl,
          form: {
            stripeToken: process.env.STRIPE_TEST_TOKEN,
            stripeEmail: 'test@joshkay.ca'
          },
          headers:
          {
            'Referer': profileUrl
          },
          followAllRedirects: true,
          jar: this.jar
        };

        request.post(options, (err, res, body) =>
        {
          User.findByPk(this.user.id)
          .then((user) =>
          {
            expect(res.request.uri.href).toBe(profileUrl);
            expect(body).toContain(User.getRoleText(User.ROLE_PREMIUM));
            expect(body).not.toContain('Upgrade to Premium');
            expect(body).toContain('Downgrade to Standard');
            expect(user.isPremium()).toBe(true);
            done();
          });
        });
      });

      it('should successfully upgrade user that has already paid for free and redirect to profile page', (done) =>
      {
        this.user.update({upgraded: true})
        .then((user) =>
        {
          this.user = user;

          const options =
          {
            url: upgradeUrl,
            headers:
            {
              'Referer': profileUrl
            },
            followAllRedirects: true,
            jar: this.jar
          };

          request.post(options, (err, res, body) =>
          {
            User.findByPk(this.user.id)
            .then((user) =>
            {
              expect(res.request.uri.href).toBe(profileUrl);
              expect(body).toContain(User.getRoleText(User.ROLE_PREMIUM));
              expect(body).not.toContain('Upgrade to Premium');
              expect(body).toContain('Downgrade to Standard');
              expect(user.isPremium()).toBe(true);
              done();
            });
          });
        })
      });
    });

    describe('POST /user/downgrade', () =>
    {
      it('should not change user role and display an error message', (done) =>
      {
        const options =
        {
          url: downgradeUrl,
          headers:
          {
            'Referer': profileUrl
          },
          followAllRedirects: true,
          jar: this.jar
        };

        request.post(options, (err, res, body) =>
        {
          User.findByPk(this.user.id)
          .then((user) =>
          {
            expect(body).toContain('Only Premium users can downgrade!');
            expect(res.request.uri.href).toBe(profileUrl);
            expect(body).toContain(User.getRoleText(User.ROLE_STANDARD));
            expect(body).toContain('Upgrade to Premium');
            expect(body).not.toContain('Downgrade to Standard');
            expect(user.isStandard()).toBe(true);
            done();
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
      this.userPassword = '123456789';

      User.create({
        username: 'loginuser',
        email: 'loginuser@wiki.com',
        password: bcrypt.hashSync(this.userPassword, salt),
        upgraded: true,
        role: User.ROLE_PREMIUM
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
    
    describe('GET /profile', () =>
    {
      it("should show the user's profile page with premium role and not prompt user to upgrade", (done) =>
      {
        const options =
        {
          url: profileUrl,
          jar: this.jar
        };

        request.get(options, (err, res, body) =>
        {
          expect(res.statusCode).toBe(200);
          expect(body).toContain(this.user.username);
          expect(body).toContain(this.user.email);
          expect(body).toContain(User.getRoleText(User.ROLE_PREMIUM));
          expect(body).not.toContain('Upgrade to Premium');
          expect(body).toContain('Downgrade to Standard');
          done();
        });
      });
    });

    describe('POST /user/upgrade', () =>
    {
      it('should not change user role and display an error message', (done) =>
      {
        const options =
        {
          url: upgradeUrl,
          form: {
            stripeToken: process.env.STRIPE_TEST_TOKEN,
            stripeEmail: 'test@joshkay.ca'
          },
          headers:
          {
            'Referer': profileUrl
          },
          followAllRedirects: true,
          jar: this.jar
        };

        request.post(options, (err, res, body) =>
        {
          User.findByPk(this.user.id)
          .then((user) =>
          {
            expect(body).toContain('Only Standard users can upgrade!');
            expect(res.request.uri.href).toBe(profileUrl);
            expect(body).toContain(User.getRoleText(User.ROLE_PREMIUM));
            expect(body).not.toContain('Upgrade to Premium');
            expect(body).toContain('Downgrade to Standard');
            expect(user.isPremium()).toBe(true);
            done();
          });
        });
      });
    });

    describe('POST /user/downgrade', () =>
    {
      it('should successfully downgrade user and redirect to profile page', (done) =>
      {
        const options =
        {
          url: downgradeUrl,
          headers:
          {
            'Referer': profileUrl
          },
          followAllRedirects: true,
          jar: this.jar
        };

        request.post(options, (err, res, body) =>
        {
          User.findByPk(this.user.id)
          .then((user) =>
          {
            expect(body).toContain('Account downgraded to standard!');
            expect(res.request.uri.href).toBe(profileUrl);
            expect(body).toContain(User.getRoleText(User.ROLE_STANDARD));
            expect(body).toContain('Free Upgrade to Premium');
            expect(body).not.toContain('Downgrade to Standard');
            expect(user.isStandard()).toBe(true);
            done();
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
      this.userPassword = '123456789';

      User.create({
        username: 'loginuser',
        email: 'loginuser@wiki.com',
        password: bcrypt.hashSync(this.userPassword, salt),
        role: User.ROLE_ADMIN
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
    
    describe('GET /profile', () =>
    {
      it("should show the user's profile page with admin role and not prompt user to upgrade", (done) =>
      {
        const options =
        {
          url: profileUrl,
          jar: this.jar
        };

        request.get(options, (err, res, body) =>
        {
          expect(res.statusCode).toBe(200);
          expect(body).toContain(this.user.username);
          expect(body).toContain(this.user.email);
          expect(body).toContain(User.getRoleText(User.ROLE_ADMIN));
          expect(body).not.toContain('Upgrade to Premium');
          expect(body).not.toContain('Downgrade to Standard');
          done();
        });
      });
    });

    describe('POST /user/upgrade', () =>
    {
      it('should not change user role and display an error message', (done) =>
      {
        const options =
        {
          url: upgradeUrl,
          form: {
            stripeToken: process.env.STRIPE_TEST_TOKEN,
            stripeEmail: 'test@joshkay.ca'
          },
          headers:
          {
            'Referer': profileUrl
          },
          followAllRedirects: true,
          jar: this.jar
        };
  
        request.post(options, (err, res, body) =>
        {
          User.findByPk(this.user.id)
          .then((user) =>
          {
            expect(body).toContain('Only Standard users can upgrade!');
            expect(res.request.uri.href).toBe(profileUrl);
            expect(body).toContain(User.getRoleText(User.ROLE_ADMIN));
            expect(body).not.toContain('Upgrade to Premium');
            expect(body).not.toContain('Downgrade to Standard');
            expect(user.isAdmin()).toBe(true);
            done();
          });
        });
      });
    });

    describe('POST /user/downgrade', () =>
    {
      it('should not change user role and display an error message', (done) =>
      {
        const options =
        {
          url: downgradeUrl,
          headers:
          {
            'Referer': profileUrl
          },
          followAllRedirects: true,
          jar: this.jar
        };
  
        request.post(options, (err, res, body) =>
        {
          User.findByPk(this.user.id)
          .then((user) =>
          {
            expect(body).toContain('Only Premium users can downgrade!');
            expect(res.request.uri.href).toBe(profileUrl);
            expect(body).toContain(User.getRoleText(User.ROLE_ADMIN));
            expect(body).not.toContain('Upgrade to Premium');
            expect(body).not.toContain('Downgrade to Standard');
            expect(user.isAdmin()).toBe(true);
            done();
          });
        });
      });
    });
  });
});