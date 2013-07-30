package TKSWeb;

use Dancer ':syntax';
use Dancer::Plugin::DBIC;
use Dancer::Plugin::Passphrase;
use Dancer::Plugin::CDN;

use TKSWeb::Schema;

use DateTime;


our $VERSION = '0.1';

my $time_zone;

sub User      { schema->resultset('AppUser'); }
sub Activity  { schema->resultset('Activity'); }


##################################  Hooks  ###################################

hook before => sub {
    my $path = request->path;
    return if $path =~ m{^/cdn/};
    var title => setting('appname');
    if( my $user = user_by_email( session('email') ) ) {
        var user => $user;
        return;
    }
    if( request->method eq 'POST'  and  my $api_user = user_by_api_key() ) {
        var user => $api_user;
        return;
    }
    if( $path =~ m{^/export/} ) {
        status 401;
        halt "Unauthorized";
    }
    if( $path !~ m{^/(login|logout)$} ) {
        session original_url => $path;
        return redirect '/login';
    }
};


hook before_template_render => sub {
    my $tokens = shift;

    my $vars = vars;
    $tokens->{user}  = $vars->{user};
    $tokens->{alert} = $vars->{alert};
    $tokens->{'cdn_url'}    = \&cdn_url;
    $tokens->{'title'}      = \&get_title;
    $tokens->{'set_title'}  = \&set_title;
    add_debug_key($tokens);
};


################################  Helpers  ###################################

sub alert {
    my($message) = @_;
    var alert => $message;
}


sub get_title {
    my($message) = @_;
    return var 'title';
}


sub set_title {
    my($new_title) = @_;
    var title => $new_title;
}


################################  Routes  ####################################

get '/login' => sub {
    template 'login';
};


