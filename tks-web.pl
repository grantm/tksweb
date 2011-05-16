#!/usr/bin/perl

use strict;
use warnings;

use TKS::Timesheet  qw();
use File::Slurp     qw(read_file);
use Date::Calc      qw(Day_of_Week Add_Delta_Days);
use JSON::XS;
use Data::Dumper;

my $data_dir = -d './tks-data/.' ? './tks-data' : '$ENV{HOME}/tks';

print entries_for_week('2011-04-04');

exit;


sub entries_for_week {
    my($date) = @_;

    my $dates     = dates_for_week($date);
    my $data      = read_tks_files($dates->[0], $dates->[6]);
    my $range     = TKS::Date->new("$dates->[0]..$dates->[6]");
    my $timesheet = TKS::Timesheet->from_string($data, 1)->filter_date($range);

    my @entries = map {
        {
            date        => $_->date,
            wr_number   => $_->request,
            start       => $_->start,
            hours       => $_->time,
            description => $_->comment,
        }
    } $timesheet->entries;

    my $week = {
        dates      => $dates,
        activities => \@entries,
    };
    return JSON::XS->new->pretty->encode($week);
}


sub dates_for_week {
    my($date) = @_;
    my @ymd   = split /-/, $date;
    my $dow   = Day_of_Week(@ymd);
    @ymd      = Add_Delta_Days(@ymd, (($dow + 6) % 7) * -1) if $dow != 1;
    my @week  = ( sprintf('%04u-%02u-%02u', @ymd) );
    foreach (1..6) {
        @ymd = Add_Delta_Days(@ymd, 1);
        push @week, sprintf('%04u-%02u-%02u', @ymd);
    }
    return \@week;
}


sub read_tks_files {
    my($week_start, $week_end) = @_;
    my($month_start) = $week_start =~ /^(\d\d\d\d-\d\d)/;
    my($month_end)   = $week_end   =~ /^(\d\d\d\d-\d\d)/;
    my $data = '';
    if(-r "$data_dir/$month_start.tks") {
        $data .= read_file("$data_dir/$month_start.tks")
    }
    if($month_start ne $month_end) {
        if(-r "$data_dir/$month_end.tks") {
            $data .= read_file("$data_dir/$month_end.tks")
        }
    }
    return $data;
}

