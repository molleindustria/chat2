//check README.md

//create a web application that uses the express frameworks and socket.io to communicate via http (the web protocol)
var express = require('express');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);


//canvas size
var WIDTH = 800;
var HEIGHT = 600;
var MARGIN = 50; //don't spawn on corners

//We want the server to keep track of the whole game state
//in this case the game state are the attributes of each player
var gameState = {
    players: {}
}

//when a client connects serve the static files in the public directory ie public/index.html
app.use(express.static('public'));

//when a client connects the socket is established and I set up all the functions listening for events
io.on('connection', function (socket) {
    //this appears in the terminal
    console.log('A user connected');


    //wait for the player to send their name and info, then broadcast them
    socket.on('join', function (playerInfo) {
        console.log("New user joined: " + playerInfo.nickName + " avatar# " + playerInfo.avatar + " color# " + playerInfo.color);

        //the server randomizes the position
        var x = MARGIN + Math.floor(Math.random() * (WIDTH - MARGIN * 2));
        var y = MARGIN + Math.floor(Math.random() * (HEIGHT - MARGIN * 2));

        var newPlayer = { id: socket.id, nickName: playerInfo.nickName, color: playerInfo.color, avatar: playerInfo.avatar, x: x, y: y, destinationX: x, destinationY: y };

        //save the same information in my game state
        gameState.players[socket.id] = newPlayer;

        //this is sent to the client upon connection
        socket.emit('serverMessage', 'Hello welcome!');

        //send the whole game state to the player that just connected 
        //so they know where all the players are without having to wait for an update     
        socket.emit('gameState', gameState);

        //send all players information about the new player
        //upon creation destination and position are the same 
        //socket.broadcast.emit('playerJoined', newPlayer);
        io.sockets.emit('playerJoined', newPlayer);

        console.log("There are now " + Object.keys(gameState.players).length + " players");

    });

    //when a client disconnects I have to delete its player object
    //or I would end up with ghost players
    socket.on('disconnect', function () {
        console.log("Player disconnected " + socket.id);
        io.sockets.emit('playerDisconnected', { id: socket.id });
        //send the disconnect
        //delete the player object
        delete gameState.players[socket.id];
        console.log("There are now " + Object.keys(gameState.players).length + " players");
    });




    //when I receive a talk send it to everybody
    socket.on('talk', function (msg) {
        io.sockets.emit('playerTalked', { id: socket.id, message: msg });

    });

    //when I receive a move sent it to everybody
    socket.on('move', function (obj) {

        //broadcast the movement to everybody
        io.sockets.emit('playerMoved', { id: socket.id, x: obj.x, y: obj.y, destinationX: obj.destinationX, destinationY: obj.destinationY });
    });


});



//listen to the port 3000
http.listen(3000, function () {
    console.log('listening on *:3000');
});



