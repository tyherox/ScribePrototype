/**
 * Created by JohnBae on 4/7/16.
 */
var workers = [];

testingRect = null;

function Hub(){
    var self = this;
    Mainframe.cssLoader('packages/Hub/style.css');
    var mainConfig = new Mainframe.electronSettings({configFileName:'config',configDirPath: Mainframe.packageDir +"/0"});

    //Create writing area using MIT licensed library prosemirror (http://prosemirror.net).
    var writeArea = document.createElement('div');
    this.writeArea = writeArea;
    writeArea.id = 'hubEditor';

    //Build widget
    var widget = new Widget("Hub",0, writeArea);
    this.widget = widget;
    widget.pinned = true;

    testingRect = writeArea;

    //Initialize widget
    widget.initialize('packages/Hub/package.json');
    widget.setMinSize(3,3);
    widget.setMaxSize(10,10);

    this.currentFile = null;

    const {ProseMirror} = require("prosemirror/dist/edit")
    const {schema} = require("prosemirror/dist/schema-basic")
    const {exampleSetup, buildMenuItems} = require("prosemirror/dist/example-setup")

    var editor = widget.editor = window.pm = new ProseMirror({
        place: writeArea,
        schema: schema,
        plugins: [exampleSetup.config({menuBar: false, tooltipMenu: false})]
    })
    editor.on.change.add(change => {
        for(var i = 0; i<workers.length; i++){
            workers[i](widget);
        };

    });

    var spellCheck = require('plugin/spellCheck/main');
    spellCheck.initialize(pm);

    function setPane(div){
        if(widget.element.childCount != 0){
            console.debug("PANE : " + widget.container.children.length);
            if(widget.container.firstChild.isSameNode(div)) {
                widget.container.removeChild(widget.container.firstChild);
                widget.container.appendChild(writeArea);
                widget.element.className = "widget widgetBackground";
            }
            else{
                widget.container.removeChild(widget.container.firstChild);
                widget.container.appendChild(div);
                widget.element.className = "widget widgetSecondaryBackground";
            }
            return;
        }
        widget.container.appendChild(div);
    }

    var toolbar = widget.toolbar;

    var quitButton = document.createElement('button');
    quitButton.className = 'widgetToolbarButtons';
    Mainframe.setThemeIcon("quitbutton.png", quitButton)
    quitButton.name = 'hubQuit';
    quitButton.addEventListener("click", function(){
        window.close();
    });
    toolbar.addButton(quitButton);

    var documentButton = document.createElement('button');
    documentButton.className = 'widgetToolbarButtons';
    Mainframe.setThemeIcon("documentbutton.png", documentButton)
    toolbar.addButton(documentButton);

    var settings = function(){

        var settingComp = require('./settings');

        var button = document.createElement('button');
        button.className = 'widgetToolbarButtons';
        button.style.background = 'url("assets/settingsbutton.png") no-repeat';
        button.style.backgroundSize = "80% 80%";
        button.style.backgroundPosition = 'center';
        button.name = 'hubSettings';

        var settingsPane = document.createElement('writeArea');
        settingsPane.className = 'hubSettingsPane';
        this.settings = settingsPane;

        var titles = document.createElement('div');
        titles.style.paddingTop = '5px';
        titles.style.fontSize = '25px';
        titles.textContent = 'Settings';
        titles.className = 'hubSettingTitle';
        settingsPane.appendChild(titles);

        var hubSettings = document.createElement('button');
        hubSettings.style.marginTop = '30px';
        hubSettings.textContent = 'The Hub';
        hubSettings.className = 'hubSettingTitleButton';
        titles.appendChild(hubSettings);

        var pluginSettings = document.createElement('button');
        pluginSettings.textContent = 'Plugin';
        pluginSettings.className = 'hubSettingTitleButton';
        titles.appendChild(pluginSettings);

        var widgetSettings = document.createElement('button');
        widgetSettings.textContent = 'Widgets';
        widgetSettings.className = 'hubSettingTitleButton';
        titles.appendChild(widgetSettings);

        var keybindingSettings = document.createElement('button');
        keybindingSettings.textContent = 'Keybindings';
        keybindingSettings.className = 'hubSettingTitleButton';
        titles.appendChild(keybindingSettings);

        var settingsSegment = document.createElement('writeArea');
        settingsSegment.className = 'hubSettingsSegment';
        settingsPane.appendChild(settingsSegment);
        settingComp.initialize(settingsSegment);

        hubSettings.addEventListener('click',function(){
            var div = settingComp.hub();
            if(settingsSegment.currentSegment!=null) {
                console.debug("BLAH");

                settingsSegment.removeChild(settingsSegment.currentSegment);
            }
            settingsSegment.appendChild(div);
            settingsSegment.currentSegment = div;
        });
        pluginSettings.addEventListener('click',function(){
            var div = settingComp.plugins();
            if(settingsSegment.currentSegment!=null) {
                settingsSegment.removeChild(settingsSegment.currentSegment);
            }
            settingsSegment.appendChild(div);
            settingsSegment.currentSegment = div;
        });
        widgetSettings.addEventListener('click',function(){
            var div = settingComp.widgets();
            if(settingsSegment.currentSegment!=null) {
                settingsSegment.removeChild(settingsSegment.currentSegment);
            }
            settingsSegment.appendChild(div);
            settingsSegment.currentSegment = div;
        });
        keybindingSettings.addEventListener('click',function(){
            var div = settingComp.keybindings();
            if(settingsSegment.currentSegment!=null) {
                settingsSegment.removeChild(settingsSegment.currentSegment);
            }
            settingsSegment.appendChild(div);
            settingsSegment.currentSegment = div;
        });

        button.addEventListener("click", function(){
            setPane(settingsPane);
        });
        return button;
    };
    //toolbar.addButton(settings());

    var displaySettings = function(){

        var displayComp = require('./display');
        widget.resizeListener = ()=>displayComp.revalidateGUI();

        var button = document.createElement('button');
        button.className = 'widgetToolbarButtons';
        Mainframe.setThemeIcon("displayButton.png", button);
        button.name = 'layoutSettingsButton';

        var settingsPane = document.createElement('writeArea');
        settingsPane.className = 'hubSettingsPane themeTextColor';
        this.settings = settingsPane;

        var titles = document.createElement('writeArea');
        titles.style.paddingTop = '5px';
        titles.style.fontSize = '25px';
        titles.textContent = 'Display';
        titles.className = 'hubSettingTitle';
        settingsPane.appendChild(titles);

        var widgets = document.createElement('button');
        Mainframe.setThemeIcon('widgetsicon.png',widgets,"17px 17px","25px 50%");
        widgets.style.marginTop = '30px';
        widgets.textContent = 'Widgets';
        widgets.className = 'hubSettingTitleButton';
        titles.appendChild(widgets);

        var layouts = document.createElement('button');
        Mainframe.setThemeIcon('layoutsicon.png',layouts,"17px 17px","25px 50%");
        layouts.textContent = 'Layouts';
        layouts.className = 'hubSettingTitleButton';
        titles.appendChild(layouts);

        var themes = document.createElement('button');
        Mainframe.setThemeIcon('themesicon.png',themes,"17px 17px","25px 50%");
        themes.textContent = 'Themes';
        themes.className = 'hubSettingTitleButton';
        titles.appendChild(themes);

        var settingsSegment = document.createElement('writeArea');
        settingsSegment.className = 'hubSettingsSegment boxShadow';
        settingsPane.appendChild(settingsSegment);
        displayComp.initialize(settingsSegment);

        layouts.addEventListener('click',function(){
            var div = displayComp.layout(settingsSegment);
            if(settingsSegment.currentSegment!=null) {
                settingsSegment.removeChild(settingsSegment.currentSegment);
            }
            settingsSegment.appendChild(div);
            settingsSegment.currentSegment = div;
        });
        widgets.addEventListener('click',function(){
            var div = displayComp.widgets();
            if(settingsSegment.currentSegment!=null) {
                settingsSegment.removeChild(settingsSegment.currentSegment);
            }
            settingsSegment.appendChild(div);
            settingsSegment.currentSegment = div;
        });
        themes.addEventListener('click',function(){
            var div = displayComp.themes(settingsSegment);
            if(settingsSegment.currentSegment!=null) {
                settingsSegment.removeChild(settingsSegment.currentSegment);
            }
            settingsSegment.appendChild(div);
            settingsSegment.currentSegment = div;
        });

        button.addEventListener("click", function(){
            if(button.pressed== false || button.pressed == null){
                button.style.opacity = '.3';
                button.pressed = true;
            }
            else{
                button.style.opacity = '1';
                button.pressed = false;
            }
            setPane(settingsPane);
            widgets.click()
        });

        return button;
    };
    toolbar.addButton(displaySettings());

    var hideButton = document.createElement('button');
    hideButton.className = 'widgetToolbarButtons';
    Mainframe.setThemeIcon("hidebutton.png", hideButton)
    hideButton.name = 'layoutSettingsButton';
    hideButton.addEventListener('click', function(){
        if(hideButton.active == false || hideButton.active == null) {
            hideButton.active = true;
            Layout.activatePins(true);
            hideButton.style.opacity = '.3';
        }
        else{
            hideButton.active = false;
            Layout.activatePins(false);
            hideButton.style.opacity = '1';
        }
    });
    toolbar.addButton(hideButton);

    var saveButton = document.createElement('button');
    saveButton.className = 'widgetToolbarButtons';
    Mainframe.setThemeIcon("savebutton.png", saveButton)
    saveButton.name = 'hubSave';
    saveButton.style.top = '25px';
    saveButton.style.left = '75px';
    saveButton.addEventListener("click", function(){
        function saveFile () {
            if(self.currentFile!=null)  {
                const {defaultMarkdownSerializer} = require("prosemirror/dist/markdown")
                Mainframe.fs.writeFile(self.currentFile, defaultMarkdownSerializer.serialize(editor.doc.content), function (err) {});
                return;
            }
            Mainframe.dialog.showSaveDialog(function (fileName) {
                if (fileName === undefined) return;
                const {defaultMarkdownSerializer} = require("prosemirror/dist/markdown")
                Mainframe.fs.writeFile(fileName, defaultMarkdownSerializer.serialize(editor.doc.content), function (err) {});
                self.currentFile = fileName;
            });
        }
        saveFile();
    });
    toolbar.addButton(saveButton);

    var saveAsButton = document.createElement('button');
    saveAsButton.className = 'widgetToolbarButtons';
    Mainframe.setThemeIcon("saveasbutton.png", saveAsButton)
    saveAsButton.name = 'hubSave';
    saveAsButton.style.top = '50px';
    saveAsButton.style.left = '100px';
    saveAsButton.addEventListener("click", function(){
        function saveFile () {
            Mainframe.dialog.showSaveDialog({defaultPath: self.currentFile}, function (fileName) {
                if (fileName === undefined) return;
                const {defaultMarkdownSerializer} = require("prosemirror/dist/markdown")
                Mainframe.fs.writeFile(fileName, defaultMarkdownSerializer.serialize(editor.doc.content), function (err) {

                });
                self.currentFile = fileName;
            });
        }
        saveFile();
    });
    toolbar.addButton(saveAsButton);

    var openButton = document.createElement('button');
    openButton.className = 'widgetToolbarButtons';
    Mainframe.setThemeIcon("openbutton.png", openButton)
    openButton.name = 'hubOpen';
    openButton.style.top = '75px';
    openButton.style.left = '125px';
    openButton.addEventListener("click", function(){
        console.debug("CLICKED ON : ",openButton.name);
        function openFile () {
            Mainframe.dialog.showOpenDialog(function (fileNames) {
                if (fileNames === undefined) return;
                var fileName = fileNames[0];
                Mainframe.fs.readFile(fileName, 'utf-8', function (err, data) {
                    const {defaultMarkdownParser, defaultMarkdownSerializer} = require("prosemirror/dist/markdown")
                    editor.setDoc(defaultMarkdownParser.parse(data));
                    self.currentFile = fileName;
                });
            });
        }
        openFile();
    });
    toolbar.addButton(openButton);

    documentButton.addEventListener('click',function(){
        if(documentButton.expanded==false||documentButton.expanded==null){
            openButton.style.display = 'inline';
            saveAsButton.style.display = 'inline';
            saveButton.style.display = 'inline';
            documentButton.expanded=true;
        }
        else{
            openButton.style.display = 'none';
            saveAsButton.style.display = 'none';
            saveButton.style.display = 'none';
            documentButton.expanded=false;
        }
    });
    documentButton.addEventListener('blur',function(){
        setTimeout(function () {
            openButton.style.display = 'none';
            saveAsButton.style.display = 'none';
            saveButton.style.display = 'none';
            documentButton.expanded=false;
        }, 100)
    });

    toolbar.fixedButtons();

    openButton.style.display = 'none';
    saveAsButton.style.display = 'none';
    saveButton.style.display = 'none';

    function autoSave(){
        var delayTime = 500,delay = null;

        writeArea.addEventListener('keyup',function(){
            if(delay!=null) {
                clearTimeout(delay)
            }
            delay = setTimeout(function(){
                if(self.currentFile!=null){
                    const {defaultMarkdownSerializer} = require("prosemirror/dist/markdown")
                    Mainframe.fs.writeFile(self.currentFile, defaultMarkdownSerializer.serialize(editor.doc.content), function (err) {});
                    saveButton();
                }
            }, 500)
        });
    }
    autoSave();
}

addWorker = function(worker){
    workers.push(worker);

    return worker;
}

removeWorker = function(worker){
    workers.splice(workers.indexOf(worker),1);
}

module.exports = new Hub();
