
DELETE FROM app_user;
DELETE FROM wr_system;
DELETE FROM activity;

INSERT INTO app_user VALUES(
    1,
    'grant@mclean.net.nz',
    'Grant McLean',
    '{CRYPT}$2a$04$qUPNseqxQZFLWaNu4C5a8eA8kiK3Rp/CxonoBpK.lcF3g0Tu83KHG',
    NULL,
    '8dabbc494e28f2f8577a425963d11c454065ed57',
    'active',
    1
);

INSERT INTO wr_system VALUES (1,1,'catalyst','Catalyst WRMS',1);
INSERT INTO wr_system VALUES (2,1,'eec','EEC WRMS',1);

INSERT INTO activity VALUES (
    '1',
    1,
    '2013-06-10 09:00:00',
    60,
    2,
    '55555',
    'Weekly meeting'
);

INSERT INTO activity VALUES (
    '2',
    1,
    '2013-06-10 10:00:00',
    180,
    1,
    '81754',
    'Implement "delete account"'
);

INSERT INTO activity VALUES (
    '3',
    1,
    '2013-06-11 09:30:00',
    45,
    1,
    '81754',
    'Implement "delete account"'
);

INSERT INTO activity VALUES (
    '4',
    1,
    '2013-06-11 10:15:00',
    165,
    1,
    '42424',
    'Analyse log files from before "the incident"'
);

