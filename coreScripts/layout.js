/**
 *Tyherox
 *
 * Layout
 *
 * The layout module of Scribe handles tasks related to decorating and arranging widgets on the screen.
 * Main components include both the widget and its Element object counterpart. Custom data is stored on the widget
 * with the exception of transition distance, which is stored on the Element through the setAttribute() function.
 *
 */



var Layout = (function () {

    //Local variables that are used by the Layout module.

    var addedWidgets = [],
        collider,
        mother = document.getElementById('parent'),
        gridCols = 8, gridRows = 5,
        screenWidth = document.getElementById('parent').getBoundingClientRect().width,
        screenHeight = document.getElementById('parent').getBoundingClientRect().height,
        cellOffset = 5,
        cellWidth = screenWidth/8-cellOffset,
        cellHeight = screenHeight/5-cellOffset;

    //Inner functions

    /**
     * Layout.prepElement
     *
     * Used to prepare an element for comparison. It extracts the rect, col, row, width and height of the element.
     *
     * @param element: element to be compared.
     * @returns {{rect: ClientRect, col: *, row: *, width: number, height: number}}: values of comparison.
     */
    function prepElement(element){
        return{
            rect: element.getBoundingClientRect(),
            col: Layout.findCol(element.getBoundingClientRect().left),
            row: Layout.findRow(element.getBoundingClientRect().top),
            width: Math.round(element.getBoundingClientRect().width/(cellWidth-cellOffset))-1,
            height: Math.round(element.getBoundingClientRect().height/(cellHeight-cellOffset))-1,
        }
    };

    /**
     * Layout.prepWidget
     *
     * Used to prepare a widget for comparison. It extracts the rect, col, row, width and height of the widget.
     *
     * @param widget: widget to be compared
     * @returns {{rect: null, col: *, row: *, width: number, height: number}}: values of comparison.
     */
    function prepWidget(widget){
        return{
            rect: widget.homeRect,
            col: Layout.findCol(widget.homeRect.left),
            row: Layout.findRow(widget.homeRect.top),
            width: Math.round(widget.homeRect.width/(cellWidth-cellOffset))-1,
            height: Math.round(widget.homeRect.height/(cellHeight-cellOffset))-1,
        }
    }

    /**
     * Layout.isAvailableArea
     *
     * Used to determine if an element's target destination is empty or not.
     *
     *
     * @param element: The element that is moving towards the target.
     * @param target: The target detination.
     * @returns {boolean}: returns true for empty and false for occupied.
     */
    function isAvailableArea(element, target){

        //Checks to see if target is out of bounds.
        //-1 on col and row to offset for 0 being the minimum width of widgets.
        if(target.col<0||target.row<0||target.col+target.width>gridCols-1||target.row+target.height>gridRows-1){
            return false;
        }

        for(var i = 0; i<addedWidgets.length; i++){

            var iComp = prepElement(document.getElementById(addedWidgets[i].id));

            if(addedWidgets[i].id!=collider.id){

                var iterated_widget = addedWidgets[i];
                iComp.col = iterated_widget.column;
                iComp.row = iterated_widget.row;
                iComp.width = iterated_widget.width-1;
                iComp.height = iterated_widget.height-1;
            }

            if(((target.col>=iComp.col&&target.col<=iComp.col+iComp.width)||
                (iComp.col>=target.col&&iComp.col<=target.col+target.width))&&
                ((target.row>=iComp.row&&target.row<=iComp.row+iComp.height)||
                (iComp.row>=target.row&&iComp.row<=target.row+target.height)) && addedWidgets[i].id!=element.id){
                return false;
            }
        }

        return true;
    }

    /**
     * layout.detectChainCollisions
     *
     * Detects whether a drag causes several "chain" collisions to occur.
     *
     * @param widget: widget that is being moved.
     * @param x: the x distance it is moving.
     * @param y: the y distance it is moving.
     * @returns {boolean}
     */
    function detectChainCollisions(widget, x, y){

        var iComp = prepWidget(widget);
        iComp.col += x;
        iComp.row += y;

        if(isAvailableArea(widget, iComp)){
            return true;
        }
    }

    /**
     * Layout.findPushDirection
     *
     * Finds the direction a widget should be pushed when a drag event occurs.
     *
     * @param pRect: pushed rect.
     * @param cRect: colliding (collider) rect.
     * @returns {*}: returns the direction as a string.
     */
    function findPushDirection( pRect, cRect){

        var iRect = {
            top: 0,
            left: 0,
            bottom: 0,
            right: 0
        }

        if(pRect.top<cRect.top){
            iRect.top = cRect.top;
        }
        else iRect.top = pRect.top;

        if(pRect.bottom<cRect.bottom){
            iRect.bottom = pRect.bottom;
        }
        else iRect.bottom = cRect.bottom;

        if(pRect.left<cRect.left){
            iRect.left = cRect.left;
        }
        else iRect.left = pRect.left;

        if(pRect.right<cRect.right){
            iRect.right = pRect.right;
        }
        else iRect.right = cRect.right;

        var iRect_width = iRect.right - iRect.left;
        var iRect_height = iRect.bottom - iRect.top;

        var right = 0, left = 0, up = 0, down = 0;

        if(iRect.bottom == cRect.top + iRect_height) down = iRect_width;
        else if(iRect.top == cRect.bottom - iRect_height) up = iRect_width;
        if(iRect.left == cRect.right - iRect_width) left = iRect_height;
        else if(iRect.right == cRect.left + iRect_width) right = iRect_height;

        console.debug("C: " + right, left, up, down);

        var max = Math.max(right,left,up,down);

        if(max==right) return "right";
        if(max==left) return "left";
        if(max==up) return "up";
        if(max==down) return "down";
    }

    /**
     * Layout.intersectRect
     *
     * Finds if two rect objects are intersecting or not.
     *
     * @param r1: First rectangle.
     * @param r2: Second rectangle.
     * @returns {boolean}: true if intersects, false if not.
     */
    function intersectRect(r1, r2) {
        return !(r2.left > r1.right ||
        r2.right < r1.left ||
        r2.top > r1.bottom ||
        r2.bottom < r1.top);
    }

    /**
     * Layout.pointIntersections
     *
     * Finds if two sets of custom data points (col,row,width,height) intersect or not.
     * @param a: First custom data points.
     * @param b: Second custom dta points.
     * @returns {boolean} true if intersects, false if not.
     */
    function pointIntersections(a,b){
        if(((a.col>=b.col&&a.col<=b.col+b.width)||
            (b.col>=a.col&&b.col<=a.col+a.width))&&
            ((a.row>=b.row&&a.row<=b.row+b.height)||
            (b.row>=a.row&&b.row<=a.row+a.height))){
            return true;
        }
        return false;
    }

    /**
     * Layout.resetWidget
     *
     * Resets a single wiget so future drag events can occur normally on it.
     * @param widgetElement: widget to be reset.
     */
    function resetWidget(widgetElement){

        var widget = Layout.findWidget(widgetElement.id);

        var new_rect = widgetElement.getBoundingClientRect();
        var new_col = Layout.findCol(new_rect.left);
        var new_row = Layout.findRow(new_rect.top);
        var new_width = Math.round(new_rect.width/(cellWidth-cellOffset));
        var new_height = Math.round(new_rect.height/(cellHeight-cellOffset));

        widget.column = new_col;
        widget.row = new_row;
        widget.width = new_width;
        widget.height = new_height;
    }

    //Public methods
    return{

        /**
         * Layout.drawGrid
         *
         * Draws a grid according to the set cell height and width values. Becomes visible during drag events.
         * @param w: width of grid
         * @param h: height of grid
         * @param id: id of canvas
         */
        drawGrid: function(w, h, id) {
            var wOffs = w/gridCols;
            var hOffs = h/gridRows;
            var canvas = document.getElementById(id);
            canvas.className = 'themeGridColor';
            var ctx = canvas.getContext('2d');

            ctx.canvas.width  = w;
            ctx.canvas.height = h;
            setTimeout(function(){
                ctx.strokeStyle = getComputedStyle(canvas).getPropertyValue('border-color');
                console.debug("TEST",getComputedStyle(canvas).getPropertyValue('border-color'));

                ctx.stroke();

                for (x=0;x<=w;x+=wOffs) {
                    for (y=0;y<=h;y+=hOffs) {
                        ctx.moveTo(x, 0);
                        ctx.lineTo(x, h);
                        ctx.stroke();
                        ctx.moveTo(0, y);
                        ctx.lineTo(w, y);
                        ctx.stroke();
                    }
                }
            },500);
            //ctx.lineWidth = 1;
        },

        /**
         * Layout.makeLayout
         *
         * Scribe layout initializer. Sets widgets in correct coordinates in the beginning of the program boot.
         */
        makeLayout: function(){
            for(var i = 0; i<addedWidgets.length; i++){
                var widget = addedWidgets[i];
                var widgetElement = document.getElementById(widget.id);

                var x = this.findX(widget.column);
                var y = this.findY(widget.row);

                widgetElement.style.left = x + "px";
                widgetElement.style.top = y + "px";

            }
        },


        /**
         * Layout.addWidget
         *
         * Adds the given widget to the layout.
         * @param widget: Widget/element to be added.
         */
        addWidget: function(widget){
            mother.appendChild(widget.element);
            widget.element.addEventListener("transitionend", function(){
                if(widget.resetting) widget.resetting = false;
                if(collider!=null&&collider.id!=widget.id&&widget.pushing==true){
                    //resolve_drag(collider);
                    widget.pushing = false;
                    //widget.pushed = !widget.pushed;
                }
                resetWidget(widget.element);
                Layout.freePushed();
            }, false);
            addedWidgets.push(widget);

            //if(widget.resizeListener!=null) widget.resizeListener();
        },

        /**
         * Layout.removeWidget
         *
         * Removes the given widget from the layout.
         * @param element: Element/widget to be removed
         */
        removeWidget: function(element){
            var widget = this.findWidget(element.id);
            var index = addedWidgets.indexOf(widget);
            if (index != -1 && widget.id!=0) {
                addedWidgets.splice(index, 1);
                mother.removeChild(widget.element);
                Layout.reset();
            }
        },
        /**
         * Layout.toggle
         *
         * Toggles the visibility of Scribe's layout grid.
         * @param visibility: boolean value to set visibility
         */
        toggle: function(visibility){
            var canvas = document.getElementById("grid");
            console.debug("V: "+ visibility);
            if(visibility) {
                canvas.style.opacity = '1';
            }
            else {
                canvas.style.opacity = '0';
            }
        },

        /**
         * Layout.activatePins
         *
         * Switches between the normal and minimalist mode of Scribe.
         *
         * @param visibility: boolean value to set mode
         */
        activatePins: function(activity){

            this.pinActivated = activity;

            for(var i = 0; i<addedWidgets.length; i++){
                var widget = addedWidgets[i];
                var widgetElement = widget.element;

                if(widget.pinned == false || widget.pinned == null){
                    if(activity){
                        widgetElement.style.opacity = '0';
                    }
                    else{
                        widgetElement.style.opacity = '1';
                    }
                }

            }
        },

        // Layout Tools (Self Explanatory)
        findX: function(column){
            return Math.round(column*(cellWidth+cellOffset) + 2);
        },

        findY: function(row){
            return Math.round(row*(cellHeight+cellOffset) + 2);
        },

        findRow: function(y){
            return Math.round(y/cellHeight);
        },

        findCol: function(x){
            return Math.round(x/cellWidth);
        },

        findNearestRow: function(y){
            return this.findY(this.findRow(y));
        },

        findNearestCol:  function(x){
            return this.findX(this.findCol(x));
        },

        findWidget: function(id){
            for(var i = 0; i<addedWidgets.length; i++){
                if(addedWidgets[i].id==id) return addedWidgets[i];
            }
            return null;
        },

        /**
         * Layout.setCollider
         *
         * Set the collider, or the dragged element, during a drag.
         * @param element
         */
        setCollider: function(element){
            collider = element;
        },

        /**
         * Layout.dragElement
         *
         * The function is called whenever a widget is dragged across the layout.
         * It resolves drags and collisions of widgets by iterating through the entire addedWidgets array.
         *
         * @param dragElement: The dragged widget (collider).
         */
        dragWidget: function(dragElement){

            //Set Element as "collider" to avoid comparing itself.
            this.setCollider(dragElement);

            //The bound where the dragged widget is headed.
            var target = prepElement(dragElement);

            //Iterate through the addedWidgets to apply the necessary actions.
            for(var i = 0; i<addedWidgets.length; i++){

                var iWidget = addedWidgets[i];
                var iElement = iWidget.element;

                if(iElement.id!=collider.id&&!iWidget.pushing){

                    //Current state of iterated widget bounds.
                    var iCurrent = prepElement(iElement);

                    //Check to see if they are intersecting each other.
                    if(pointIntersections(target,iCurrent)){

                        if(!iWidget.pinned) iElement.style.opacity = '1';

                        var direction;
                        var pushed = false;

                        var x = parseFloat(iElement.getAttribute('data-start_x')) || 0;
                        var y = parseFloat(iElement.getAttribute('data-start_y')) || 0;


                        //Original bounds of iterated widget.
                        var iHome = prepWidget(iWidget);

                        var dBot = target.row + (target.height + 1) - iHome.row;
                        var dRight = target.col + (target.width + 1) - iHome.col;
                        var dTop = target.row - (iHome.height + 1) - iHome.row;
                        var dLeft = target.col - (iHome.width + 1) - iHome.col;

                        var push_direction = findPushDirection(target.rect, iHome.rect);

                        switch(push_direction) {
                            case 'up':
                                if(iCurrent.row>0 && detectChainCollisions(iWidget, 0, dTop)
                                    &&Math.abs(dTop)<=iCurrent.height+target.height+1){
                                    direction = "up " + dTop ;
                                    if(iCurrent.row-dTop>=0) y += (cellHeight + 5) * dTop;
                                    iWidget.pushedRow = dTop;
                                    pushed = true;
                                }
                                if(!pushed&&iCurrent.row+iCurrent.height+1<gridRows && detectChainCollisions(iWidget, 0, dBot)
                                    &&Math.abs(dBot)<=iCurrent.height+target.height+1){
                                    direction = "down " + dBot;
                                    if(iCurrent.row-dBot<gridRows-iCurrent.height+1) y += (cellHeight + cellOffset) * dBot;
                                    iWidget.pushedRow = dBot;
                                    pushed = true;
                                }
                                break;

                            case 'down':
                                if(!pushed&&iCurrent.row+iCurrent.height+1<gridRows && detectChainCollisions(iWidget, 0, dBot)
                                    &&Math.abs(dBot)<=iCurrent.height+target.height+1){
                                    direction = "down " + dBot;
                                    if(iCurrent.row-dBot<gridRows-iCurrent.height+1) y += (cellHeight + cellOffset) * dBot;
                                    iWidget.pushedRow = dBot;
                                    pushed = true;
                                }
                                if(!pushed&&iCurrent.row>0 && detectChainCollisions(iWidget, 0, dTop)
                                    &&Math.abs(dTop)<=iCurrent.height+target.height+1){
                                    direction = "up " + dTop ;
                                    if(iCurrent.row-dTop>=0) y += (cellHeight + 5) * dTop;
                                    iWidget.pushedRow = dTop;
                                    pushed = true;
                                }
                                break;

                            case 'left':
                                if(!pushed&&iCurrent.col>0  && detectChainCollisions(iWidget, dLeft, 0)
                                    &&Math.abs(dLeft)<=iCurrent.width+target.width+1){
                                    direction = "left " + dLeft;
                                    if(iCurrent.col-dLeft>=0) x += (cellWidth + 5) * dLeft;
                                    iWidget.pushedCol = dLeft;
                                    pushed = true;
                                }
                                if(!pushed&&iCurrent.col+iCurrent.width+1<gridCols  && detectChainCollisions(iWidget, dRight, 0)
                                    &&Math.abs(dRight)<=iCurrent.width+target.width+1){
                                    direction = "right " + dRight;
                                    if(iCurrent.col-dRight<gridCols-iCurrent.width+1) x += (cellWidth + cellOffset) * dRight;
                                    iWidget.pushedCol = dRight;
                                    pushed = true;
                                }
                                break;

                            case 'right':
                                if(!pushed&&iCurrent.col+iCurrent.width+1<gridCols && detectChainCollisions(iWidget, dRight, 0)
                                    &&Math.abs(dRight)<=iCurrent.width+target.width+1){
                                    direction = "right " + dRight;
                                    if(iCurrent.col-dRight<gridCols-iCurrent.width+1) x += (cellWidth + cellOffset) * dRight;
                                    iWidget.pushedCol = dRight;
                                    pushed = true;
                                }
                                if(!pushed&&iCurrent.col>0 && detectChainCollisions(iWidget, dLeft, 0)
                                    && Math.abs(dLeft)<=iCurrent.width+target.width+1) {
                                    direction = "left " + dLeft;
                                    if(iCurrent.col-dLeft>=0) x += (cellWidth + 5) * dLeft;
                                    iWidget.pushedCol = dLeft;
                                    pushed = true;
                                }
                                break;
                        }

                        if(pushed){
                            //Transform Widget to position.
                            iElement.style.webkitTransform = 'translate(' + x + 'px, ' + y + 'px)';

                            //Update widget attributes.
                            iWidget.column += x/(cellWidth+cellOffset);
                            iWidget.row += y/(cellHeight+cellOffset);
                            iWidget.pushed = true;
                            iWidget.pushing = true;

                            //Update widget element attributes.
                            iElement.setAttribute('data-x', x);
                            iElement.setAttribute('data-y', y);
                        }
                    }
                }

            }

        },

        /**
         * Layout.isValidHome
         *
         * Checks to see if coordinates are occupied.
         *
         * @param element
         * @returns {boolean}
         */
        isValidHome: function(element){

            var elementRect = element.getBoundingClientRect();

            for(var i = 0; i<addedWidgets.length; i++){
                //Makes sure element isn't compared to itself.
                if(element.id != addedWidgets[i].id){
                    var clientRect = addedWidgets[i].element.getBoundingClientRect();
                    if(intersectRect(elementRect, clientRect)) {
                        return false;
                    }
                }
            }
            return true;
        },

        /**
         * Layout.freePushed
         *
         * Iterates through widgets to see if their homes are available.
         */
        freePushed: function(){

            if(collider==null) {
                //console.debug("useless call");
                return;
            }

            for(var i = 0; i<addedWidgets.length; i++){

                var iWidget = addedWidgets[i];

                if(collider.id!=iWidget.id&&!iWidget.pushing){

                    var iterations = 0;
                    var iElement = document.getElementById(iWidget.id);
                    var iComp = prepWidget(iWidget);

                    var x = (parseFloat(iElement.getAttribute('data-start_x')) || 0);
                    var y = (parseFloat(iElement.getAttribute('data-start_y')) || 0);

                    //p prefix means pushed value, contrary to the normal one which is its home (original) value

                    var px = x, py = y;

                    var tOffs = (cellHeight + 5);
                    var lOffs = (cellWidth + 5);
                    var rOffs = (cellWidth + cellOffset);
                    var bOffs = (cellHeight + cellOffset);

                    var pc = iWidget.pushedCol;
                    var pr = iWidget.pushedRow;

                    // Multiples to emulate one grid movement
                    var cMult = 0;
                    var rMult = 0;

                    //Iterate movement from 1 to see if home is free
                    while(cMult!=pc||pr!=rMult){

                        if(pc>0&&pc!=cMult){
                            if(iterations>0){
                                cMult += 1;
                                x += rOffs;
                                iComp.col++;
                            }
                        }
                        if(pc<0&&pc!=cMult){
                            if(iterations>0){
                                cMult -= 1;
                                x -= lOffs;
                                iComp.row--;
                            }
                        }
                        if(pr>0&&pr!=rMult){
                            if(iterations>0){
                                rMult += 1;
                                y += bOffs;
                                iComp.row++;
                            }
                        }
                        if(pr<0&&pr!=rMult){
                            if(iterations>0){
                                rMult -= 1;
                                y -= tOffs;
                                iComp.row--;
                            }
                        }

                        if(isAvailableArea(iWidget, iComp)){

                            //Check to see there is a need to be freed.
                            if(parseInt(iElement.getAttribute('data-x'))==x && parseInt(iElement.getAttribute('data-y'))==y){
                                console.debug("FALSE REPORT");
                                //reset
                                iWidget.column += Math.abs(x/(cellWidth+5));
                                iWidget.row += Math.abs(y/(cellHeight+cellOffset));
                                break;
                            }


                            iElement.style.webkitTransform ='translate(' + x + 'px, ' + y + 'px)';

                            //Update widget attributes.
                            iWidget.column += Math.abs(x/(cellWidth+5));
                            iWidget.row += Math.abs(y/(cellHeight+cellOffset));


                            if(x==px && y==py){
                                //reset
                                iWidget.pushed = false;
                                iWidget.pushedCol = 0;
                                iWidget.pushedRow = 0;
                                console.debug("original");
                            };

                            iElement.setAttribute('data-x', x);
                            iElement.setAttribute('data-y', y);
                            break;

                        }
                        iterations++;
                    }
                    if(iWidget.pushedCol == 0&&
                        iWidget.pushedRow == 0){
                        //reset pushed state
                        iWidget.pushed = false;
                    }
                }
            }
        },

        /**
         * Layout.reset
         *
         * Resets the layout so future drag events can occur normally.
         */
        reset: function(){
            collider = null;
            for(var i = 0; i<addedWidgets.length; i++){
                var widget = addedWidgets[i];
                var widgetElement = document.getElementById(widget.id);

                if(this.pinActivated && !widget.pinned) widgetElement.style.opacity = '0';

                var x = widgetElement.getAttribute("data-x");
                var y = widgetElement.getAttribute("data-y");
                widgetElement.setAttribute("data-start_x",x);
                widgetElement.setAttribute("data-start_y",y);

                resetWidget(widgetElement);
                widget.homeRect = widgetElement.getBoundingClientRect();
                widget.linked_collider = null;
                widget.pushed = false;
                widget.pushing = false;
                widget.pushedCol = 0;
                widget.pushedRow = 0;

            }

            Mainframe.config.set("general.layout", {});
            addedWidgets.forEach(function(widget){
                console.debug("TESTING:", widget.id + ": " + widget.column + ", " + widget.row + ", " + widget.width + ", " + widget.height);
                Mainframe.config.set(("general.layout."+widget.id.toString()), {column: widget.column , row: widget.row, width: widget.width, height: widget.height});
            });
        },

        mother: document.getElementById('parent'),
        gridCols: 8,
        gridRows: 5,
        screenWidth: document.getElementById('parent').getBoundingClientRect().width,
        screenHeight: document.getElementById('parent').getBoundingClientRect().height,
        cellOffset: 5,
        cellWidth: screenWidth/8-cellOffset,
        cellHeight: screenHeight/5-cellOffset,
        addedWidgets: addedWidgets

    };

})();