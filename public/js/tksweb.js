/*
 * tksweb - Web UI for timesheet entry
 *
 * Copyright (c) 2011-2013 Grant McLean (grant@mclean.net.nz)
 *
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 *
 */

(function($) {
    'use strict';

    var TKSWeb = window.TKSWeb = {
        day_name          : [ 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun' ],
        month_name        : [ 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                              'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec' ],
        hour_label_width  : 50,
        hour_label_height : 48,
        day_label_width   : 200,
        day_label_height  : 28,
        duration_unit     : 15
    };
    var keyCode = $.ui.keyCode;
    var end_of_day = 24 * 60;
    var wr_systems, week_days, hours, column_for_date;

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

    function add_wr_systems(data) {
        if(!data.wr_system_id) {
            data.wr_system_id = wr_systems[0].wr_system_id;
        }
        if(wr_systems.length > 1) {
            data.wr_systems = [];
            _.each(wr_systems, function(sys) {
                data.wr_systems.push({
                    wr_system_id: sys.wr_system_id,
                    description: sys.description,
                    checked: data.wr_system_id === sys.wr_system_id ? 'checked' : ''
                });
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
        validate: function(attr) {
            if(!column_for_date.hasOwnProperty(attr.date)) {
                return "Invalid date: " + attr.date;
            }
            if(typeof(attr.start_time) !== "number") {
                return "Invalid start time - must be a number";
            }
            if(attr.start_time < 0  ||  attr.start_time >= end_of_day) {
                return "Invalid start time - expected minutes value in range 0-" + end_of_day;
            }
            if(typeof(attr.duration) !== "number") {
                return "Invalid duration - must be a number";
            }
            if(attr.duration < TKSWeb.duration_unit) {
                return "Invalid duration - too short";
            }
            if(attr.duration > this.max_duration()) {
                return "Invalid duration - too long";
            }
            if(!attr.description.match(/\S/)) {
                return "Description field is required";
            }
        },
        select: function() {
            this.trigger('selection_changed', this);
            this.set('selected', true);
        },
        unselect: function() {
            this.set('selected', false);
            this.trigger('clear_selection');
        },
        start_activity_edit: function() {
            this.trigger('start_activity_edit', this.for_edit_dialog());
        },
        for_edit_dialog: function() {
            var data = this.toJSON();
            data.duration = data.duration / 60;
            add_wr_systems(data);
            return data;
        },
        update_from_editor: function(data) {
            var attr_before = this.toJSON();
            this.set('wr_system_id', parseInt(data.wr_system_id, 10));
            this.set('wr_number', data.wr_number);
            this.set('description', data.description);
            this.set('duration', data.duration);
            if(!this.save()) {
                this.set(attr_before);
                return false;
            }
            this.trigger('selection_updated', this);
            return true;
        },
        try_move_to: function(new_date, new_time) {
            var new_end = new_time + this.get("duration");
            var next = this.collection.find_at_or_after_date_time(new_date, new_time, this);
            if(next) {
                if(next.get("start_time") < new_end) {
                    return false;
                }
            }
            if(new_end > end_of_day) {
                return false;
            }
            this.set({date: new_date, start_time: new_time});
            this.save();
            this.trigger('selection_updated', this);
            return true;
        },
        max_duration: function() {
            if(this.collection) {
                return this.collection.max_duration(this.get("date"), this.get("start_time"), this);
            }
            else {
                return this.initial_max_duration;
            }
        }
    });


    var Activities = Backbone.Collection.extend({
        model: Activity,
        url: '/activity',

        initialize: function() {
            this.on("invalid", this.validation_failed);
            this.on("selection_changed", this.selection_changed);
            this.on("clear_selection", this.clear_selection);
        },
        comparator: function(activity) {
            return activity.get("date") + ' ' +
                   ('0000' + activity.get("start_time")).substr(-4);
        },
        validation_failed: function(activity) {
            this.last_validation_error = activity.validationError;
        },
        selection_changed: function(new_selection) {
            if(this.current_activity) {
                this.current_activity.unselect();
            }
            this.current_activity = new_selection;
        },
        clear_selection: function() {
            this.current_activity = null;
        },
        trigger_cursor_move: function(pos) {
            this.trigger('cursor_move', pos);
        },
        find_by_date_time: function(date, time) {
            return this.find(function(activity) {
                if(activity.get("date") !== date) { return false; }
                var start_time = activity.get("start_time");
                var end_time = start_time + activity.get("duration");
                return(start_time <= time && time < end_time);
            });
        },
        find_at_or_after_date_time: function(date, time, except) {
            return this.find(function(activity) {
                if(activity === except) { return false; }
                if(activity.get("date") !== date) { return false; }
                var start_time = activity.get("start_time");
                var end_time = start_time + activity.get("duration");
                if(start_time <= time && time < end_time) {
                    return true;
                }
                return(start_time >= time);
            });
        },
        max_duration: function(date, start_time, except) {
            var next = this.find_at_or_after_date_time(date, start_time, except);
            if(next && next.get("date") === date) {
                return next.get("start_time") - start_time;
            }
            return end_of_day - start_time;
        },
        editor_active: function() {
            return this.editor.active;
        },
        edit_new_activity: function(data) {
            data.duration = data.duration / 60;
            add_wr_systems(data);
            this.new_activity = data;
            this.trigger('start_activity_edit', data);
        },
        save_from_editor: function(data) {
            var activity = this.current_activity;
            data.duration = Math.floor(4 * data.duration) * 15;
            if(!activity) {
                data.date = this.new_activity.date;
                data.start_time = this.new_activity.start_time;
                activity = new Activity(data);
                activity.initial_max_duration = this.cursor.max_duration();
                if(!activity.isValid()) {
                    this.last_validation_error = activity.validationError;
                    return false;
                }
                this.add(activity);
            }
            return activity.update_from_editor(data);
        },
        delete_current_activity: function(data) {
            var activity = this.current_activity;
            if(activity) {
                this.clear_selection();
                activity.destroy();
            }
        },
        create_from_clipboard: function(data) {
            this.create(data);
        }
    });


    var ActivityView = Backbone.View.extend({
        tagName: 'div',
        className: 'activity',

        events: {
            "click": "select_activity"
        },

        initialize: function() {
            this.week_view = this.model.collection.view;
            this.listenTo(this.model, "change:wr_number change:description", this.render);
            this.listenTo(this.model, "change:date change:start_time", this.position_element);
            this.listenTo(this.model, "change:duration", this.size_element);
            this.listenTo(this.model, "change:selected", this.show_selection);
            this.listenTo(this.model, "destroy", this.destroy);
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
                left: column_for_date[ activity.get('date') ] * 200,
                top:  (activity.get('start_time') * TKSWeb.hour_label_height) / 60
            });
        },
        size_element: function() {
            var activity = this.model;
            this.$el.height(activity.get('duration') * TKSWeb.hour_label_height / 60 - 2);
        },
        week_view: function() {
            return this.collection.view;
        },
        select_activity: function() {
            this.model.select();
        },
        show_selection: function() {
            this.$el.toggleClass('selected', this.model.get('selected'));
        },
        destroy: function() {
            this.$el.remove();
        }
    });


    var ActivityCursor = Backbone.View.extend({
        events: {
            "dblclick": "edit_activity"
        },

        initialize: function() {
            var cursor = this;
            this.init_units();
            this.collection.on("selection_changed", this.selection_changed, cursor);
            this.collection.on("selection_updated", this.select_activity_at_cursor, cursor);
            this.$el.parent().mousedown( $.proxy(cursor.activities_mousedown, cursor) );
            $(window).keydown( $.proxy(cursor.key_handler, cursor) );
            this.move_to(0, 8 * this.units_per_hour);
        },
        init_units: function() {
            this.x_scale = TKSWeb.day_label_width;
            this.y_scale = TKSWeb.hour_label_height / (60 / TKSWeb.duration_unit);
            this.units_per_hour = 60 / TKSWeb.duration_unit;
            this.max_x = 6;
            this.max_y = 24 * this.units_per_hour - 1;
            this.$el.width(this.x_scale - 2);
            this.size_cursor(1);
        },
        size_cursor: function(h) {
            this.$el.height((h * this.y_scale) - 2);
        },
        move_to: function(x, y) {
            this.x = x;
            this.y = y;
            this.position_cursor();
            this.select_activity_at_cursor();
        },
        move: function(delta_x, delta_y) {
            var pos = this.relative_position(delta_x, delta_y);
            if(pos) {
                this.move_to(pos.x, pos.y);
            }
        },
        move_activity: function(delta_x, delta_y) {
            var pos = this.relative_position(delta_x, delta_y);
            if(!pos) {
                return;
            }
            var activity = this.collection.current_activity;
            var date = week_days[pos.x].date;
            var time = pos.y * TKSWeb.duration_unit;
            if(activity.try_move_to(date, time)) {
                this.move_to(pos.x, pos.y);
            }
        },
        relative_position: function(delta_x, delta_y) {
            var pos = {};
            pos.x = Math.max(0, Math.min(this.x + delta_x, this.max_x));
            pos.y = Math.max(0, Math.min(this.y + delta_y, this.max_y));
            return pos.x === this.x && pos.y === this.y ? null : pos;
        },
        position_cursor: function() {
            var pos = {
                left: this.x * this.x_scale,
                right: this.x * this.x_scale + this.x_scale,
                top: this.y * this.y_scale,
                bottom: this.y * this.y_scale + this.y_scale
            };
            this.$el.css({ left: pos.left + 'px', top: pos.top + 'px' });
            this.collection.trigger_cursor_move(pos);
        },
        cursor_date: function() {
            return week_days[this.x].date;
        },
        cursor_time: function() {
            return this.y * TKSWeb.duration_unit;
        },
        default_duration: function() {
            return 60;
        },
        select_activity_at_cursor: function() {
            var activity = this.collection.find_by_date_time(this.cursor_date(), this.cursor_time());
            if(activity) {
                activity.select();
            }
            else if(this.collection.current_activity){
                this.collection.current_activity.unselect();
                this.size_cursor(1);
            }
        },
        selection_changed: function(activity) {
            this.x = column_for_date[ activity.get("date") ];
            this.y = activity.get("start_time") / TKSWeb.duration_unit;
            this.position_cursor();
            this.size_cursor( activity.get("duration")  / TKSWeb.duration_unit );
        },
        activities_mousedown: function(e) {
            if(!$(e.target).hasClass('activities')) {
                return;
            }
            e = e.originalEvent;
            var x = (e.layerX || e.offsetX) - TKSWeb.hour_label_width;
            var y = (e.layerY || e.offsetY) - TKSWeb.day_label_height;
            this.move_to(Math.floor(x / this.x_scale), Math.floor(y / this.y_scale));
        },
        key_handler: function(e) {
            if(this.collection.editor_active()) {
                return true;
            }
            var curr = this.collection.current_activity;
            if(!e.shiftKey && !e.ctrlKey) {
                switch(e.keyCode) {
                    case keyCode.LEFT:   this.move(-1,  0);       break;
                    case keyCode.RIGHT:  this.move( 1,  0);       break;
                    case keyCode.UP:     this.move( 0, -1);       break;
                    case keyCode.DOWN:
                        this.move(0, curr ? curr.get("duration") / TKSWeb.duration_unit : 1);
                        break;
                    case keyCode.TAB:    this.select_next_activity();   break;
                    case keyCode.ENTER:  this.edit_activity();    break;
                    case keyCode.DELETE: this.delete_activity();  break;
                    default:
                        return;
                }
            }
            else if(e.shiftKey) {
                switch(e.keyCode) {
                    case keyCode.LEFT:   this.move_activity(-1,  0);    break;
                    case keyCode.RIGHT:  this.move_activity( 1,  0);    break;
                    case keyCode.UP:     this.move_activity( 0, -1);    break;
                    case keyCode.DOWN:   this.move_activity( 0,  1);    break;
                    case keyCode.TAB:    this.select_previous_activity();   break;
                    default:
                        return;
                }
            }
            else if(e.ctrlKey) {
                switch(e.keyCode) {
                    case 67:  // Ctrl-C
                        this.copy_activity();
                        break;
                    case 88:  // Ctrl-X
                        this.copy_activity();
                        this.delete_activity();
                        break;
                    case 86:  // Ctrl-V
                        this.paste_activity();
                        break;
                    default:
                        return;
                }
            }
            e.preventDefault();
        },
        select_next_activity: function() {
            var curr = this.collection.current_activity;
            var next;
            if(curr) {
                next = this.collection.at( this.collection.indexOf(curr) + 1 );
            }
            else {
                next = this.collection.find_at_or_after_date_time(this.cursor_date(), this.cursor_time());
            }
            if(next) {
                next.select();
            }
        },
        select_previous_activity: function() {
            var curr = this.collection.current_activity;
            var prev;
            if(curr) {
                prev = this.collection.at( this.collection.indexOf(curr) - 1 );
            }
            if(prev) {
                prev.select();
            }
        },
        max_duration: function() {
            return this.collection.max_duration(this.cursor_date(), this.cursor_time());
        },
        edit_activity: function() {
            var curr = this.collection.current_activity;
            if(curr) {
                curr.start_activity_edit();
            }
            else {
                this.collection.edit_new_activity({
                    date: this.cursor_date(),
                    start_time: this.cursor_time(),
                    duration: Math.min(this.default_duration(), this.max_duration())
                });
            }
        },
        delete_activity: function() {
            this.collection.delete_current_activity();
            this.size_cursor(1);
        },
        copy_activity: function() {
            var curr = this.collection.current_activity;
            if(curr) {
                this.clipboard = curr.toJSON();
                delete this.clipboard.id;
                delete this.clipboard.selected;
            }
        },
        paste_activity: function() {
            if(this.collection.current_activity) {
                return;
            }
            var data = this.clipboard;
            if(data && data.duration) {
                data.date = this.cursor_date();
                data.start_time = this.cursor_time();
                this.collection.create_from_clipboard(data);
                this.select_activity_at_cursor();
            }
        }
    });


    var ActivityEditor = Backbone.View.extend({
        tagName: 'form',
        className: 'tksweb-activity-dialog',

        events: {
            "submit": "enter_pressed"
        },

        initialize: function() {
            this.create_edit_dialog();
            this.activity_dialog_template = Handlebars.compile( $('#activity-dialog-template').html() );
            this.collection.on('start_activity_edit', this.start_activity_edit, this);
        },
        create_edit_dialog: function() {
            var editor = this;
            this.$el.dialog({
                autoOpen:      false,
                resizable:     false,
                closeOnEscape: true,
                width:         360,
                height:        290,
                modal:         true,
                open:          function() { editor.active = true;  },
                close:         function() { editor.active = false; },
                buttons:       {
                    "Ok":     function() { editor.save_activity(); },
                    "Cancel": function() { editor.close(); }
                }

            });
        },
        open: function() {
            this.$el.dialog("open");
        },
        close: function() {
            this.$el.dialog("close");
        },
        start_activity_edit: function(data) {
            this.$el.html( this.activity_dialog_template(data) );
            this.set_title(data.id ? 'Edit Activity' : 'Add Activity');
            this.set_focus(data.wr_number ? '.activity-dc input' : '.activity-wr input');
            this.open();
        },
        set_title: function(new_title) {
            this.$el.dialog('option', 'title', new_title);
        },
        set_focus: function(selector) {
            this.$(selector).focus();
        },
        enter_pressed: function(e) {
            e.preventDefault();
            this.save_activity();
        },
        save_activity: function() {
            var success = this.collection.save_from_editor({
                wr_system_id  : parseInt(this.$('input[name=wr_system_id]:checked').val(), 10),
                wr_number   : this.$('.activity-wr input').val().trim(),
                duration    : parseFloat(this.$('.activity-hr input').val().trim()),
                description : this.$('.activity-dc input').val().trim()
            });
            if(success) {
                return this.close();
            }
            alert(this.collection.last_validation_error);
        }
    });


    var WeekView = Backbone.View.extend({
        events: {
            "mousewheel .activities": "mousewheel"
        },
        initialize: function(options) {
            var view = this;
            this.monday = options.monday;
            this.last_monday = options.last_monday;
            this.next_monday = options.next_monday;
            this.left = 0;
            this.top = 0;
            this.compile_templates();
            this.render();
            this.collection.on('add', this.add_activity, this);
            this.collection.on("cursor_move", this.scroll_to_show_cursor, this);
            $(window).resize( $.proxy(view.resize, view) );
        },
        compile_templates: function() {
            this.template = Handlebars.compile( $('#week-view-template').html() );
            this.activity_template = Handlebars.compile( $('#activity-template').html() );
        },
        wr_systems_for_exports: function() {
            var period_start = this.monday.replace(/\d\d$/, '01');
            return _.map(wr_systems, function(sys) {
                return {
                    sys_name: sys.name,
                    sys_description: sys.description,
                    period_start: period_start
                }
            });
        },
        render: function() {
            var context = {
                week_days: week_days,
                hours: hours,
                exports_by_sys: this.wr_systems_for_exports(),
                this_monday: this.monday,
                last_monday: this.last_monday,
                next_monday: this.next_monday
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
                distance: 5,
                drag: function(event, ui) { view.drag( ui.position ); }
            });
        },
        resize: function() {
            this.app_width  = Math.min(this.activities_width, window.innerWidth);
            this.app_height = Math.min(this.activities_height, window.innerHeight);
            this.$el.width( this.app_width ).height( this.app_height );
            this.set_drag_constraints();
        },
        set_drag_constraints: function() {
            this.min_y = this.app_height - this.activities_height - TKSWeb.day_label_height;
            this.max_y = 0;
            this.$('.activities').draggable("option", {
                containment: [
                    this.app_width - this.activities_width - TKSWeb.hour_label_width,
                    this.min_y,
                    1,
                    this.max_y + 1
                ]
            });
        },
        drag: function(pos) {
            this.left = pos.left;
            this.top = pos.top;
            this.$('.day-labels ul').css('left', pos.left);
            this.$('.hour-labels ul').css('top', pos.top);
        },
        set_position_top: function(y) {
            this.top = y;
            this.$('.activities').css('top', y);
            this.$('.hour-labels ul').css('top', y);
        },
        set_position_left: function(x) {
            this.left = x;
            this.$('.activities').css('left', x);
            this.$('.day-labels ul').css('left', x);
        },
        set_initial_scroll: function() {
            var day_height = (18 - 8) * TKSWeb.hour_label_height;
            var y = -8 * TKSWeb.hour_label_height;
            if(day_height < this.app_height) {
                y = y + (this.app_height - day_height) / 2
            }
            this.set_position_top(y);
        },
        mousewheel: function(e, delta) {
            var $activities = this.$('.activities');
            var y = parseInt($activities.css('top'), 10) + delta * 12;
            y = Math.min( Math.max(y, this.min_y), this.max_y);
            $activities.css('top', y);
            this.$('.hour-labels ul').css('top', y);
        },
        cursor_el: function() {
            return this.$('.activities .cursor');
        },
        add_activity: function(activity) {
            this.$('.activities').append(
                new ActivityView({
                    model: activity
                }).render().el
            );
        },
        scroll_to_show_cursor: function(cursor) {
            var viewport = {
                top: 0 - this.top,
                bottom: this.app_height - this.top - TKSWeb.day_label_height,
                left: 0 - this.left,
                right: this.app_width - this.left - TKSWeb.hour_label_width
            };
            if(cursor.top < viewport.top) {
                this.set_position_top(0 - cursor.top);
            }
            else if(cursor.bottom > viewport.bottom) {
                this.set_position_top(0 - viewport.top - cursor.bottom + viewport.bottom);
            }
            if(cursor.left < viewport.left) {
                this.set_position_left(0 - cursor.left);
            }
            else if(cursor.right > viewport.right) {
                this.set_position_left(0 - viewport.left - cursor.right + viewport.right);
            }
        }
    });

    TKSWeb.show_week = function (el, dates, wr_sys, activities_data) {
        wr_systems = wr_sys;
        init_week_days(dates.week_dates);
        init_hours();
        var activities = new Activities();
        activities.view = new WeekView({
            el: el,
            monday: dates.week_dates[0],
            last_monday: dates.last_monday,
            next_monday: dates.next_monday,
            collection: activities
        });
        activities.cursor = new ActivityCursor({ collection: activities, el: activities.view.cursor_el() });
        activities.editor = new ActivityEditor({ collection: activities });
        activities.add(activities_data);
    };

})(jQuery);
