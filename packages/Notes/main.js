/**
 * Tyherox
 *
 * NoteWidget
 *
 * The widget allows users to create notes with ease and turn them into separate widgets if necessary. The widget
 * textarea is handled by the MIT licensed library prosemirror (http://prosemirror.net).
 *
 */
function NoteWidget(){

    Mainframe.cssLoader("node_modules/packages/Notes/style.css");
    var mainConfig = new Mainframe.electronSettings({configFileName:'config',configDirPath: Mainframe.packageDir +"/2"});
    const {defaultMarkdownParser, defaultMarkdownSerializer} = require("prosemirror/dist/markdown")

    // Variable for indicating note amount
    var noteID = 0;
    var notes = [];

    //Create NoteWidget HTML Elements
    var container = document.createElement('div');
    container.style.top = '25px';

    //Note search field
    var inputField = document.createElement('input');
    inputField.placeholder = "Search";
    inputField.className = 'inputField themeTextColor themeSecondaryColor';
    inputField.style.paddingRight = '30px';
    inputField.style.margin = '2px 2px 2px 2px';
    inputField.style.position = 'center';
    inputField.style.zIndex = 10;
    inputField.style.left = 0;
    inputField.addEventListener('keyup',function(){

        for(var i = 0; i<notes.length; i++){
            var noteObj = notes[i];

            var textValue = noteObj.element.textContent.toLowerCase();

            if(textValue.indexOf(inputField.value.toLowerCase())==-1){
                noteObj.element.style.display = 'none';
            }
            else{
                noteObj.element.style.display = 'block';
            }
            revalidate();
        }

    });
    container.appendChild(inputField);

    var noteContainer = document.createElement('div');
    noteContainer.id = 'noteContainer';
    noteContainer.style.marginTop = '5px';
    container.appendChild(noteContainer);

    //Build widget
    var widget = new Widget("Note", 2, container);
    this.widget = widget;
    widget.save = function(){

        for(var i = 0; i<notes.length;i++){
            var note = notes[i];
            var title = note.title.value;
            var content = note.editor.getContent('text');
            console.debug("TITLE:",title +"\n","CONTENT:",content + "\n","/*//*/");
        }


    };

    var toolbar = widget.toolbar;
    toolbar.addButton(toolbar.exit());
    toolbar.addButton(toolbar.pin());

    //Note append button
    var addNoteButton = function(){

        var button = document.createElement('button');
        button.className = 'mui-btn mui-btn--small mui-btn--primary mui-btn--fab';
        button.id = 'noteAddButton';
        button.innerHTML = '+';

        button.addEventListener("click", function(){
            addNote();
        });
        return button;
    };
    noteContainer.appendChild(addNoteButton());

    widget.initialize('packages/Notes/package.json');
    widget.setMinSize(2,2);
    widget.setMaxSize(10,10);

    var scope = document.createElement('button');
    scope.className = 'widgetToolbarButtons';
    scope.addEventListener('click',function(){
        console.debug("NOTES:",notes);
        widget.save();
    });
    widget.toolbar.addButton(scope);

    var addNote = this.addNote = function(key){
        //Build note
        var note = new noteObject(key);
        autoSave(note,note.id);
        console.debug("ADDING NOTE:",note.id);

        //Find y bound
        var yOffs = findPlace(note);

        note.element.style.top = yOffs + "px";
        note.element.style.left = 0 + "px";

        noteContainer.appendChild(note.element);
        widget.scrollTo(yOffs, 500, noteContainer);

        revalidate();

        if(key){
            note.editor.setDoc(defaultMarkdownParser.parse(mainConfig.get("notes."+key+".content")));
            note.title.value = mainConfig.get("notes."+key+".title");
            notes.splice(mainConfig.get("notes."+note.id+".position"),0,note);
        }
        else{
            mainConfig.set("notes."+note.id+".content","");
            mainConfig.set("notes."+note.id+".title","Untitled");
            mainConfig.set("notes."+note.id+".position",notes.length);
            mainConfig.set("notes."+note.id+".state","note");
            notes.push(note);
        }

        return note;
    };
    var removeNote = this.removeNote = function(note,temp){
        noteContainer.removeChild(note.element);
        notes.splice(notes.indexOf(note),1);
        console.debug("notes."+note.id);
        if(!temp) mainConfig.unset("notes."+note.id);
        console.debug("Note Array:",notes,"Note Data:",mainConfig);
    };

    /**
     * NoteWidget.findplace
     *
     * Finds the y axis position for a given note. Used when arranging the notes.
     * @param note: The note to be examined.
     * @returns {number}
     */
    var findPlace = function(note){
        var yOffs = 10;
        for(var i = 0; i<notes.length;i++){
            var object = notes[i];
            var element = object.element;
            if(note.id == element.id) {
                break;
            }
            else if(element.style.display!='none'){
                console.debug("TRUTHY : " + object.expanded);
                if(!object.expanded) {
                    console.debug("MINIMIZED++");
                    yOffs += 30;
                }
                else {
                    if(object.storedHeight==null) yOffs += 10 + element.getBoundingClientRect().height;
                    else yOffs += 10 + parseInt(object.storedHeight);
                }
            }
        }

        return yOffs;
    };

    /**
     * NoteWidget.revalidate
     *
     * Re-organizes the NoteWidget layout.
     */
    var revalidate = function(exception){
        console.debug("REVALIDATING");
        console.debug("Note Array:",notes,"Note Data:",mainConfig.get());
        var total = 0;

        for(var i = 0; i<notes.length;i++){
            console.debug("REVALIDATING:",notes[i].id);
            if(exception==null || exception.id != notes[i].id){
                var elem = notes[i].element;
                var target = findPlace(notes[i]);
                var current = elem.style.top;

                elem.style.top = target + "px";
                if(i+1==notes.length){
                    height =  notes[i].expanded ? elem.getBoundingClientRect().height : 30;
                    total = parseInt(current) + height;
                }

                mainConfig.set("notes."+notes[i].id+".position", i);
            }
        }

        //noteContainer.style.height = total + 60 + 'px';

    };

    /**
     * NoteWidget.noteObject
     *
     * The object that is created when adding new notes. These can be converted to widget format by using the
     * noteToWidget function.
     */
    function noteObject(key){

        var self = this;

        this.position = notes.length;
        this.id = (key || validID());
        this.element = document.createElement('div');
        this.element.className = 'noteObject themeTextColor themeTertiaryColor';
        this.element.id = this.id;
        this.element.style.webkitTransition = 'all .5s ease';
        this.title = null;

        this.element.addEventListener('transitionend',function(){
            if(self.resize){
                if(self.expanded) {
                    self.element.style.height = 'auto';
                    self.storedHeight = null;
                    self.writeArea.style.display = 'block';
                }
                self.resize = false;
                revalidate();
            }
            self.locked = false;

        });

        //Create Toolbar
        this.toolbar = function toolbar(){
            var toolbar = document.createElement('div');
            toolbar.className = 'noteObjectToolbar';

            var title = document.createElement('input');
            title.className = 'noteToolbarTitle';
            title.value = 'Untitled';
            self.title = title;
            toolbar.appendChild(title);

            var exit = document.createElement('button');
            exit.addEventListener('click',function(){
                removeNote(self);
                revalidate();
            });
            Mainframe.setThemeIcon('exitbutton.png',exit);
            exit.className = 'noteToolbarButton';
            toolbar.appendChild(exit);

            this.expanded = true;
            var minimize = document.createElement('button');
            minimize.addEventListener("click", function(){
                if(!self.expanded){
                    self.resize = true;
                    self.expanded = true;
                    self.element.style.height = self.storedHeight;
                    self.element.style.minHeight = "75px";
                    Mainframe.setThemeIcon('upbutton.png',minimize);
                }
                else{
                    self.resize = true;
                    self.expanded = false;
                    if(self.settingsOpened) {
                        self.element.appendChild(self.writeArea);
                        self.element.removeChild(self.settings);
                        self.element.style.backgroundColor = 'rgba(255, 255, 255, 0.46)';
                        self.settingsOpened = false;
                    }
                    self.storedHeight = self.element.getBoundingClientRect().height + 'px';
                    self.element.style.height = "20px";
                    self.element.style.minHeight = "20px";
                    self.writeArea.style.display = 'none';

                    Mainframe.setThemeIcon('downbutton.png',minimize);
                }
                revalidate();
            });
            Mainframe.setThemeIcon('upbutton.png',minimize);;
            minimize.className = 'noteToolbarButton';
            toolbar.appendChild(minimize);

            var settingsElement = document.createElement('div');
            settingsElement.className = 'noteToolbarSettings';
            this.settingsOpened = false;
            this.settings = settingsElement;

            var websiteTitle = document.createElement('div');
            websiteTitle.textContent = "Website URL";
            settingsElement.appendChild(websiteTitle);
            var websiteField = document.createElement('input');
            websiteField.className = 'noteToolbarSettingsInput';
            websiteTitle.appendChild(websiteField);

            var fileTitle = document.createElement('div');
            fileTitle.textContent = "File";
            fileTitle.style.marginTop = '10px';
            settingsElement.appendChild(fileTitle);
            var fileButton = document.createElement('button');
            fileButton.className = 'noteSettingsFileButton';
            fileButton.textContent = 'Open File';
            fileTitle.appendChild(fileButton);
            var fileField = document.createElement('input');
            fileField.className = 'noteToolbarSettingsInput';
            //fileTitle.appendChild(fileField);

            var typeTitle = document.createElement('div');
            typeTitle.textContent = "Type";
            typeTitle.style.marginTop = '10px';
            settingsElement.appendChild(typeTitle);
            var typeLocal = document.createElement('button');
            typeLocal.className = 'noteSettingsTypeButton';
            typeLocal.textContent = "Local";
            typeTitle.appendChild(typeLocal);
            var typeGlobal = document.createElement('button');
            typeGlobal.className = 'noteSettingsTypeButton';
            typeGlobal.textContent = "Global";
            typeTitle.appendChild(typeGlobal);

            var colorTitle = document.createElement('form');
            colorTitle.textContent = "Color";
            //settingsElement.appendChild(colorTitle);
            var colorOne = document.createElement('radio');
            colorTitle.appendChild(colorOne);
            var colorTwo = document.createElement('radio');
            colorTitle.appendChild(colorTwo);
            var colorThree = document.createElement('radio');
            colorTitle.appendChild(colorThree);
            var colorFour = document.createElement('radio');
            colorTitle.appendChild(colorFour);
            var colorFive = document.createElement('radio');
            colorTitle.appendChild(colorFive);

            var settings = document.createElement('button');
            settings.addEventListener('click',function(){
                if(self.settingsOpened){
                    self.element.removeChild(self.settings);
                    self.element.appendChild(self.writeArea);
                    self.element.style.backgroundColor = 'rgba(255, 255, 255, 0.46)';
                    self.settingsOpened = false;
                }
                else if(self.expanded){
                    self.element.removeChild(self.writeArea);
                    self.element.appendChild(self.settings);
                    self.element.style.backgroundColor = '#949494';
                    self.settingsOpened = true;
                }
                revalidate();


            });
            settings.className = 'noteToolbarButton';
            settings.style.background = 'url("assets/morebutton.png") no-repeat';
            settings.style.backgroundSize = "80% 80%";
            settings.style.backgroundPosition = 'center';
            //toolbar.appendChild(settings);

            return toolbar;
        };
        this.element.appendChild(this.toolbar());

        //Create Textarea
        var div = document.createElement('div');
        div.addEventListener('click', function(){
            if(!editor.hasFocus()) editor.focus();
        });
        div.className = 'noteObjectTextArea';
        var prosemirror = require("prosemirror/dist/edit");
        var schema = require("prosemirror/dist/schema-basic").schema
        var editor = this.editor = new prosemirror.ProseMirror({
            place: div,
            schema: schema,
            autoInput: true,
            content: div,
            wrapper: div,
        });
        this.writeArea = div;
        this.element.appendChild(this.writeArea);

        this.writeArea.addEventListener('keyup', function(){
            revalidate();
        },true);
        this.writeArea.addEventListener('keydown', function(){
            revalidate();
        },true);

        //Place holder for cases when it turns into a widget.
        this.widget = null;

        //Function for dragging using the interact.js library.
        this.interact = function(){
            var offset = 0;
            var viewStart = 0;
            //Adjusted with context, deltaSource, and .origin() to help with noteContainer offset.
            var noteInteract = Mainframe.interact(self.element, {context: noteContainer, deltaSource: noteContainer})
                .draggable({
                    autoScroll:true,
                    inertia:true,
                    snap: {
                        targets: [
                            function () {
                                //Applying manual offset.
                                if(noteContainer.scrollTop != 0) offset = noteContainer.scrollTop;
                                return { x: 2, y: findPlace(self) - (offset), range: Infinity };
                            }
                        ],
                        relativePoints: [ { x: 0, y: 0 } ],
                        endOnly: true
                    },
                    onstart: function(event){
                        viewStart = noteContainer.scrollTop;
                    },
                    onmove: function(event) {
                        self.element.style.webkitTransition =  "all 0s ease ";
                        self.element.style.transformOrigin = '0 0';
                        dragMoveListener(event);
                    },
                    onend: function(){
                        self.element.style.webkitTransition =  "all .5s ease ";
                        self.element.style.transformOrigin = '0 0';
                    }
                })
                .actionChecker(function (pointer, event, action, interactable, element, interaction) {
                    if(action.name=='drag'){
                        if(event.target.className == 'noteObjectToolbar' ||
                            event.target.className == 'noteToolbarTitle'){
                            action.name = 'drag';
                        }
                        else{
                            return null;
                        }
                    }
                    return action;
                })
                .origin(noteContainer);

            var dragMoveListener = function(event) {

                var offset = noteContainer.scrollTop - viewStart;
                var target = event.target;
                var x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx,
                    y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

                target.style.webkitTransform = 'translate(' + (x)+ 'px, ' + (y + offset) + 'px)';
                target.setAttribute('data-x', x);
                target.setAttribute('data-y', y);


                var index = notes.indexOf(self);

                for(var i = 0; i<notes.length;i++){

                    var object = notes[i];
                    var element = object.element;


                    if(event.target!==element && !object.locked){

                        if(event.clientY + noteContainer.scrollTop>element.offsetTop &&
                            event.clientY + noteContainer.scrollTop<element.offsetTop+element.getBoundingClientRect().height){

                            var temp = notes[i];
                            notes[index] = temp;
                            notes[i] = self;
                            temp.locked = true;

                            revalidate();

                            if(i<index){
                                y = y + element.getBoundingClientRect().height + 10;
                            }
                            else {
                                y = y - element.getBoundingClientRect().height - 10;
                            }
                            target.setAttribute('data-y', y);
                            target.style.webkitTransform = 'translate(' + x + 'px, ' + (y + offset) + 'px)';
                        }

                    }

                }

                //Checks to see if out of bounds.
                if(event.clientX>noteContainer.getBoundingClientRect().width||
                    event.clientX<0||
                    event.clientY>noteContainer.getBoundingClientRect().height||
                    event.clientY<0){

                    //Begin widget conversion
                    self.widget = noteToWidget(self, event);
                    console.debug("REMOVING NOTE");
                    removeNote(self,true);
                    revalidate();

                    //Initialize offsets and disable previous interact function.
                    var offsetX = noteContainer.getBoundingClientRect().left + event.clientX/1000, offsetY = noteContainer.getBoundingClientRect().top + event.clientY/1000;
                    noteInteract.unset();

                    //New draggable function that moves the widget instead of the noteObject.
                    noteInteract.draggable({
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

                            var target = self.widget.element,
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
                            var target = self.widget.element;

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
                                    widgetToNote(self.widget);
                                }
                                else{
                                    Layout.findWidget(target.id).interact();
                                }
                                Layout.toggle(false);
                                target.removeEventListener("transitionend", endHandler);
                            }
                            revalidate();
                            target.addEventListener("transitionend", endHandler);

                        }
                    })
                    .on("draginertiastart", function(event){
                        Layout.toggle(false);
                    })
                    .origin(document.getElementById('parent'));

                    Layout.reset();
                    Layout.setCollider(self.widget.element);

                    var x = (parseFloat(target.getAttribute('data-x')) || - offsetX) + event.dx;
                    var y = (parseFloat(target.getAttribute('data-y')) || - offsetY) + event.dy;
                    target.setAttribute("data-start_x", x);
                    target.setAttribute("data-start_y", y);

                    self.widget.element.style.position = 'fixed';
                    self.widget.element.style.webkitTransition =  "all 0s ease ";
                    self.widget.element.style.zIndex = 3;

                    Layout.toggle(true);
                }

            };

            return noteInteract;
        };
        this.interact();

    }

    /**
     * Notes.noteToWidget
     *
     * Changes a note object to widget object.
     *
     * @param note: The note to be changed.
     * @param event The event of the drag.
     * @returns {Widget}: Returns the widget created.
     */
    function noteToWidget(note, event){

        var div = document.createElement('div');
        div.className = 'noteWidgetTextArea';
        var prosemirror = require("prosemirror");
        var schema = require("prosemirror/dist/schema-basic").schema
        var editor = new prosemirror.ProseMirror({
            place: div,
            schema: schema,
            autoInput: true,
            content: div,
            wrapper: div,
        });
        editor.setDoc(defaultMarkdownParser.parse(mainConfig.get("notes."+note.id+".content")));

        var widget = new Widget(note.title.value, "2.child." + note.id, div);
        widget.editor = editor;
        var toolbar = widget.toolbar;

        var backButton = function(){
            var button = document.createElement('button');
            Mainframe.setThemeIcon("backbutton.png",button);
            button.className = 'widgetToolbarButtons';
            button.addEventListener("click", function(){
                widgetToNote(widget);
            });
            return button;
        };
        toolbar.addButton(backButton());
        toolbar.addButton(toolbar.pin());

        mainConfig.set("notes."+note.id+".state","widget");
        widget.initialize(null);
        widget.setSize(1,1);
        widget.setMinSize(1,1);
        widget.setMaxSize(100,100);
        Layout.addWidget(widget);

        if(event){
            if(event.clientX>noteContainer.getBoundingClientRect().width){
                widget.element.style.left = noteContainer.getBoundingClientRect().left + event.clientX - Layout.cellWidth*(widget.minWidth/2) + "px";
                widget.element.style.top = noteContainer.getBoundingClientRect().top + event.clientY - Layout.cellHeight*(widget.minHeight/2) + "px";
            }
            else if(event.clientX<0){
                widget.element.style.left = noteContainer.getBoundingClientRect().left - event.clientX - Layout.cellWidth*(widget.minWidth/2) + "px";
                widget.element.style.top = noteContainer.getBoundingClientRect().top + event.clientY - Layout.cellHeight*(widget.minHeight/2) + "px";
            }
            else if(event.clientY>noteContainer.getBoundingClientRect().height){
                widget.element.style.left = noteContainer.getBoundingClientRect().left + event.clientX/2 + "px";
                widget.element.style.top = noteContainer.getBoundingClientRect().top + event.clientY - Layout.cellHeight*(widget.minHeight/2) + "px";
            }
            else if(event.clientY<0){
                widget.element.style.left = noteContainer.getBoundingClientRect().left + event.clientX/2 + "px";
                widget.element.style.top = noteContainer.getBoundingClientRect().top - event.clientY - Layout.cellHeight*(widget.minHeight/2) - 25 + "px";
            }
        }


        return widget;
    }

    function autoSave(elem,id){
        var delayTime = 500,delay = null;

        elem.writeArea.addEventListener('keyup',function(){
            if(delay!=null) {
                clearTimeout(delay)
            }
            delay = setTimeout(function(){
                console.debug(id);
                const {defaultMarkdownSerializer} = require("prosemirror/dist/markdown")
                mainConfig.set("notes."+id+".content", defaultMarkdownSerializer.serialize(elem.editor.doc.content), function (err) {});
            }, 500)
        });
        elem.title.addEventListener('keyup',function(){
            if(delay!=null) {
                clearTimeout(delay)
            }
            delay = setTimeout(function(){
                mainConfig.set("notes."+id+".title", elem.title.value, function (err) {});
            }, 500)
        });
    }

    /**
     * Notes.widgetToNote
     *
     * Changes a widget object to note object.
     *
     * @param widget: The widget to be changed.
     */
    function widgetToNote(widget){
        Layout.removeWidget(widget);
        var id = widget.id.replace('2.child.',"");
        console.debug("ID CHECK",id);
        var note = addNote(id);
        note.title.value = widget.name;
        mainConfig.set('notes.' + id + ".position", notes.length-1)
        mainConfig.set('notes.'+ id + ".state","note")
        note.editor.setDoc(defaultMarkdownParser.parse(mainConfig.get("notes."+note.id+".content")));
    }

    function validID(){

        var i = 0;
        var existing = [];
        for (var id in mainConfig.get("notes")) {
            existing.push(id);
            console.debug("Existing:",id);
        }

        while(existing.indexOf(i + "-noteObj")!=-1){
            console.debug(i++);
        };

        return i+"-noteObj";
    }


    widget.resizeListener = function(){
        revalidate();
    }
    widget.createChild = function(key,data){

        var verified = false;
        for (var id in mainConfig.get("notes")) {
            if(id==key){
               verified = true;
            }
        }
        if(!verified) return false;

        console.debug("CREATED CHILD:",data);
        var note = addNote(key);
        var widget = noteToWidget(note);
        removeNote(note,true);
        widget.setLocation(data.column,data.row);
        widget.setSize(data.width,data.height);

        return true;
    }

    if(mainConfig.get("notes")) {
        var existingNotes = [];
        for (var key in mainConfig.get("notes")) {
            console.debug("KEY",key);
            var note = addNote(key);
        }
    }
    Mainframe.afterLoad(revalidate);
}

module.exports = new NoteWidget();
