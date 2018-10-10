var city="bologna";  //bologna rovaniemi poznan coimbra
var loc = {latitude:"", longitude:""};
var path="";
var popup="";
var notification_ID=0;
var l;  //db
var stack = [];
var isLexiconAvailable;
var isTranslated;
var hasTranslation;
var notifications;
var fontsize;

//elements
var PAGE_TITLE=document.getElementById("top-bar-title"); //change when choose page
var MAIN_MENU=document.getElementById("main-menu-page"); //hide when choose page
var LOADING=document.getElementById("loading");

document.addEventListener('deviceready', init, false);
document.addEventListener("backbutton", back, false);
document.addEventListener("pause", onPause, false);
document.addEventListener("resume", onResume, false);
var lastIframe;
function onPause() {
    lastIframe="";
    var iframes = document.querySelectorAll('iframe');
    for (var i = 0; i < iframes.length; i++) {
        lastIframe=iframes[i].outerHTML;
        iframes[i].parentNode.removeChild(iframes[i]);
    }
}
function onResume(){
    if(lastIframe!=""){
        document.getElementById("content-page").innerHTML+=lastIframe;
    }
    lastIframe="";
}


function init(){   
    $(document).on('click', 'a[href^=http], a[href^=https]', function(e){

	e.preventDefault();
	var $this = $(this); 
	var target = $this.data('inAppBrowser') || '_blank';

	window.open($this.attr('href'), target, 'location=yes,zoom=no');
    });
    path = "data/"+city+"/";
    colorTopBar();
    setStatusBar();
    fontsize = localStorage.getItem("fontsize");
    if (fontsize == null || fontsize == 'undefined'){
        fontsize = 14;
        localStorage.setItem("fontsize", fontsize);
    }
    fontSize(fontsize);
    document.getElementById("top-bar-back").onclick = function() {back();};
    getfile("data/"+city+"/db.txt",function(data){
        l=JSON.parse(data);
    });
    
    notificationPermission();           //permesso notifiche
    setNotificationOnClickEvents();     //onClick
    notifications = localStorage.getItem("notifications");
    if (notifications != "false"){
        startNotificationPlanner();
    }
    load();
}

function back (){
    switch (stack.pop()) {
        case "add-answer":
            addAnswerEnded();
            break;
        case "search":
            hideSearch();
            break;
        case "notification":
            closenotif();
            break;
        case "game-type":
            closeGameTyping();
            break;
        case "game-match":
            closeGameMatch();
            break;
        case "game-choice":
            closeGameChoice();
            break;
        case "menu":
            closeMenu();
            break;
        case "note":
            hideNote();
            break;
        case "add-note":
            addNoteEnded();
            break;
        case "wordz":
            hideWordz();
            break;
        default:
            var top = stack.pop();
            if(top == null || top == ""){
                gohome();
            }else if(top.indexOf("data/")>=0){
                goto(top);
            }
    }
}

function forward(folder){
    path += folder+"/";
    stack.push(path);
    load();
}
function goto(p){
    path=p;
    stack.push(path);
    load();
}
function gohome(){
    if(path!=="data/"+city+"/"){
        path="data/"+city+"/";
        stack = [];
        load();
    }
}
function checkConnection(){
   var networkState = navigator.connection.type;
   var states = {};
   states[Connection.UNKNOWN]  = 'Unknown connection';
   states[Connection.ETHERNET] = 'Ethernet connection';
   states[Connection.WIFI]     = 'WiFi connection';
   states[Connection.CELL_2G]  = 'Cell 2G connection';
   states[Connection.CELL_3G]  = 'Cell 3G connection';
   states[Connection.CELL_4G]  = 'Cell 4G connection';
   states[Connection.CELL]     = 'Cell generic connection';
   states[Connection.NONE]     = 'No network connection';
   if(states[networkState].indexOf("WiFi") != -1 || states[networkState].indexOf("Cell") != -1) return true;
   return false;
}

