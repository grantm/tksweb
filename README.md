TKS-Web
=======

A web application for entering simple time-tracking information in a
calendar-style week view.  The data is stored in a database (SQLite by default)
and can be exported in [TKS](https://github.com/shoptime/tks) format.  The
web interface is designed to be used from either a desktop or a mobile
browser.

[<img src="https://github.com/grantm/tksweb/raw/master/screenshots/tks-web-screenshot-small.png">](https://github.com/grantm/tksweb/raw/master/screenshots/tks-web-screenshot.png)

Each activity will have the following attributes

 * start time (date + time)
 * duration (minutes in multiples of 15)
 * work request number
 * activity description
 * backend system identifier

It is assumed that metadata required for billing is stored in the relevant
backend system and referenced by the work request number.

Once activities have been entered into the database they can be exported in
TKS format.

The user interface is implemented in Javascript using
[Backbone](http://backbonejs.org/), [jQuery](http://jquery.com/),
[jQueryUI](http://jqueryui.com/), [Handlebars](http://handlebarsjs.com/) and
[jquery.event.ue](https://github.com/mmikowski/jquery.event.ue) for unified
mouse/touch event handling.

The backend is implemented in Perl using the
[Dancer](http://www.perldancer.org/) framework.

The TKS-Web application itself is copyright (c) 2011-2013 Grant McLean and
released under the [AGPL3](http://opensource.org/licenses/AGPL-3.0) license.
The libraries used are individually licensed.

