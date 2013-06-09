package TKSWeb;

use Dancer ':syntax';
use TKSWeb::Helpers;

our $VERSION = '0.1';


get '/' => sub {
    js_file "js/lazyload-min.js";
    js_file "js/tks-web.js";
    template 'index', {};
};

1;
