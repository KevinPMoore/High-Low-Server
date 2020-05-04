CREATE TABLE highlow_users (
    id INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    user_name TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    bank INTEGER NOT NULL DEFAULT 100,
    administrator BOOLEAN NOT NULL DEFAULT FALSE
)