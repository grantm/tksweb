
DELETE FROM app_user;
DELETE FROM wr_system;
DELETE FROM activity;

INSERT INTO app_user VALUES(1,'grant@mclean.net.nz','Grant McLean','{CRYPT}$2a$04$qUPNseqxQZFLWaNu4C5a8eA8kiK3Rp/CxonoBpK.lcF3g0Tu83KHG',NULL,NULL,'active',1);

INSERT INTO wr_system VALUES (1,1,'catalyst','Catalyst WRMS',1);
INSERT INTO wr_system VALUES (2,1,'catalyst','EEC WRMS',1);

INSERT INTO activity VALUES (
    '1',
    1,
    '2013-06-10',
    '09:00',
    1.5,
    2,
    '33705',
    'Fix test failures'
);

INSERT INTO activity VALUES (
    '2',
    1,
    '2013-06-10',
    '10:00',
    0.5,
    1,
    '40390',
    'Update level 9 map'
);

