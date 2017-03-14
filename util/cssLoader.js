/**
 * Created by JohnBae on 6/12/16.
 */
module.exports = function(file){
    if(file!=null){
        var css = document.createElement("link");
        css.setAttribute("rel", "stylesheet");
        css.setAttribute("type", "text/css");
        css.setAttribute("href", file);
        document.getElementsByTagName("head")[0].appendChild(css)
    }
    else{
        console.debug("CSS link null value");
    }
}