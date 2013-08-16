requires 'JSON';
requires 'Template';
requires 'DateTime';
requires 'DBIx::Class';
requires 'DBIx::Class::Schema::Loader';
requires 'DateTime::Format::SQLite';
requires 'Dancer';
requires 'Dancer::Plugin::DBIC';
requires 'Dancer::Plugin::Passphrase', '<= 1.00';
requires 'Dancer::Plugin::CDN';
requires 'CSS::Minifier::XS';
requires 'JavaScript::Minifier::XS';
requires 'MIME::Lite';

recommends 'Starman';

on 'test' => sub {
  requires 'Test::More', '>= 0.88';
  requires 'Test::WWW::Mechanize::Dancer';
};
