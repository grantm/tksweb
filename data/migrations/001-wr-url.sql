BEGIN;

ALTER TABLE wr_system RENAME TO old_wr_system;

CREATE TABLE wr_system (
    wr_system_id    INTEGER CONSTRAINT PK_WR_SYSTEM PRIMARY KEY AUTOINCREMENT,
    app_user_id     INTEGER NOT NULL,
    name            TEXT    NOT NULL,
    description     TEXT    NOT NULL,
    request_url     TEXT    NOT NULL DEFAULT '',
    colour_code     INTEGER NOT NULL DEFAULT '0',

    CONSTRAINT FK_WR_SYSTEM_USER
        FOREIGN KEY (app_user_id) REFERENCES app_user (app_user_id)
);

INSERT INTO wr_system
    SELECT
        wr_system_id
        ,app_user_id
        ,name
        ,description
        ,'' AS request_url
        ,colour_code
    FROM old_wr_system
    ORDER BY wr_system_id;

DROP TABLE old_wr_system;

COMMIT;