function load(lingua){
    //show loading bar
    LOADING.style.display="block";
    
    //old image fade out
    var img = document.getElementsByClassName("page-image");
    if(img[0]!=null){
        img[0].className = "page-image animated fadeOut";
    }
    
    //reset variables
    isLexiconAvailable = false;
    isTranslated = false;
    hasTranslation = false;
    
    //hide back button on homepage
    if (path == "data/"+city+"/"){
        document.getElementById("top-bar-back").style.display="none";
    }else{
        document.getElementById("top-bar-back").style.display="block";
    }
    
    //check connection
    var connected = checkConnection();
    if(connected){
        var sheet = window.document.styleSheets[0];
        sheet.insertRule('iframe { display: block; }', sheet.cssRules.length);
    }else{
        var sheet = window.document.styleSheets[0];
        sheet.insertRule('iframe { display: none; }', sheet.cssRules.length);
    }
    
    deactivateIconGame();
    deactivateIconTalk();
    var page=document.getElementById("content-page");
    var t="<div id="+path+">";
    getfile(path+"content.txt", function(file){ 
        var content=JSON.parse(file);
        
        //set page title--------------------------------------------------------
        PAGE_TITLE.innerHTML=content.title;
        
        //set image-------------------------------------------------------------
        var imageTitle;
        if((path).indexOf("/talk/")>=0){
            imageTitle = "TalkImage.jpg";
        }else{
            imageTitle = "NoImage.jpg";
        }
        t+='<img class="page-image animated fadeIn" src="'+path+'image.jpg" onError="this.src=\'img/'+imageTitle+'\'" alt=""/>';
        
        var talkText="";
        if(content.talk != ""){
            if(city=="bologna"){
                var x = content.talk;
                x = x.split("</tr>");
                for (var i = 0; i < x.length; i++) {
                    var added="";
                    if(localStorage.getItem('added'+path+i) != null){
                        var loc = localStorage.getItem('added'+path+i).split("$%&");
                        for(var p=0;p<loc.length-1;p++){
                            added+='<div class="addedAnswer"><p id="ADDED-ANSWER'+path+p+"/"+p+'"onclick="tts(this.innerHTML)"><img style="width:9px; margin:0 3px 0 -5px;" src="img/voice.png"/>'+loc[p]+'</p><div style="display:inline;" onClick="removeAnswer(\''+path+i+'\',\''+loc[p]+'\')"><img src="img/trash.png"/></div></div>';
                        }
                    }
                    talkText+=(x[i]+'</tr>').replace(/<p>/g,'<p onclick="tts(this.innerHTML)"><img style="width:9px; margin:0 2px 0 -9px;" src="img/voice.png"/>').replace(/<\/td><\/tr>/g, added+'<div class="ADDAnswerButton" id="ADD'+path+i+'" onClick="addAnswer(\''+path+i+'\')"><img class="ADDAnswerButtonPlus" src="img/add.png"/><div class="ADDAnswerButtonText">[add]</div></div></td></tr>');
                }
            }else{
                talkText = content.talk;
            }
        };
        
        listDir(cordova.file.applicationDirectory + "www/" + path, function(cartelle){
                if(content.lexicon!="")isLexiconAvailable=content.lexicon;
                iconTitle("",cartelle, 0, cartelle.length-1, function(t1){
                    t+=t1;
                        setPageText(lingua, function(t2){
                            t+=t2;
                            if(talkText!=""){
                                t+='<div id=\'TALKDIV'+path+'\' class="textDiv">'+talkText+'</div>';
                            }
                            var menu="";
                            menu+='<div id="firstMenuIcon" onClick="settings()" class="menuIcon"><img src="img/iconSettings.png"/></div>';
                            menu+='<div id="secondMenuIcon" onClick="book()" class="menuIcon"><img src="img/iconLexicon.png"/></div>';
                            menu+='<div id="thirdMenuIcon" onClick="about()" class="menuIcon"><img src="img/iconAbout.png"/></div>';
                            document.getElementById("page-menu").innerHTML= menu+'<div id="page-menu-content"></div>';
                            document.getElementById("top-bar-menu").style.display="block";
                            t+='<div class="distance animated fadeInLeft" style="display:none;" id="DISTANCE'+path+'" ></div>';
                            t+="</div>";

                            if((path+cartelle[i]).indexOf("/talk/")>=0){
                                colorizeIconTalk();
                            }

                            page.innerHTML=t;
                            page.style.display="block";
                            LOADING.style.display="none";
                            if(content.latitude != "" && content.longitude != ""){
                                document.getElementById("content-page").innerHTML+='<div class="iconMap"><a href="https://www.google.com/maps/search/?api=1&query='+content.latitude+','+content.longitude+'&z=18"><img src="img/iconMap.png"/></a></div>';
                                distanceFromDevice(content.latitude,content.longitude,"DISTANCE"+path);
                            }
                        });  
                });  
        });
        
        
    });
    
}

