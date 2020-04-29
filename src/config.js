'use strict';

module.exports = {
  PORT: process.env.PORT || 8000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DB_URL: process.env.DB_URL || 'postgresql://postgres@localhost/high-low',
  JWT_SECTRET: process.env.JWT_SECTRET || 'change-this-secret',
};