'use strict';

module.exports = {
  PORT: process.env.PORT || 8000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  API_TOKEN: process.env.API_TOKEN || 'dummy-api-token',
  JWT_SECTRET: process.env.JWT_SECTRET || 'change-this-secret',
};