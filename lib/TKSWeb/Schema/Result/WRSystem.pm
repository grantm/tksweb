package TKSWeb::Schema::Result::WRSystem;

use parent 'DBIx::Class::Core';

use strict;
use warnings;

__PACKAGE__->table('wr_system');
__PACKAGE__->add_columns(
    wr_system_id => {
                        data_type     => 'integer',
                        is_nullable   => 0,
                    },
    name         => {
                        data_type     => 'text',
                        is_nullable   => 0,
                    },
    description  => {
                        data_type     => 'text',
                        is_nullable   => 0,
                    },
    request_url  => {
                        data_type     => 'text',
                        is_nullable   => 0,
                    },
    colour_code  => {
                        data_type     => 'integer',
                        is_nullable   => 0,
                    },
);

__PACKAGE__->set_primary_key('wr_system_id');

__PACKAGE__->has_many( wr_app_users => UserWRSystem => { 'foreign.wr_system_id' => 'self.wr_system_id' } );
__PACKAGE__->many_to_many( app_users => 'wr_app_users', 'app_user' );


1;


