
var boxMatch;
var lastTouched="";

var numberPairs=0;
var numberRightTouch=0;
var numberWrongTouch=0;

function gameMatchFile(path, callback){
    $.ajax({
        type: "GET",
        url: path,
        dataType: "text",
        success: function(data){callback(data);}
     });
}
function gameMatch(address,id){
    gameMatchText="";
    boxMatch=document.getElementById(id);
    boxMatch.innerHTML="";
    lastTouched="empty";
    numberRightTouch = 0;
    numberWrongTouch = 0;
    gameMatchFile(address,function(data){
        data.replace("\n","");
        data=data.split("[pair]");
        numberPairs = data.length-1;
        var array1 = new Array();
        var array2 = new Array();
        for(var i=1;i<data.length;i++){
            array1.push('<div id="gameMatch'+address+i+'Left" onClick="gameMatchTouch(this.id)" class="gameMatchAnswer GMALeft">'+data[i].split("_")[0]+'</div>');
            array2.push('<div id="gameMatch'+address+i+'Right" onClick="gameMatchTouch(this.id)" class="gameMatchAnswer GMARight">'+data[i].split("_")[1]+'</div>');
        }
        array2=shuffle(array2);
        var s="<p>"+data[0]+"</p>";
        for(var j=0;j<array1.length;j++){
            s+=array1[j];
            s+=array2[j];
        }
        boxMatch.innerHTML='<div class="scrollableContainer">'+s+'</div>';
        stack.push("game-match");
        boxMatch.style.display="block";
    });
}
function gameMatchTouch(id){
    var div=document.getElementById(id);
    if(id!=lastTouched&&(id.replace("Right","Left")==lastTouched||id.replace("Left","Right")==lastTouched)){
        div.style.backgroundColor="#22b573";//green
        div.onclick = function (){};
        document.getElementById(lastTouched).style.backgroundColor="#22b573";//green
        document.getElementById(lastTouched).onclick = function (){};
        lastTouched="empty";
        numberRightTouch++;
        if(numberRightTouch==numberPairs){
            notify("Completed", "<b>Correct:</b> "+numberRightTouch+"<br />Wrong: "+numberWrongTouch+"<br />Accuracy: "+Math.round((100*numberRightTouch)/(numberRightTouch+numberWrongTouch))+"%");
        }
    }else{
        if(id==lastTouched){
            div.style.backgroundColor="#5a6168";//gray
            lastTouched="empty";
        }else{
            div.style.backgroundColor="#338dc9";//lightblue
            if(lastTouched!="empty"){
                var last=document.getElementById(lastTouched);
                last.style.backgroundColor="#d74d4d";//red
                div.style.backgroundColor="#d74d4d";//red
                lastTouched="empty";
                numberWrongTouch++;
                setTimeout(function () {
                    div.style.backgroundColor="#5a6168";//gray
                    last.style.backgroundColor="#5a6168";//gray
                }, 300);
                
            }else{
            lastTouched=id;
            }
        }
    }
}
function shuffle(array) {
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
function closeGameMatch(){
    popup="";
    boxMatch.style.display="none";
}