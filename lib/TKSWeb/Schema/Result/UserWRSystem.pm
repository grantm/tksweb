package TKSWeb::Schema::Result::UserWRSystem;

use parent 'DBIx::Class::Core';

use strict;
use warnings;

__PACKAGE__->table('user_wr_system');
__PACKAGE__->add_columns(
    wr_system_id => {
                        data_type     => 'integer',
                        is_nullable   => 0,
                    },
    app_user_id => {
                        data_type     => 'integer',
                        is_nullable   => 0,
                    },

);

__PACKAGE__->set_primary_key(qw/wr_system_id app_user_id/);

__PACKAGE__->belongs_to( app_user  => AppUser  => { 'foreign.app_user_id'  => 'self.app_user_id' } );
__PACKAGE__->belongs_to( wr_system => WRSystem => { 'foreign.wr_system_id' => 'self.wr_system_id' } );


1;


