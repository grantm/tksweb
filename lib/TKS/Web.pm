package TKS::Web;

use Dancer ':syntax';

our $VERSION = '0.1';

get '/dancer' => sub {
    template 'dancer';
};

true;
