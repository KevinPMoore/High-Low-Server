'use strict';

const xss = require('xss');
const bcrypt = require('bcryptjs');
const REGEX_UPPER_LOWER_NUMBER_SPECIAL = /(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&])[\S]+/;

const UsersService = {
  //Returns all users
  getAllUsers(db) {
    return db
      .from('highlow_users AS hl')
      .select(
        'hl.id',
        'hl.user_name',
        'hl.password',
        'hl.bank',
        'hl.administrator'
      );
  },
  //Returns a specific user from all users based on id
  getUserById(db, id) {
    return UsersService.getAllUsers(db)
      .where('hl.id', id)
      .first();
  },
  //Returns the first user with a provided name, user names are validated for uniqueness elsewhere
  hasUserWithUserName(db, user_name) {
    return db('highlow_users')
      .where({ user_name })
      .first()
      .then(user => !!user);
  },
  //Inserts a new user into the database
  insertUser(db, newUser) {
    return db
      .insert(newUser)
      .into('highlow_users')
      .returning('*')
      .then(([user]) => user);
  },
  //Removes a user from the database based on id
  deleteUser(db, id) {
    return db('highlow_users')
      .where({ id })
      .delete();
  },
  //Updates fields for a user specified by id, used to update bank for the client side
  updateUser(db, id, newUserFields) {
    return db('highlow_users')
      .where({ id })
      .update(newUserFields);
  },
  //Checks a provided password against validation criteria
  validatePassword(password) {
    if (password.length < 8) {
      return 'Password must be longer than 8 characters';
    }
    if (password.length > 72) {
      return 'Password must be less than 72 characters';
    }
    if (password.startsWith(' ') || password.endsWith(' ')) {
      return 'Password must not start or end with empty spaces';
    }
    if (!REGEX_UPPER_LOWER_NUMBER_SPECIAL.test(password)) {
      return 'Password must contain 1 upper case, lower case, number and special character';
    }
    return null;
  },
  //Replaces the provided password with a hashed version, used upon insertion of a new user
  hashPassword(password) {
    return bcrypt.hash(password, 12);
  },
  //Returns the user as an XSS sanitized object
  serializeUser(user) {
    return {
      id: user.id,
      user_name: xss(user.user_name),
      password: xss(user.password),
      bank: user.bank,
      administrator: user.administrator,
    };
  }
};

module.exports = UsersService;