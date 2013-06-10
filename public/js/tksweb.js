(function($) {

    var TKSWeb = window.TKSWeb = {
        day_name          : [ 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat' ],
        month_name        : [ 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                              'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec' ],
        hour_label_width  : 50,
        hour_label_height : 50,
        day_label_width   : 200,
        day_label_height  : 28
    };
    var week_days, hours;

    function pad2(num) {
        return num < 10 ? '0' + num : '' + num;
    }

    var WeekView = Backbone.View.extend({
        initialize: function(options) {
            var view = this;
            this.el = options.el;
            this.init_week_days(options.monday);
            this.init_hours();
            this.template = Handlebars.compile( $('#week-view-template').html() );
            var context = {
                week_days: week_days,
                hours: hours
            };
            this.el.html( this.template(context) );
            this.size_activities();
            this.resize();
        },
        size_activities: function() {
            this.activities_width  = TKSWeb.day_label_width * 7;
            this.activities_height = TKSWeb.hour_label_height * 24;
            this.$('.activities')
                .width(this.activities_width)
                .height(this.activities_height);
            this.$('.day-labels')
                .width(this.activities_width)
                .height(TKSWeb.day_label_height);
            this.$('.hour-labels')
                .width(TKSWeb.hour_label_width)
                .height(this.activities_height);
        },
        resize: function() {
            var app_width = this.activities_width + TKSWeb.hour_label_width;
            var app_height = this.activities_height + TKSWeb.day_label_height;
            this.el.width( app_width ).height( app_height );
        },
        init_week_days: function(monday) {
            week_days = [];
            var one_day = 24 * 60 * 60 * 1000;
            var ms = (new Date(monday + 'T12:00:00')).getTime();
            for(var i = 0; i < 7; i++) {
                var dt = new Date(ms + i * one_day);
                week_days.push({
                    date: dt.toISOString().substr(0,10),
                    day: pad2( dt.getDate() ),
                    day_name: TKSWeb.day_name[ dt.getDay() ],
                    month: pad2( dt.getMonth() + 1),
                    month_name: TKSWeb.month_name[ dt.getMonth() ],
                    year: dt.getFullYear()
                });
            }
        },
        init_hours: function() {
            hours = [];
            for(var i = 0; i < 24; i++) {
                hours.push({ hour: pad2(i) + ':00' });
            }
        },
        $: function(selector) {
            return this.el.find(selector);
        }
    });

    TKSWeb.show_week = function (el, monday) {
        new WeekView({ el: el, monday: monday });
    };

})(jQuery);
