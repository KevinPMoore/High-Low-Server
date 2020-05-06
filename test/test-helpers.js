'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

function makeUsersArray() {
  return [
    {
      id: 1,
      user_name: 'Test-User-1',
      password: 'TPassW0rd1',
      bank: 100,
      administrator: false
    },
    {
      id: 2,
      user_name: 'Test-User-2',
      password: 'TPassW0rd3',
      bank: 200,
      administrator: false
    },
    {
      id: 3,
      user_name: 'Test-User-3',
      password: 'TPassW0rd3',
      bank: 100,
      administrator: true
    }
  ];
}

function makeMaliciousUser() {
  const maliciousUser = {
    id: 911,
    user_name: 'Naughty naughty very naughty <script>alert("xss");</script>',
    password: 'Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.',
    bank: 100,
    administrator: false
  };

  const expectedUser = {
    id: 911,
    user_name: 'Naughty naughty very naughty &lt;script&gt;alert("xss");&lt;/script&gt;',
    password: 'Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.',
    bank: 100,
    administrator: false
  };

  return {
    maliciousUser,
    expectedUser
  };
}

function cleanTables(db) {
  return db.raw(
    `TRUNCATE
        highlow_users
        RESTART IDENTITY CASCADE`
  );
}

function seedUsers(db, users) {
  const preppedUsers = users.map(user=> ({
    ...user,
    password: bcrypt.hashSync(user.password, 1)
  }));
  return db.into('highlow_users').insert(preppedUsers)
    .then(() => 
      db.raw(
        `SELECT setval ('highlow_users_id_seq', ?)`,
        [users[users.length -1].id]
      )
    );
}

function seedMaliciousUser(db, maliciousUser) {
  return seedUsers(db, [maliciousUser]);
}

function makeAuthHeader(user, secret = process.env.JWT_SECRET) {
  const token = jwt.sign({ id: user.id }, secret, {
    subject: user.user_name,
    algorithm: 'HS256'
  });
  return `Bearer ${token}`;
}

module.exports = {
  makeUsersArray,
  makeMaliciousUser,
  cleanTables,
  seedUsers,
  seedMaliciousUser,
  makeAuthHeader,
};