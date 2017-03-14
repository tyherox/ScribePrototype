/**
 * Created by JohnBae on 7/9/16.
 */

var Mainframe = (function () {

    const electron = require('electron');
    const remote = electron.remote;
    const {app} = electron.remote;
    const dialog = remote.dialog;

    var path = require('path');
    var fs = require('fs');
    var widgets = [],
        layouts = [],
        themes = [],
        afterLoad = [],
        manualUpdate = [];

    var userDataPath = app.getPath('userData');
    var packageDir = path.join(userDataPath,'packages'),
        layoutDir = path.join(userDataPath,'layouts'),
        themeDir = path.join(userDataPath,'themes'),
        pluginDir = path.join(userDataPath,'plugins'),
        settingDir = path.join(userDataPath,'settings');

    if (!fs.existsSync(packageDir)){
        fs.mkdirSync(packageDir);
    }
    if (!fs.existsSync(layoutDir)){
        fs.mkdirSync(layoutDir);
    }
    if (!fs.existsSync(themeDir)){
        fs.mkdirSync(themeDir);
    }
    if (!fs.existsSync(pluginDir)){
        fs.mkdirSync(pluginDir);
    }
    if (!fs.existsSync(settingDir)){
        fs.mkdirSync(settingDir);
    }

    const ElectronSettings = require('electron-settings');

    var defaultConfig = new ElectronSettings({configFileName: 'config', configDirPath: path.join(app.getAppPath(),"coreScripts")});
    var config = new ElectronSettings({configFileName: 'config', configDirPath: path.join(settingDir,"coreScripts")});
    if(!config.get('general')){
        config.set('.',defaultConfig.get('.'));
    }

    if(config.get())

        var gatherWidgets = function(){

            var dir = Mainframe.path.join(__dirname,'packages');
            var packages = fs.readdirSync(dir);
            packages.forEach(function(packageDir){
                var path = Mainframe.path.join(dir,packageDir);
                var stat = fs.statSync(path);
                if (stat && stat.isDirectory() && Mainframe.path.basename(path)!="Hub"){
                    var packageFiles = fs.readdirSync(path);
                    var widget = {main:null,json:null,portrait:null};
                    packageFiles.forEach(function (file) {
                        // Full path of that file
                        let cPath = Mainframe.path.join(path,file);
                        // Get the file's stats
                        if(Mainframe.path.basename(cPath) == 'main.js') {
                            console.log("PATH 1:", Mainframe.path.join("."+Mainframe.path.basename(dir),Mainframe.path.basename(path),file));
                            widget.main = require(Mainframe.path.join(Mainframe.path.basename(dir),Mainframe.path.basename(path),file));
                        }
                        if(Mainframe.path.basename(cPath) == 'package.json') {
                            widget.json = require(Mainframe.path.join(Mainframe.path.basename(dir),Mainframe.path.basename(path),file));
                        }
                        if(Mainframe.path.basename(cPath) == 'icon.png') {
                            var test = Mainframe.path.join(Mainframe.path.basename(dir),Mainframe.path.basename(path), file).replace(/\\/g,"/");
                            widget.portrait = test;
                        }
                    });
                    widgets.push(widget);
                }
            });
        }

    var gatherLayouts = function(){
        var dir = layoutDir;
        var layoutData = fs.readdirSync(dir);
        layoutData.forEach(function(layout){

            var path = dir + "/" + layout;
            var stat = fs.statSync(path);
            if (stat && stat.isDirectory()){
                var packageFiles = fs.readdirSync(path);
                var layout = {json:null,portrait:null};
                packageFiles.forEach(function (file) {
                    // Full path of that file
                    let cPath = path + "/" + file;
                    console.log("LAYOUT:",cPath);
                    if(Mainframe.path.extname(cPath) == '.json') {
                        console.log("FOUND JSON");
                        layout.json = require(cPath);
                    }
                });
                layouts.push(layout);
            }
            console.log("uhh.. layout?");
        });
        console.debug("Gathered Layouts");
    }

    var gatherThemes = function(){
        var dir = Mainframe.path.join(__dirname, path.join("themes"));

        var packages = fs.readdirSync(dir);
        packages.forEach(function(packageDir){
            var path = Mainframe.path.join(dir,packageDir);
            var stat = fs.statSync(path);
            if (stat && stat.isDirectory() && Mainframe.path.basename(path)!="Hub"){
                var packageFiles = fs.readdirSync(path);
                var theme = {css:null,json:null, portrait: null};
                packageFiles.forEach(function
                    (file) {
                    // Full path of that file
                    let cPath = Mainframe.path.join(path,file);
                    // Get the file's stats
                    if(Mainframe.path.basename(cPath) == 'theme.css') {
                        theme.css = Mainframe.path.join(dir,Mainframe.path.basename(path),file);
                        console.log(theme.css);
                    }
                    if(Mainframe.path.basename(cPath) == 'package.json') {
                        theme.json = require(Mainframe.path.join(Mainframe.path.basename(dir),Mainframe.path.basename(path),file));
                    }
                    if(Mainframe.path.basename(cPath) == 'icon.png') {
                        theme.portrait = Mainframe.path.join(Mainframe.path.basename(dir),Mainframe.path.basename(path),file);
                    }
                });
                themes.push(theme);
            }
        });
    }

    var gatherPlugins = function(){

    }

    return{

        start: function(){
            console.time("load");
            mui.overlay('on');
            gatherWidgets();
            gatherLayouts();
            gatherThemes();

            window.addEventListener('load', function() {
                console.timeEnd('load');
                mui.overlay('off');

                for(var i = 0; i<afterLoad.length; i++){
                    afterLoad[i]();
                }

            }, false);

            if(config.get("general.theme")=="" || config.get("general.layout")=={}){

                document.getElementById('themeCss').href = path.join("themes","Default","theme.css");
                Mainframe.config.set('general.theme', path.join("themes","Default","theme.css"));

                var Hub = require(path.join("packages","Hub","main.js"));
                Hub.widget.setSize(4,5);
                Hub.widget.column = 2;
                Hub.widget.row = 0;
                Layout.addWidget(Hub.widget);

                Layout.drawGrid(Layout.screenWidth, Layout.screenHeight, "grid");
                Layout.makeLayout();
                Layout.reset();
                Layout.toggle(false);

            }
            else{
                document.getElementById('themeCss').href = config.get("general.theme");

                var Hub = require(path.join('packages','Hub','main.js'));
                Hub.widget.setSize(4,5);
                Hub.widget.column = 2;
                Hub.widget.row = 0;
                Layout.addWidget(Hub.widget);

                for (var key in config.get('general.layout')) {
                    var duh = key;
                    var val = config.get('general.layout')[key];
                    var widget = Layout.findWidget(key);
                    if(key==0) widget = Hub.widget;
                    if(widget){
                        widget.setSize(val.width,val.height);
                        widget.setLocation(val.column,val.row);
                    }
                    else{
                        var data = Mainframe.widgets;
                        console.debug("Widget Iterating", data.length);
                        data.forEach(function(datum){
                            console.debug("Iterated Widget:",datum.main.widget.id);
                            if(datum.main.widget.id==duh){
                                widget = datum.main.widget;
                                console.debug("Layout Added Widget",widget.id);
                                Layout.addWidget(widget);
                                widget.setSize(val.width,val.height);
                                widget.setLocation(val.column,val.row);
                                if(widget.resizeListener!=null) widget.resizeListener();;
                            }
                            /*if(val.child && datum.main.widget.createChild!=null){
                             console.debug("CHILDREN at",duh);
                             for(var key in config.get('general.layout.'+duh+".child")){
                             console.debug("CHILD!");
                             datum.main.widget.createChild(key,config.get('general.layout.'+duh+".child."+key));
                             }
                             }*/
                        });
                    }
                }

                Layout.drawGrid(Layout.screenWidth, Layout.screenHeight, "grid");
                Layout.toggle(false);
            }

            function doc_keyUp(e) {

                // this would test for whichever key is 40 and the ctrl key at the same time
                if (e.ctrlKey && e.keyCode == 76) {
                    console.debug("a 1 2 3 \n b 1 2 3 \n c 1 2 3");
                }
            }
            // register the handler
            document.addEventListener('keyup', doc_keyUp, false);

            var webContents = remote.getCurrentWebContents();

            var Menu = remote.Menu;
            var menu = new Menu();

            // set the initial context menu so that a context menu exists even before spellcheck is called
            var template = [
                {
                    label: 'Select All',
                    selector: 'selectAll:'
                }
            ];
            menu = Menu.buildFromTemplate(template);

            // on right click.....
            window.addEventListener('contextmenu', function(e){
                // use current menu, probably the one that was built the last time spellcheck ran
                menu.popup(remote.getCurrentWindow());
                // build a new one with only select all in it
                menu = Menu.buildFromTemplate(template);
            }, false);

            var template = [{
                label: "Application",
                submenu: [
                    { label: "About Application", selector: "orderFrontStandardAboutPanel:" },
                    { type: "separator" },
                    { label: "Quit", accelerator: "Command+Q", click: function() { app.quit(); }}
                ]}, {
                label: "Edit",
                submenu: [
                    { label: "Undo", accelerator: "CmdOrCtrl+Z", selector: "undo:" },
                    { label: "Redo", accelerator: "Shift+CmdOrCtrl+Z", selector: "redo:" },
                    { type: "separator" },
                    { label: "Cut", accelerator: "CmdOrCtrl+X", selector: "cut:" },
                    { label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:" },
                    { label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:" },
                    { label: "Select All", accelerator: "CmdOrCtrl+A", selector: "selectAll:" }
                ]}
            ];

            //Menu.setApplicationMenu(Menu.buildFromTemplate(template));
        },

        getThemeAsset: function(){
            var asset = path.join(config.get("general.theme"), "../" , "assets");
            return asset;
        },

        setThemeIcon: function(name,elem,size,pos){
            var asset = path.join(config.get("general.theme"), "../", "assets", name);

            if(!size) size = "80% 80%";
            if(!pos) pos = 'center';
            elem.style.backgroundImage = "url(" + asset.replace(/\\/g, "/")+ ")";
            //elem.style.backgroundColor = 'transparent';
            elem.style.backgroundRepeat = "no-repeat";
            elem.style.backgroundSize = size;
            elem.style.backgroundPosition = pos;

            //manualUpdate.push({element: elem, name: name, size: size, position: pos});
            return asset;
        },

        updateTheme: function(theme){
            manualUpdate.forEach(function(data){
                var bla = path.join(config.get("general.theme"), "/../../" ,theme,"assets" , data.name);

                data.element.style.backgroundImage = "url(" + bla+ ")";
                //data.element.style.backgroundColor = 'transparent';
                data.element.style.backgroundSize = data.size;
                data.element.style.backgroundRepeat = "no-repeat";
                data.element.style.backgroundPosition = data.pos;
            })
            Layout.drawGrid(Layout.screenWidth, Layout.screenHeight, "grid");
        },

        rebuildWidgets:  function(){
            widgets.splice(0,widgets.length);
            gatherWidgets();
        },
        rebuildLayouts: function(){
            layouts.splice(0,layouts.length);
            gatherLayouts();
        },
        rebuildThemes: function(){
            themes.splice(0,themes.length);
            gatherThemes();
        },

        afterLoad: function(task){
            afterLoad.push(task);
        },
        exists: function(file){
            fs.stat(file, function(err, stat) {
                if(err == null) {
                    return true
                } else if(err.code == 'ENOENT') {
                    // file does not exist
                    fs.writeFile('log.txt', 'Some log\n');
                } else {
                    console.log('Some other error: ', err.code);
                }
                return false;
            });
        },
        packageDir: packageDir,
        layoutDir: layoutDir,
        pluginDir: pluginDir,
        settingDir: settingDir,
        themeDir: themeDir,
        electronSettings: ElectronSettings,
        config: config,
        cssLoader: require('./util/cssLoader.js'),
        interact: require('interact.js/dist/interact.js'),
        mui: require('mui/mui.js'),
        remote: remote,
        fs: fs,
        dialog: dialog,
        path: path,
        widgets: widgets,
        layouts: layouts,
        themes: themes,
        config: config,

    }

})();