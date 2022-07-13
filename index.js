const { v4: uuidv4 } = require('uuid');

const { initGame, gameLoop, getUpdatedVelocity } = require('./game');
const { FRAME_RATE } = require('./constants');

const express = require('express');
const socketio = require('socket.io');
const path = require('path');
const http = require('http');

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 8080;
const io = socketio(server);

// Static folder
app.use(express.static(path.join(__dirname, "static")));

// Start server
server.listen(port, () => {
    console.log(`Now listening on port ${port}`); 
});

const state = {};
const clientRooms = {};

io.on('connection', client => {

    console.log("Jogador entrou");

    client.on('keydown', handleKeydown);
    client.on('newGame', handleNewGame);
    client.on('joinGame', handleJoinGame);

    function handleJoinGame(roomName) {
        console.log(`Alguém tentando entrar em ${roomName}`);

        const room = io.sockets.adapter.rooms.get(roomName);

        if (room) {
            allUsers = room.sockets;
        
            if(room.size > 1) {
                client.emit('tooManyPlayers');
                return;
            }
        } else {
            client.emit('unknownCode');
            return;
        }

        clientRooms[client.id] = roomName;

        client.join(roomName);
        client.number = 2;
        client.emit('init', 2);
        client.emit('gameCode', roomName);
        
        startGameInterval(roomName);
    }

    function handleNewGame() {
        let roomName = uuidv4();
        clientRooms[client.id] = roomName;
        client.emit('gameCode', roomName);

        console.log(`Sala ${roomName} criada`);

        state[roomName] = initGame();

        client.join(roomName);
        client.number = 1;
        client.emit('init', 1);
    }

    function handleKeydown(keyCode) {
        const roomName = clientRooms[client.id];
        if (!roomName) {
            return;
        }

        try {
            keyCode = parseInt(keyCode);
        } catch(e) {
            console.error(e);
            return;
        }

        const vel = getUpdatedVelocity(keyCode);

        if (state[roomName] && vel) {
            state[roomName].players[client.number - 1].vel = vel;
        }
    }

    client.on('disconnect', () => {
        const roomName = clientRooms[client.id];

        if (!roomName) {
            return;
        }
        
        io.sockets.in(roomName).emit('quit');
        io.in(roomName).socketsLeave(roomName);
    });
});

function startGameInterval(roomName) {
    const intervalId = setInterval(() => {
        const winner = gameLoop(state[roomName]);
        
        if (!winner) {
            emitGameState(roomName, state[roomName])
        } else {
            emitGameOver(roomName, winner);
            state[roomName] = null;
            clearInterval(intervalId);
        }
    }, 1000 / FRAME_RATE);
}

function emitGameState(room, gameState) {
    io.sockets.in(room)
        .emit('gameState', JSON.stringify(gameState));
}

function emitGameOver(room, winner) {
    io.sockets.in(room)
        .emit('gameOver', JSON.stringify({ winner }));
}