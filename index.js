const express = require("express");
const app = express();
const http = require('http');
const cors = require('cors');
const {Server} = require("socket.io");

app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
    cors:{
        origin: "*",
        methods: ["GET", "POST"]
    },
});


let roomInfo =[]

io.on("connection", (socket)=>{

        
        console.log("A user has connected!: "+socket.id);

        socket.on('createRoom', (data)=>{
            
            const exists = roomInfo.find(el=>(el.userName.toLowerCase()===data.userName.toLowerCase() && el.roomId ===data.roomId));
            
            if(!exists)
            {
            
            socket.join(data.roomId);
            
            roomInfo.push({userName: data.userName, roomId: data.roomId, userId: socket.id});
            const participants = roomInfo.filter(el=>el.roomId === data.roomId);
            
            socket.emit('joinedRoom', {userName: data.userName, roomId: data.roomId, userId: socket.id, participants });
            
            socket.to(data.roomId).emit('newParticipant', participants);

            console.log(participants);

                    
            }

            else if(data.userId == exists.userId){

            socket.join(data.roomId);

            console.log("We reconnected: "+ data.userName + " to the room: "+data.roomId);
            let user = roomInfo.filter(el=>(el.userName === data.userName && el.roomId === data.roomId));
            user[0].userId = socket.id;
            let temp = roomInfo.filter(el=>!(el.userName === data.userName && el.roomId === data.roomId));
            temp.push(...user);
            roomInfo = temp;
            
            const participants = roomInfo.filter(el=>el.roomId === data.roomId);
            
            socket.emit('joinedRoom', {userName: data.userName, roomId: data.roomId, userId: socket.id, participants });
            socket.to(data.roomId).emit('newParticipant', participants);


            }
            else{
                socket.emit('userAlreadyExists');
            }  
        });
        
        socket.on('chatMsg', (data)=>{
            
            socket.to(data.roomId).emit('incomingChatMsg', {msg: data.msg, userName: data.userName});
        });

        // socket.on('leaveRoom', (roomId)=>{
        //     socket.leave(roomId);

        //     const updatedParticipants = roomInfo.filter(el=>(el.userId !==socket.id && el.roomId === roomId ));
        //     socket.to(roomId).emit('newParticipant', updatedParticipants);

        //     let temp  = roomInfo.filter(el=>el.roomId!==roomId);
        //     temp.push(...updatedParticipants);
        //     roomInfo = temp;
        // })

  
        ///######################################## Video Related events  ######################## //////////////////////

        socket.on('playVideo', (roomId)=>{
            socket.to(roomId).emit('playVideo');
        });

        socket.on('pauseVideo', (roomId)=>{
            socket.to(roomId).emit('pauseVideo');
        });

        socket.on('seeked', (data)=>{
            socket.to(data.roomId).emit('seeked', data.time);
        })


        ///////////////////////// End of Video Events //////////////////////////////////////////////////////////////////


        socket.on('disconnect', function () {
            console.log('User Disconnected: ' +socket.id);
            
            const userDetails = roomInfo.find(el=>el.userId===socket.id);    
            if(userDetails){
            
            const updatedParticipants = roomInfo.filter(el=>(el.userId !==socket.id && el.roomId === userDetails.roomId ));
            //Updating participants list
            socket.to(userDetails.roomId).emit('newParticipant', updatedParticipants);

            //updating roomInfo Array:

            let temp  = roomInfo.filter(el=>el.roomId!==userDetails.roomId);
            temp.push(...updatedParticipants);
            roomInfo = temp;
            console.log(temp);
            }

         });
      
})


server.listen(3001, ()=>{
    console.log("Listening on port 3001");
})