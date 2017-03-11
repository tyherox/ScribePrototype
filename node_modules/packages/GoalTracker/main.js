/**
 * Tyherox
 *
 * GoalTracker
 *
 * The GoalTracker is a widget to track goals that writers can set for themselves.
 */
function GoalTracker(){

    Mainframe.cssLoader('node_modules/packages/GoalTracker/style.css');

    var mainConfig = new Mainframe.electronSettings({configFileName:'config',configDirPath: Mainframe.packageDir +"/3"});

    //Create TimeWidget HTML Elements

    var goals = [];

    var goalPane = document.createElement('div');
    goalPane.className = 'goalPane';

    var goalList  = document.createElement('div');
    goalList.className = 'goalList';
    goalPane.appendChild(goalList);

    var goalTrack = document.createElement('div');
    goalTrack.className = 'goalTrack';
    goalPane.appendChild(goalTrack);

    //Build widget
    var widget = new Widget("Goals", 3, goalPane);
    this.widget = widget;

    var toolbar = widget.toolbar;
    toolbar.addButton(toolbar.exit());
    toolbar.addButton(toolbar.pin());
    var addGoalButton = function(){
        var button = document.createElement('button');
        button.className = 'mui-btn mui-btn--small mui-btn--primary mui-btn--fab';
        button.id = 'goalAddButton';
        button.innerHTML = '+';
        button.addEventListener("click", function(){
            console.debug("ADDING GOAL");
            addGoalObject();
        });
        return button;
    };
    goalList.appendChild(addGoalButton());

    widget.initialize('packages/GoalTracker/package.json');
    widget.setMaxSize(3,4);
    widget.setMinSize(2,2);

    //Relevant functions
    var addGoalObject = function(key){

        //Build note
        var goal = new GoalObject(key);

        //Find y bound
        var yOffs = 0;
        for(var i = 1; i<goalList.childElementCount;i++){
            var element = goalList.childNodes;
            console.debug(element[i].getBoundingClientRect().height,"!");
            yOffs += 10 + element[i].getBoundingClientRect().height;
        }

        goal.element.style.top = yOffs + "px";
        goal.element.style.left = 0 + "px";

        goalList.appendChild(goal.element);

        widget.scrollTo(yOffs, 500, widget.container);

        if(key){
            goals.splice(mainConfig.get("goals."+goal.id+".position"),0,goal);
        }
        else{
            mainConfig.set("goals."+goal.id+".position",goals.length);
            goals.push(goal);
        }

        revalidate();

        return goal;
    }

    var findPlace = function(goal){
        var yOffs = 5;
        for(var i = 0; i<goals.length;i++){

            var obj = goals[i];
            var element = obj.element;
            if(goal.element == element) {
                break;
            }
            else {
                yOffs += 10 + (obj.storedHeight==null ? element.getBoundingClientRect().height : obj.storedHeight);
            }
        }
        return yOffs;
    };

    var revalidate = function(){

        var total = 0;

        for(var i = 0; i<goals.length; i++){

            var obj = goals[i];
            var elem = obj.element;
            var target = findPlace(obj);
            var current = elem.style.top;

            //elem.style.webkitTransform = 'translate(' + 0 + 'px, ' + (target-parseInt(current)) + 'px)';

            elem.style.top = target + "px";

            if(i+1==goals.length){
                total = parseInt(current) + elem.getBoundingClientRect().height;
            }

            mainConfig.set("goals."+goals[i].id+".position", i);
        }
    };

    function GoalObject(key){

        var self = this;
        self.id = (key || validID());

        var element = document.createElement('div');
        element.className = 'goalObject themeTertiaryColor';
        element.addEventListener('transitionend',function(){
            if(self.storedHeight!=null) self.storedHeight = null;

            self.locked = false;
        });
        this.element = element;

        var offset = 0;
        var viewportHeight = 0;

        var goalInteract = Mainframe.interact(self.element, {context: goalList, deltaSource: goalList})
            .draggable({
                autoScroll:true,
                inertia:true,
                snap: {
                    targets: [
                        function () {
                            //Applying manual offset.
                            if(goalList.scrollTop != 0) offset = goalList.scrollTop;
                            return { x: 2, y: findPlace(self) - offset, range: Infinity };
                        }
                    ],
                    relativePoints: [ { x: 0, y: 0 } ],
                    endOnly: true
                },
                onstart: function(event){
                    viewportHeight = goalList.getBoundingClientRect().height;
                },
                onmove: function(event) {
                    self.element.style.webkitTransition =  "all 0s ease ";
                    self.element.style.transition =  "all 0s ease";
                    goalList.style.height = viewportHeight + 'px';
                    dragMoveListener(event);
                },
                onend: function(){
                    self.element.style.webkitTransition =  "all .5s ease ";
                    self.element.style.transition =  "all .5s ease";
                    self.element.style.transformOrigin = '0 0';
                }
            })
            .origin(goalList);

        var dragMoveListener = function(event) {

            var target = event.target;
            var x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx,
                y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

            target.style.webkitTransform = 'translate(' + x + 'px, ' + y + 'px)';
            target.setAttribute('data-x', x);
            target.setAttribute('data-y', y);

            var index = goals.indexOf(self);

            for(var i = 0; i<goals.length;i++){

                var object = goals[i];
                var element = object.element;

                if(event.target!==element && !object.locked){
                    if(event.clientY>element.offsetTop &&
                        event.clientY<element.offsetTop+element.getBoundingClientRect().height){

                        var temp = goals[i];
                        goals[index] = temp;
                        goals[i] = self;
                        temp.locked = true;

                        revalidate();

                        if(i<index){
                            y = y + element.getBoundingClientRect().height + 10;
                        }
                        else {
                            y = y - element.getBoundingClientRect().height - 10;
                        }

                        target.setAttribute('data-y', y);
                        target.style.webkitTransform = 'translate(' + x + 'px, ' + y + 'px)';

                    }

                }

            }
        };

        var doneButton = document.createElement('button');
        doneButton.addEventListener('click',function(){
            if(!doneButton.done){
                doneButton.done = true;
                doneButton.style.opacity = '1';
                element.className = 'goalObject themeVerifiedColor';
            }
            else{
                doneButton.done = false;
                doneButton.style.opacity = '.3';
                element.className = 'goalObject themeTertiaryColor';
            }
        });
        doneButton.className = 'goalObjectButtons';
        Mainframe.setThemeIcon("checkcircle.png",doneButton);
        doneButton.style.left = '5px';
        doneButton.style.opacity = '.3';
        element.appendChild(doneButton);

        //Panel where content goes

        var goalObjectPane = document.createElement('div');
        goalObjectPane.className = 'goalObjectPane';
        goalObjectPane.style.left = '30px';
        element.appendChild(goalObjectPane);

        var settingsButton = document.createElement('button');
        settingsButton.className = 'goalObjectButtons';
        Mainframe.setThemeIcon("morebutton.png",settingsButton);
        settingsButton.style.left = 'calc(100% - 55px)';
        element.appendChild(settingsButton);

        var deleteButton = document.createElement('button');
        deleteButton.className = 'goalObjectButtons';
        Mainframe.setThemeIcon("exitbutton.png",deleteButton);
        deleteButton.addEventListener('click',function(){
            goals.splice(goals.indexOf(self),1);
            goalList.removeChild(element);
            mainConfig.unset("goals."+self.id);
            revalidate();
        });
        deleteButton.style.left = 'calc(100% - 30px)';
        element.appendChild(deleteButton);

        var currentGoal = null;

        //Text Goal

        var textGoalContent = 'This is a text goal';

        var textGoal = this.textGoal = document.createElement('div');
        textGoal.className = 'themeTextColor goalObjectTextGoal';
        textGoal.textContent = textGoalContent;

        var textSetting = document.createElement('input');
        textGoal.setting = textSetting;
        textSetting.value = textGoalContent;
        textSetting.className = 'inputField themePrimaryColor themeTextColor';
        textSetting.placeholder = 'Description';
        autoSave(textSetting,'.text');

        //Track Goal

        var trackGoal = this.trackGoal = document.createElement('div');
        trackGoal.counter = 'Words';

        var trackGoalTrack = document.createElement('div');
        trackGoalTrack.textContent = 'Invalid Tracking Goal';
        trackGoal.appendChild(trackGoalTrack);

        var trackGoalText = document.createElement('div');
        trackGoalText.textContent = 'Invalid Description'
        trackGoal.appendChild(trackGoalText);

        var trackSetting = document.createElement('div');
        trackGoal.setting = trackSetting;

        var trackSettingText = document.createElement('input');
        trackSettingText.className = 'inputField themePrimaryColor themeTextColor';
        trackSettingText.placeholder = 'Description';
        autoSave(trackSettingText,'.text');
        trackSetting.appendChild(trackSettingText);

        var trackDropDown = document.createElement('div');
        trackDropDown.className = 'mui-dropdown goalObjectTrackSettingDropDown';
        trackDropDown.style.zIndex = 10;
        trackSetting.appendChild(trackDropDown);

        var trackChooser = document.createElement('button');
        trackChooser.addEventListener('click', function(){
            for(var i = 0; i<goals.length; i++){
                goals[i].element.style.zIndex = 1;
            }
            self.element.style.zIndex = 10;
        });
        trackChooser.setAttribute("data-mui-toggle","dropdown");
        trackChooser.className = 'mui-btn mui-btn--primary mui-btn--raised goalObjectTrackSettingChooser';
        trackChooser.innerHTML = 'Words';
        trackDropDown.appendChild(trackChooser);

        var trackList = document.createElement('UL');
        trackList.className = 'mui-dropdown__menu';
        trackList.style.width = '125px';
        trackDropDown.appendChild(trackList);

        var trackWordOption = document.createElement('LI');
        var trackWordOptionValue = document.createElement('a');
        trackWordOptionValue.innerHTML = 'Words';
        trackWordOptionValue.addEventListener('click',function(){
            trackChooser.innerHTML = 'Words';
            trackGoal.counter = 'Words';
            while(trackList.firstChild){
                trackList.removeChild(trackList.firstChild);
            }
            trackList.appendChild(trackCharOption);
            mainConfig.set("goals."+self.id+".content.type","Words");
        });
        trackWordOption.appendChild(trackWordOptionValue);

        var trackCharOption = document.createElement('LI');
        var trackCharOptionValue = document.createElement('a');
        trackCharOptionValue.innerHTML = 'Characters';
        trackCharOptionValue.addEventListener('click',function(){
            trackChooser.innerHTML = 'Characters';
            trackGoal.counter = 'Characters';
            while(trackList.firstChild){
                trackList.removeChild(trackList.firstChild);
            }
            trackList.appendChild(trackWordOption);
            mainConfig.set("goals."+self.id+".content.type","Characters");
        });
        trackCharOption.appendChild(trackCharOptionValue);
        trackList.appendChild(trackCharOption);

        var trackSettingAmount = document.createElement('input');
        trackSettingAmount.className = 'inputField';
        trackSettingAmount.className = 'inputField themePrimaryColor themeTextColor';
        trackSettingAmount.id = 'goalObjectTrackSettingAmount';
        trackSettingAmount.placeholder = 'Amount'
        autoSave(trackSettingAmount,'.amount');
        trackSetting.appendChild(trackSettingAmount);

        //Date Goal

        var dateGoal = this.dateGoal = document.createElement('div');

        var dateGoalDate = document.createElement('div');
        dateGoalDate.textContent = 'DATE';
        dateGoal.appendChild(dateGoalDate);

        var dateGoalText = document.createElement('div');
        dateGoalText.textContent = 'DESCRIPTION';
        dateGoal.appendChild(dateGoalText);

        var dateSetting = document.createElement('div');
        dateGoal.setting = dateSetting;

        var dateSettingText = document.createElement('input');
        dateSettingText.className = 'inputField';
        dateSettingText.style.position = 'relative';
        dateSettingText.style.top = 0;
        dateSettingText.style.left = 0;
        dateSettingText.placeholder = 'Description';
        autoSave(dateSettingText,'.text');
        dateSetting.appendChild(dateSettingText);

        var dateSettingDate = document.createElement('input');
        dateSettingDate.className = 'inputField';
        dateSettingDate.style.position = 'absolute';
        dateSettingDate.style.top = '27px';
        dateSettingDate.style.left = 0;
        dateSettingDate.placeholder = 'DD/MM/YY';
        dateSettingDate.addEventListener('keyup',function(){
            var date = dateSettingDate.value.split('/');
            console.debug(dateSettingDate.value.length);
            if(dateSettingDate.value.length == 0) {
                dateSettingDate.style.color = 'black';
                return;
            }

            var allocatedDays = isValidDate(parseInt(date[1])-1,parseInt(date[0]),parseInt(date[2]));
            if(allocatedDays!=false) {
                dateSettingDate.style.color = 'blue';
                dateGoal.date = dateSettingDate.value + ' - ' + allocatedDays + ' days';
            }
            else {
                dateSettingDate.style.color = 'red';
                dateGoal.date = 'Invalid Date';
            }

            function isValidDate (month, day, year) {
                var tempDate = new Date(year, month, day);
                var today = new Date();
                if(tempDate == 'Invalid Date' || tempDate.getMonth() != month) return false;

                if(tempDate.getFullYear()<today.getFullYear()) {
                    return false;
                }
                if(tempDate.getMonth()<today.getMonth() &&
                    tempDate.getFullYear()==today.getFullYear()) {
                    return false;
                }

                if(tempDate.getDate()<today.getDate()&&
                    tempDate.getMonth()==today.getMonth()) {
                    return false;
                }

                var timeDiff = Math.abs(tempDate.getTime() - today.getTime());
                var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));

                return diffDays;
            };
        });
        autoSave(dateSettingDate,'.date');
        dateSetting.appendChild(dateSettingDate);

        //DropDown chooser

        var typeDropDown = document.createElement('div');
        typeDropDown.className = 'mui-dropdown dropDown';
        typeDropDown.style.zIndex = '1000';

        var typeChooser = document.createElement('button');
        typeChooser.addEventListener('click', function(){
            for(var i = 0; i<goals.length; i++){
                goals[i].element.style.zIndex = 1;
            }
            self.element.style.zIndex = 10;
        });
        typeChooser.setAttribute("data-mui-toggle","dropdown");
        typeChooser.className = 'mui-btn mui-btn--small mui-btn--raised mui-btn--primary dropButton';
        typeDropDown.appendChild(typeChooser);

        var list = document.createElement('UL');
        list.className = 'mui-dropdown__menu';
        list.style.width = '100px';
        typeDropDown.appendChild(list);

        var textOption = document.createElement('LI');

        var textOptionValue = document.createElement('a');
        textOptionValue.innerHTML = 'Text';
        textOptionValue.addEventListener('click',function(){
            typeChooser.innerHTML = 'Text';
            while(list.firstChild){
                list.removeChild(list.firstChild);
            }
            list.appendChild(dateOption);
            list.appendChild(trackOption);
            currentGoal = textGoal;
            textSetting.value = textGoalContent;
            setPane(textSetting);
            element.style.height = '50px';
            self.storedHeight = parseInt(element.style.height);

            mainConfig.unset("goals."+self.id+".content");
            mainConfig.set("goals."+self.id+".type",'text');
            mainConfig.set("goals."+self.id+".content.text");

            revalidate();
        });
        textOption.appendChild(textOptionValue);

        var dateOption = document.createElement('LI');
        var dateOptionValue = document.createElement('a');
        dateOptionValue.innerHTML = 'Date';
        dateOptionValue.addEventListener('click',function(){
            typeChooser.innerHTML = 'Date';
            while(list.firstChild){
                list.removeChild(list.firstChild);
            }
            list.appendChild(textOption);
            list.appendChild(trackOption);
            currentGoal = dateGoal;
            setPane(dateSetting);
            element.style.height = '75px';
            self.storedHeight = parseInt(element.style.height);

            mainConfig.unset("goals."+self.id+".content");
            mainConfig.set("goals."+self.id+".type",'date');
            mainConfig.set("goals."+self.id+".content.text");
            mainConfig.set("goals."+self.id+".content.date");

            revalidate();
        });
        dateOption.appendChild(dateOptionValue);

        var trackOption = document.createElement('LI');
        var trackOptionValue = document.createElement('a');
        trackOptionValue.innerHTML = 'Track';
        trackOptionValue.addEventListener('click',function(){
            typeChooser.innerHTML = 'Track';
            while(list.firstChild){
                list.removeChild(list.firstChild);
            }
            list.appendChild(textOption);
            list.appendChild(dateOption);
            currentGoal = trackGoal;
            setPane(trackSetting);
            element.style.height = '75px';
            self.storedHeight = parseInt(element.style.height);

            mainConfig.unset("goals."+self.id+".content");
            mainConfig.set("goals."+self.id+".type",'track');
            mainConfig.set("goals."+self.id+".content.text");
            mainConfig.set("goals."+self.id+".content.amount");
            mainConfig.set("goals."+self.id+".content.type", "Words");

            revalidate();
        });
        trackOption.appendChild(trackOptionValue);

        //Settings

        settingsButton.addEventListener('click', function(){
            if(!settingsButton.settings){

                settingsButton.settings = true;
                element.className = 'goalObject themeTertiaryColor';

                element.removeChild(doneButton);
                element.removeChild(goalObjectPane);
                element.appendChild(typeDropDown);
                element.appendChild(goalObjectPane);
                setPane(currentGoal.setting);

                switch (currentGoal){
                    case textGoal : typeChooser.innerHTML = 'Text';
                        textSetting.value = textGoalContent;
                        list.appendChild(dateOption);
                        list.appendChild(trackOption);
                        element.style.height = '50px';
                        break;
                    case trackGoal : typeChooser.innerHTML = 'Track';
                        list.appendChild(textOption);
                        list.appendChild(dateOption);
                        element.style.height = '75px';
                        break;
                    case dateGoal : typeChooser.innerHTML = 'Date';
                        list.appendChild(trackOption);
                        list.appendChild(textOption);
                        element.style.height = '75px';
                        break;
                }

                goalObjectPane.style.top = '13px';
                goalObjectPane.style.width = 'calc(100% - 150px)';
                goalObjectPane.style.left = parseInt(goalObjectPane.style.left) + 55 + 'px';
                self.storedHeight = parseInt(element.style.height);

                revalidate();

            }
            else{
                while(list.firstChild){
                    list.removeChild(list.firstChild);
                }

                settingsButton.settings = false;
                if(!doneButton.done) element.className = 'goalObject themeTertiaryColor';
                else element.className = 'goalObject themeVerifiedColor';

                element.removeChild(typeDropDown);
                element.removeChild(goalObjectPane);
                element.appendChild(doneButton);
                element.appendChild(goalObjectPane);
                setPane(currentGoal);

                switch (currentGoal){
                    case textGoal : textGoalContent = textSetting.value;
                        textGoal.textContent = textGoalContent;

                        break;

                    case trackGoal :

                        trackGoalText.textContent = trackSettingText.value;
                        console.debug(Layout.findWidget(0).id);
                        addWorker(function(editor){

                            var DOM =  editor.editor.doc.content.toDOM();
                            var content = "";
                            for(var i = 0; i<DOM.childElementCount; i++){
                                console.debug(DOM.childNodes[i].textContent);
                                content += DOM.childNodes[i].textContent;
                                if(i+1<DOM.childElementCount) content += "\n";
                            }

                            console.debug("FINDAL : "+content);

                            if(trackGoal.counter == 'Characters') {

                                var goal = trackSettingAmount.value;
                                var edited = content.replace(/\s+/g,'');
                                console.debug("EDITED:",edited);
                                var count = edited.length;
                                var type = count==1 ? ' Character' : ' Characters';

                                trackGoalTrack.textContent = count + (goal>0 ? (" / " + goal): null) + type;
                            }
                            else if(trackGoal.counter == 'Words') {

                                var goal = trackSettingAmount.value;
                                var edited = content.replace(/(^\s*)|(\s*$)/gi,"")
                                    .replace(/[ ]{2,}/gi," ")
                                    .replace(/\n /,"\n");
                                console.debug("EDITED:",edited);
                                var count = edited.length != 0 ?
                                    edited.split(/\s+/).length : 0;
                                var type = count==1 ? ' Word' : ' Words';

                                trackGoalTrack.textContent = count + (goal>0 ? (" / " + goal): null) + type;
                            }

                        })(Layout.findWidget(0));

                        break;
                    case dateGoal : dateGoalDate.textContent = (dateGoal.date != null && dateGoal.date.length > 0)? dateGoal.date : "Goal not set!";
                        dateGoalText.textContent = dateSettingText.value;
                        dateGoalDate.textContent = dateSettingDate.value;
                        break;
                }
                goalObjectPane.style.top = '15px';
                goalObjectPane.style.width = 'calc(100% - 90px)';
                goalObjectPane.style.left = parseInt(goalObjectPane.style.left) - 55 + 'px';
                element.style.height = (goalObjectPane.getBoundingClientRect().height + 30) + 'px';
                self.storedHeight = parseInt(element.style.height);

                revalidate();
            }
        });

        function setPane(div){
            while (goalObjectPane.firstChild) {
                goalObjectPane.removeChild(goalObjectPane.firstChild);
            }
            goalObjectPane.appendChild(div);
        }


        if(!key) {
            setPane(textGoal);
            currentGoal = textGoal;
            mainConfig.set("goals."+self.id+".type", "text");
            mainConfig.set("goals."+self.id+".content.text", textGoalContent);
        }
        else{
            switch(mainConfig.get("goals."+self.id+".type")){
                case "text":
                    setPane(textGoal);
                    currentGoal = textGoal;
                    console.debug("TEXT:","goals."+self.id+".content.text");
                    textGoalContent = mainConfig.get("goals."+self.id+".content.text");
                    break;
                case "track":
                    setPane(trackGoal);
                    currentGoal = trackGoal;
                    trackSettingAmount.value = mainConfig.get("goals."+self.id+".content.amount");
                    trackSettingText.value = (mainConfig.get("goals."+self.id+".content.text")||"");
                    trackChooser.innerHTML = (mainConfig.get("goals."+self.id+".content.type") || "");
                    trackGoal.counter = (mainConfig.get("goals."+self.id+".content.type") || "");
                    break;
                case "date":
                    setPane(dateGoal);
                    currentGoal = dateGoal;
                    dateSettingDate.value = mainConfig.get("goals."+self.id+".content.date");
                    dateSettingText.value = (mainConfig.get("goals."+self.id+".content.text")||"");
                    break;
            }
            Mainframe.afterLoad(function(){
                settingsButton.click();
                settingsButton.click();
            })
        }

        function autoSave(elem,dir){
            var delayTime = 500,delay = null;

            elem.addEventListener('keyup',function(){
                if(delay!=null) {
                    clearTimeout(delay)
                }
                delay = setTimeout(function(){
                    const {defaultMarkdownSerializer} = require("prosemirror/dist/markdown")
                    mainConfig.set("goals."+self.id+".content"+dir, elem.value);
                }, 500)
            });
        }

        return this;
    }

    function validID(){
        var i = 0;
        for (var id in mainConfig.get("goals")) {
            if((i++ + "-goalObj")!=id) {
                console.debug("VALID ID:",i);
                return i + "-goalObj";
            }
        }
        return i +"-goalObj";
    }

    if(mainConfig.get("goals")) {
        var existingGoals = [];
        for (var key in mainConfig.get("goals")) {
            console.debug("KEY",key);
            var goal = addGoalObject(key);
        }
    }
    Mainframe.afterLoad(revalidate);


    //Resize Listener to show appropriate functionality (HH/MM or HH/MM/SS)
    widget.resizeListener = function(){
        var date = new Date();
        var hours = date.getHours();
        if(hours<10) hours = "0" + hours;
        var minutes = date.getMinutes();
        if(minutes<10) minutes = "0" + minutes;
        var seconds = date.getSeconds();
        if(seconds<10) seconds = "0" + seconds
    };
}

module.exports = new GoalTracker();