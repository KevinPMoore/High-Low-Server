'use strict';

const express = require('express');
const path = require('path');
const UsersService = require('./users-service');
const { requireAuth } = require('../middleware/jwt-auth');

const usersRouter = express.Router();
const jsonBodyParser = express.json();

usersRouter
  .route('/')
  .get((req, res, next) => {
    UsersService.getAllUsers(req.app.get('db'))
      .then(users => {
        res.json(users.map(user => UsersService.serializeUser(user)));
      })
      .catch(next);
  })
  .post(jsonBodyParser, (req, res, next) => {
    const { user_name, password } = req.body;
    for (const field of ['user_name', 'password'])
      if(!req.body[field])
        return res.status(400).json({
          error: `Missing '${field}' in request body`
        });

    const passwordError = UsersService.validatePassword(password);

    if(passwordError)
      return res.status(400).json({ error: passwordError });

    UsersService.hasUserWithUserName(
      req.app.get('db'),
      user_name
    )
      .then(hasUserWithUserName => {
        if (hasUserWithUserName)
          return res.status(400).json({ error: 'Username already taken' });

        return UsersService.hashPassword(password)
          .then(hashedPassword => {
            const newUser = {
              user_name,
              password: hashedPassword
            };

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

usersRouter
  .route('/:user_id')
  .all(requireAuth)
  .all(checkUserExists)
  .get((req, res) => {
      res.json(UsersService.serializeUser(res.user))
  });

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