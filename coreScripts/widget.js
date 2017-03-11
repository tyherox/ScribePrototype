/**
 * Tyherox
 *
 * Widget
 *
 * The widget class is the template for all widgets of Scribe. It includes the container to place custom content
 * as well as a means to be arranged upon the Layout module.
 *
 * @param name: Name of widget that will appear on the toolbar.
 * @param id: Id of widget that will be used as a unique identifier.
 * @param content: The custom content to be placed in the widget.
 * @constructor
 */

function Widget(name, id, content){

    //Reference to self
    var self =  this;
    var config = null;

    //Widget State Variables
    this.name = name;
    this.id = id;
    this.content = content;

    this.column = 0;
    this.row = 0;

    this.width = 0;
    this.height =0;
    this.maxWidth =  2;
    this.maxHeight =  2;
    this.minWidth =  1;
    this.minHeight =  1;

    this.homeRect = null;
    this.pushing = false;
    this.resetting = false;
    this.pushedCol = 0;
    this.pushedRow = 0;
    this.resizeListener = null;
    this.createChild = null;
    this.endFunctions = [];

    this.pinned = false;

    this.setLocation = function(c,r){

        this.column = c;
        this.row = r;

        //self.element.style.left =  self.element.getBoundingClientRect().left + "px";
        //self.element.style.top = self.element.getBoundingClientRect().top + "px";

        //console.debug("Destination:",Layout.findX(c),Layout.findY(r));

        var x = Layout.findX(c);
        var y = Layout.findY(r);

        self.element.setAttribute('data-x', x);
        self.element.setAttribute('data-y', y);

        //console.debug("Dif:",x,y);

        self.element.style.webkitTransform = 'translate(' + x + 'px, ' + y + 'px)';

        self.element.addEventListener('transitionend',function(){
            //console.debug("2!",self.element.getBoundingClientRect().left,",",self.element.getBoundingClientRect().top);
        });

        //console.debug("SET LOC");
    };

    //Setters to make dimension changing easier. Self-explanatory.
    this.setSize = function(w,h){
        this.width = w;
        this.height = h;

        self.element.style.width =  (Layout.cellWidth + Layout.cellOffset) * this.width - Layout.cellOffset + "px";
        self.element.style.height = (Layout.cellHeight + Layout.cellOffset) * this.height - Layout.cellOffset + "px";
    };

    this.setMinSize = function(w,h){
        this.minWidth = w;
        this.minHeight = h;

        self.element.style.minWidth =  (Layout.cellWidth + Layout.cellOffset) * this.minWidth - Layout.cellOffset + "px";
        self.element.style.minHeight = (Layout.cellHeight + Layout.cellOffset) * this.minHeight - Layout.cellOffset + "px";
    };

    this.setMaxSize = function(w,h){
        this.maxWidth = w;
        this.maxHeight = h;

        self.element.style.maxWidth =  (Layout.cellWidth + Layout.cellOffset) * this.maxWidth - Layout.cellOffset + "px";
        self.element.style.maxHeight = (Layout.cellHeight + Layout.cellOffset) * this.maxHeight - Layout.cellOffset + "px";
    };

    this.exit = function(){
        console.debug("END FUNCTIONS",self.endFunctions.length);
        self.endFunctions.forEach(function(fun){
            fun();
        });
        Layout.removeWidget(self.element);
    };

    /**
     * Toolbar
     *
     * Constructs the toolbar for widgets. Has pin and exit buttons that can be included by using the function
     * addButton(toolbar.pin) or addButton(toolbar.exit).
     *
     * @constructor
     */
    function Toolbar(){

        var buttons = [];

        var element = document.createElement("div")
        this.element = element;
        this.element.className = "widgetToolbar";

        var expandBtn = document.createElement('button');
        expandBtn.className = 'widgetToolbarButtons';
        Mainframe.setThemeIcon('leftbutton.png',expandBtn);
        expandBtn.addEventListener('click',function(){
            if(expandBtn.expanded==false||expandBtn.expanded==null){
                console.debug("EXPANDING");
                for(var i = 0; i<buttons.length; i++){
                    buttons[i].style.display = 'inline';
                }
                expandBtn.expanded=true;
                Mainframe.setThemeIcon('rightbutton.png',expandBtn);
            }
            else{
                console.debug("COllAPSING");
                for(var i = 0; i<buttons.length; i++){
                    buttons[i].style.display = 'none';
                }
                expandBtn.expanded=false;
                Mainframe.setThemeIcon('leftbutton.png',expandBtn);
            }
        });
        element.appendChild(expandBtn);

        var title = document.createElement('div');
        this.title = title;
        title.className = 'widgetToolbarTitle';
        //title.textContent = self.name;
        element.appendChild(title);

        this.pin = function(){
            var button = document.createElement("button");
            button.addEventListener("click", function(){
                if(button.pinned == false || button.pinned == null){
                    self.pinned = true;
                    button.pinned = true;
                    button.style.opacity = '1';
                }
                else{
                    self.pinned = false;
                    button.pinned = false;
                    button.style.opacity = '.3';
                }
            });
            button.style.opacity = '.5';
            button.className = "widgetToolbarButtons";
            Mainframe.setThemeIcon('pinbutton.png',button);
            return button;
        };

        this.exit = function(){
            var button = document.createElement("button");
            button.addEventListener("click", self.exit);
            button.className = "widgetToolbarButtons";
            Mainframe.setThemeIcon('exitbutton.png',button);
            return button;
        };

        this.addButton = function(button){
            element.appendChild(button);
            button.style.display = 'none';
            buttons.push(button);
        };

        this.fixedButtons = function(){
            console.debug("");
            element.removeChild(expandBtn);
            for(var i = 0; i<buttons.length; i++){
                buttons[i].style.display = 'inline';
            }
        }
    }
    this.toolbar = new Toolbar();

    /**
     * Widget.interact
     *
     * Using the MIT licensed library interact.js (http://interactjs.io) this functions allows the widgets to be dragged.
     * The logic from widget intersections is handled by the Layout module. Different interact functions can be used
     * by applying a custom interact function to the widget.
     *
     * @returns {*|{x, y}}: Returns the interact.js object interactable.
     */
    this.interact  = function(){
         var widget_interact = Mainframe.interact('.widget',{preventDefault: 'never'})
            .draggable({
                inertia:true,
                snap: {
                    targets: [
                        Mainframe.interact.createSnapGrid({ x: Layout.cellWidth+Layout.cellOffset, y: Layout.cellHeight+Layout.cellOffset })
                    ],
                    offset: { x: 2, y: 2 },
                    range: Infinity,
                    relativePoints: [ { x: 0, y: 0 } ],
                    endOnly: true
                },
                restrict: {
                    restriction: document.getElementById('parent'),
                    elementRect: { top: 0, left: 0, bottom: 1, right: 1 },
                    endOnly: true
                },
                onstart: function(event){

                    Layout.reset();
                    Layout.setCollider(event.target);

                    var target = event.target;

                    var x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
                    var y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

                    target.setAttribute("data-start_x", x);
                    target.setAttribute("data-start_y", y);

                    target.style.webkitTransition =  "all 0s ease ";
                    target.style.zIndex = 3;

                    Layout.toggle(true);
                },
                onmove: function(event) {
                    dragMoveListener(event);
                },
                onend: function (event) {
                    var target = event.target;

                    var viewportOffset = target.getBoundingClientRect();
                    var y = viewportOffset.top || 0;
                    var x = viewportOffset.left || 0;

                    target.style.webkitTransition =  "all .5s ease";
                    target.style.zIndex = 1;

                    if(!Layout.isValidHome(target)){
                        var x = target.getAttribute("data-start_x");
                        var y = target.getAttribute("data-start_y");

                        target.style.webkitTransform = 'translate(' + x + 'px, ' + y + 'px)';

                        target.setAttribute('data-x', x);
                        target.setAttribute('data-y', y);
                    }

                    Layout.reset();

                }
            })
            .on("draginertiastart", function(event){
                Layout.toggle(false);
            })
            .resizable({
                invert: 'none',
                inertia:true,
                square: false,
                preserveAspectRatio: false,
                edges: { left: false, right: true, bottom: true, top: false },
                snap: {
                    targets: [
                        Mainframe.interact.createSnapGrid({ x: Layout.cellWidth+Layout.cellOffset, y: Layout.cellHeight+Layout.cellOffset })
                    ],
                    offset: { x: 2, y: 2 },
                    range: Infinity,
                    relativePoints: [ { x: 0, y: 0 } ],
                    endOnly: true
                },
                restrict: {
                    restriction: document.getElementById("grid"),
                    endOnly: true
                },
                onstart: function(event){

                    var target = event.target;

                    Layout.reset();
                    Layout.setCollider(target);

                    target.setAttribute("data-start_width", event.rect.width);
                    target.setAttribute("data-start_height", event.rect.height);

                    target.style.webkitTransition =  "all 0s ease";

                    Layout.toggle(true);
                },
                onmove: function(event){
                    dragResizeListener(event);
                },
                onend: function(event){
                    var target = event.target;

                    target.style.webkitTransition =  "all 0.5s ease";

                    if(!Layout.isValidHome(target)){
                        var width = target.getAttribute("data-start_width");
                        var height = target.getAttribute("data-start_height");

                        target.style.width  = width + 'px';
                        target.style.height = height + 'px';
                    }

                    Layout.reset();
                }
            })
            .on("resizeinertiastart", function(event){
                Layout.toggle(false);
            })
            .actionChecker(function (pointer, event, action, interactable, element, interaction) {
                return action;
            })
            .origin('parent');

        var dragResizeListener = function(event){
            var target = event.target,
                x = (parseFloat(target.getAttribute('data-x')) || 0),
                y = (parseFloat(target.getAttribute('data-y')) || 0);

            target.style.width  = event.rect.width + 'px';
            target.style.height = event.rect.height + 'px';

            if(event.rect.width>Layout.cellWidth-Layout.cellOffset){
                x += event.deltaRect.left;
            }
            if(event.rect.height>Layout.cellHeight-Layout.cellOffset){
                y += event.deltaRect.top;
            }
            target.style.webkitTransform = target.style.transform = 'translate(' + x + 'px,' + y + 'px)';

            Layout.dragWidget(target);
            Layout.freePushed();

            target.setAttribute('data-x', x);
            target.setAttribute('data-y', y);

            if(Layout.findWidget(target.id).resizeListener!=null) Layout.findWidget(target.id).resizeListener();
        };

        var dragMoveListener = function(event) {

            var target = event.target,
                x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx,
                y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

            target.style.webkitTransform = 'translate(' + x + 'px, ' + y + 'px)';

            target.setAttribute('data-x', x);
            target.setAttribute('data-y', y);

            if(event.velocityX<750&&event.velocityY<750){
                Layout.dragWidget(target);
            }
            Layout.freePushed();
        };

        return widget_interact;
    };

    /**
     *Widget.ScrollTo
     *
     * Allows the widget to smooth scroll to a specific area.
     * @type {boolean}
     */
    var scrolling = false;
    this.scrollTo = function(to, duration, element){

        function scroll(){
            if(!scrolling && to!=element.scrollTop){
                scrolling = true;
                var start = element.scrollTop,
                    change = to - start,
                    currentTime = 0,
                    increment = 20;

                var animateScroll = function(){
                    currentTime += increment;
                    var val = Math.easeInOutQuad(currentTime, start, change, duration);
                    element.scrollTop = val;
                    if(currentTime < duration) {
                        setTimeout(animateScroll, increment);
                    }
                    else{
                        scrolling = false;
                    }
                };
                animateScroll();
            }
        }

        Math.easeInOutQuad = function (t, b, c, d) {
            t /= d/2;
            if (t < 1) return c/2*t*t + b;
            t--;
            return -c/2 * (t*(t-2) - 1) + b;
        };
        scroll();
    }

    /**
     * Widget.initialize
     *
     * Applies the given attributes to the widget and creates the appropriate HTML element which can be accessed
     * with widget.element.
     */
    this.initialize = function(json){

        if(json!=null) config = require(json);

        var widgetElement = document.createElement("div");
        self.element = widgetElement;
        widgetElement.id = this.id;
        widgetElement.className = "widget widgetBackground";

        widgetElement.style.width =  (Layout.cellWidth + Layout.cellOffset) * this.width - Layout.cellOffset + "px";
        widgetElement.style.height = (Layout.cellHeight + Layout.cellOffset) * this.height - Layout.cellOffset + "px";

        widgetElement.style.maxWidth =  (Layout.cellWidth + Layout.cellOffset) * this.maxWidth - Layout.cellOffset + "px";
        widgetElement.style.maxHeight = (Layout.cellHeight + Layout.cellOffset) * this.maxHeight - Layout.cellOffset + "px";

        widgetElement.style.minWidth =  (Layout.cellWidth + Layout.cellOffset) * this.minWidth - Layout.cellOffset + "px";
        widgetElement.style.minHeight = (Layout.cellHeight + Layout.cellOffset) * this.minHeight - Layout.cellOffset + "px";

        widgetElement.appendChild(this.toolbar.element);

        var container = document.createElement('div');
        container.className = 'widgetContainer';
        self.container = container;
        widgetElement.appendChild(container);

        if(content!=null) container.appendChild(this.content);

        self.interact();
    };

    this.save = null;
}
