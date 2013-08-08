-- Change these fields:
--   USER      - email address (2 places)
--   FULL_NAME - user's full name
--   API_KEY   - generate a unique value with a command like this:
--               ps fax | sort | sha1sum -
--
-- Use the password reset function on the login page.

INSERT INTO app_user (
    email, full_name, password, reset_key, api_key, status, admin
) VALUES (
    'USER@catalyst.net.nz', 'FULL_NAME', '*LOCKED*', NULL,
    'API_KEY',
    'active', 0
);

INSERT INTO wr_system (
    app_user_id, name, description, request_url
) VALUES (
    (SELECT app_user_id FROM app_user WHERE email = 'USER@catalyst.net.nz'),
    'catalyst', 'Catalyst WRMS',
    'https://wrms.catalyst.net.nz/wr.php?request_id='
);
