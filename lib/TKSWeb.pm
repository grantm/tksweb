package TKSWeb;

use Dancer ':syntax';
use Dancer::Plugin::DBIC;

use TKSWeb::Schema;

our $VERSION = '0.1';


sub User { schema->resultset('AppUser'); }


get '/' => sub {
    my $user = user_by_email('grant@mclean.net.nz');
    template 'week-view', { user => $user->full_name };
};


sub user_by_email {
    my($email) = @_;
    return User->search({
        email   => lc( $email ),
        status  => 'active',
    })->first;
}


1;
