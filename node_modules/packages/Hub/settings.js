/**
 * Created by JohnBae on 7/8/16.
 */
function settings() {

    var parentContainer;

    var container = document.createElement("div");
    container.style.width = '100%';
    container.style.height = '100%';

    function purge(){
        while(container.firstChild){
            container.removeChild(container.firstChild);
        }
    }

    return{
        hub: function(){
            purge();
            var title = document.createElement('div');
            title.textContent = 'Hub';
            title.style.paddingTop = '5px';
            title.style.fontSize = '25px';
            title.style.textAlign = 'left';
            title.style.marginBottom = '15px';
            container.appendChild(title);

            var filler = document.createElement('div');
            filler.style.background = 'transparent';
            filler.style.height = '25px';
            filler.style.width = '100%';
            container.appendChild(filler);

            var contentScrollPane = document.createElement('div');
            contentScrollPane.style.height = 'calc(100% - 100px)';
            contentScrollPane.style.width = '100%';
            contentScrollPane.style.overflowY = 'scroll';
            container.appendChild(contentScrollPane);

            var contentBox = document.createElement('div');
            contentBox.style.overFlow = 'visible';
            contentBox.style.position = 'relative';
            contentBox.style.height = 'calc(100% - 100px)';
            contentBox.style.width = '100%';
            contentScrollPane.appendChild(contentBox);

            var settingKey = Mainframe.config.get("hub");
            var array = Object.keys(settingKey).map(function (key) {

                if(key!="tooltip"){
                    var compContainer = document.createElement('div');
                    compContainer.style.width = '100%';
                    compContainer.style.height = '30px';
                    compContainer.style.marginTop = '10px';

                    switch(key){
                        case "Menu Style":
                            var selectContainer = document.createElement('div');
                            selectContainer.style.color = 'black';
                            selectContainer.style.height = '30px';
                            selectContainer.style.width = '100px';
                            selectContainer.style.margin = 0;
                            selectContainer.style.padding = 0;
                            selectContainer.style.marginRight = '20px';
                            selectContainer.style.float = 'right';

                            var selectBox = document.createElement('select');
                            selectBox.style.height = '25px';
                            selectBox.style.width = '100px';
                            selectBox.style.marginRight = '20px';
                            selectBox.style.background = 'white';
                            selectContainer.appendChild(selectBox);

                            var inlineOption = document.createElement('option');
                            inlineOption.style.height = '15px';
                            inlineOption.textContent = 'Inline';
                            selectBox.appendChild(inlineOption);

                            var toolbarOption = document.createElement('option');
                            toolbarOption.style.height = '15px';
                            toolbarOption.textContent = 'Toolbar';
                            selectBox.appendChild(toolbarOption);
                            compContainer.appendChild(selectContainer);

                            break;
                        case "Open New Page On Start":
                            var choiceBox = document.createElement('input');
                            choiceBox.setAttribute('type','checkbox');
                            choiceBox.style.height = '30px';
                            choiceBox.style.width = '30px';
                            choiceBox.style.float = 'right';
                            choiceBox.style.marginRight = '25px';
                            compContainer.appendChild(choiceBox)
                            break;
                            break;
                        case "Show Invisible Characters":
                            var choiceBox = document.createElement('input');
                            choiceBox.setAttribute('type','checkbox');
                            choiceBox.style.height = '30px';
                            choiceBox.style.width = '30px';
                            choiceBox.style.float = 'right';
                            choiceBox.style.marginRight = '25px';
                            compContainer.appendChild(choiceBox)
                            break;
                        case "Auto Save":
                            var divider = document.createElement('div');
                            divider.className = 'mui-divider';
                            compContainer.appendChild(divider);

                            var choiceBox = document.createElement('input');
                            choiceBox.setAttribute('type','checkbox');
                            choiceBox.style.height = '30px';
                            choiceBox.style.width = '30px';
                            choiceBox.style.float = 'right';
                            choiceBox.style.marginRight = '25px';
                            compContainer.appendChild(choiceBox)
                            break;
                        case "Auto Correct":
                            var choiceBox = document.createElement('input');
                            choiceBox.setAttribute('type','checkbox');
                            choiceBox.style.height = '30px';
                            choiceBox.style.width = '30px';
                            choiceBox.style.float = 'right';
                            choiceBox.style.marginRight = '25px';
                            compContainer.appendChild(choiceBox)
                            break;
                        case "Auto Indent":
                            var choiceBox = document.createElement('input');
                            choiceBox.setAttribute('type','checkbox');
                            choiceBox.style.height = '30px';
                            choiceBox.style.width = '30px';
                            choiceBox.style.float = 'right';
                            choiceBox.style.marginRight = '25px';
                            compContainer.appendChild(choiceBox)
                            break;
                        case "Auto List":
                            var choiceBox = document.createElement('input');
                            choiceBox.setAttribute('type','checkbox');
                            choiceBox.style.height = '30px';
                            choiceBox.style.width = '30px';
                            choiceBox.style.float = 'right';
                            choiceBox.style.marginRight = '25px';
                            compContainer.appendChild(choiceBox)
                            break;
                        default:
                            console.debug("HUB UI error");
                    }

                    var title = document.createElement('div');
                    title.textContent = key;
                    title.style.float = 'left';
                    title.style.marginLeft = '20px';
                    title.style.lineHeight = '30px';
                    compContainer.appendChild(title);

                    contentBox.appendChild(compContainer);
                }


            });


            return container;
        },
        plugins: function(){
            purge();

            var title = document.createElement('div');
            title.textContent = 'Plugins';
            title.style.paddingTop = '5px';
            title.style.fontSize = '25px';
            title.style.textAlign = 'left';
            title.style.marginBottom = '15px';
            container.appendChild(title);

            var search = document.createElement('input');
            search.className = 'inputField';
            search.style.background = 'white';
            search.style.color = 'black';
            search.style.height = '25px';
            search.style.width = '100%';
            search.placeholder = 'Search Plugins';
            container.appendChild(search);

            var contentScrollPane = document.createElement('div');
            contentScrollPane.style.height = 'calc(100% - 100px)';
            contentScrollPane.style.width = '100%';
            contentScrollPane.style.overflowY = 'scroll';
            container.appendChild(contentScrollPane);

            var contentBox = document.createElement('div');
            contentBox.style.overFlow = 'visible';
            contentBox.style.position = 'relative';
            contentBox.style.height = 'calc(100% - 100px)';
            contentBox.style.width = '100%';
            contentScrollPane.appendChild(contentBox);

            return container;
        },
        widgets: function(){
            purge();
            container.style.background = 'yellow';
            return container;
        },
        keybindings: function(){
            purge();
            container.style.background = 'black';
            return container;
        },
        install: function(){
            purge();
            container.style.background = 'pink';
            return container;
        },
        initialize: function(parent){
            parentContainer = parent;
        }
    }

}
module.exports = new settings();