
var box;
var gameTypingText="";
var gameTypingAnswers = new Array();

function gameTypingFile(path, callback){
    $.ajax({
        type: "GET",
        url: path,
        dataType: "text",
        success: function(data){callback(data);}
     });
}
function gameTyping(address,id){
    gameTypingText="";
    box=document.getElementById(id);
    box.innerHTML="";
    gameTypingReadFile(address,id);
    gameTypingAddButtons();
}
function gameTypingAddButtons(){
    var s="";
    s+='<div class="gameTypingButtons"><div class="gameTypingButton" onclick="checkanswers();" >Check</div>';
    s+='<div class="gameTypingButton" onclick="showanswers();" >Show answers</div>';
    s+='<div class="gameTypingButton" onclick="clearanswers();" >Clear</div></div>';
    box.innerHTML+=s;
}
function gameTypingReadFile(address,id){
    gameTypingAnswers = new Array();
    gameTypingFile(address,function(data){
        var res=JSON.parse('"'+data+'"');
        var i=0;
        while(res.indexOf("_")>0){
            var answer=res.match(/_(.*?)_/i)[1];
            var s="";
            s+='<input class="game-type-input" type="text" name="0answer" id="'+i+'answer"/>';
            //s+='<img src="img/correct.png" id="'+i+'lianswer-c" alt="correct" class="gameTypingImage"/>';
            //s+='<img src="img/wrong.gif" id="'+i+'lianswer-w" alt="wrong" class="gameTypingImage"/>';
            res=res.replace(/_(.*?)_/i,s); 
            gameTypingAnswers[i]=answer;
            i++;
        }
        gameTypingText=res;
        box.innerHTML+='<p id="tttt">'+gameTypingText+"</p>";
        stack.push("game-type");
        box.style.display="block";
    });
}
function checkanswers(){
    var i=0;
    for (i=0;i<gameTypingAnswers.length;i++){
        if(document.getElementById(i+'answer').value.toLowerCase() == gameTypingAnswers[i].toLowerCase()){
            document.getElementById(i+'answer').style.backgroundColor = "#88dd88";
            //document.getElementById(i+'lianswer-c').style.display = 'inline-block';
            //document.getElementById(i+'lianswer-w').style.display = 'none';
            //console.log("vrvev");
        }else {
            document.getElementById(i+'answer').style.backgroundColor = "#ff8585";
            //document.getElementById(i+'lianswer-w').style.display = 'inline-block';
            //document.getElementById(i+'lianswer-c').style.display = 'none';
            //console.log("no");
        }
    }
}
function showanswers(){
    var i=0;
    for (i=0;i<gameTypingAnswers.length;i++){
        document.getElementById(i+'answer').value = gameTypingAnswers[i];
    }
}
function clearanswers(){
var i=0;
    for (i=0;i<gameTypingAnswers.length;i++){
        document.getElementById(i+'answer').value = '';
        document.getElementById(i+'answer').style.backgroundColor = "transparent";
        //document.getElementById(i+'lianswer-w').style.display = 'none';
        //document.getElementById(i+'lianswer-c').style.display = 'none';
    }
}
function closeGameTyping(){
    popup="";
    box.style.display="none";
}