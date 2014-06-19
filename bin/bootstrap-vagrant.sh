#!/bin/bash

apt-get update
DEBIAN_FRONTEND=noninteractive apt-get -y install liblocal-lib-perl sqlite3 curl postgresql-9.1 libdbix-class-perl libdancer-perl libdbd-pg-perl libdbix-class-schema-loader-perl libhtml-fillinform-perl libdatetime-perl libtemplate-perl libjson-perl libdancer-plugin-dbic-perl libcss-minifier-xs-perl libwww-mechanize-perl libmime-lite-perl libdatetime-format-pg-perl curl

curl -L http://cpanmin.us | perl - App::cpanminus

cpanm --installdeps /vagrant

sudo -u postgres createuser -d --no-password --no-superuser --no-createrole vagrant
sudo -u vagrant createdb tksweb-vagrant
sudo -u vagrant psql -f /vagrant/data/schema-postgres.sql tksweb-vagrant
sudo -u vagrant psql -f /vagrant/data/vagrant_user.sql tksweb-vagrant


