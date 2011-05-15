use strict;
use warnings;
use ExtUtils::MakeMaker;

WriteMakefile(
    NAME                => 'tksweb',
    AUTHOR              => q{Grant McLean <grant@catalyst.net.nz>},
    VERSION_FROM        => 'lib/TKS/Web.pm',
    ABSTRACT            => 'Web front-end',
    LICENSE             => 'perl',
    PL_FILES            => {},
    PREREQ_PM => {
        'Test::More' => 0,
        'YAML'       => 0,
        'Dancer'     => 1.3014,
    },
    dist                => { COMPRESS => 'gzip -9f', SUFFIX => 'gz', },
    clean               => { FILES => 'tksweb-*' },
);
