package TKSWeb;

use Dancer ':syntax';
use TKSWeb::Helpers;

our $VERSION = '0.1';


get '/' => sub {
    template 'week-view', {};
};

1;
