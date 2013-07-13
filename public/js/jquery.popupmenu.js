/*
 * jQuery popup_menu plugin v0.1.0
 * Copyright (c) 2013 Grant McLean (grant@mclean.net.nz)
 *
 * Dual licensed under the MIT and GPL (v2.0 or later) licenses:
 *   http://opensource.org/licenses/MIT
 *   http://opensource.org/licenses/GPL-2.0
 *
 */

(function($) {
    "use strict";

    // Constructor function

    var PopupMenu = function ($el, options) {
        this.$target = $el;
        this.options = $.extend({}, $.fn.popup_menu.defaults, options)
        this.show_menu();
    };

    PopupMenu.prototype = {

        constructor: PopupMenu

        ,show_menu: function() {
            var that = this;
            this.$menu = this.build_menu();
            this.add_overlay( this.$menu );
            this.position_menu();
            this.$menu.on('utap li', function(e) { that.activate_selection(e); });
            this.$menu.on('click li', function(e) { that.activate_selection(e); });
        }

        ,build_menu: function() {
            var $div  = $('<div class="popup-menu" />');
            $div.append( $('<div class="arrow" />') );
            var $list = $('<ul />');
            var opt = this.options.options || [];
            for(var i = 0; i < opt.length; i++) {
                var $item = $('<li>').text( opt[i].name );
                if(opt[i].accel) {
                    $item.prepend( $('<span class="accel" />').text(opt[i].accel) );
                }
                $list.append( $item );
            }
            return $div.append( $list );
        }

        ,position_menu: function($menu) {
            var offset = this.$target.offset();
            var menu_x = offset.left + this.$target.outerWidth()  / 2;
            var menu_y = offset.top  + this.$target.outerHeight() / 2 -
                         this.$menu.outerHeight() / 2;
            this.$menu.css({top: menu_y, left: menu_x});
        }

        ,add_overlay: function($menu) {
            var that = this;
            this.$overlay = $('<div class="popup-menu-overlay" />')
                .click(function() { that.destroy(); });
            $('body').append( this.$overlay.append( this.$menu ) );
        }

        ,activate_selection: function(e) {
            e.stopPropagation();
            var el = e.orig_target || e.target;
            if(el  &&  el.nodeName !== 'LI') {
                el = el.parentNode;
            }
            var i = this.$menu.find('li').index(el);
            var item = this.options.options[i];
            this.destroy();
            if(item && item.handler) {
                item.handler();
            }
        }

        ,destroy: function() {
            this.$menu.remove();
            this.$overlay.remove();
        }

    };


    // jQuery plugin function

    $.fn.popup_menu = function(options) {
        if(this.length > 0) {
            var menu = new PopupMenu(this.first(), options);
        }
        return this;
    };

    $.fn.popup_menu.defaults = {
    };


})(jQuery);


