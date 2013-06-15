(function($){
    'use strict';

    var dow = [ 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun' ];
    var label_width = 50;
    var label_height = 28;
    var day_width = 200;
    var hour_height = 50;
    var activities_width = day_width * 7;
    var activities_height = hour_height * 24;
    var $current_activity = null;

    var $container = $('<div />')
        .addClass('container')
        .height(window.innerHeight);

    var $hlabels = $('<div />').addClass('hour-labels');
    var $hlist = $('<ul />');
    for(var i = 0; i < 24; i++) {
        var time = ('0' + i + ':00').substr(-5);
        $hlist.append( $('<li />').text(time) );
    }

    var $dlabels = $('<div />').addClass('day-labels');
    var $dlist = $('<ul />');
    for(var i = 0; i < 7; i++) {
        var day = dow[i] + ' ' + ('0' + i).substr(-2);
        $dlist.append( $('<li />').text(day) );
    }

    var $activities = $('<div />').addClass('activities').css({width: activities_width, height: activities_height});

    var $activity1 = $('<div />').addClass('activity').css({top: '150px', left: '0', height: '48px'});
    var $activity2 = $('<div />').addClass('activity').css({top: '200px', left: '200px', height: '48px'});

    $container.append( $activities.append($activity1, $activity2) );
    $container.append( $hlabels.append($hlist) );
    $container.append( $dlabels.append($dlist) );

    $('body').append( $container );

    var max_x = 200;
    var max_y = 400;
    $activities.draggable({
        containment: [
            window.innerWidth - activities_width,
            window.innerHeight - activities_height,
            label_width + 1,
            label_height + 1
        ],
        drag: function (event, ui) {
            var pos = ui.position;
            $dlist.css({left: pos.left - label_width});
            $hlist.css({top: pos.top - label_height});
        }
    });

    $activities.on('click', '.activity', function() {
        select_activity(this);
    });

    function select_activity(activity) {
        if($current_activity) {
            $current_activity
                .removeClass('selected')
                .draggable( "disable" );
        }
        $current_activity = $(activity).addClass('selected');
        if(!$current_activity.data('uiDraggable')) {
            $current_activity.draggable({
                containment: "parent",
                grid: [ 200, 50 ],
                addClasses: false
            });
        }
        $current_activity.draggable('option', 'disabled', false);
    }

    $('body').on('DOMMouseScroll', function(e) {
console.log("DOMMouseScroll event", e, e.which);
    });

    $('body').on('mousewheel', function(e) {
console.log("mousewheel event", e);
    });

})(jQuery);
