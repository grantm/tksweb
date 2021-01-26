package TKSWeb::Schema::Result::AppUser;

use parent 'DBIx::Class::Core';

use strict;
use warnings;

require Digest::MD5;

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
                        is_nullable   => 1,
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

__PACKAGE__->has_many( activities => 'Activity' => { 'foreign.app_user_id' => 'self.app_user_id' } );
__PACKAGE__->has_many( preferences => 'UserPreference' => { 'foreign.app_user_id' => 'self.app_user_id' } );

__PACKAGE__->has_many( user_wr_systems => 'UserWRSystem' => { 'foreign.app_user_id' => 'self.app_user_id' } );
__PACKAGE__->many_to_many( wr_systems => 'user_wr_systems', 'wr_system' );

sub new {
    my ( $class, $attrs ) = @_;

    $attrs->{api_key} = $class->_random_hash unless defined $attrs->{api_key};

    my $new = $class->next::method($attrs);

    return $new;
}

sub is_ldap_user {
    my $self = shift;

    return defined $self->password ? 0 : 1;
}

sub set_or_get_reset_key {
    my $self = shift;

    my $reset_key = $self->reset_key;
    return $reset_key if $reset_key;
    foreach my $i (1 .. 5) {
        $reset_key = $self->_random_hash('RESET', $i, $self->email);
        eval {
            $self->set_column(reset_key => $reset_key);
            $self->update;
        };
        if(not $@) {
            return $reset_key; # << normal return path
        }
        if("$@" !~ /unique/  and  "$@" !~ /reset_key/) {
            die $@;
        }
    }
    die "unable to generate unique value for reset_key";
}


sub _random_hash {
    my $self = shift;
    my $plain_text = join '-', rand, time, $$, $self, @_;
    return Digest::MD5::md5_hex($plain_text);
}

sub preference {
    my $self = shift;
    my $pref_name = shift;
    
    my $preference = $self->find_related('preferences',
        {
            preference => $pref_name,
        }
    );
    
    if (! $preference) {
        my %defaults = TKSWeb::Schema::Result::UserPreference->preference_defaults;
        return $defaults{$pref_name};
    }
    else {    
        return $preference->value;
    }
}

# Get all the user's preferences as a hash
sub all_preferences {
    my $self = shift;
    
    my %prefs = TKSWeb::Schema::Result::UserPreference->preference_defaults;
    
    foreach my $pref_rec ($self->preferences) {
        $prefs{$pref_rec->preference} = $pref_rec->value; 
    }
    
    return %prefs;    
}

sub set_preference {
    my $self = shift;
    my $preference = shift;
    my $value = shift;
    
    my $pref = $self->find_related('preferences',
        {
            preference => $preference,
        }
    );
    
    if ($pref) {    
        $pref->value($value);
        $pref->update;
    }
    else {
        $self->add_to_preferences(
            {            
                preference => $preference,
                value => $value,
            },            
        );
    }
}


1;

