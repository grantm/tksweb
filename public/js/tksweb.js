(function($) {

    var WeekView = Backbone.View.extend({
        initialize: function(options) {
            this.el = options.el;
            this.el.html('view for week starting ' + options.monday + ' goes here');
        },
        $: function(selector) {
            return this.el.find(selector);
        }
    });

    window.TKSWeb = {
        show_week: function (el, monday) {
            new WeekView({ el: el, monday: monday });
        }
    }

})(jQuery);
