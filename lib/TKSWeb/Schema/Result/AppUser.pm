package TKSWeb::Schema::Result::AppUser;

use parent 'DBIx::Class::Core';

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

__PACKAGE__->has_many( activities => 'Activity' => { 'foreign.app_user_id' => 'self.app_user_id' } );
__PACKAGE__->has_many( wr_systems => 'WRSystem' => { 'foreign.app_user_id' => 'self.app_user_id' } );


sub set_or_get_reset_key {
    my $self = shift;

    my $reset_key = $self->reset_key;
    return $reset_key if $reset_key;
    foreach my $i (1 .. 5) {
        $reset_key = $self->_random_hash('RESET', $i);
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
    my $plain_text = join '-', $self->email, rand, time, $$, $self, @_;
    return Digest::MD5::md5_hex($plain_text);
}


1;

