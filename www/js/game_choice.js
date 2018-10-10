var gameChoiceDiv;
var questions;

function gameChoiceFile(path, callback){
    $.ajax({
        type: "GET",
        url: path,
        dataType: "text",
        success: function(data){callback(data);}
     });
}
function gameChoice(address,id){
    stack.push("game-choice");
    gameChoiceText="";
    gameChoiceDiv=document.getElementById(id);
    gameChoiceDiv.innerHTML="";
    gameChoiceReadFile(address);
    gameChoiceAddButtons();
}
function gameChoiceAddButtons(){
    var s="";
    s+='<div class="gameChoiceButtons"><div class="gameChoiceButton" onclick="gameChoiceCheckAnswers();" >Check</div></div>';
    gameChoiceDiv.innerHTML+=s;
}
function gameChoiceReadFile(address){
    gameChoiceFile(address,function(data){
        var data = JSON.parse(data);
        var s = "";
        questions=data.length;
        for(var i=0; i<data.length; i++){
            s += '<strong>'+data[i].question+'</strong><form>';
            var array = new Array();
            for(var j=0; j<data[i].answers.length; j++){
                array.push('<label class="container">'+data[i].answers[j]+'<input type="radio" name="choiceAnswer'+i+'" value="'+j+'"><span class="checkmark"></span></label>');
                //array.push('<p><input type="radio" name="choiceAnswer'+i+'" value="'+j+'" >'++'</p>');
            }
            array = gameChoiceShuffle(array);
            for(var j=0; j<data[i].answers.length; j++){
                s += array.pop();
            }
            s += '</form>';
        }
        gameChoiceDiv.innerHTML+=s;
        gameChoiceDiv.style.display="block";
    });
}
function gameChoiceCheckAnswers(){
    var ok = true;
    for(var n=0; n<questions; n++){
        var radios = document.getElementsByName( "choiceAnswer"+n );
        for( var i=0; i<radios.length; i++ ) {
            if( (radios[i].checked && radios[i].value!="0") || (!radios[i].checked && radios[i].value=="0") ) {
                ok = false;
                break;
            }
        }
    }
    if(ok) notify("Completed", "Well done!");
    else notify("Sorry", "Try again...");
}
function closeGameChoice(){
    gameChoiceDiv.style.display="none";
}

function gameChoiceShuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;
    while (0 !== currentIndex) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
      }
  return array;
}