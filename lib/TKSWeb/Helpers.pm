package TKSWeb::Helpers;

use Dancer ':syntax';

use Exporter qw(import);

our @EXPORT = qw( &js_file );


before sub {
    var js_files => [];
};


before_template sub {
    my $tokens = shift;
    $tokens->{js_files} = var 'js_files';
};


sub js_file {
    my $js = var 'js_files';
    push @$js, @_;
}

1;
