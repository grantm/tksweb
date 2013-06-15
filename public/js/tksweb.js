(function($) {
    'use strict';

    var TKSWeb = window.TKSWeb = {
        day_name          : [ 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun' ],
        month_name        : [ 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                              'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec' ],
        hour_label_width  : 50,
        hour_label_height : 50,
        day_label_width   : 200,
        day_label_height  : 28
    };
    var week_days, hours, column_for_date;

    function init_hours() {
        hours = [];
        for(var i = 0; i < 24; i++) {
            hours.push({ hour: pad2(i) + ':00' });
        }
    }

    function init_week_days(days) {
        week_days = [];
        column_for_date = {};
        for(var i = 0; i < 7; i++) {
            var ymd = days[i];
            week_days.push({
                date: ymd,
                day: ymd.substr(8, 2),
                month: ymd.substr(5, 2),
                year: ymd.substr(0, 4),
                day_name: TKSWeb.day_name[ i ],
                month_name: TKSWeb.month_name[ parseInt(ymd.substr(5, 2), 10) ],
            });
            column_for_date[ymd] = i;
        }
    };

    function pad2(num) {
        return num < 10 ? '0' + num : '' + num;
    }


    var Activity = Backbone.Model.extend({
        defaults: {
            date          : '',
            start_time    : 0,
            duration      : 60,
            wr_number     : '',
            description   : ''
        },
        initialize: function() {
            this.set('column', column_for_date[ this.get('date') ]);
        }
    });


    var Activities = Backbone.Collection.extend({
        model: Activity,
        url: '/activity'
    });


    var ActivityView = Backbone.View.extend({
        tagName: 'div',
        className: 'activity',

        initialize: function() {
            this.week_view = this.model.collection.view;
            this.listenTo(this.model, "change:wr_number change:description", this.render);
            this.position_element();
            this.size_element();
        },

        render: function() {
            var context = this.model.toJSON();
            this.$el.html( this.week_view.activity_template(context) );
            return this;
        },
        position_element: function() {
            var activity = this.model;
            this.$el.css({
                left: activity.get('column') * 200,
                top:  (activity.get('start_time') * 50) / 60
            });
        },
        size_element: function() {
            var activity = this.model;
            this.$el.height(activity.get('duration') * 50 / 60);
        }
    });


    var WeekView = Backbone.View.extend({
        initialize: function(options) {
            var view = this;
            this.compile_templates();
            this.render();
            this.collection.on('add', this.add_activity, this);
            $(window).resize( $.proxy(view.resize, view) );
        },
        compile_templates: function() {
            this.template = Handlebars.compile( $('#week-view-template').html() );
            this.activity_template = Handlebars.compile( $('#activity-template').html() );
        },
        render: function() {
            var context = {
                week_days: week_days,
                hours: hours
            };
            this.$el.html( this.template(context) );
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
        add_activity: function(activity) {
            this.$('.activities').append(
                new ActivityView({
                    model: activity
                }).render().el
            );
        }
    });

    TKSWeb.show_week = function (el, days, activities_data) {
        init_week_days(days);
        init_hours();
        var activities = new Activities();
        activities.view = new WeekView({
            el: el,
            monday: days[0],
            collection: activities
        });
        activities.add(activities_data);
    };

})(jQuery);
