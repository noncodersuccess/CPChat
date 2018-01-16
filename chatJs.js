var socket = io.connect("http://localhost:4000");

// dom Operation

var userName   = document.getElementById('field1');
var masseage   = document.getElementById('field2');
var btn        = document.getElementById('field3');
var output     = document.getElementById('mainHolder');
var typeing    = document.getElementById('typeingMassage');
var usersList  = document.getElementById('onlineUserHolder');			

// registering client events

btn.addEventListener('click',function(){
     socket.emit("userMasseage",{
          userName : userName.value,
     	  masseage : masseage.value
     });
     masseage.value = '';
     btn.setAttribute("disabled",'disabled');
});

masseage.addEventListener("keypress",function(){
	/*socket.emit("liveBroadcasting",{
          userName : userName.value,
     });*/
     btn.removeAttribute("disabled");
});

// listening server events

socket.on("sendingToAllUserToMasseage",function(data){
     if(data && data.length > 0){
       var reverseData = data.reverse();
       typeing.innerHTML = '';
       output.innerHTML = '';
        reverseData.forEach(function(value){
           output.innerHTML += '<p><strong> '+ value.userName +' :</strong> '+ value.masseage +'</p>'; 
        });
     }else{
       typeing.innerHTML = '';
       output.innerHTML = '';
     }
});

socket.on('liveBroadcasting',function(data){
     typeing.innerHTML = '<p>'+data.userName + " is Typing....</p>";
});

socket.on('sendWelComeMassage',function(data){
    if(data["name"]){
       alert("Hi! " + data["name"] + " Welcome To My Application");
       userName.value = data["name"];
    }else{
       alert("Hi! Welcome To My Application.This is Your First Time On My Application Please Enter Your Name"); 
    }
});

socket.on('broadcastOnlineUsers',function(data){
     usersList.innerHTML = '';
     data.forEach(function(val){
        if(val["online"] && val["name"]){
          if(val["online"]){
             usersList.innerHTML += '<div class="mainOnlineHolder"><span class="nameHolder">'+val["name"]+'</span><span class="onlineChild">Online</span></div>';
          }else{
             usersList.innerHTML += '<div class="mainOnlineHolder"><span class="nameHolder">'+val["name"]+'</span><span class="onlineChild redClass">Offline</span><div class="mainOnlineHolder">';
          }
        }else{
            usersList.innerHTML = '';
        }
     })
});
