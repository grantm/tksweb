BEGIN;

ALTER TABLE app_user RENAME TO old_app_user;

CREATE TABLE app_user (
    app_user_id     INTEGER CONSTRAINT PK_APP_USER PRIMARY KEY AUTOINCREMENT,
    email           TEXT    NOT NULL UNIQUE,
    full_name       TEXT    NOT NULL,
    password        TEXT    NOT NULL,
    reset_key       TEXT    NULL UNIQUE,
    api_key         TEXT    NULL UNIQUE,
    status          TEXT    NOT NULL DEFAULT 'active',
    admin           BOOLEAN NOT NULL DEFAULT '0'
);

INSERT INTO app_user
    SELECT
        app_user_id
        ,email
        ,full_name
        ,password
        ,reset_key
        ,api_key
        ,status
        ,admin
    FROM old_app_user
    ORDER BY app_user_id;

DROP TABLE old_app_user;

COMMIT;
