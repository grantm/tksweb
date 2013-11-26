BEGIN;

CREATE TABLE app_user (
    app_user_id     SERIAL  NOT NULL,
    email           TEXT    NOT NULL UNIQUE,
    full_name       TEXT    NOT NULL,
    password        TEXT,
    reset_key       TEXT    NULL UNIQUE,
    api_key         TEXT    NULL UNIQUE,
    status          TEXT    NOT NULL DEFAULT 'active',
    admin           BOOLEAN NOT NULL DEFAULT '0',
    PRIMARY KEY (app_user_id)
);

CREATE TABLE wr_system (
    wr_system_id    SERIAL  NOT NULL,
    name            TEXT    NOT NULL,
    description     TEXT    NOT NULL,
    request_url     TEXT    NOT NULL DEFAULT '',
    colour_code     INTEGER NOT NULL DEFAULT '0',
    is_default      BOOLEAN NOT NULL DEFAULT false,
    PRIMARY KEY (wr_system_id)
);

CREATE TABLE activity (
    activity_id     SERIAL   NOT NULL,
    app_user_id     INTEGER  NOT NULL,
    date_time       TIMESTAMP NOT NULL,
    duration        INTEGER  NOT NULL,
    wr_system_id    INTEGER  NOT NULL,
    wr_number       TEXT,
    description     TEXT,

    PRIMARY KEY (activity_id),

    CONSTRAINT FK_ACTIVITY_USER
        FOREIGN KEY (app_user_id) REFERENCES app_user (app_user_id),

    CONSTRAINT FK_ACTIVITY_WR_SYSTEM
        FOREIGN KEY (wr_system_id) REFERENCES wr_system (wr_system_id)
);

CREATE TABLE user_preference (
    preference_id   SERIAL NOT NULL,
    app_user_id     INTEGER NOT NULL,
    preference      TEXT NOT NULL,
    value           TEXT NOT NULL,
    PRIMARY KEY(preference_id)
);

CREATE TABLE user_wr_system (
    "wr_system_id" INTEGER NOT NULL,
    "app_user_id" INTEGER NOT NULL,
    PRIMARY KEY (wr_system_id, app_user_id),

    CONSTRAINT FK_USER_M2M
        FOREIGN KEY (app_user_id) REFERENCES app_user (app_user_id),

    CONSTRAINT FK_WR_SYSTEM_M2M
        FOREIGN KEY (wr_system_id) REFERENCES wr_system (wr_system_id)
);

COMMIT;

