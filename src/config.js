'use strict';

module.exports = {
  PORT: process.env.PORT || 8000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECTRET: process.env.JWT_SECTRET || 'change-this-secret',
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres@localhost/high-low',
  TEST_DATABASE_URL: process.env.TEST_DATABASE_URL || 'postgresql://postgres@localhost/high-low-test',
};