/**
 * Created by JohnBae on 7/8/16.
 */
function displaySettings() {
    var self = this;
    var parentContainer, currentContainer, currentChildren = [], sizeFactor, fillWidth;

    function validateWidgets(){
        var widgetData = Mainframe.widgets;
        var portraits = [];
        widgetData.forEach(function(widgetDatum){

            var endFunction;

            var widgetPortrait = document.createElement('div');
            widgetPortrait.style.marginBottom = '10px';
            widgetPortrait.style.height = '125px';
            widgetPortrait.style.width = '125px';

            widgetPortrait.style.color = 'white';
            widgetPortrait.style.Backgroundcolor = 'white';
            widgetPortrait.style.position = 'absolute';

            var portrait = document.createElement('div');
            console.log(widgetDatum.portrait)
            portrait.style.background = 'url("node_modules/'+ widgetDatum.portrait + '") no-repeat';
            portrait.style.backgroundColor = 'white';
            portrait.style.backgroundSize = 'contain';
            portrait.style.backgroundPosition = 'center';
            portrait.style.position = 'absolute';
            portrait.style.top = 0;
            portrait.style.color = 'black';
            portrait.style.width = '100%';
            portrait.style.height = 'calc(100% - 25px)';
            if(Layout.findWidget(widgetDatum.main.widget.id)){
                widgetDatum.main.widget.endFunctions.splice(widgetDatum.main.widget.endFunctions.indexOf(endFunction),1);
                widgetDatum.main.widget.endFunctions.push(function(){
                    portrait.style.border = 'none';
                    portraitInteract();
                });
                portrait.style.border = '3px solid #448AFF';
            }
            else portrait.style.border = 'none';
            widgetPortrait.appendChild(portrait);

            var title = document.createElement('div');
            title.className = 'themeTextColor';
            title.style.position = 'absolute';
            title.style.width = '100%';
            title.style.top = 'calc(100% - 25px)';
            title.style.textAlign = 'center';
            title.textContent = widgetDatum.json.name;
            widgetPortrait.appendChild(title);

            var portraitInteract = function(){

                var placeHolder = null;

                var offset = 0;
                var viewportHeight = 0;

                //Adjusted with context, deltaSource, and .origin() to help with parent offset.
                var widgetInteract = Mainframe.interact(widgetPortrait, {context: parentContainer, deltaSource: parentContainer})
                    .draggable({
                        autoScroll:true,
                        inertia:true,
                        snap: {
                            targets: [
                                function () {
                                    //Applying manual offset.
                                    if(parentContainer.scrollTop != 0) offset = parentContainer.scrollTop;
                                    return { x: parseInt(widgetPortrait.style.left) + 20, y: parseInt(widgetPortrait.style.top) + 55, range: Infinity };
                                }
                            ],
                            relativePoints: [ { x: 0, y: 0 } ],
                            endOnly: true
                        },
                        onstart: function(event){
                            placeHolder = widgetPortrait.cloneNode(true);
                            placeHolder.style.opacity = '.3';
                            currentContainer.appendChild(placeHolder);
                            viewportHeight = parentContainer.getBoundingClientRect().height;
                            widgetPortrait.style.zIndex = '5';
                        },
                        onmove: function(event) {
                            widgetPortrait.style.webkitTransition =  "all 0s ease ";
                            widgetPortrait.style.transition =  "all 0s ease";
                            dragMoveListener(event);
                        },
                        onend: function(){
                            currentContainer.removeChild(placeHolder);
                            widgetPortrait.style.webkitTransition =  "all .5s ease ";
                            widgetPortrait.style.transition =  "all .5s ease";
                            widgetPortrait.style.transformOrigin = '0 0';
                            widgetPortrait.style.zIndex = '1';

                        }
                    })
                    .origin(parentContainer);

                var dragMoveListener = function(event) {

                    var target = event.target;
                    var x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx,
                        y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

                    target.style.webkitTransform = 'translate(' + x + 'px, ' + y + 'px)';
                    target.setAttribute('data-x', x);
                    target.setAttribute('data-y', y);

                    //Checks to see if out of bounds.
                    if(event.clientX>parentContainer.getBoundingClientRect().width||
                        event.clientX<0||
                        event.clientY>parentContainer.getBoundingClientRect().height||
                        event.clientY<0){

                        //Begin widget conversion
                        currentContainer.removeChild(widgetPortrait);
                        var newContainer = portraitToWidget(widgetDatum.main.widget, event);

                        //Initialize offsets and disable previous interact function.
                        var offsetX = currentContainer.getBoundingClientRect().left + event.clientX/1000,
                            offsetY = currentContainer.getBoundingClientRect().top + event.clientY/1000;
                        widgetInteract.unset();

                        //New draggable function that moves the widget instead of the noteObject.
                        widgetInteract.draggable({
                            inertia:true,
                            snap: {
                                targets: [
                                    function (x,y) {
                                        return { x: x, y: y, range: Infinity };
                                    }
                                ],
                                relativePoints: [ { x: 0, y: 0 } ],
                                endOnly: true
                            },
                            onmove: function(event) {

                                var target = newContainer.element,
                                    x = (parseFloat(target.getAttribute('data-x')) || - offsetX) + event.dx,
                                    y = (parseFloat(target.getAttribute('data-y')) || - offsetY) + event.dy;

                                target.style.webkitTransform = target.style.transform = 'translate(' + x + 'px, ' + y + 'px)';

                                target.setAttribute('data-x', x);
                                target.setAttribute('data-y', y);

                                if(event.velocityX<750&&event.velocityY<750){
                                    Layout.dragWidget(target);
                                }
                                Layout.freePushed();
                            },
                            onend: function (event) {

                                var target = newContainer.element;

                                target.style.webkitTransition =  "all .5s ease";
                                target.style.zIndex = 1;

                                var x = parseInt(target.getAttribute("data-x"));
                                var y = parseInt(target.getAttribute("data-y"));

                                x += Layout.findNearestCol(target.getBoundingClientRect().left) - target.getBoundingClientRect().left;
                                y += Layout.findNearestRow(target.getBoundingClientRect().top) - target.getBoundingClientRect().top;

                                target.style.webkitTransform = target.style.transform = 'translate(' + x + 'px, ' + y + 'px)';

                                target.setAttribute('data-x', x);
                                target.setAttribute('data-y', y);

                                var endHandler = function(){
                                    if(!Layout.isValidHome(target)){
                                        Layout.removeWidget(newContainer);
                                        widgetInteract.set();
                                    }
                                    else{
                                        Layout.findWidget(target.id).interact();
                                        portrait.style.border = '3px solid #448AFF';
                                    }
                                    widgetPortrait.style.left = placeHolder.style.left;
                                    widgetPortrait.style.top = placeHolder.style.top;
                                    widgetPortrait.style.webkitTransform = 'translate(0px, 0px)';
                                    currentContainer.removeChild(placeHolder);
                                    currentContainer.appendChild(widgetPortrait)
                                    widgetPortrait.style.zIndex = '1';
                                    Layout.toggle(false);
                                    widgetPortrait.setAttribute('data-x', 0);
                                    widgetPortrait.setAttribute('data-y', 0);
                                    target.removeEventListener("transitionend", endHandler);
                                }

                                target.addEventListener("transitionend", endHandler);
                                Layout.reset();
                            }
                        })
                            .on("draginertiastart", function(event){
                                Layout.toggle(false);
                            })
                            .origin(document.getElementById('parent'));

                        Layout.reset();
                        Layout.setCollider(newContainer.element);

                        var x = (parseFloat(target.getAttribute('data-x')) || - offsetX) + event.dx;
                        var y = (parseFloat(target.getAttribute('data-y')) || - offsetY) + event.dy;
                        target.setAttribute("data-start_x", x);
                        target.setAttribute("data-start_y", y);

                        newContainer.element.style.position = 'fixed';
                        newContainer.element.style.webkitTransition =  "all 0s ease ";
                        newContainer.element.style.zIndex = 3;

                        Layout.toggle(true);
                    }

                };

                return widgetInteract;
            };
            portraitInteract();

            function portraitToWidget(widget, event){

                endFunction = function(){
                    portrait.style.border = 'none';
                    portraitInteract();
                }
                widget.endFunctions.push(endFunction);
                widget.initialize(null);
                widget.setSize(widget.minWidth,widget.minHeight);
                Layout.addWidget(widget);

                if(event.clientX>currentContainer.getBoundingClientRect().width){
                    widget.element.style.left = currentContainer.getBoundingClientRect().left + event.clientX - Layout.cellWidth*(widget.minWidth/2) + "px";
                    widget.element.style.top = currentContainer.getBoundingClientRect().top + event.clientY - Layout.cellHeight*(widget.minHeight/2) + "px";
                }
                else if(event.clientX<0){
                    widget.element.style.left = currentContainer.getBoundingClientRect().left - event.clientX - Layout.cellWidth*(widget.minWidth/2) + "px";
                    widget.element.style.top = currentContainer.getBoundingClientRect().top + event.clientY - Layout.cellHeight*(widget.minHeight/2) + "px";
                }
                else if(event.clientY>parent.getBoundingClientRect().height){
                    widget.element.style.left = currentContainer.getBoundingClientRect().left + event.clientX/2 + "px";
                    widget.element.style.top = currentContainer.getBoundingClientRect().top + event.clientY + "px";
                }
                else if(event.clientY<0){
                    widget.element.style.left = currentContainer.getBoundingClientRect().left + event.clientX/2 + "px";
                    widget.element.style.top = currentContainer.getBoundingClientRect().top - event.clientY - 25 + "px";
                }

                return widget;
            }

            portraits.push(widgetPortrait);
        })
        return portraits;
    };

    function validateLayouts(){
        var layoutData = Mainframe.layouts;
        var portraits = [];
        layoutData.forEach(function(layoutDatum){
            var widgetPortrait = document.createElement('div');
            widgetPortrait.style.marginBottom = '10px';
            widgetPortrait.style.height = '250px';
            widgetPortrait.style.width = '250px';
            widgetPortrait.style.color = 'white';
            widgetPortrait.style.Backgroundcolor = 'white';
            widgetPortrait.style.position = 'absolute';

            var button = document.createElement('button');
            button.style.position = 'absolute';
            button.style.background = 'red';
            button.style.width = '25px';
            button.style.height = '25px';
            button.style.top = 0;
            button.style.left = 0;
            button.innerHTML = 'x';
            button.style.lineHeight = '25px';
            button.style.outline = 'none';
            button.style.border = 'none';
            button.style.borderRadius = '30px';
            button.style.zIndex = '2';
            button.style.visibility = 'hidden';
            widgetPortrait.appendChild(button);

            var portrait = document.createElement('div');
            //portrait.style.background = 'url("node_modules/'+ widget.portrait + '") no-repeat';
            //portrait.style.backgroundSize = '100% 100%';
            portrait.style.position = 'absolute';
            portrait.style.background = 'white';
            portrait.style.top = 0;
            portrait.style.color = 'black';
            portrait.style.width = '100%';
            portrait.style.height = 'calc(100% - 25px)';
            widgetPortrait.addEventListener('mouseover',function(){
                button.style.top = 1 + 'px';
                button.style.left = widgetPortrait.getBoundingClientRect().width - 26 + 'px';;
                button.style.visibility = 'visible';
            })
            widgetPortrait.addEventListener('mouseout',function(){
                button.style.visibility = 'hidden';
            })
            portrait.addEventListener('click',function(){

                var widgets = Layout.addedWidgets.slice();
                widgets.forEach(function(widget){
                    Layout.removeWidget(widget);
                    console.debug("Removing Widget:",widget.id);
                });

                for (var key in layoutDatum) {
                    if(key!='name'){
                        if (layoutDatum.hasOwnProperty(key)) {
                            var duh = key;
                            var val = layoutDatum[key];
                            var widget = Layout.findWidget(key);

                            if(widget){
                                widget.setSize(val.width,val.height);
                                widget.setLocation(val.column,val.row);
                            }
                            else{
                                var data = Mainframe.widgets;
                                console.debug("Widget Iterating");
                                data.forEach(function(datum){
                                    console.debug("Widget:",datum.main.widget.id,"key:",duh);
                                    if(datum.main.widget.id==duh){
                                        widget = datum.main.widget;
                                        console.debug("Layout Added Widget",widget.id);
                                        Layout.addWidget(widget);
                                        widget.setSize(val.width,val.height);
                                        widget.setLocation(val.column,val.row);
                                        if(widget.resizeListener!=null) {
                                            console.debug("RESIZING WIDGET FROM LAYOUT");
                                            widget.resizeListener();
                                        }

                                        /*if(val.child && datum.main.widget.createChild!=null){
                                         console.debug("CHILDREN at",duh);
                                         for(var key in val.child){
                                         console.debug("CHILD!");
                                         if(!widget.createChild(key,val.child[key])){
                                         delete val.child[key];
                                         }
                                         }
                                         }*/
                                    }
                                });
                            }
                        }
                    }

                }
                setTimeout(function(){
                    Layout.reset();
                },600)
                console.debug("Final List:",Layout.addedWidgets);
            });
            widgetPortrait.appendChild(portrait);

            var title = document.createElement('input');
            title.placeholder = 'Insert Name';
            title.style.background = 'white';
            title.style.color = 'black';
            title.style.border = 'none';
            title.style.outline = 'none';
            title.style.position = 'absolute';
            title.style.width = '100%';
            title.style.left = '0px';
            title.style.top = 'calc(100% - 25px)';
            title.style.textAlign = 'center';
            title.value = layoutDatum.name;
            title.addEventListener('keydown',function(e){
                var key = e.which || e.keyCode;
                if (key === 13) checkValidity();
            });
            title.addEventListener('blur',function(){
                checkValidity();
            });
            function checkValidity(){
                if(title.value.length>0) {

                }
                else {
                    currentContainer.removeChild(widgetPortrait);
                    currentChildren.splice(currentChildren.indexOf(widgetPortrait),1);
                }
                title.blur();
            };

            button.addEventListener("click", function(){
                currentChildren.splice(currentChildren.indexOf(widgetPortrait),1);

                var path = Mainframe.layoutDir + "/" + title.value + ".json";

                Mainframe.fs.unlinkSync(path);
                Mainframe.rebuildLayouts();
                revalidateGUI();
            });
            widgetPortrait.appendChild(title);

            portraits.push(widgetPortrait);
        });

        return portraits;
    };

    function addLayout(){
        var widgetPortrait = document.createElement('div');
        widgetPortrait.style.marginBottom = '10px';
        widgetPortrait.style.height = '250px';
        widgetPortrait.style.width = '250px';
        widgetPortrait.style.color = 'white';
        widgetPortrait.style.Backgroundcolor = 'white';
        widgetPortrait.style.position = 'absolute';

        var portrait = document.createElement('div');
        //portrait.style.background = 'url("node_modules/'+ widget.portrait + '") no-repeat';
        //portrait.style.backgroundSize = '100% 100%';
        portrait.style.position = 'absolute';
        portrait.style.background = 'gray';
        portrait.style.top = 0;
        portrait.style.color = 'black';
        portrait.style.width = '100%';
        portrait.style.height = 'calc(100% - 25px)';
        widgetPortrait.appendChild(portrait);

        var title = document.createElement('input');
        title.placeholder = 'Insert Name';
        title.style.background = 'white';
        title.style.color = 'black';
        title.style.border = 'none';
        title.style.outline = 'none';
        title.style.position = 'absolute';
        title.style.width = '100%';
        title.style.left = '0px';
        title.style.top = 'calc(100% - 25px)';
        title.style.textAlign = 'center';
        title.addEventListener('keydown',function(e){
            var key = e.which || e.keyCode;
            if (key === 13) checkValidity();
        });
        title.addEventListener('blur',function(){
            checkValidity();
        });
        function checkValidity(){
            if(title.value.length>0) {
                var path = Mainframe.layoutDir;
                var newLayoutScheme = new Mainframe.electronSettings({configFileName: title.value, configDirPath: path});
                newLayoutScheme.set('name',title.value);
                Layout.addedWidgets.forEach(function(widget){
                    newLayoutScheme.set(widget.id.toString(), {column: widget.column , row: widget.row, width: widget.width, height: widget.height});
                })
                console.debug("Rebuilt");
            }
            title.blur();
            setTimeout(function(){
                Mainframe.rebuildLayouts();
                currentChildren = validateLayouts();
                revalidateGUI();
            },500);


        };
        function checkName(){
            var name = title.value;
        }
        widgetPortrait.appendChild(title);

        currentChildren.push(widgetPortrait);
        revalidateGUI();
        title.focus();
    }

    function validateThemes(){

        console.debug(Mainframe.themes);
        var themeData = Mainframe.themes;
        var portraits = [];
        themeData.forEach(function(themeDatum){
            var themePortrait = document.createElement('div');
            themePortrait.style.marginBottom = '10px';
            themePortrait.style.height = '250px';
            themePortrait.style.width = '100%';
            themePortrait.style.color = 'white';
            themePortrait.style.background = 'url("node_modules/'+ themeDatum.portrait + '") no-repeat';
            themePortrait.style.backgroundColor = 'white';
            themePortrait.style.backgroundSize = 'contain';
            themePortrait.style.backgroundPosition = 'center';
            themePortrait.style.position = 'absolute';

            var title = document.createElement('div');
            title.style.background = 'rgba(255, 255, 255, 0.0)';
            title.style.color = 'black';
            title.style.textAlign = 'left';
            title.style.border = 'none';
            title.style.outline = 'none';
            title.style.position = 'absolute';
            title.style.height = '25px';
            title.style.width = '100%';
            title.style.left = '0px';
            title.style.top = '0px';
            title.style.paddingLeft = '10px';
            title.textContent = themeDatum.json.name;
            themePortrait.appendChild(title);

            var button = document.createElement('button');
            button.style.position = 'absolute';
            button.style.background = 'red';
            button.style.width = '25px';
            button.style.height = '25px';
            button.style.top = 0;
            button.style.left = 0;
            button.innerHTML = 'x';
            button.style.lineHeight = '25px';
            button.style.outline = 'none';
            button.style.border = 'none';
            button.style.borderRadius = '30px';
            button.style.zIndex = '2';
            button.style.visibility = 'hidden';
            //themePortrait.appendChild(button);

            var portrait = document.createElement('div');
            //portrait.style.background = 'url("node_modules/'+ widget.portrait + '") no-repeat';
            //portrait.style.backgroundSize = '100% 100%';
            portrait.style.position = 'absolute';
            portrait.style.background = 'red';
            portrait.style.top = '25px';
            portrait.style.color = 'black';
            portrait.style.minWidth = '150px';
            portrait.style.width = '30%';
            portrait.style.height = 'calc(100% - 25px)';
            themePortrait.addEventListener('click',function(){
                document.getElementById('themeCss').href = themeDatum.css;
                Mainframe.config.set('general.theme',themeDatum.css);
                Mainframe.updateTheme(themeDatum.json.name);
            });
            //themePortrait.appendChild(portrait);

            portraits.push(themePortrait);
        });

        var testBox3 = document.createElement('div');
        testBox3.style.marginBottom = '10px';
        testBox3.style.height = '125px';
        testBox3.style.width = '100%';
        testBox3.style.background = '#424242';

        return portraits;
    };

    function revalidateGUI(){

        if(currentChildren==null||currentContainer==null) return;

        while(currentContainer.firstChild) currentContainer.removeChild(currentContainer.firstChild);

        var gap = 20;

        var totalWidth = currentContainer.getBoundingClientRect().width;

        var maxCol = Math.floor(totalWidth/(Layout.cellWidth*sizeFactor));

        var availWidth = totalWidth - (gap * (maxCol -1));

        var childDimension = availWidth/maxCol;

        var row = 0, col = 0, width, height = childDimension;

        if(fillWidth) width = '100%';
        else width = childDimension;

        for(var i = 0; i<currentChildren.length; i++){
            var child = currentChildren[i];

            if(!fillWidth) col = i%maxCol * (childDimension + gap);
            else col = 0;
            if(!fillWidth) row = Math.floor(i/maxCol) * (childDimension + gap);
            else row = i * (childDimension + gap);

            child.style.width = width + 'px';
            child.style.height = height + 'px';
            child.style.top = row + 'px';
            child.style.left = col+ 'px';
            currentContainer.appendChild(child);
        }
    }

    widgetPortraits = validateWidgets();

    return{
        widgets: function(){
            sizeFactor = .8;
            currentChildren = [];
            fillWidth = false;

            var displayContainer = document.createElement('div');
            displayContainer.className = 'themeTextColor';
            displayContainer.style.height = '100%';
            displayContainer.style.width = '100%';
            displayContainer.style.overflow = 'visible';

            var title = document.createElement('div');
            title.textContent = 'Widgets';
            title.style.paddingTop = '5px';
            title.style.fontSize = '25px';
            title.style.textAlign = 'left';
            title.style.marginBottom = '15px';
            displayContainer.appendChild(title);

            var searchField = document.createElement('input');
            searchField.className = 'inputField themeTextColor themePrimaryColor';
            searchField.style.height = '25px';
            searchField.style.width = '100%';
            searchField.placeholder = 'Search Widgets';
            searchField.style.background = 'whitesmoke';
            searchField.style.color = 'black';
            searchField.style.marginBottom = '15px';
            //displayContainer.appendChild(organize);

            var contentScrollPane = document.createElement('div');
            contentScrollPane.style.height = 'calc(100% - 100px)';
            contentScrollPane.style.width = '100%';
            contentScrollPane.style.overflowY = 'scroll';
            displayContainer.appendChild(contentScrollPane);

            var contentBox = document.createElement('div');
            contentBox.style.overFlow = 'visible';
            contentBox.style.position = 'relative';
            contentBox.style.height = '100%';
            contentBox.style.width = '100%';
            contentScrollPane.appendChild(contentBox);

            currentContainer = contentBox;
            currentChildren = validateWidgets();

            parentContainer.appendChild(displayContainer);
            this.revalidateGUI();
            parentContainer.removeChild(displayContainer);

            return displayContainer;
        },
        validateWidgets: validateWidgets,

        layout: function(){

            sizeFactor = 1.25;
            fillWidth = false;
            currentChildren = [];

            var displayContainer = document.createElement('div');
            displayContainer.className = 'themeTextColor';
            displayContainer.style.height = '100%';
            displayContainer.style.width = '100%';
            displayContainer.style.overflow = 'visible';

            var title = document.createElement('div');
            title.textContent = 'Layout';
            title.style.paddingTop = '5px';
            title.style.fontSize = '25px';
            title.style.textAlign = 'left';
            title.style.marginBottom = '15px';
            displayContainer.appendChild(title);

            var organize = document.createElement('input');
            organize.className = 'inputField themeTextColor themePrimaryColor';
            organize.style.height = '25px';
            organize.style.width = '100%';
            organize.placeholder = 'Search Layouts';
            organize.style.background = 'whitesmoke';
            organize.style.color = 'black';
            organize.style.marginBottom = '15px';
            //displayContainer.appendChild(organize);

            var contentScrollPane = document.createElement('div');
            contentScrollPane.style.height = 'calc(100% - 100px)';
            contentScrollPane.style.width = '100%';
            contentScrollPane.style.overflowY = 'scroll';
            displayContainer.appendChild(contentScrollPane);

            var contentBox = document.createElement('div');
            contentBox.style.overFlow = 'visible';
            contentBox.style.position = 'relative';
            contentBox.style.height = '100%';
            contentBox.style.width = '100%';
            contentScrollPane.appendChild(contentBox);

            var button = document.createElement('button');
            button.className = 'mui-btn mui-btn--small mui-btn--primary mui-btn--fab';
            button.id = 'hubDisplayAddButton';
            button.innerHTML = '+';
            button.addEventListener("click", function(){
                addLayout();
            });

            displayContainer.appendChild(button);

            currentContainer = contentBox;
            currentChildren = validateLayouts();

            parentContainer.appendChild(displayContainer);
            this.revalidateGUI();
            parentContainer.removeChild(displayContainer);

            return displayContainer;
        },

        themes: function(){

            sizeFactor = 1.25;
            fillWidth = true;
            currentChildren = [];

            var displayContainer = document.createElement('div');
            displayContainer.className = 'themeTextColor';
            displayContainer.style.height = '100%';
            displayContainer.style.width = '100%';
            displayContainer.style.overflow = 'visible';

            var title = document.createElement('div');
            title.textContent = 'Themes';
            title.style.paddingTop = '5px';
            title.style.fontSize = '25px';
            title.style.textAlign = 'left';
            title.style.marginBottom = '15px';
            displayContainer.appendChild(title);

            var organize = document.createElement('input');
            organize.className = 'inputField themeTextColor themePrimaryColor';
            organize.style.height = '25px';
            organize.style.width = '100%';
            organize.placeholder = 'Search Themes';
            organize.style.background = 'whitesmoke';
            organize.style.color = 'black';
            organize.style.marginBottom = '15px';
            //displayContainer.appendChild(organize);

            var contentScrollPane = document.createElement('div');
            contentScrollPane.style.height = 'calc(100% - 100px)';
            contentScrollPane.style.width = '100%';
            contentScrollPane.style.overflowY = 'scroll';
            displayContainer.appendChild(contentScrollPane);

            var contentBox = document.createElement('div');
            contentBox.style.overFlow = 'visible';
            contentBox.style.position = 'relative';
            contentBox.style.height = '100%';
            contentBox.style.width = '100%';
            contentScrollPane.appendChild(contentBox);

            currentContainer = contentBox;
            currentChildren = validateThemes();

            parentContainer.appendChild(displayContainer);
            this.revalidateGUI();
            parentContainer.removeChild(displayContainer);

            return displayContainer;
        },

        revalidateGUI: revalidateGUI,
        initialize: function(parent){
            parentContainer = parent;
        }
    }

}
module.exports = new displaySettings();