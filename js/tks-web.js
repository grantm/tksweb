LazyLoad.css(  // from: https://github.com/rgrove/lazyload
    [ 'style.css' ]
);
LazyLoad.css(  // from: https://github.com/rgrove/lazyload
    [ 'css/smoothness/jquery-ui-1.8.12.custom.css' ]
);

LazyLoad.js(
    [
        'js/jquery-1.5.1.min.js',
        'js/jquery-ui-1.8.12.custom.min.js',
        'js/jquery.tmpl.min.js',
        'js/jquery.tksweb.js'
    ],
    function() {
        jQuery('noscript').remove();
        jQuery('#tks-web').tksweb();
    }
);

