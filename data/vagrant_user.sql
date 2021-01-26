
INSERT INTO app_user (
    email, full_name, password, reset_key, api_key, status, admin
) VALUES (
    'vagrant', 'vagrant', '{CRYPT}$2a$04$1.HMmfFTiYWfHesuX1WJY.JQALFjk0M0cbFh/CqH0T0RpviF5IGSK', NULL,
    'API_KEY',
    'active', 't'
);

INSERT INTO wr_system (
    name, description, request_url
) VALUES (
    'catalyst', 'Catalyst WRMS',
    'https://wrms.catalyst.net.nz/wr.php?request_id='
);

INSERT INTO user_wr_system(
	wr_system_id, app_user_id
) VALUES (
	(select wr_system_id from wr_system where name = 'catalyst'),
	(select app_user_id from app_user where full_name = 'vagrant')
);


