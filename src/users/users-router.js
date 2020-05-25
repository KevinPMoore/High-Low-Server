'use strict';

const express = require('express');
const path = require('path');
const UsersService = require('./users-service');
const { requireAuth } = require('../middleware/jwt-auth');

const usersRouter = express.Router();
const jsonBodyParser = express.json();

usersRouter
  .route('/')
  //Provides a list of all users
  .get((req, res, next) => {
    UsersService.getAllUsers(req.app.get('db'))
      .then(users => {
        res.json(users.map(user => UsersService.serializeUser(user)));
      })
      .catch(next);
  })
  //Inserts a new user into the database when provided with a user_name and password.  Other values are populated by default
  .post(jsonBodyParser, (req, res, next) => {
    const { user_name, password } = req.body;
    for (const field of ['user_name', 'password'])
      if(!req.body[field])
        return res.status(400).json({
          error: `Missing '${field}' in request body`
        });

    const passwordError = UsersService.validatePassword(password);

    //Validates password when attempting to post a user
    if(passwordError)
      return res.status(400).json({ error: passwordError });

    //Checks that the user_name provided is not already in the database
    UsersService.hasUserWithUserName(
      req.app.get('db'),
      user_name
    )
      .then(hasUserWithUserName => {
        if (hasUserWithUserName)
          return res.status(400).json({ error: 'Username already taken' });

        //After validation passes, hash the password prior to insertion
        return UsersService.hashPassword(password)
          .then(hashedPassword => {
            const newUser = {
              user_name,
              password: hashedPassword
            };

            //Inserts the new user and returns that user object
            return UsersService.insertUser(
              req.app.get('db'),
              newUser
            )
              .then(user => {
                res
                  .status(201)
                  .location(path.posix.join(req.originalUrl, `/${user.id}`))
                  .json(UsersService.serializeUser(user));
              });
          });
      })
      .catch(next);
  });

//These are protected routes that require authorization to access
usersRouter
  .route('/:user_id')
  .all(requireAuth)
  .all(checkUserExists)
  //Returns the specified user based on request params
  .get((req, res) => {
    res.json(UsersService.serializeUser(res.user));
  })
  //Returns the specified user based on request params and sends a 204
  .delete((req, res, next) => {
    UsersService.deleteUser(
      req.app.get('db'),
      req.params.user_id
    )
      .then(numRowsAffected => {
        res.status(204).end();
      })
      .catch(next);
  })
  //Updates the user's 'user_name' or 'bank' fields, currently there is no client-side means of updating the user_name field
  .patch(jsonBodyParser, (req, res, next) => {
    const { user_name, bank } = req.body;
    const userToUpdate = { user_name, bank };
    const expectedKeys = ['user_name', 'bank'];

    //Checks that appropriate fields are provided
    for (let i = 0; i < expectedKeys.length; i ++) {
      if(!userToUpdate.hasOwnProperty(expectedKeys[i])) {
        return res.status(400).json({
          error: { message: `Request body must contain '${expectedKeys}'`}
        });
      }
    }

    const numberOfValues = Object.values(userToUpdate).filter(Boolean).length;
    if (numberOfValues === 0)
      return res.status(400).json({
        error: {
          message: 'Request body must contain \'user_name\' and \'bank\''
        }
      });

    //Sends PATCH request with new user information and returns a 204
    const updatedUser = { user_name: userToUpdate.user_name, bank: userToUpdate.bank };
    UsersService.updateUser(
      req.app.get('db'),
      req.params.user_id,
      updatedUser
    )
      .then(numRowsAffected => {
        res.status(204).end();
      })
      .catch(next);
  });

//Confirms that a user with the id in the request params is in the database
async function checkUserExists (req, res, next) {
  try {
    const user = await UsersService.getUserById(
      req.app.get('db'),
      req.params.user_id
    );
    if(!user)
      return res.status(404).json({
        error: 'User does not exist'
      });

    res.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = usersRouter;