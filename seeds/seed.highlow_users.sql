BEGIN;

TRUNCATE highlow_users RESTART IDENTITY CASCADE;

INSERT INTO highlow_users (user_name, password, administrator)
VALUES
    ('DemoUser', 'P4ssW0rd', false),
    ('DemoAdmin', '4dM1n1str4t0r', true);

COMMIT;