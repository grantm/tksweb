/*
 * tksweb - Web UI for timesheet entry
 *
 * Copyright (c) 2011 Grant McLean (grant@mclean.net.nz)
 *
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 *
 */

(function($) {

$.fn.tksweb = function(options) {
    return this.each(function() {
        $.fn.tksweb.build(this, options);
    });
};

$.fn.tksweb.build = function(app_el, options) {
    var app        = $.extend({}, $.fn.tksweb.defaults, options);
    var x_inc      = app.activity_width;
    var y_inc      = app.hour_height / 4;
    var x_max      = 6 * x_inc;
    var y_max      = (app.last_hour - app.first_hour + 0.75) * 4 * y_inc;
    var keyCode    = $.ui.keyCode;

    app.current_activity = null;

    register_templates();

    var week_view  = $('<div class="week" />');
    var week_hdr   = $('<ul class="week-hdr" />');
    var hours      = $('<ul class="hour-labels" />');
    var week_hours = $('<div class="week-hours" />');
    var activities = $('<div class="activities" />');
    var cursor     = add_cursor(activities);

    $(app.day_names).each(function(i, day) {
        week_hdr.append( $('<li />').text(day) )
    });

    for(var i = app.first_hour; i <= app.last_hour; i++) {
        var prefix = i > 9 ? '' : '0'
        hours.append( $('<li />').text(prefix + i + ':00') );
    }

    activities.height((app.last_hour - app.first_hour + 1) * app.hour_height);

    week_hours.append(hours, activities)
    week_view.append(week_hdr, week_hours);

    $(app_el).addClass('tksweb-app').append(week_view);

    if(app.scroll_to_hour >= 1) {
        week_hours.scrollTop((app.scroll_to_hour - 0.5) * app.hour_height);
    }

    var dlg_activity = add_activity_dialog($(app_el));

    week_hours.delegate('.activity', 'mouseenter', function() {
        init_draggable( $(this) );
    });

    $(document).keydown(function(e) { key_handler(e); });
    activities.dblclick(function(e) { dblclick_canvas(e); })
    week_hours.mousedown(function(e) { mousedown_handler(e) });

set_cursor_pos(100, 10 * app.hour_height);
create_activity({
    description : "Do some stuff with the thing",
    hours       : 1.5,
    wr_number   : "12345"
});

set_cursor_pos(200, 9 * app.hour_height);
create_activity({
    description : "Do stuff to the other thing",
    hours       : 1.75,
    wr_number   : "54763"
});

set_cursor_pos(200, 10.75 * app.hour_height);
create_activity({
    description : "Undo that last thing",
    hours       : 0.75,
    wr_number   : "12345"
});

set_cursor_pos(300, 9 * app.hour_height);
create_activity({
    description : "Decommision obselete thing",
    hours       : 1,
    wr_number   : "44632"
});

    set_cursor_pos(0, app.scroll_to_hour * app.hour_height);


    function register_templates() {
        $.template(
            "tmpl_activity",
            '<div class="activity" style="'
            + 'height: ${height}px; top: ${y}px; left: ${x}px;'
            + '">'
            + '<p>${wr_number}: ${description}</p></div>'
        );
    }

    function init_draggable(activity) {
        // Initialise draggable+resizable behaviours on first mouse enter
        if(activity.is(':data(draggable)')) {
            return;
        }

        activity.draggable({
            grid: [x_inc, y_inc],
            containment: 'parent',
            cursor: 'move',
            zIndex:  100,
            stop: function () {
                var act_data = activity.tmplItem().data;
                p = activity.position()
                act_data.x = p.left;
                act_data.y = p.top;
                set_cursor_pos(p.left, p.top);
            }
        });

        activity.resizable({
            handles: 'n, s',
            grid: [0, y_inc],
            stop: function (event, ui) {
                var act_data = activity.tmplItem().data;
                act_data.height = activity.height();
                act_data.hours  = (act_data.height + app.border_allowance) / (4 * y_inc);
                unselect_activity();
                select_activity(activity);
            }
        });

    }

    function add_cursor(parent) {
        var cursor = $('<div class="cursor" />');

        cursor.css({
            width  : (x_inc - app.border_allowance) + 'px',
            height : (y_inc - app.border_allowance) + 'px'
        });

        parent.append(cursor);
        return cursor;
    }

    function set_cursor_pos(x, y) {
        cursor.css({ left: x + 'px', top: y + 'px' });
    }

    function mousedown_handler(e) {
        var target = e.target;
        if(target.nodeName == "P") { target = target.parentNode; }
        var activity = $(target).hasClass('activity') ? target : null;
        if(activity) {
            select_activity(activity);
        }
        else if(!$(target).hasClass('cursor')) {
            mouse_position_cursor(e);
        }
    }

    function mouse_position_cursor(e) {
        unselect_activity();
        var x = Math.floor((e.layerX || e.offsetX) / x_inc) * x_inc;
        var y = Math.floor((e.layerY || e.offsetY) / y_inc) * y_inc;
        set_cursor_pos(x, y);
    }

    function dblclick_canvas(e) {
        activate_cursor();
    }

    function dblclick_activity(e) {
        dlg_activity.dialog('open');
        e.stopPropagation();
    }

    function current_activity_data() {
        if(app.current_activity) {
            return $(app.current_activity).tmplItem().data;
        }
        return {
            wr_number   : '',
            hours       : app.default_duration,
            description : ''
        };
    }

    function key_handler(e) {
        var curr = null;
        if(app.current_activity) {
            curr = $(app.current_activity).tmplItem().data;
        }
        switch(e.keyCode) {
            case keyCode.LEFT:   move_cursor(-x_inc,  0); break;
            case keyCode.RIGHT:  move_cursor( x_inc,  0); break;
            case keyCode.ENTER:  activate_cursor();       break;
            case keyCode.UP:
                move_cursor(0, -y_inc);
                break;
            case keyCode.DOWN:
                move_cursor(0, curr ? curr.hours * 4 * y_inc : y_inc);
                break;
            case keyCode.DELETE: delete_activity();       break;
            default: return;
        }
        e.preventDefault();
    }

    function move_cursor(x_delta, y_delta) {
        var p = cursor.position();

        if(x_delta < 0 && p.left > 0    ) { p.left += x_delta; }
        if(x_delta > 0 && p.left < x_max) { p.left += x_delta; }
        if(y_delta < 0 && p.top  > 0    ) { p.top  += y_delta; }
        if(y_delta > 0 && p.top  < y_max) { p.top  += y_delta; }
        var activity = find_activity_at_cursor(p);
        if(activity) {
            select_activity(activity);
        }
        else {
            unselect_activity();
            set_cursor_pos(p.left, p.top);
        }
    }

    function find_activity_at_cursor(p) {
        return activities.find('.activity').filter(function() {
            var data = $(this).tmplItem().data;
            if(p.left != data.x) { return false; }
            if(p.top < data.y)  { return false; }
            if(p.top > (data.y + data.height))  {
                return false;
            }
            set_cursor_pos(data.x, data.y);
            return true;
        })[0];
    }

    function select_activity(activity) {
        if(app.current_activity == activity) {
            return;
        }
        unselect_activity();
        if(activity) {
            app.current_activity = activity;
            var $activity = $(activity);
            var p = $activity.position();
            set_cursor_pos(p.left, p.top);
            $activity.addClass('selected');
        }
    }

    function unselect_activity() {
        if(app.current_activity) {
            $(app.current_activity).removeClass('selected');
        }
        app.current_activity = null;
    }

    function delete_activity() {
        var activity = app.current_activity;
        if(!activity) {
            return;
        }
        unselect_activity();
        $(activity).remove();
    }

    function activate_cursor() {
        dlg_activity.dialog('open');
    }

    function save_activity(data) {
        if(app.current_activity) {
            update_activity(data);
        }
        else {
            create_activity(data);
        }
    }

    function update_activity(data) {
        var tmpl_item = $(app.current_activity).tmplItem();
        var tmpl_data = tmpl_item.data;
        tmpl_data.wr_number   = data.wr_number;
        tmpl_data.hours       = data.hours;
        tmpl_data.description = data.description;
        tmpl_data.height      = data.hours * 4 * y_inc - app.border_allowance;
        tmpl_item.update();
    }

    function create_activity(data) {
        var p = cursor.position();
        data.height = data.hours * 4 * y_inc - app.border_allowance;
        data.x      = p.left;
        data.y      = p.top;
        var act = $.tmpl("tmpl_activity", data);
        act.dblclick(function(e) { dblclick_activity(e) });
        activities.append(act);
    }

    function add_activity_dialog($app_el) {
        var div      = $('<div class="tksweb-activity-dlg" />');
        var wr_inp   = $('<input type="text" />');
        var hr_inp   = $('<input type="text" />').val(1);
        var desc_inp = $('<input type="text" />');
        div.append(
            $('<div class="act-wr"><label>WR Number</label></div>').append(wr_inp),
            $('<div class="act-hr"><label>Hours</label></div>').append(hr_inp),
            $('<div class="act-dc"><label>Activity Description</label></div>').append(desc_inp)
        );

        div.dialog({
            autoOpen:      false,
            title:         "Activity Detail",
            resizable:     false,
            closeOnEscape: true,
            width:         360,
            height:        230,
            modal:         true,
            open: function() {
                var data = current_activity_data();
                wr_inp.val(data.wr_number);
                hr_inp.val(data.hours);
                desc_inp.val(data.description);
            },
            buttons:       {
                "Ok":  function() {
                    var data = {
                        wr_number   : wr_inp.val(),
                        hours       : hr_inp.val(),
                        description : desc_inp.val()
                    };
                    save_activity(data);
                    div.dialog("close");
                },
                "Cancel": function() { $(this).dialog("close"); }
            }
        });

        div.find('input').keydown(function(e) {
            if(e.keyCode == keyCode.ENTER) {
                div.parent().find('.ui-dialog-buttonpane button:first').click();
                e.stopPropagation();  // Don't allow Enter to re-launch dialog
            }
        });

        return div;
    }

};

$.fn.tksweb.defaults = {
    day_names        : [ 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun' ],
    first_hour       : 0,
    last_hour        : 23,
    scroll_to_hour   : 9,
    hour_height      : 48,  // must be a multiple of 4 and match bg-image bands
    activity_width   : 100,
    border_allowance : 2,   // top border thickness + bottom border
    default_duration : 1    // default number of hours for a new activity
};

})(jQuery);
