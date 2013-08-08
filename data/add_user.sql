-- generate a value for API-KEY with a command like this:
-- ps fax | sort | sha1sum -
--
-- Change email address (2 places) and full name

INSERT INTO app_user (
    email, full_name, password, reset_key, api_key, status, admin
) VALUES (
    'user@catalyst.net.nz', 'Full Name', '*LOCKED*', NULL,
    'API-KEY',
    'active', 0
);

INSERT INTO wr_system (
    app_user_id, name, description, request_url
) VALUES (
    (SELECT app_user_id FROM app_user WHERE email = 'user@mclean.net.nz'),
    'catalyst', 'Catalyst WRMS',
    'https://wrms.catalyst.net.nz/wr.php?request_id='
);
