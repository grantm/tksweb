(function($) {
    'use strict';

    var TKSWeb = window.TKSWeb = {
        day_name          : [ 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun' ],
        month_name        : [ 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                              'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec' ],
        hour_label_width  : 50,
        hour_label_height : 48,
        day_label_width   : 200,
        day_label_height  : 28
    };
    var week_days, hours, column_for_date;

    function init_hours() {
        hours = [ '' ];
        for(var i = 1; i < 24; i++) {
            hours.push({ hour: pad2(i) + ':00' });
        }
    }

    function init_week_days(days) {
        column_for_date = {};
        week_days       = [];
        for(var i = 0; i < 7; i++) {
            column_for_date[ days[i] ] = i;
            var part = days[i].split('-');
            week_days.push({
                date      : days[i],
                day       : part[2],
                month     : part[1],
                year      : part[0],
                day_name  : TKSWeb.day_name[ i ],
                month_name: TKSWeb.month_name[ parseInt(part[1], 10) - 1 ],
            });
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
        url: '/activity',
        comparator: function(activity) {
            return activity.get("date") + ' ' +
                   ('0000' + activity.get("start_time")).substr(-4);
        }
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
                top:  (activity.get('start_time') * TKSWeb.hour_label_height) / 60
            });
        },
        size_element: function() {
            var activity = this.model;
            this.$el.height(activity.get('duration') * TKSWeb.hour_label_height / 60);
        }
    });


    var WeekView = Backbone.View.extend({
        events: {
            "mousewheel .activities": "mousewheel"
        },
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
            this.set_initial_scroll();
        },
        size_activities: function() {
            this.activities_width  = TKSWeb.day_label_width * 7;
            this.activities_height = TKSWeb.hour_label_height * 24;
            this.$('.activities')
                .width(this.activities_width)
                .height(this.activities_height);
            this.$('.day-labels')
                .width(this.activities_width);
            this.$('.hour-labels')
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
            this.min_y = this.app_height - this.activities_height;
            this.max_y = TKSWeb.day_label_height + 1;
            this.$('.activities').draggable("option", {
                containment: [
                    this.app_width - this.activities_width,
                    this.min_y,
                    TKSWeb.hour_label_width + 1,
                    this.max_y
                ]
            });
        },
        drag: function(pos) {
            this.$('.day-labels ul').css('left', pos.left - TKSWeb.hour_label_width);
            this.$('.hour-labels ul').css('top', pos.top - TKSWeb.day_label_height);
        },
        set_initial_scroll: function() {
            var $activities = this.$('.activities');
            var day_height = (18 - 8) * TKSWeb.hour_label_height;
            var y = -8 * TKSWeb.hour_label_height;
            if(day_height < this.app_height) {
                y = y + (this.app_height - day_height) / 2
            }
            $activities.css('top', y);
            this.$('.hour-labels ul').css('top', y - TKSWeb.day_label_height);
        },
        mousewheel: function(e, delta) {
            var $activities = this.$('.activities');
            var y = parseInt($activities.css('top'), 10) + delta * 12;
            y = Math.min( Math.max(y, this.min_y), this.max_y);
            $activities.css('top', y);
            this.$('.hour-labels ul').css('top', y - TKSWeb.day_label_height);
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
