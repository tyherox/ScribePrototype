/**
 * Created by JohnBae on 7/8/16.
 */
function spellCheck() {

    var dictionary = [];

    var fs = require('fs');
    fs.readFile(__dirname + '/english.txt', function(err, data) {
        if(err) throw err;
        dictionary = data.toString().split("\n");
    });

    var pm = null;

    var errors = [],
        delay = null,
        start = -1,
        end = -1,
        hold = false;

    function runSpellCheck(start, end){

        console.time('spellcheck');
        if(start>end) start = end;
        delay = null;

        var s = start, f = end;
        while(s!=0&&pm.doc.textBetween(s-1,s--," ").match(/\s/)==null){
            start = s + 1;
            if(start==0) start = 1;
            pm.doc.resolve(start);
        }
        while(f!=pm.doc.content.size&&pm.doc.textBetween(f,++f," ").match(/\s/)==null){
            end = f - 1;
            pm.doc.resolve(end);
        }
        start--;

        var words = getText(start,end).split(/\s/);

        var pos = start;
        for(var i = 0; i<words.length; i++){
            if(words[i].length>0&&words[i]!=' '){
                if(dictionary.indexOf(words[i])==-1) {
                    var error = pm.markRange(pos,pos + words[i].length,
                        {className: 'misspellEditorText', removeWhenEmpty: true, onRemove: function(){console.debug("REMOVED MISSPELL")}});
                    errors.push(error);
                    console.debug("Misspelled:",words[i]);
                }
                else{
                    var mark = pm.markRange(pos,pos + words[i].length,
                        {className: 'defaultEditorText', removeWhenEmpty: true, onRemove: function(){console.debug("REMOVED MISSPELL")}});

                    for(let i = 0; i<errors.length;){
                        var S = mark.from;
                        var F = mark.to;

                        var s = errors[i].from;
                        var f = errors[i].to;

                        if(Math.max(s,S) <= Math.min(f,F)) {
                            pm.removeRange(errors[i]);
                            errors.splice(errors.indexOf(errors[i]),1);
                        }
                        else{
                            i++;
                        }
                    }

                }
                pos += words[i].length + 1;
            }
            else pos++;

        }

        console.timeEnd('spellcheck');
    }

    function getText(start,end){
        var words = "";
        while(start!=end){
            var char = pm.doc.textBetween(start,++start,"  ");
            if(char.length==0) char = " ";
            words += char;
        }
        words = words.replace(/[.,\/#?!$%\^&\*;:{}=\-_`~()"“']/g," ").toLowerCase();
        console.debug(words);
        return words;
    }

    return{
        initialize: function(editor){
            pm = editor;

            pm.on.beforeTransform.add((transform) => {
                if(delay==null)start = pm.selection.$from.pos;
            })

            pm.on.transform.add((transform) =>{
                if(delay!=null) {
                    clearTimeout(delay)
                }
                else {

                }
                end = pm.selection.$to.pos;
                delay = setTimeout(()=>runSpellCheck(start,end), 500)
            });

            pm.on.setDoc.add(()=>{
                runSpellCheck(0,pm.doc.content.size);
            })
        },
        remove: function(){

        }
    }

}
module.exports = new spellCheck();