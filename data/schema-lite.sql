BEGIN;

CREATE TABLE app_user (
    app_user_id     INTEGER CONSTRAINT PK_APP_USER PRIMARY KEY AUTOINCREMENT,
    email           TEXT    NOT NULL UNIQUE,
    full_name       TEXT    NOT NULL,
    password        TEXT    NOT NULL,
    reset_key       TEXT,
    api_key         TEXT,
    status          TEXT    NOT NULL DEFAULT 'active',
    admin           BOOLEAN NOT NULL DEFAULT '0'
);

CREATE TABLE wr_system (
    wr_system_id    INTEGER CONSTRAINT PK_WR_SYSTEM PRIMARY KEY AUTOINCREMENT,
    app_user_id     INTEGER NOT NULL,
    name            TEXT    NOT NULL,
    description     TEXT    NOT NULL,
    colour_code     INTEGER,

    CONSTRAINT FK_WR_SYSTEM_USER
        FOREIGN KEY (app_user_id) REFERENCES app_user (app_user_id)
);

CREATE TABLE activity (
    activity_id     TEXT CONSTRAINT PK_ACTIVITY PRIMARY KEY,
    app_user_id     INTEGER  NOT NULL,
    date_time       DATETIME NOT NULL,
    duration        INTEGER  NOT NULL,
    wr_system_id    INTEGER  NOT NULL,
    wr_number       TEXT,
    description     TEXT,

    CONSTRAINT FK_ACTIVITY_USER
        FOREIGN KEY (app_user_id) REFERENCES app_user (app_user_id),

    CONSTRAINT FK_ACTIVITY_WR_SYSTEM
        FOREIGN KEY (wr_system_id) REFERENCES wr_system (wr_system_id)
);

COMMIT;

