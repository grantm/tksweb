// LazyLoad.css(  // from: https://github.com/rgrove/lazyload
//     [ 'css/smoothness/jquery-ui-1.8.12.custom.css' ]
// );

LazyLoad.js(
    [
        'js/spine.min.js',
        'js/spine.route.js',
        'js/jquery-1.5.1.min.js'//,
        // 'js/jquery-ui-1.8.12.custom.min.js',
        // 'js/jquery.tmpl.min.js',
        // 'js/jquery.tksweb.js'
        // 'json2.js' // for JSON support in IE < 8.0
    ],
    function() {
        jQuery('noscript').remove();
        // jQuery('#tks-web').tksweb();
        TksWebInit(jQuery);
    }
);


function TksWebInit($) {

var Week = Spine.Class.create({
    init: function(arg){
        this.arg = arg;
    }
});

var Activity = Spine.Model.setup(
    "Activity",
    ['date', 'wr_number', 'start', 'hours', 'description']
);

Activity.include({
    validate: function(){
      if(!this.start)
          return "Start time is required";
      if(!this.start.match(/^([01][0-9]|2[0-3]):(00|15|30|45)/))
          return "Start time '" + this.start + "' is invalid";
      if(!this.hours)
          return "Hours are required";
      this.hours = Math.floor(this.hours * 4) / 4;
      if(this.hours > 24)
          return "Hours must be ";
    }
});


var act1 = Activity.init({
    date        : '2011-04-04',
    wr_number   : '36136',
    start       : '09:30',
    hours       : '1.5',
    description : 'Do some stuff with the thing'
});
act1.save();

console.log(JSON.stringify(act1));


var Activities = Spine.Controller.create({
    init: function(){
        console.log('The Activities controller init() method was called');
        this.navigate("/week");
    }
});

var activities = Activities.init({el: $("#tks-web")});


}

