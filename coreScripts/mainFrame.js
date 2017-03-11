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
    console.log(userDataPath);
    var packageDir = userDataPath+'/packages',
        layoutDir = userDataPath+'/layouts',
        themeDir = userDataPath+'/themes',
        pluginDir = userDataPath+'/plugins',
        settingDir = userDataPath+'/settings';

    if (!fs.existsSync(userDataPath+'/packages')){
        fs.mkdirSync(packageDir);
    }
    if (!fs.existsSync(userDataPath+'/layouts')){
        fs.mkdirSync(layoutDir);
    }
    if (!fs.existsSync(userDataPath+'/themes')){
        fs.mkdirSync(themeDir);
    }
    if (!fs.existsSync(userDataPath+'/plugins')){
        fs.mkdirSync(pluginDir);
    }
    if (!fs.existsSync(userDataPath+'/settings')){
        fs.mkdirSync(settingDir);
    }

    const ElectronSettings = require('electron-settings');

    var defaultConfig = new ElectronSettings({configFileName: 'config', configDirPath: app.getAppPath() + "/coreScripts"});
    var config = new ElectronSettings({configFileName: 'config', configDirPath: settingDir + "/coreScripts"});
    if(!config.get('general')){
        config.set('.',defaultConfig.get('.'));
    }

    if(config.get())

    var gatherWidgets = function(){

        var dir = Mainframe.path.join(__dirname, '/node_modules/packages');

        var packages = fs.readdirSync(dir);
        packages.forEach(function(packageDir){
            var path = dir + "/" + packageDir;
            var stat = fs.statSync(path);
            if (stat && stat.isDirectory() && Mainframe.path.basename(path)!="Hub"){
                var packageFiles = fs.readdirSync(path);
                var widget = {main:null,json:null,portrait:null};
                packageFiles.forEach(function (file) {
                    // Full path of that file
                    let cPath = path + "/" + file;
                    // Get the file's stats
                    if(Mainframe.path.basename(cPath) == 'main.js') {
                        widget.main = require(Mainframe.path.basename(dir) + "/" + Mainframe.path.basename(path) + "/" + file);
                    }
                    if(Mainframe.path.basename(cPath) == 'package.json') {
                        widget.json = require(Mainframe.path.basename(dir) + "/" + Mainframe.path.basename(path) + "/" + file);
                    }
                    if(Mainframe.path.basename(cPath) == 'icon.png') {
                        widget.portrait = Mainframe.path.basename(dir) + "/" + Mainframe.path.basename(path) + "/" + file;
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
            var path = Mainframe.path.join(dir,layout);
            if(Mainframe.path.extname(path) == '.json') {
                var json = require(path);
                layouts.push(json);
                console.log("FOUND NEW LAYOUT");
            }
        });
        console.debug("Gathered Layouts");
    }

    var gatherThemes = function(){
        var dir = Mainframe.path.join(__dirname, '/node_modules/themes');

        var packages = fs.readdirSync(dir);
        packages.forEach(function(packageDir){
            var path = dir + "/" + packageDir;
            var stat = fs.statSync(path);
            if (stat && stat.isDirectory() && Mainframe.path.basename(path)!="Hub"){
                var packageFiles = fs.readdirSync(path);
                var theme = {css:null,json:null, portrait: null};
                packageFiles.forEach(function
                    (file) {
                    // Full path of that file
                    let cPath = path + "/" + file;
                    // Get the file's stats
                    if(Mainframe.path.basename(cPath) == 'theme.css') {
                        theme.css = (dir + "/" + Mainframe.path.basename(path) + "/" + file);
                        console.log(theme.css);
                    }
                    if(Mainframe.path.basename(cPath) == 'package.json') {
                        theme.json = require(Mainframe.path.basename(dir) + "/" + Mainframe.path.basename(path) + "/" + file);
                    }
                    if(Mainframe.path.basename(cPath) == 'icon.png') {
                        theme.portrait = Mainframe.path.basename(dir) + "/" + Mainframe.path.basename(path) + "/" + file;
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

                document.getElementById('themeCss').href = "node_modules/themes/Default/theme.css";
                Mainframe.config.set('general.theme', document.getElementById('themeCss').href.toString());

                var Hub = require('packages/Hub/main.js');
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

                var Hub = require('packages/Hub/main.js');
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
            var asset = path.join(config.get("general.theme"), "../" , "/assets/");
            return asset;
        },

        setThemeIcon: function(name,elem,size,pos){
            var asset = path.join(config.get("general.theme"), "../" , "/assets/" , name);

            if(!size) size = "80% 80%";
            if(!pos) pos = 'center';

            elem.style.backgroundImage = "url(" + asset+ ")";
            //elem.style.backgroundColor = 'transparent';
            elem.style.backgroundRepeat = "no-repeat";
            elem.style.backgroundSize = size;
            elem.style.backgroundPosition = pos;

            manualUpdate.push({element: elem, name: name, size: size, position: pos});
            return asset;
        },

        updateTheme: function(theme){
            manualUpdate.forEach(function(data){
                var bla = path.join(config.get("general.theme"), "/../../" ,theme,"/assets/" , data.name);

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
        cssLoader: require('util/cssLoader.js'),
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
