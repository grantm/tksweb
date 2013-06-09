package TKSWeb;

use Dancer ':syntax';

our $VERSION = '0.1';


get '/' => sub {
    template 'week-view', {};
};

1;