post '/login' => sub {
    my $user = get_user_from_login( param('email'), param('password') );
    if( $user ) {
        session email => $user->email;
        if( my $url = session('original_url') ) {
            session original_url => undef;
            return redirect $url;
        }
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


get '/server-time' => sub {
    content_type 'text/plain';
    return '' . _now();
};


get qr{^/week/?(?<date>\d\d\d\d-\d\d-\d\d)[.]json$} => sub {
    my $monday = monday_of_week( captures->{date} );
    return to_json({
        dates       => dates_for_weekview($monday),
        activities  => activities_for_week($monday),
    });
};


get qr{^/week/?(?<date>.*)$} => sub {
    my $date = captures->{date} // '';
    my $monday = monday_of_week( $date );
    return redirect "/week/$monday" if $date ne $monday;
    my $dates = dates_for_weekview($monday);
    template 'week-view', {
        week_dates  => $dates->{week_dates},
        dates       => to_json( $dates ),
        wr_systems  => to_json( wr_system_list() ),
        activities  => to_json( activities_for_week($monday) ),
    };
};


post '/activity' => sub {
    my $new = from_json( request->body );
    my $start_date_time = combine_date_time($new->{date}, $new->{start_time});
    my $activity = Activity->new({
        app_user_id   => var('user')->id,
        date_time     => $start_date_time,
        duration      => $new->{duration},
        wr_system_id  => $new->{wr_system_id},
        wr_number     => $new->{wr_number},
        description   => $new->{description},
    });
    $activity->insert;
    return to_json({ id => $activity->id, sync_id => $new->{sync_id} });
};


put '/activity/:id' => sub {
    my $activity = activity_by_id( param('id') )
        or return status "not_found";
    my $new = from_json( request->body );
    my $start_date_time = combine_date_time($new->{date}, $new->{start_time});
    $activity->date_time($start_date_time);
    $activity->duration($new->{duration});
    $activity->wr_system_id($new->{wr_system_id});
    $activity->wr_number($new->{wr_number});
    $activity->description($new->{description});
    $activity->update;
    return to_json({ id => $activity->id, sync_id => $new->{sync_id} });
};


del '/activity/:id' => sub {
    my $activity = activity_by_id( param('id') )
        or return status "not_found";
    $activity->delete;
    return to_json({status => 'deleted'});
};


any ['get', 'post'] =>
    qr{^/export/(?<sys_name>\w+)/(?<date>\d\d\d\d-\d\d-\d\d)[.]tks$} => sub {
    my $sys_name  = captures->{sys_name};
    my $date      = captures->{date};
    my $filename  = substr($date, 7) . '-' . $sys_name . '.tks';
    my $period_detail = activities_for_month_by_day($sys_name, $date)
        or return status "not_found";
    content_type 'text/plain';
    header 'Content-disposition' => qq{attachment; filename="$filename"};
    template "export-tks", $period_detail, { layout => undef };
};


############################  Support Routines  ##############################


sub _now {
    $time_zone //= config->{timezone} || 'Pacific/Auckland';
    return DateTime->now(time_zone => $time_zone);
}


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


sub user_by_api_key {
    my $api_key = param('api-key') or return;
    return User->search({
        api_key   => lc( $api_key ),
        status  => 'active',
    })->first;
}


sub monday_of_week {
    my $dt = parse_date(shift) || _now();
    my $dow = $dt->dow;
    $dt->add( days => -1 * $dow + 1 ) if $dow != 1;
    return $dt->ymd;
}


sub dates_for_weekview {
    my $monday = parse_date(shift) or die "Date needed";
    return {
        next_monday => $monday->clone->add(days => 7)->ymd,
        last_monday => $monday->clone->add(days => -7)->ymd,
        week_dates  => [
            map { { ymd => $_->ymd, fmt => $_->strftime('%a %b-%d') } }
                map { $monday->clone->add(days => $_) }
                    0..6
        ]
    };
}


sub wr_system_list {
    my @wr_systems;
    my $user = var 'user';
    my $rs = $user->wr_systems->search(
        {},
        {
            order_by => 'wr_system_id'
        }
    );
    while(my $wr_system = $rs->next) {
        my %sys = $wr_system->get_columns;
        delete $sys{app_user_id};
        push @wr_systems, \%sys;
    }
    return \@wr_systems;
}


sub wr_system_by_name {
    my $system_name = shift or return;
    my $user = var 'user';
    return $user->wr_systems->search({
        name => $system_name,
    })->first;
}


sub activities_for_week {
    my $monday = parse_date(shift);
    my $start_date = $monday->ymd . ' 00:00:00';
    my $end_date   = $monday->add(days => 7)->ymd . ' 00:00:00';
    my @activities;
    my $user = var 'user';
    my $rs = $user->activities->search(
        {
            date_time => {
              -between => [ $start_date, $end_date ],
            },
        },
        {
            order_by => 'date_time'
        }
    );
    while(my $activity = $rs->next) {
        my %act = $activity->get_columns;
        delete $act{app_user_id};
        $act{id} = delete $act{activity_id};
        my($date, $hours, $minutes)
            = (delete $act{date_time}) =~ m{(\d\d\d\d-\d\d-\d\d) (\d\d):(\d\d)};
        $act{date} = $date;
        $act{start_time} = $hours * 60 + $minutes;
        push @activities, \%act;
    }
    return \@activities;
}


sub activities_for_month_by_day {
    my $wr_system = wr_system_by_name(shift) or return;
    my $date = parse_date(shift) or return;
    my $period_start = $date->set_day(1)->ymd . ' 00:00:00';
    my $period_end   = $date->add(months => 1)->ymd . ' 00:00:00';
    my %days;
    my $user = var 'user';
    my $rs = $user->activities->search(
        {
            date_time => {
              -between => [ $period_start, $period_end ],
            },
            wr_system_id => $wr_system->id,
        },
        {
            order_by => 'date_time'
        }
    );
    while(my $activity = $rs->next) {
        my $date = do {
            $activity->date_time =~ m{\A(\d\d\d\d)-(\d\d)-(\d\d) }
                and DateTime->new( year => $1, month => $2, day => $3 );
        };
        my $ymd = $date->ymd;
        $days{$date} ||= {
            date        => $ymd,
            dow         => $date->day_name,
            activities  => [],
        };
        my $detail = {
            wr_number   => $activity->wr_number,
            duration    => $activity->duration / 60,
            description => $activity->description,
        };
        push @{ $days{$date}->{activities} }, $detail;
    }
    return {
        month_start => $period_start,
        wr_system   => $wr_system->description,
        days        => [ map { $days{$_} } sort keys %days ],
    };
}


sub parse_date {
    my $date = shift or return;
    return eval {
        $date =~ m{\A(\d\d\d\d)-(\d\d)-(\d\d)\z}
            and DateTime->new( year => $1, month => $2, day => $3 );
    };
}


sub activity_by_id {
    my $id = shift or return;
    return Activity->find({
        activity_id => $id,
        app_user_id => var('user')->id,
    });
}


sub combine_date_time {
    my($date, $minutes) = @_;

    my $hours = int( $minutes / 60 );
    $minutes  = $minutes % 60;
    return sprintf('%s %02u:%02u:00', $date, $hours, $minutes);
}


sub add_debug_key {
    my($tokens) = @_;

    if(my $network = config->{debug_match}) {
        return unless request->address =~ m{$network};
    }
    my $key = config->{debug_key} or return;
    $tokens->{debug_key} = $key;
}


1;

