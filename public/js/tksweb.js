(function($) {
    'use strict';

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


    var Activity = Backbone.Model.extend({
        defaults: {
            date          : '',
            start_time    : '',
            duration      : '',
            wr_number     : '',
            description   : ''
        }
    });


    var Activities = Backbone.Collection.extend({
        model: Activity,
        url: '/activity'
    });


    var WeekView = Backbone.View.extend({
        initialize: function(options) {
            var view = this;
            this.init_label_data(options.monday);
            this.render();
            this.collection.on('add', this.add_activity, this);
            $(window).resize( $.proxy(view.resize, view) );
        },
        init_label_data: function(monday) {
            this.init_week_days(monday);
            this.init_hours();
        },
        render: function() {
            var template = Handlebars.compile( $('#week-view-template').html() );
            var context = {
                week_days: week_days,
                hours: hours
            };
            this.$el.html( template(context) );
            this.size_activities();
            this.enable_workspace_drag();
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
        enable_workspace_drag: function() {
            var view = this;
            this.$('.activities').draggable({
                drag: function(event, ui) { view.drag( ui.position ); }
            });
        },
        resize: function() {
            this.app_width  = Math.min(this.activities_width + TKSWeb.hour_label_width, window.innerWidth);
            this.app_height = Math.min(this.activities_height + TKSWeb.day_label_height, window.innerHeight);
            this.$el.width( this.app_width ).height( this.app_height );
            this.set_drag_constraints();
        },
        set_drag_constraints: function() {
            this.$('.activities').draggable("option", {
                containment: [
                    this.app_width - this.activities_width,
                    this.app_height - this.activities_height,
                    TKSWeb.hour_label_width + 1,
                    TKSWeb.day_label_height + 1
                ]
            });
        },
        drag: function(pos) {
            this.$('.day-labels ul').css({left: pos.left - TKSWeb.hour_label_width});
            this.$('.hour-labels ul').css({top: pos.top - TKSWeb.day_label_height});
        },
        init_week_days: function(monday) {
            week_days = [];
            var one_day = 24 * 60 * 60 * 1000;
            var ms = (new Date(monday + 'T12:00:00Z')).getTime();
            for(var i = 0; i < 7; i++) {
                var dt = new Date(ms + i * one_day);
                week_days.push({
                    date: dt.toISOString().substr(0,10),
                    day: pad2( dt.getUTCDate() ),
                    day_name: TKSWeb.day_name[ dt.getUTCDay() ],
                    month: pad2( dt.getUTCMonth() + 1),
                    month_name: TKSWeb.month_name[ dt.getUTCMonth() ],
                    year: dt.getUTCFullYear()
                });
            }
        },
        init_hours: function() {
            hours = [];
            for(var i = 0; i < 24; i++) {
                hours.push({ hour: pad2(i) + ':00' });
            }
        },
        add_activity: function() {
console.log("Adding an activity", arguments);
        }
    });

    TKSWeb.show_week = function (el, monday, activities_data) {
        var activities = new Activities();
        new WeekView({
            el: el,
            monday: monday,
            collection: activities
        });
        activities.add(activities_data);
    };

})(jQuery);
