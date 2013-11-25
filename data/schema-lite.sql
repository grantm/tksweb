BEGIN;

CREATE TABLE app_user (
    app_user_id     INTEGER CONSTRAINT PK_APP_USER PRIMARY KEY AUTOINCREMENT,
    email           TEXT    NOT NULL UNIQUE,
    full_name       TEXT    NOT NULL,
    password        TEXT,
    reset_key       TEXT    NULL UNIQUE,
    api_key         TEXT    NULL UNIQUE,
    status          TEXT    NOT NULL DEFAULT 'active',
    admin           BOOLEAN NOT NULL DEFAULT '0'
);

CREATE TABLE wr_system (
    wr_system_id    INTEGER CONSTRAINT PK_WR_SYSTEM PRIMARY KEY AUTOINCREMENT,
    name            TEXT    NOT NULL,
    description     TEXT    NOT NULL,
    request_url     TEXT    NOT NULL DEFAULT '',
    colour_code     INTEGER NOT NULL DEFAULT '0',
    is_default      BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE activity (
    activity_id     INTEGER CONSTRAINT PK_ACTIVITY PRIMARY KEY AUTOINCREMENT,
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

CREATE TABLE "main"."user_wr_system" (
    "wr_system_id" INTEGER NOT NULL,
    "app_user_id" INTEGER NOT NULL,
    PRIMARY KEY (wr_system_id, app_user_id),

    CONSTRAINT FK_USER_M2M
        FOREIGN KEY (app_user_id) REFERENCES app_user (app_user_id),

    CONSTRAINT FK_WR_SYSTEM_M2M
        FOREIGN KEY (wr_system_id) REFERENCES wr_system (wr_system_id)
);

COMMIT;

