package TKSWeb::Schema::Result::AppUser;

use parent 'DBIx::Class::Core';

__PACKAGE__->table('app_user');
__PACKAGE__->add_columns(
    app_user_id  => {
                        data_type     => 'integer',
                        is_nullable   => 0,
                    },
    email        => {
                        data_type     => 'text',
                        is_nullable   => 0,
                    },
    full_name    => {
                        data_type     => 'text',
                        is_nullable   => 0,
                    },
    password     => {
                        data_type     => 'text',
                        is_nullable   => 0,
                    },
    reset_key    => {
                        data_type     => 'text',
                        is_nullable   => 1,
                    },
    api_key      => {
                        data_type     => 'text',
                        is_nullable   => 1,
                    },
    status       => {
                        data_type     => 'text',
                        is_nullable   => 0,
                    },
    admin        => {
                        data_type     => 'boolean',
                        is_nullable   => 0,
                        default_value => 0,
                    },
);

__PACKAGE__->set_primary_key('app_user_id');


1;

