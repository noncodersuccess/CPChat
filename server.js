var Express = require('express'),
app = Express(),
mongo = require('mongoskin'),
db,
chatId = "5a58cd4d0cf033eaeaab1f04",
index,
_ = require('lodash'),
colors = require('colors'),
os = require('os'),
ip,
usersList = null,
globalScoket;
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://192.168.2.13:27017/";


// creating socket for server
var http = require('http').createServer(app);
var io = require('socket.io')(http);

// middlewares for page
app.use(Express.static('public'));

// listening for connection
io.on('connection',function(socket){
  globalScoket = socket;
	ifaces = os.networkInterfaces();
	var userIp = ifaces["eth0"][0]["address"];
	ip = ifaces["eth0"][0]["address"].split('.')[3];
  console.log("client is connected With This Ip :".green+userIp);  
    connectToDB(function(err,status){
    	if(err){
    		throw err;
    		return;
    	}
    	if(status){
      console.log("Data base is connected".green);  
      setTheUserIsOnline(function(err,userStatus){
          if(err){
             throw err;
             return;
           }
            startChatMassenage(globalScoket);
          });
	      }    
    });

    socket.on("userMasseage",function(data){
    	if(!usersList){
           checkUserList(data);
    	}else{
    		if(usersList[ip]["name"]){
           updateMasseges(data);
    		}else{
    		   checkUserList(data);
    		}
    	}
    });

    socket.on("liveBroadcasting",function(data){
    	socket.broadcast.emit("liveBroadcasting",data);
    });

    socket.on('reconnect', function() {
        console.log("client is reconnect With This Ip :".green+userIp);
    });

    socket.on('disconnect', function() {
        console.log("client is disconnect With This Ip :".green+userIp);
        unsetTheUserIsOnline(function(err,res){
           if(err){
              throw err;
              return;
           }
           globalScoket = null;
        });
    });
});

function connectToDB (cb) {
	MongoClient.connect(url, function(err, dbCon) {
	  if (err) throw err;
	  db = dbCon.db("mydb");
	  cb(null,true)
	});
};

function updateMasseges(data) {
        var query = {"_id":chatId};
        var newval ={$push:{masseages:data}};
        db.collection('mytestCol').update(query,newval,{upsert:true},function(err,resp) {
            if(err){
                console.log('error while updating data in db'.red);
                return;
            }
            getAllMassage(function(err,res){});
        });
};

function getAllMassage(cb){
	db.collection('mytestCol').findOne({} , function(err,allMs) {
        if(err){
            console.log('error while updating data in db'.red);
            return;
        }
         if(allMs){
         	if(!usersList){
               try{
                  usersList = allMs["users"];
          	   }catch(e){
          		  console.log("userList Is not there err ".red+colors(e).red);
          	   }
         	  }
            createOnlineUserList(allMs["users"],function(err,res){
                if(err){
                   throw err;
                   return;
                }
               io.sockets.emit("sendingToAllUserToMasseage",allMs.masseages);
               cb(null,true);
            });
         }
    });
}

function createOnlineUserList(userList,cb){
   var finalList = _.filter(userList,function(val){
      if(val["online"] && val["online"] === true || val["online"] === false){
          return val["online"] === true || val["online"] === false;
       }
    });
    io.sockets.emit("broadcastOnlineUsers",finalList);
    cb(null,true);
 }  

function step1(userName,cb){
   
      function checkUserIsAlreadyThereOrNot(){
      	  var newval = {};
      	  var query = {"_id":chatId};
      	  newval["users."+ip+".name"] = userName;
	        db.collection('mytestCol').update(query,{$set:newval},{upsert:true},function(err,resp) {
	            if(err){
	                console.log('error while updating data in db'.red);
	                return;
	            }
	            updateUserList();
	        });
      }

      function updateUserList(){
      	  db.collection('mytestCol').findOne({} , function(err,allMs) {
          if(err){
            console.log('error while updating data in db'.red);
            return;
          }
          if(allMs){
               try{
               	  usersList = null;
                  usersList = allMs["users"];
          	   }catch(e){
          		  console.log("userList Is not there err ".red+colors(e).red);
          	   }
         	    cb(null,true);
           }
        });
      }

      checkUserIsAlreadyThereOrNot();
 }

 function setTheUserIsOnline(cb){
        var newval = {};
        var query = {"_id":chatId};
        newval["users."+ip+".online"] = true;
        db.collection('mytestCol').update(query,{$set:newval},{upsert:true},function(err,resp) {
            if(err){
                console.log('error while updating data in db'.red);
                return;
            }
            cb(null,true);
        });
 }

  function unsetTheUserIsOnline(cb){
        var newval = {};
        var query = {"_id":chatId};
        newval["users."+ip+".online"] = false;
        db.collection('mytestCol').update(query,{$set:newval},{upsert:true},function(err,resp) {
            if(err){
                console.log('error while updating data in db'.red);
                return;
            }
            cb(null,true);
        });
 }

 function startChatMassenage(ev){
      getAllMassage(function(err,res){
          if(err){
            throw err;
            return;
          }
          if(usersList[ip]["name"]){
               ev.emit("sendWelComeMassage",usersList[ip]);
          }
        });
        setInterval(function(){
               getAllMassage(function(err,res){});
        },10000);
 }

 function checkUserList(data){
 	step1(data["name"],function(err,res){
		if(err){
			throw err;
			return;
		}
      updateMasseges(data);
	 });
 }

// listening port
http.listen(4000,function (){
	console.log("LiveChat Is Started".green);
})