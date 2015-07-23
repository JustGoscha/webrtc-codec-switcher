// configuration file
var config = require('./config');

// all connected sockets
var connections = [];

/**
 * All the Chat rooms with their name as key value
 * @type {Map}
 */
var rooms = {};

/**
 * All the names that are already taken
 * @type {Array}
 */
var names = [];


// ------------------- WebSocket Server ----------------------
var WebSocket = require("ws");
var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({port: config.websocketport});

var websockets = [];

wss.on('connection', function(ws){
	console.log("Websocket opened");
	websockets.push(ws)
	// ws.send("Welcome to " + config.serverName);
	// ws.send("Login Name?");

	ws.on('close', function(){
		// console.log("CLOSE WS: Closed websocket. Removing...")
		delete websockets[websockets.indexOf(ws)]
	});

	ws.on('message', function(message){
		// handle message
		// message = JSON.parse(message);
		console.log(" - - - - Message - - - -");
		console.log(message);
		for(i in websockets){
			w = websockets[i];
			if(w != ws){
				w.send(message)
			}
		}
	});
});


// -------------------- static webserver ----------------------------
// serves the static webpage

var express = require('express'),
    app = express();

app.use(express.static(__dirname + '/webapp'));
app.listen(config.webport);

console.log("WebRTC WebSocket server started, running on port :" +config.webport );

