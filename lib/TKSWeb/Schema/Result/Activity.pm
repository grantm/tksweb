package TKSWeb::Schema::Result::Activity;

use parent 'DBIx::Class::Core';

__PACKAGE__->table('activity');
__PACKAGE__->add_columns(
    activity_id  => {
                        data_type     => 'text',
                        is_nullable   => 0,
                    },
    app_user_id  => {
                        data_type     => 'integer',
                        is_nullable   => 0,
                    },
    date_time    => {
                        data_type     => 'datetime',
                        is_nullable   => 0,
                    },
    duration     => {
                        data_type     => 'integer',
                        is_nullable   => 0,
                    },
    wr_system_id => {
                        data_type     => 'integer',
                        is_nullable   => 0,
                    },
    wr_number    => {
                        data_type     => 'text',
                        is_nullable   => 0,
                    },
    description  => {
                        data_type     => 'text',
                        is_nullable   => 0,
                    },
);

__PACKAGE__->set_primary_key('activity_id');

__PACKAGE__->belongs_to( app_user => AppUser => { 'foreign.app_user_id' => 'self.app_user_id' } );

1;


