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
        units_per_hour: 4
    };
    var dim = {};
    var keyCode = $.ui.keyCode;
    var end_of_day = 24 * 60;
    var wr_systems, wr_system_by_id, week_dates, column_for_date;

    var unsaved_edits_message =
        "Warning: Some updates have not been saved.\n" +
        "Press OK to discard changes,\n" +
        "or Cancel if you want to try a manual sync.";

    function init_wr_systems(wr_sys) {
        wr_systems = wr_sys;
        wr_system_by_id = {};
        _.each(wr_systems, function(sys) {
            wr_system_by_id[ sys.wr_system_id ] = sys;
        });
    };

    function init_week_dates(dates) {
        week_dates = dates;
        column_for_date = {};
        for(var i = 0; i < 7; i++) {
            column_for_date[ dates[i].ymd ] = i;
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
            sync_id       : 0,
            date          : '',
            start_time    : 0,
            duration      : 60,
            wr_number     : '',
            description   : ''
        },
        initialize: function() {
            _.bindAll(this, 'run_deferred_save');
            this.on("change", this.set_dirty);
            this.on("sync", this.clear_dirty);
        },
        set_dirty: function(){
            // Stored directly in attributes so that a) it doesn't trigger 'change'
            // event and b) so it does get sent to the server
            this.attributes.sync_id++;
        },
        clear_dirty: function(model, resp){
            if((resp.sync_id === 0) || (resp.sync_id === this.attributes.sync_id)) {
                this.attributes.sync_id = 0;
            }
        },
        is_dirty: function(){
            return this.attributes.sync_id > 0;
        },
        deferred_save: function() {
            if(this.current_deferred_save) {
                clearTimeout( this.current_deferred_save );
            }
            this.current_deferred_save = setTimeout(this.run_deferred_save, 3000);
        },
        run_deferred_save: function() {
            delete this.current_deferred_save;
            if( this.is_dirty() ) {
                this.save();
            }
        },
        for_template: function() {
            var attr = this.toJSON();
            attr.request_url = this.request_url();
            return attr;
        },
        request_url: function() {
            var sys = wr_system_by_id[ this.get("wr_system_id") ] || {};
            if(sys.request_url && sys.request_url.length > 0) {
                if( sys.request_url.match(/%s/) ) {
                    return sys.request_url.replace(/%s/, this.get("wr_number"));
                }
                else {
                    return sys.request_url + this.get("wr_number");
                }
            }
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
            if(attr.duration < dim.duration_unit) {
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
            this.selected = true;
            this.trigger('selection_changed', this);
        },
        unselect: function() {
            this.selected = false;
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
            this.deferred_save();
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
        trigger_view_replaced: function(pos) {
            this.trigger('view_replaced');
        },
        sync_now: function() {
            _.each(this.dirty_models(), function(act) { act.save(); });
        },
        dirty_models: function() {
            return this.filter(function(act) { return act.is_dirty() });
        },
        edits_are_unsaved: function() {
            return this.dirty_models().length > 0;
        },
        select_next_activity: function(cursor_date, cursor_time) {
            var next = this.current_activity
                     ? this.at( this.indexOf(this.current_activity) + 1 )
                     : this.find_at_or_after_date_time(cursor_date, cursor_time);
            if(next) {
                next.select();
            }
        },
        select_previous_activity: function(cursor_date, cursor_time) {
            var prev = this.current_activity
                     ? this.at( this.indexOf(this.current_activity) - 1 )
                     : null;
            if(prev) {
                prev.select();
            }
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
                activity.unselect();
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
            "utap": "select_activity",
            "uheld.uheld": "select_activity"
        },

        initialize: function() {
            this.week_view = this.model.collection.view;
            this.listenTo(this.model, "change:wr_number change:description", this.render);
            this.listenTo(this.model, "change:date change:start_time", this.position_element);
            this.listenTo(this.model, "change:duration", this.size_element);
            this.listenTo(this.model, "change:wr_number change:wr_system_id", this.apply_colour);
            this.listenTo(this.model, "change sync", this.show_dirty);
            this.listenTo(this.model, "selection_changed clear_selection", this.show_selection);
            this.listenTo(this.model, "remove", this.remove, this);
            this.listenTo(this.model, "destroy", this.destroy);
            this.position_element();
            this.size_element();
            this.apply_colour();
        },

        render: function() {
            var context = this.model.for_template();
            this.$el.html( this.week_view.activity_template(context) );
            if( this.el.parentNode ) {  // content has no height until added to DOM
                this.check_overflow();
            }
            return this;
        },
        position_element: function() {
            var activity = this.model;
            this.$el.css({
                left: column_for_date[ activity.get('date') ] * dim.column_width,
                top:  (activity.get('start_time') * dim.hour_height) / 60
            });
        },
        size_element: function() {
            var activity = this.model;
            this.$el.height(activity.get('duration') * dim.hour_height / 60 - 2);
        },
        check_overflow: function() {
            var $p = this.$('p');
            if( this.$el.innerHeight() < $p.outerHeight() ) {
                $p.attr( 'title', this.model.get("description") );
            }
        },
        week_view: function() {
            return this.collection.view;
        },
        select_activity: function() {
            this.model.select();
        },
        show_dirty: function() {
            this.$el.toggleClass('dirty', this.model.is_dirty());
        },
        apply_colour: function() {
            var view = this;
            var activity = this.model;
            if( !activity.get("wr_number").match(/^\d+$/) ) {
                return this.$el.addClass('no-wr');
            }
            this.$el.removeClass('no-wr');
            _.each(wr_systems, function(sys) {
                var match = (sys.wr_system_id === activity.get("wr_system_id"));
                view.$el.toggleClass('cc' + sys.colour_code, match);
            });
        },
        show_selection: function() {
            this.$el.toggleClass('selected', this.model.selected);
        },
        remove: function() {
            // Should be this.remove() ?  Seems to cause hard looping
            this.$el.remove();
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
            this.collection.on("selection_updated add", this.select_activity_at_cursor, cursor);
            this.collection.on("view_replaced", this.view_replaced, cursor);
            this.$el.parent().on( "utap", $.proxy(cursor.activities_click, cursor) );
            $(window).keydown( $.proxy(cursor.key_handler, cursor) );
            this.view_replaced();
        },
        init_units: function() {
            this.x_scale = dim.column_width;
            this.y_scale = dim.hour_height / (60 / dim.duration_unit);
            this.units_per_hour = 60 / dim.duration_unit;
            this.max_x = 6;
            this.max_y = 24 * this.units_per_hour - 1;
            this.$el.width(this.x_scale - 2);
            this.size_cursor(1);
        },
        view_replaced: function() {
            this.move_to(0, 9 * this.units_per_hour);
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
            if(!activity) {
                return;
            }
            var date = week_dates[pos.x].ymd;
            var time = pos.y * dim.duration_unit;
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
            return week_dates[this.x].ymd;
        },
        cursor_time: function() {
            return this.y * dim.duration_unit;
        },
        default_duration: function() {
            return 60;
        },
        select_activity_at_cursor: function() {
            var activity = this.collection.find_by_date_time(this.cursor_date(), this.cursor_time());
            if(activity) {
                activity.select();
            }
            else {
                if(this.collection.current_activity){
                    this.collection.current_activity.unselect();
                }
                this.size_cursor(1);
            }
        },
        selection_changed: function(activity) {
            this.x = column_for_date[ activity.get("date") ];
            this.y = activity.get("start_time") / dim.duration_unit;
            this.position_cursor();
            this.size_cursor( activity.get("duration")  / dim.duration_unit );
        },
        activities_click: function(e) {
            if(!$(e.target).hasClass('activities')) {
                return;
            }
            var x = e.px_current_x - dim.hour_label_width - parseInt( $(e.target).css("left"), 10 ) || 0;
            var y = e.px_current_y - dim.day_label_height - parseInt( $(e.target).css("top"), 10 ) || 0;
            this.move_to(Math.floor(x / this.x_scale), Math.floor(y / this.y_scale));
        },
        key_handler: function(e) {
            if(this.collection.editor_active()) {
                return true;
            }
            var curr = this.collection.current_activity;
            if(!e.shiftKey && !e.ctrlKey) {
                switch(e.keyCode) {
                    case keyCode.LEFT:      this.move(-1,  0);                break;
                    case keyCode.RIGHT:     this.move( 1,  0);                break;
                    case keyCode.UP:        this.move( 0, -1);                break;
                    case keyCode.DOWN:
                        this.move(0, curr ? curr.get("duration") / dim.duration_unit : 1);
                        break;
                    case keyCode.TAB:       this.select_next_activity();      break;
                    case keyCode.ENTER:     this.edit_activity();             break;
                    case keyCode.DELETE:    this.delete_activity();           break;
                    case keyCode.PAGE_UP:   $('#week-prev').click();          break;
                    case keyCode.PAGE_DOWN: $('#week-next').click();          break;
                    default:
                        return;
                }
            }
            else if(e.shiftKey && e.ctrlKey) {
                switch(e.keyCode) {
                    case keyCode.LEFT:      $('#week-prev').click();          break;
                    case keyCode.RIGHT:     $('#week-next').click();          break;
                    default:
                        return;
                }
            }
            else if(e.shiftKey) {
                switch(e.keyCode) {
                    case keyCode.LEFT:      this.move_activity(-1,  0);       break;
                    case keyCode.RIGHT:     this.move_activity( 1,  0);       break;
                    case keyCode.UP:        this.move_activity( 0, -1);       break;
                    case keyCode.DOWN:      this.move_activity( 0,  1);       break;
                    case keyCode.TAB:       this.select_previous_activity();  break;
                    default:
                        return;
                }
            }
            else if(e.ctrlKey) {
                switch(e.keyCode) {
                    case 67:                        // Ctrl-C
                        this.copy_activity();
                        break;
                    case 88:                        // Ctrl-X
                        this.copy_activity();
                        this.delete_activity();
                        break;
                    case 86:                        // Ctrl-V
                        this.paste_activity();
                        break;
                    default:
                        return;
                }
            }
            e.preventDefault();
        },
        select_next_activity: function() {
            this.collection.select_next_activity(this.cursor_date(), this.cursor_time());
        },
        select_previous_activity: function() {
            this.collection.select_previous_activity(this.cursor_date(), this.cursor_time());
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
            this.select_activity_at_cursor();
        },
        copy_activity: function() {
            var curr = this.collection.current_activity;
            if(curr) {
                this.clipboard = curr.toJSON();
                delete this.clipboard.id;
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
                data.duration = Math.min(data.duration, this.max_duration());
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
            "mousewheel .activities": "mousewheel",
            "click  #week-prev": "previous_week",
            "click  #week-next": "next_week",
            "click  #sync-now": "sync_now"
        },
        initialize: function(options) {
            this.set_dates(options.dates);
            this.compile_templates();
            this.initialise_units();
            this.initialise_ui();
            this.collection.on('add', this.add_activity, this);
            this.collection.on("cursor_move", this.scroll_to_show_cursor, this);
            $(window).resize( $.proxy(this.resize, this) );
            $(window).on("beforeunload", $.proxy(this.before_unload, this) );
        },
        set_dates: function(dates) {
            init_week_dates(dates.week_dates);
            this.monday      = dates.week_dates[0].ymd;
            this.last_monday = dates.last_monday;
            this.next_monday = dates.next_monday;
        },
        compile_templates: function() {
            this.menu_template = Handlebars.compile( $('#menu-template').html() );
            this.activity_template = Handlebars.compile( $('#activity-template').html() );
        },
        initialise_units: function() {
            this.top  = 0;
            this.left = 0;
            dim.duration_unit = 60 / TKSWeb.units_per_hour;
            dim.column_width = this.$('.day-labels li:first').outerWidth();
            dim.hour_height  = this.$('.hour-labels li:nth-child(2)').outerHeight();
            dim.hour_label_width  = this.$('.hour-labels').outerWidth();
            dim.day_label_height  = this.$('.day-labels').outerHeight();
            this.activities_width  = dim.column_width * 7;
            this.activities_height = dim.hour_height * 24;
        },
        initialise_ui: function() {
            this.update_menu();
            this.enable_workspace_drag();
            this.resize();
            this.set_initial_scroll();
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
        update_menu: function(dates) {
            var context = {
                exports_by_sys: this.wr_systems_for_exports(),
                this_monday: this.monday,
                last_monday: this.last_monday,
                next_monday: this.next_monday
            }
            this.$('.menu ul').html( this.menu_template(context) );
        },
        enable_workspace_drag: function() {
            var view = this;
            this.$('.activities').udraggable({
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
            this.min_y = this.app_height - this.activities_height - dim.day_label_height;
            this.max_y = 0;
            this.$('.activities').udraggable("option", {
                containment: [
                    this.app_width - this.activities_width - dim.hour_label_width,
                    this.min_y,
                    0,
                    this.max_y
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
            var day_height = (18 - 8) * dim.hour_height;
            var y = -8 * dim.hour_height;
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
        previous_week: function(e) {
            e.preventDefault();
            if(this.pause_for_user_to_sync()) {
                return;
            }
            this.load_new_week(this.last_monday);
        },
        next_week: function(e) {
            e.preventDefault();
            if(this.pause_for_user_to_sync()) {
                return;
            }
            this.load_new_week(this.next_monday);
        },
        sync_now: function(e) {
            this.collection.sync_now();
            e.preventDefault();
        },
        pause_for_user_to_sync: function() {
            if(!this.collection.edits_are_unsaved()) {
                return false;
            }
            return !confirm(unsaved_edits_message);
        },
        before_unload: function(e) {
            if(!this.collection.edits_are_unsaved()) {
                return;
            }
            (e || window.event).returnValue = unsaved_edits_message;
            return unsaved_edits_message;
        },
        load_new_week: function(date) {
            if(this.collection.current_activity) { // ensure no hanging reference
                this.collection.current_activity.unselect();
            }
            $.ajax({
                url: "/week/" + date + ".json",
                dataType: 'json',
                success: $.proxy(this.update_week_view, this)
            });
            this.collection.remove( this.collection.toArray() );
            history.pushState(null, null, '/week/' + date);
        },
        update_week_view: function(data) {
            this.set_dates(data.dates);
            this.$('.day-labels li').each(function(i, el) {
                $(el).text(week_dates[i].fmt);
            });
            this.update_menu();
            this.collection.add( data.activities );
            this.set_initial_scroll();
            this.collection.trigger_view_replaced();
        },
        cursor_el: function() {
            return this.$('.activities .cursor');
        },
        add_activity: function(activity) {
            var a_view = new ActivityView({ model: activity });
            this.$('.activities').append( a_view.render().el );
            a_view.check_overflow();
        },
        scroll_to_show_cursor: function(cursor) {
            var viewport = {
                top: 0 - this.top,
                bottom: this.app_height - this.top - dim.day_label_height,
                left: 0 - this.left,
                right: this.app_width - this.left - dim.hour_label_width
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

    TKSWeb.show_week = function (el, dates, wr_systems, activities_data) {
        init_wr_systems(wr_systems);
        var activities = new Activities();
        activities.view = new WeekView({
            el: el,
            collection: activities,
            dates: dates
        });
        activities.cursor = new ActivityCursor({ collection: activities, el: activities.view.cursor_el() });
        activities.editor = new ActivityEditor({ collection: activities });
        activities.add(activities_data);
    };

})(jQuery);