function setPageText(lingua, callback){
    var t="";
    getfile(path+"text.txt", function(text){
        getfile(path+"textEN.txt", function(textEN){
            if(textEN!=null){
                if(lingua!="EN") {   
                    hasTranslation = true;
                }else{
                    t+='<div class="textDiv animated fadeIn">'+textEN+'</div>';
                }
            }
            callback(t);
        });
        if(text!=null){
            if(lingua=="EN") {
                isTranslated = true;
            }else{
                t+='<div class="textDiv animated fadeIn">'+text+'</div>';
            }
        }
    });
    
}
function iconTitle(t1,cartelle, i, to, callback){
    console.log("icon title. "+i);
    if(i<=to&&cartelle!=""&&cartelle!=null){
        var t=t1;
        if(cartelle[i]==="games"){
            activateIconGame();
            iconTitle(t,cartelle,i+1,to,callback);
        }else if(cartelle[i]==="talk"){
            activateIconTalk();
            iconTitle(t,cartelle,i+1,to,callback);
        }else if(cartelle[i]==="lexicon"){
            isLexiconAvailable = true;
            iconTitle(t,cartelle,i+1,to,callback);
        }
        else{
            var titleID=path+cartelle[i]+'title';
            getfile(path+cartelle[i]+"/content.txt",function(file){
                var data = (JSON.parse(file)).title;
                var diff = (JSON.parse(file)).difficulty;
                
                // set icon onclick event
                var onclick = 'forward(\'' + cartelle[i] + '\')';
                if((path+cartelle[i]).indexOf("09Wordz")>=0) onclick = 'showWordz()';

                //set icon layout
                if((path+cartelle[i]).indexOf("/talk/")>=0){
                    t+='<div onClick="'+onclick+'" style="-webkit-animation-delay:0.'+i+'s;" class="iconLongContainerTalk animated slideInRight"><img class="iconLongTalk" src="'+path+cartelle[i]+'/icon.png" onError="this.src=\'img/iconTalk.png\'" alt=""/><span id="'+titleID+'">'+data+'</span></div>';
                }else if((path.match(/\//g) || []).length>3){
                    t+='<div onClick="'+onclick+'" style="-webkit-animation-delay:0.'+i+'s;" class="iconLongContainer animated slideInRight"><span id="'+titleID+'">'+data+'</span>';
                    if(diff != ""){//add difficulty flag if possible
                        t+='<img class="iconLong" src="img/DIFF'+diff+'.png" />';
                    }
                    t+='</div>';
                }else{
                    //set defautl icon
                    var icon="";
                    if((path+cartelle[i]).indexOf("01Uni-Life")>=0){
                        icon="img/Uni-Life.png";
                    }
                    else if((path+cartelle[i]).indexOf("02Getting-Around")>=0){
                        icon="img/Getting-Around.png";
                    }
                    else if((path+cartelle[i]).indexOf("03Food-and-Drink")>=0){
                        icon="img/Food-and-Drink.png";
                    }
                    else if((path+cartelle[i]).indexOf("04Worth-seeing")>=0){
                        icon="img/Worth-seeing.png";
                    }
                    else if((path+cartelle[i]).indexOf("05Entertainment")>=0){
                        icon="img/Entertainment.png";
                    }
                    else if((path+cartelle[i]).indexOf("06Lifestyle")>=0){
                        icon="img/Lifestyle.png";
                    }
                    else if((path+cartelle[i]).indexOf("07Services-and-needs")>=0){
                        icon="img/Services-and-needs.png";
                    }
                    else if((path+cartelle[i]).indexOf("08Shopping")>=0){
                        icon="img/Shopping.png";
                    }
                    else if((path+cartelle[i]).indexOf("09Wordz")>=0){
                        icon="img/Wordz.png";
                    }
                    t+='<div onClick="'+onclick+'" class="iconContainer animated zoomIn"><img class="icon" src="'+path+cartelle[i]+'/icon.png" onError="this.src=\''+icon+'\'" alt=""/><span id="'+titleID+'">'+data+'</span></div>';
                }
                iconTitle(t,cartelle,i+1,to,callback);
            });
        }  
    }else{
        callback(t1);
    }
}

function listDir(path, callback){
    var folders=new Array();
    window.resolveLocalFileSystemURL(path,function (fileSystem) {
        var reader = fileSystem.createReader();
        reader.readEntries(
            function (entries) {
                for (var i = 0; i < entries.length; i++) {
                    if (entries[i].isDirectory===true){
                        folders.push(entries[i].name);
                    }
                }
                callback(folders.sort());
            },
            function (err) { //READ ENTRIES ERROR
              alert(err);
            }
        );
    },  
    function (err) {  //RESOLVE FILE ERROR
        alert(err);
    });
}

function lingua(x){
    load(x);
}

//--------------------FILES-----------------------------------------------------
function getfile(path, callback){
    $.ajax({
        type: "GET",
        url: path,
        dataType: "text",
        success: function(data){callback(data);},
        error: function(){callback();}
     });
}
//----------------------END-FILES-----------------------------------------------
//
//----------------------SEARCH--------------------------------------------------
function showHideSearch(){
    if(document.getElementById("searchBox").style.display=="block"){
        hideSearch();
    }
    else{
        showSearch();
    }
}
function showSearch(){
    document.getElementById("topBar").style.backgroundColor="#5a6168";
    document.getElementById("searchBox").style.display="block";
    document.getElementById("searchResults").style.display="block";
    document.getElementById("bottom-bar").className="animated fadeOutDown";
    stack.push("search");
    document.getElementById("searchInput").focus();
}
function hideSearch(){
    colorTopBar();
    document.getElementById("searchBox").style.display="none";
    document.getElementById("searchResults").style.display="none";
    document.getElementById("searchResults").innerHTML="";
    document.getElementById("bottom-bar").className="animated fadeInUp";
}
function startSearch(){
    search(document.getElementById("searchInput").value.trim());
}
function search(text){
    document.getElementById("searchResults").innerHTML="";
    var s = "";
    for(var i=0;i<l.db.length;i++){
        if(l.db[i].name!=null && l.db[i].path!=null){
            if(l.db[i].name.toUpperCase().indexOf(text.toUpperCase())>=0){
                s+='<div style="margin:15px 0 0 0;" onClick=\'stack.pop(); hideSearch(); goto("'+l.db[i].path+'"); \'>'+l.db[i].name+"</div>";
            }
        }  
    }
    for(var i=0;i<l.db.length;i++){
        if(l.db[i].keyword!=null && l.db[i].keyword!="" && l.db[i].path!=null){
            var k = l.db[i].keyword;
            for(var n=0;n<k.length;n++){
                if(k[n].toUpperCase().indexOf(text.toUpperCase())>=0){
                    if(s.indexOf('<div style="margin:15px 0 0 0;" onClick=\'stack.pop(); hideSearch(); goto("'+l.db[i].path+'"); \'>'+l.db[i].name+"</div>")<0){
                        s+='<div style="margin:15px 0 0 0;" onClick=\'stack.pop(); hideSearch(); goto("'+l.db[i].path+'"); \'>'+l.db[i].name+"</div>";
                    }
                break;
                }
            }
        }  
    }
    document.getElementById("searchResults").innerHTML = s == "" ? '<div style="margin:15px 0 0 0;">No results</div>': s;
}          
//---------------------END-SEARCH-----------------------------------------------
//
//------------------NOTIFICATIONS-----------------------------------------------
var notifIntervalID;
function notificationPermission(){
    cordova.plugins.notification.local.hasPermission(function (granted) {
        if(!granted){
            cordova.plugins.notification.local.requestPermission(function () {});
        }
        if(granted){
        }
    });
}
function startNotificationPlanner(){
    notifications = "true";
    localStorage.setItem("notifications", "true");
    var oldbest="";
    notifIntervalID = setInterval(function() {
        var best=999999999;
        var bestname;
        var bestpath;
        getlocation(function(){
            for(var i=0;i<l.db.length;i++){
                if(l.db[i].latitude!=null && l.db[i].longitude!=null){
                    var dist=distance2dot(loc["latitude"],loc["longitude"],l.db[i].latitude,l.db[i].longitude);
                    if(dist<best){
                        best=dist;
                        bestname=l.db[i].name;
                        bestpath=l.db[i].path;
                    }
                }  
            }
            if (bestname!==oldbest&&best<100){
                sendNotification(bestname,"Distance: "+best+"m",bestpath,bestpath+"image.jpg"); 
                oldbest=bestname;
            }
        });
    }, 30 * 1000); //30+1000
}
function stopNotificationPlanner(){
    clearInterval(notifIntervalID);
    notifications = "false";
    localStorage.setItem("notifications", "false");
}
function setNotificationOnClickEvents(){
    cordova.plugins.notification.local.on("click", function(notification) {
        path=notification.data;
        load();
    });
}
function sendNotification(title,text,data,attach){
    notification_ID++;
    cordova.plugins.notification.local.schedule({
        id: notification_ID,
        title: title,
        text: text,
        foreground: true,
        attachments: ['file://'+attach],
        data: data
    });
}
//------------------END-NOTIFICATIONS-------------------------------------------
//
//------------------DISTANCE----------------------------------------------------
function getlocation(callback){
    var onSuccess = function(position) {
        loc["latitude"]=position.coords.latitude;
        loc["longitude"]=position.coords.longitude;
        /*latitude.longitude.altitude.accuracy.altitudeAccuracy.heading.speed.timestamp*/
        callback();
    };
    function onError(error) { console.log('GPS ERROR\n' + error.message + '\n'); }
    var options = { enableHighAccuracy: true, timeout: 10000 };
    navigator.geolocation.getCurrentPosition(onSuccess, onError, options);
}
function distanceFromDevice(lat2,lon2,id){           //distanza del device da un punto
    getlocation(function(){
        var m=distance2dot(loc["latitude"],loc["longitude"],lat2,lon2);
        //document.getElementById("DISTANCE"+path).innerHTML="DISTANCE: "+m+"m"+'<div class="iconMap"><a href="geo:'+lat2+","+lon2+'?z=18"><img src="img/iconMap.png"/></a></div>';
        document.getElementById(id).innerHTML=m+"m";
        document.getElementById(id).style.display="block";
    });
}
function distance2dot(lat1,lon1,lat2,lon2){                //distanza tra due punti
    var p = 0.017453292519943295;
    var c = Math.cos;
    var a = 0.5 - c((lat2 - lat1) * p)/2 + c(lat1 * p) * c(lat2 * p) * (1 - c((lon2 - lon1) * p))/2;
    var km=12742*Math.asin(Math.sqrt(a));
    var m=Math.round(km*1000);
    return m;
}
//------------------END-DISTANCE------------------------------------------------
//
//------------------TALK--------------------------------------------------------
function activateIconTalk(){
    document.getElementById("iconTalk").className="bottom-bar-icon iconTalkON";
    document.getElementById("iconTalk").onclick = function() { talk(); };
}
function colorizeIconTalk(){
    document.getElementById("iconTalk").className="bottom-bar-icon iconTalkCOLOR";
}
function deactivateIconTalk(){
    document.getElementById("iconTalk").className="bottom-bar-icon iconTalkOFF";
    document.getElementById("iconTalk").onclick = function() {};
}
function talk(){                        //apre pagina talk
    forward("talk");
}
function addAnswer(data){             //apre schermata aggiungi modello di risposta
    popup="add-answer";
    var div=document.getElementById("add-answer-div");
    div.innerHTML='<textarea id="inputAnswer" type="text" placeholder="Add answer model"></textarea><div class="cancellAnswerButton" onClick="addAnswerEnded()" >CANCEL</div><div class="addAnswerButton" onClick="addAnswerCallback(\''+data+'\')" >ADD ANSWER</div>';
    div.style.display="block";
}
function addAnswerCallback(data) {       //salva nuovo modello di risposta
    addAnswerEnded();
    var input = document.getElementById("inputAnswer").value;
    if (input != ""){
        var a="";
        if(localStorage.getItem("added"+data)!==null){
            a=localStorage.getItem("added"+data);
        }
        localStorage.setItem("added"+data,a+input+"$%&");
    }
    load();
}
function addAnswerEnded() {              //chiude schermata aggiungi modello di risposta
    document.getElementById("add-answer-div").style.display="none";
    popup="";
}
function removeAnswer(data,text){        //elimina modello di risposta
    var r = confirm("Remove added answer?");
    if (r === true) {
        var a=localStorage.getItem("added"+data);
        text+="$%&";
        a=a.replace(text,"");
        localStorage.setItem("added"+data,a);
        load();
    }
}
//------------------END-TALK----------------------------------------------------
//
//------------------GAME--------------------------------------------------------
function activateIconGame(){
    document.getElementById("iconGames").className="bottom-bar-icon iconGamesON";
    document.getElementById("iconGames").onclick = function() { game(); };
}
function deactivateIconGame(){
    document.getElementById("iconGames").className="bottom-bar-icon iconGamesOFF";
    document.getElementById("iconGames").onclick = function() {};
}
function game(){
    listDir(cordova.file.applicationDirectory + "www/" + path + "games/",
        function(cartelle){
            if(cartelle!=null){
                var i;
                for (var i = 0; i < cartelle.length; i++) {
                    if(cartelle[i].toUpperCase()=="TYPE"){
                        gameTyping(path+'games/'+cartelle[i]+'/game.txt',"game_type_div");
                        break;
                    }
                    if(cartelle[i].toUpperCase()=="MATCH"){
                        gameMatch(path+'games/'+cartelle[i]+'/game.txt',"game_match_div");
                        break;
                    }
                    if(cartelle[i].toUpperCase().indexOf("CHOICE")>=0){
                        gameChoice(path+'games/'+cartelle[i]+'/game.txt',"game_choice_div");
                    }
                }
            }
        });
}
function closenotif(){
    document.getElementById("notifica").style.display="none";
    document.getElementById("notifica").innerHTML="";
}
//------------------END-GAME----------------------------------------------------
//
//-------------------POP-UP-----------------------------------------------------
function notify(title, content){
    var s="";
    s+='<div class="wrapperOutside">';
    s+='	<div class="wrapperInside">';
    s+='		<div class="dialogContainer">';
    s+='		<div class="dialogContent">';
    s+='			<div class="dialogContentTitle">'+title+'</div>';
    s+='                        <div class="dialogContentBody">';
    s+=                             content;
    s+='                        </div>';
    s+='			</div>';
    s+='	 		<div class="dialogActionBar">';
    s+='				<div class="buttonFlat" style=display:inline;" onclick="stack.pop(); closenotif()">CLOSE</div>';
    s+='                    </div>';
    s+='		</div>';
    s+='	</div>';
    s+='    </div>';
    stack.push("notification");
    document.getElementById("notifica").innerHTML=s;
    document.getElementById("notifica").style.display="block";
}
//------------------END-POP-UP--------------------------------------------------
//
//--------------------SPEECH----------------------------------------------------
function tts(text){
    var locale="";
    if(city=="bologna"){locale="it-it";}
    else if(city==="rovaniemi"){locale="fi-fi";}
    else if(city==="coimbra"){locale="pt-pt";}
    else if(city==="poznan"){locale="pl-pl";}
    else{locale=="en-uk";}
    TTS.speak({
            text: text.replace(/<img[^>]*>/g,"").replace(/<strong>/g,"").replace(/<\/strong>/g,""),
            locale: locale,
            rate: 1.00
        }, function () {
            //alert('success');
        }, function (reason) {
            alert(reason);
        });
}
//-----------------END-SPEECH---------------------------------------------------
//
//---------------------MENU-----------------------------------------------------
function pageMenuButton(){
    var p = document.getElementById("page-menu");
    if(p.style.display=="block"){
        stack.pop();
        closeMenu();
    }
    else{
        document.getElementById("topBar").style.backgroundColor="#5a6168";
        StatusBar.backgroundColorByHexString("#333333");
        p.style.display="block";
        stack.push("menu");
        settings();
    }
}
function closeMenu(){
    document.getElementById("page-menu").style.display="none";
    colorTopBar();
    setStatusBar();
}
function settings(){
    document.getElementById("firstMenuIcon").style.backgroundColor="#70777d";
    document.getElementById("secondMenuIcon").style.backgroundColor="#9ca0a4";
    document.getElementById("thirdMenuIcon").style.backgroundColor="#9ca0a4";
    var s='<div class="page-menu-first-line">Settings:</div>';
    if(hasTranslation){s += '<div onClick="closeMenu(); stack.pop(); lingua(\'EN\');" class="iconEn page-menu-line">Switch to: <img src="img/iconEn.png"/></div>';}
    if(isTranslated){s += '<div onClick="closeMenu(); stack.pop(); lingua();" class="iconEn page-menu-line">Switch to: <img src="img/icon'+city+'.png"/></div>';}
    if(notifications=="true"){s += '<div class="page-menu-line">Notifications: <div onclick="stopNotificationPlanner(); settings();" class="notifications-button" >off</div><div style="color:skyblue" class="notifications-button" >on</div></div>';}
    if(notifications=="false"){s += '<div class="page-menu-line">Notifications: <div style="color:skyblue" class="notifications-button" >off</div><div onclick="startNotificationPlanner(); settings();" class="notifications-button" >on</div></div>';}
    if(fontsize==12){s += '<div class="page-menu-line ">Text size: <div style="color:skyblue" class="font-size-button" onclick="fontSize(12); settings();">small</div><div class="font-size-button" onclick="fontSize(14); settings();">medium</div><div class="font-size-button" onclick="fontSize(18); settings();">large</div></div>';}
    if(fontsize==14){s += '<div class="page-menu-line ">Text size: <div class="font-size-button" onclick="fontSize(12); settings();">small</div><div style="color:skyblue" class="font-size-button" onclick="fontSize(14); settings();">medium</div><div class="font-size-button" onclick="fontSize(18); settings();">large</div></div>';}
    if(fontsize==18){s += '<div class="page-menu-line ">Text size: <div class="font-size-button" onclick="fontSize(12); settings();">small</div><div class="font-size-button" onclick="fontSize(14); settings();">medium</div><div style="color:skyblue" class="font-size-button" onclick="fontSize(18); settings();">large</div></div>';}
    document.getElementById("page-menu-content").innerHTML = s;
}
function fontSize(size){
    fontsize = size;
    var sheet = window.document.styleSheets[0];
    sheet.insertRule('.textDiv { font-size: '+fontsize+'px; }', sheet.cssRules.length);
    //sheet.insertRule('.font-size-example { font-size: '+fontsize+'px; }', sheet.cssRules.length);
    localStorage.setItem("fontsize", fontsize);
}
function book(){
    document.getElementById("firstMenuIcon").style.backgroundColor="#9ca0a4";
    document.getElementById("secondMenuIcon").style.backgroundColor="#70777d";
    document.getElementById("thirdMenuIcon").style.backgroundColor="#9ca0a4";
    var s='<div class="page-menu-first-line">Language:</div>';
    if(isLexiconAvailable!=false){s+='<div class="page-menu-line" onClick="stack.pop(); closeMenu(); lexicon();">Glossary</div>';}
    s+='<div class="page-menu-line" onClick="dictionary()">Dictionary</div>';
    s+='<div class="page-menu-line" onClick="stack.pop(); closeMenu(); showNote();">Notes</div>';
    document.getElementById("page-menu-content").innerHTML = s;
}
function dictionary(){
    if(city=="coimbra"){
        window.location.href = "https://pt.pons.com/tradu%C3%A7%C3%A3o";
    }
    if(city=="bologna"){
        notify("Available dictionaries",'<p style="font-weight:bold;">Multilingual:</p><p onclick="closenotif(); window.location.href=\'http://dizionario.reverso.net\';">Reverso</p><p onclick="closenotif(); window.location.href=\'http://www.wordreference.com\';">Wordreference</p><p style="font-weight:bold;">Monolingual:</p><p onclick="closenotif(); window.location.href=\'https://www.garzantilinguistica.it\';">Garzanti</p><p onclick="closenotif(); window.location.href=\'http://www.grandidizionari.it/Dizionario_Italiano.aspx\';">Hoepli</p><p onclick="closenotif(); window.location.href=\'https://www.dizionario-italiano.it\';">Olivetti</p>');
    }
    if(city=="poznan"){
        notify("Available dictionaries",'<p onclick="closenotif(); window.location.href=\'https://ling.pl\';">Ling.pl</p><p onclick="closenotif(); window.location.href=\'https://translatica.pl\';">Translatica</p><p onclick="closenotif(); window.location.href=\'http://edict.pl/dict?lang=EN\';">Dict</p>');
    }
    if(city=="rovaniemi"){
        window.location.href = "https://www.suomienglantisanakirja.fi/english.php";
    }
}
function lexicon(){
    if(isLexiconAvailable==true){
        forward("lexicon");
    }else if(isLexiconAvailable!=false){
        goto(isLexiconAvailable);
    }
}
function about(explode){
    document.getElementById("firstMenuIcon").style.backgroundColor="#9ca0a4";
    document.getElementById("secondMenuIcon").style.backgroundColor="#9ca0a4";
    document.getElementById("thirdMenuIcon").style.backgroundColor="#70777d";
    var university;
    var language;
    var lexicon = "";
    var credits = '<p>Developed by the teams of the ILOCALAPP project (Incidentally Learning Other Cultures and Languages through an App)<br />Coordination: Andrea Ceccherelli, University of Bologna, Italy<br />Partners: Adam Mickiewicz University, Poznan, Poland; University of Lapland, Rovaniemi, Finland, and CES-University of Coimbra, Portugal</p>';
    if(city=="coimbra"){
        university = "Coimbra";
        language = "Portuguese";
        credits += '<p>General supervision: Clara Keating</p><p>Writing of texts and tips to talk: Anabela Fernandes, Joana Cortez-Smyth, Olga Solovova<br />Multimedia: Olga Solovova<br />Methodological design: Clara Keating, Anabela Fernandes, Joana Cortez-Smyth, Olga Solovova</p><p>Editing and proofreading: Joana Cortez-Smyth, Olga Solovova</p>';
    }
    if(city=="bologna"){
        university = "Bologna";
        language = "Italian";
        lexicon = 'Within each text some lexicon items will redirect you to a lexicon sheet, and in the end there is an open question for you (you can use the notes in the menu, if you wish to write your answer).<br /><br />';
        credits += '<p>General supervision: Antonella Valva</p><p>Writing of texts, lexical notes, tips to talk: Cristiana Cervini<br />Multimedia: Cristiana Cervini<br />Methodological design: Elisabetta Magni, Cristiana Cervini</p><p>Translation: Julie Wood<br />Review and proofreading: Elisabetta Magni, Antonella Valva</p>';
    }
    if(city=="poznan"){
        university = "Pozna&#324;";
        language = "Polish";
        lexicon = "You can find a polish/english glossary in the menu.<br /><br />";
        credits += '<p>General supervision: Justyna Wci&oacute;rka</p><p>Writing of texts and tips to talk: Magdalena Bednarek, Ma\u0142gorzata Jakobsze, Karolina Ruta, Ewa W\u0119grzak, Justyna Wci&oacute;rka, Izabela Wieczorek<br />Multimedia: Magdalena Bednarek, Ma\u0142gorzata Jakobsze, Karolina Ruta, Ewa W\u0119grzak, Justyna Wci&oacute;rka, Izabela Wieczorek<br />Methodological design: Magdalena Bednarek, Karolina Ruta, Ewa W\u0119grzak, Justyna Wci&oacute;rka, Izabela Wieczorek</p><p>Translation: Alicja Sempowicz-Kalczy\u0144ska<br />Review and proofreading: Alicja Sempowicz-Kalczy\u0144ska, Justyna Wci&oacute;rka</p>';
    }
    if(city=="rovaniemi"){
        university = "Rovaniemi";
        language = "Finnish";
        credits += '<p>General supervision: Ville Jakkula</p><p>Writing of texts, lexical notes, tips to talk: Hannu Paloniemi, Annukka Jakkula, Ville Jakkula<br />Multimedia: Ana Krmek, Hannu Paloniemi, Annukka Jakkula, Ville Jakkula<br />Methodological design: Annukka Jakkula, Hannu Paloniemi</p><p>Review and proofreading: Annukka Jakkula, Pia Eriksson, Maija Paatero, Richard Foley, Aimo Tattari</p>';
    }
    credits += '<p>Graphic design: Alessandro Vitali, Marco Zanichelli (Open Stories)<br />App development: Giacomo Mambelli<br />Technological supervision: Silvia Mirri</p><br /><img class="creditsImg" src="img/erasmus.png" /><br />This project has been funded with the support of the European Union and the Italian National Agency for the Erasmus+ Programme. This app reflects the views only of the authors, and the European Union and the Italian National Agency for the Erasmus+ Programme cannot be held responsible for any use which may be made of the information contained therein.';
    var about = 'UniOn! is a mobile app that helps mobility and international students to make the most of their experiences at the universities of '+university+'. With UniOn!, discovering the '+language+' culture will be much easier and you&rsquo;ll be incidentally learning a language too. The app will help you become familiar with your new environment while getting to know loads of useful info about the uni, city and the country.<br /><br />You can access contents:<br />- by entering a category from the home page<br />- through notifications<br />- by searching a keyword<br /><br />Texts within  each category are organized into subcategories and include external links with image, video, audio, etc.). <br />Talk will give you practical tips on conversation in the language of your new environment<br />Games will help you see how much you already know.<br /><br />'+lexicon+'Feel free to use UniOn! as you prefer: while strolling around the city or before/after visiting a place, to check specific information or just to discover some fun facts. Make the most of it!';
    var s = '<div onclick="facebook();" class="FBbutton">UniOn! on Facebook</div><div onclick="survey();" class="Surveybutton">On-line Survey</div>';
    if(explode == undefined){
        s +='<div class="page-menu-first-line" onclick="about(\'about\');">About...</div>';
        s +='<div class="page-menu-first-line" onclick="about(\'credits\');">Credits...</div>';
    }else if(explode == "about"){
        s +='<div class="page-menu-first-line" onclick="about();">About:</div>';
        s +='<div class="page-menu-line animated fadeIn">'+about+'</div>';
        s +='<div class="page-menu-first-line" onclick="about(\'credits\');">Credits...</div>';
    }else if(explode == "credits"){
        s +='<div class="page-menu-first-line" onclick="about(\'about\');">About...</div>';
        s +='<div class="page-menu-first-line" onclick="about();">Credits:</div>';
        s +='<div class="page-menu-line animated fadeIn">'+credits+'</div>';
    }
    document.getElementById("page-menu-content").innerHTML = s;
}
//--------------------END-MENU--------------------------------------------------
//
//----------------------NOTE----------------------------------------------------
function showNote() {
    var div=document.getElementById("note-div");
    var content = '';
    var loc = localStorage.getItem('note');
    if(loc != null && loc != ""){
                    content += '<div class="note"><p><b>Your notes below</b></p></div>';
                    var loc = loc.split("$%&");
                    for(var p=loc.length-2;p>=0;p--){
                        content += '<div class="note"><p>'+loc[p]+'</p><div><img onClick="removeNote(\''+loc[p]+'\')" src="img/trash.png"/></div></div>';
                    }
    }else{
        content += '<div class="note"><p><b>Still no note</b></p></div>';
    }
    div.innerHTML=content+'<div class="addAnswerButton" onClick="showAddNote();" >ADD NEW</div>';
    div.style.display="block";
    stack.push("note");
    document.getElementById("top-bar-back").style.display="block";
}
function hideNote(){
    document.getElementById("note-div").style.display= "none";
    if (path == "data/"+city+"/"){
        document.getElementById("top-bar-back").style.display="none";
    }
}
function showAddNote() {                        //apre schermata add-Note
    var div=document.getElementById("add-note-div");
    div.innerHTML='<textarea id="inputNote" type="text" placeholder="Add note"></textarea><div class="cancellAnswerButton" onClick="addNoteEnded()" >CANCEL</div><div class="addAnswerButton" onClick="addNote()" >SAVE</div>';
    div.style.display="block";
    stack.push("add-note");
}
function addNote() {                            //salva nuova nota
    var regex = /[^a-z0-9\!\?\.\:]/gi;
    var input = document.getElementById("inputNote").value.replace(regex, "");
    addNoteEnded();
    if (input != ""){
        var a="";
        if(localStorage.getItem("note") != null){
            a=localStorage.getItem("note");
        }
        localStorage.setItem("note",a+input+"$%&");
    }
    showNote();
}
function addNoteEnded() {                       //chiude schermata add-Note
    document.getElementById("add-note-div").style.display="none";
}
function removeNote(text){                      //elimina nota
    var r = confirm("Remove selected text?");
    if (r === true) {
        var a=localStorage.getItem("note");
        text+="$%&";
        a=a.replace(text,"");
        localStorage.setItem("note",a);
    }
    showNote();
}
function facebook(){
    window.location.href = "https://www.facebook.com/ilocalapp/";
}
function survey(){
    window.location.href = "https://goo.gl/forms/2Ixivspsj1XYF4io2";
}

//------------------END-NOTE----------------------------------------------------

//-------------------WORDZ------------------------------------------------------
function showWordz(){
    var now = new Date();
    var start = new Date(now.getFullYear(), 0, 0);
    var diff = (now - start) + ((start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000);
    var oneDay = 1000 * 60 * 60 * 24;
    var day = Math.floor(diff / oneDay);
    var arrayIndex = day-1;
    if(new Date().getFullYear() % 4 != 0 && day > 59){ //anno bisestile, salto 29 feb
        arrayIndex++;
    }
    getfile("data/"+city+"/wordz.txt",function(data){
        var container = document.getElementById("wordz-div");
        var s = '<div class="wordzDivContent"><div class="wordzHeader"><h1>WORDZ</h1><h2>Day: <b>'+day+'</b></h2></div><p class="wordzLabel">The word of the day is:</p><h3>'+(JSON.parse(data))[arrayIndex].word+'</h3><h4>'+(JSON.parse(data))[arrayIndex].text+'</h4><div class="wordzCloseButton" onClick="hideWordz()">CLOSE</div></div>';
        container.innerHTML = s;
        container.style.display = "block";
        stack.push("wordz");
    });
    
}
function hideWordz(){
    document.getElementById("wordz-div").style.display = "none";
}
//-----------------END-WORDZ----------------------------------------------------



function colorTopBar(){
    var color="#5a6168";
    //var sheet = window.document.styleSheets[0];
    if(city=="bologna"){color="#f83939";}
    if(city=="poznan"){color="#002e60";}
    if(city=="coimbra"){color="#00703c";}
    if(city=="rovaniemi"){color="#3085c6";} //#28CAF0
    
    document.getElementById("topBar").style.backgroundColor=color; 
}
function setStatusBar(){
    var color="#5a6168";
    if(city=="bologna"){color="#dd0808";}
    if(city=="poznan"){color="#002955";}
    if(city=="coimbra"){color="#006527";}
    if(city=="rovaniemi"){color="#2580c1";}
    StatusBar.backgroundColorByHexString(color);
}