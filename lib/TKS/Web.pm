package TKS::Web;

use Dancer ':syntax';
use TKS::Web::Helpers;

our $VERSION = '0.1';


get '/' => sub {
    js_file "js/lazyload-min.js";
    template 'index', {};
};


get '/dancer' => sub {
    template 'dancer', {}, { layout => 'dancer' };
};

1;
