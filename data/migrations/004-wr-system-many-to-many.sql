BEGIN;

CREATE TABLE "main"."user_wr_system" (
    "wr_system_id" INTEGER NOT NULL,
    "app_user_id" INTEGER NOT NULL,
    PRIMARY KEY (wr_system_id, app_user_id),

    CONSTRAINT FK_USER_M2M
        FOREIGN KEY (app_user_id) REFERENCES app_user (app_user_id),

    CONSTRAINT FK_WR_SYSTEM_M2M
        FOREIGN KEY (wr_system_id) REFERENCES wr_system (wr_system_id)
);

ALTER TABLE wr_system RENAME TO old_wr_system;

CREATE TABLE wr_system (
    wr_system_id    INTEGER CONSTRAINT PK_WR_SYSTEM PRIMARY KEY AUTOINCREMENT,
    name            TEXT    NOT NULL,
    description     TEXT    NOT NULL,
    request_url     TEXT    NOT NULL DEFAULT '',
    colour_code     INTEGER NOT NULL DEFAULT '0',
    is_default      BOOLEAN NOT NULL DEFAULT false
);

INSERT INTO wr_system
    SELECT
        wr_system_id
        ,name
        ,description
        ,request_url
        ,colour_code
    FROM old_wr_system
    ORDER BY wr_system_id;

UPDATE wr_system SET is_default = 'true' WHERE wr_system_id = (select MIN(wr_system_id) from wr_system);

DROP TABLE old_wr_system;

COMMIT;

