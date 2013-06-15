package TKSWeb;

use Dancer ':syntax';
use Dancer::Plugin::DBIC;
use Dancer::Plugin::Passphrase;
use Dancer::Plugin::CDN;

use TKSWeb::Schema;

use DateTime;


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
    $tokens->{'cdn_url'}  = \&cdn_url;
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
    my $monday = monday_of_week();
    return redirect "/week/$monday";
};


get qr{^/week/?(?<date>.*)$} => sub {
    my $date = captures->{date} // '';
    my $monday = monday_of_week( $date );
    return redirect "/week/$monday" if $date ne $monday;
    template 'week-view', {
        days        => to_json( days_of_week($monday) ),
    };
};


############################  Support Routines  ##############################


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


sub monday_of_week {
    my $dt = parse_date(shift) || DateTime->now;
    my $dow = $dt->dow;
    $dt->add( days => -1 * $dow + 1 ) if $dow != 1;
    return $dt->ymd;
}


sub days_of_week {
    my $dt = parse_date(shift) or return;
    my @days;
    foreach (1..7) {
        push @days, $dt->ymd;
        $dt->add(days => 1);
    }
    return \@days;
}


sub parse_date {
    my $date = shift or return;
    return eval {
        $date =~ m{\A(\d\d\d\d)-(\d\d)-(\d\d)\z}
            and DateTime->new( year => $1, month => $2, day => $3 );
    };
}

1;

