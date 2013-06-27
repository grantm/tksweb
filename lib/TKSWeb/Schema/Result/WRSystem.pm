package TKSWeb::Schema::Result::WRSystem;

use parent 'DBIx::Class::Core';

__PACKAGE__->table('wr_system');
__PACKAGE__->add_columns(
    wr_system_id => {
                        data_type     => 'integer',
                        is_nullable   => 0,
                    },
    app_user_id  => {
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
    colour_code  => {
                        data_type     => 'integer',
                        is_nullable   => 0,
                    },
);

__PACKAGE__->set_primary_key('wr_system_id');

__PACKAGE__->belongs_to( app_user => AppUser => { 'foreign.app_user_id' => 'self.app_user_id' } );


1;


