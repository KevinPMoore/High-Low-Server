'use strict';

const knex = require('knex');
const bcrypt = require('bcryptjs');
const app = require('../src/app');
const helpers = require('./test-helpers');

describe('Users Endpoints', function() {
  let db;

  const testUsers = helpers.makeUsersArray();
  const testUser = testUsers[0];

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DATABASE_URL,
    });
    app.set('db', db);
  });
    
  after('disconnect from db', () => db.destroy());
    
  before('cleanup', () => helpers.cleanTables(db));
    
  afterEach('cleanup', () => helpers.cleanTables(db));

  describe('GET /api/users', () => {
    context('Given no users', () => {
      it('responds with 200 and an empty list', () => {
        return supertest(app)
          .get('/api/users')
          .expect(200, []);
      });
    });

    context('Given there are users', () => {
      beforeEach('insert users', () => 
        helpers.seedUsers(db, testUsers)
      );
      it('responds with 200 and all of the users', () => {
        return supertest(app)
          .get('/api/users')
          .expect(200, testUsers);
      });
    });

    context('Given an XSS attack user', () => {
      const {
        maliciousUser,
        expectedUser,
      } = helpers.makeMaliciousUser();

      beforeEach('insert malicious user', () =>
        helpers.seedMaliciousUser(db, maliciousUser)
      );

      it('removes XSS attack content', () => {
        return supertest(app)
          .get('/api/users')
          .expect(200)
          .expect(res => {
            expect(res.body[0].user_name).to.eql(expectedUser.user_name);
            expect(res.body[0].password).to.eql(expectedUser.password);
          });
      });
    });
  });

  describe('GET /api/users/:user_id', () => {
    context('Given no users', () => {
      beforeEach(() =>
        helpers.seedUsers(db, testUsers)
      );
      it('responds with 404', () => {
        const userId = 123456;
        return supertest(app)
          .get(`/api/users/${userId}`)
          .set('Authorization', helpers.makeAuthHeader(testUser))
          .expect(404, { error: 'User does not exist' });
      });
    });

    context('Given there are users', () => {
      beforeEach('insert users', () =>
        helpers.seedUsers(db, testUsers)
      );

      it('responds with 200 and the specified user', () => {
        const userId = 2;
        const expectedUser = helpers.makeUsersArray([userId - 1]);
        return supertest(app)
          .get(`/api/users/${userId}`)
          .set('Authorization', helpers.makeAuthHeader(expectedUser))
          .expect(404, { error: 'User does not exist' });
      });
    });

    context('Given an XSS attack user', () => {
      const { maliciousUser, expectedUser } = helpers.makeMaliciousUser();
      beforeEach('insert malicious user', () => {
        return helpers.seedMaliciousUser(db, maliciousUser);
      });

      it('removes XSS attack content', () => {
        //xss user here and expect statement
      });
    });
  });

  //DESCRIBE POST

  //DESCRIBE PATCH/:user_id

  //DESCRIBE DELETE/:user_id
});