/**
 * Tyherox
 *
 * TimeWidget
 *
 * The TimeWidget is a simple widget used to tell time. Expanding adds the functionality of showing seconds
 */
function TimeWidget(){

    Mainframe.cssLoader('node_modules/packages/Time/style.css');

    //Create TimeWidget HTML Elements
    var time = document.createElement('div');
    time.id = 'time';
    time.style.fontSize = Layout.cellWidth/3 + "px";

    //Build widget
    var widget = new Widget("Time", 1, time);
    this.widget = widget;

    var toolbar = widget.toolbar;
    toolbar.addButton(toolbar.exit());
    toolbar.addButton(toolbar.pin());

    widget.initialize('packages/Time/package.json');
    widget.setMaxSize(2,2);

    //Relevant functions
    function updateElement(){
        updateTime();
        setTimeout(arguments.callee, 1000);
    };

    function updateTime(){
        var width = Math.round(widget.element.getBoundingClientRect().width/(Layout.cellWidth-Layout.cellOffset));

        var date = new Date();
        var hours = date.getHours();
        if(hours<10) hours = "0" + hours;
        var minutes = date.getMinutes();
        if(minutes<10) minutes = "0" + minutes;
        var seconds = date.getSeconds();
        if(seconds<10) seconds = "0" + seconds;
        if(width == 1) time.textContent = hours + ":" + minutes;
        if(width == 2) time.textContent = hours + ":" + minutes +":" + seconds;
    };
    updateElement();

    //Resize Listener to show appropriate functionality (HH/MM or HH/MM/SS)
    widget.resizeListener = function(){

        var height = Math.round(widget.container.getBoundingClientRect().height);

        time.style.lineHeight = height + "px";

        var date = new Date();
        var hours = date.getHours();
        if(hours<10) hours = "0" + hours;
        var minutes = date.getMinutes();
        if(minutes<10) minutes = "0" + minutes;
        var seconds = date.getSeconds();
        if(seconds<10) seconds = "0" + seconds

        if(widget.width == 1) time.textContent = hours + ":" + minutes;
        if(widget.width == 2) time.textContent = hours + ":" + minutes +":" + seconds;

        updateTime();
    };
}

module.exports = new TimeWidget();