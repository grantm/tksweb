package TKSWeb;

use Dancer ':syntax';
use Dancer::Plugin::DBIC;
use Dancer::Plugin::Passphrase;

use TKSWeb::Schema;

our $VERSION = '0.1';


sub User { schema->resultset('AppUser'); }


##################################  Hooks  ###################################

hook before => sub {
    if( my $user = user_by_email( session('email') ) ) {
        var user => $user;
        return;
    }
    if( request->path !~ m{^/(login|logout)$} ) {
        return redirect "/login";
    }
};


hook before_template_render => sub {
    my $tokens = shift;

    my $vars = vars;
    $tokens->{user}  = $vars->{user};
    $tokens->{alert} = $vars->{alert};
};


################################  Helpers  ###################################

sub alert {
    my($message) = @_;
    var alert => $message;
}


################################  Routes  ####################################

get '/login' => sub {
    template 'login';
};


post '/login' => sub {
    my $user = get_user_from_login( param('email'), param('password') );
    if( $user ) {
        session email => $user->email;
        return redirect '/';
    }
    alert 'Invalid username or password';
    template 'login', { email => param('email') };
};


get '/logout' => sub {
    session->destroy;
    return redirect "/login";
};


get '/' => sub {
    template 'week-view';
};


sub get_user_from_login {
    my($email, $password) = @_;

    return unless $email;
    my $user = user_by_email( $email );
    if( $user  and  passphrase($password)->matches($user->password) ) {
        return $user;
    }
    return;
}


sub user_by_email {
    my $email = shift or return;
    return User->search({
        email   => lc( $email ),
        status  => 'active',
    })->first;
}


1;
