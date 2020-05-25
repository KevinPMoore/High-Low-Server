'use strict';
const express = require('express');
const AuthService = require('./auth-service');

const authRouter = express.Router();
const jsonBodyParser = express.json();

authRouter
  .post('/login', jsonBodyParser, (req, res, next) => {
    const { user_name, password } = req.body;
    const loginUser = { user_name, password };

    //Checks to see that the login request body contains both a user_name and password
    for (const [key, value] of Object.entries(loginUser))
      if(value === null)
        return res.status(400).json({
          error: `Missing '${key}' in request body`
        });

    //Checks to see if the provided user_name matches one in the database, sending an error if it does not match
    AuthService.getUserWithUserName(
      req.app.get('db'),
      loginUser.user_name
    )
      .then(dbUser => {
        if (!dbUser)
          return res.status(400).json({
            error: 'Incorrect user name or password',
          });

        //Runs comparePasswords from auth-service with the password for the matched user_name, sending an error if it returns false
        return AuthService.comparePasswords(loginUser.password, dbUser.password)
          .then(compareMatch => {
            if (!compareMatch)
              return res.status(400).json({
                error: 'Incorrect user name or password',
              });

            const sub = dbUser.user_name;
            const payload = { user_id: dbUser.id };
            //Sends an authToken and user object back for use on the client side
            res.send({
              user: { id: dbUser.id, user_name: dbUser.user_name, bank: dbUser.bank },
              authToken: AuthService.createJwt(sub, payload),
            });
          });
      })
      .catch(next);
  });

module.exports = authRouter;