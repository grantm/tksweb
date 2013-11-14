package TKSWeb::Schema::Result::UserPreference;

use parent 'DBIx::Class::Core';

use strict;
use warnings;

__PACKAGE__->table('user_preference');
__PACKAGE__->add_columns(
    preference_id  => {
                        data_type     => 'integer',
                        is_nullable   => 0,
                    },    
    app_user_id    => {
                        data_type     => 'integer',
                        is_nullable   => 0,
                    },
    preference  => {
                        data_type     => 'text',
                        is_nullable   => 0,
                    },                    
    value  => {
                        data_type     => 'text',
                        is_nullable   => 0,
                    },
);

__PACKAGE__->set_primary_key('preference_id');

my %DEFAULTS = (
    'interval_size' => 15,
);

# Class method to get default preferences
sub preference_defaults {
    return %DEFAULTS;
}

1;