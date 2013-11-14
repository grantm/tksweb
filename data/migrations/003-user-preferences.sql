BEGIN;

CREATE TABLE user_preference (
    preference_id   INTEGER CONSTRAINT PK_PREFERENCE PRIMARY KEY AUTOINCREMENT,
    app_user_id     INTEGER NOT NULL,
    preference      TEXT NOT NULL,
    value           TEXT NOT NULL
);

COMMIT;
