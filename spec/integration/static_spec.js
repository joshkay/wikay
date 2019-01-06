const request = require('request');
const server = require('../../src/server');

const app = require('../../src/app');
const base = `http://localhost:${app.get('port')}`;

describe('routes : static', () =>
{
  describe('GET /', () =>
  {
    it('should return status code 200', (done) =>
    {
      console.log(base);
      request.get(`${base}/`, (err, res, body) =>
      {
        expect(res.statusCode).toBe(200);
        done();
      });
    });
  });
});