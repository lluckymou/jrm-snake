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
const credentials = [];

io.on('connection', client => {

    console.log("Jogador entrou");

    client.on('login-register', handleLogin);
    client.on('keydown', handleKeydown);
    client.on('newGame', handleNewGame);
    client.on('joinGame', handleJoinGame);
    client.on('message', handleMessage);
    client.on('refresh', handleRefreshList);

    function handleLogin(data) {
        // Procura usuário para tentar autenticar
        for (let i = 0; i < credentials.length; i++) {
            const element = credentials[i];
            if(element.username == data.username && element.email == data.email) {
                if(element.password == data.password) {
                    client.emit('authentication', { username: data.username, newUser: false });
                    handleRefreshList();
                    return;
                } else {
                    client.emit('authentication-fail', 'Este usuário já existe e a senha não é essa.');
                    return;
                }
            }
        }
        
        // Cria usuário
        credentials.push(data);
        client.emit('authentication', { username: data.username, newUser: true });
        handleRefreshList();
    }

    function handleMessage(data) {
        io.emit("message", data);
    }

    function handleRefreshList() {
        const arr = Array.from(io.sockets.adapter.rooms);
        const filtered = arr.filter(room => !room[1].has(room[0]));
        const res = filtered.map(i => i[0]);

        const serverarray = [];

        for (let i = 0; i < res.length; i++) {
            const element = res[i];
            var isFull = (io.sockets.adapter.rooms.get(element).size > 1);

            serverarray.push( { room: element, isFull: isFull } );
        }

        client.emit('refresh', serverarray);
    }

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

        if (state[roomName]) {
            const vel = getUpdatedVelocity(keyCode, state[roomName].players[client.number - 1]);

            if (vel) {
                state[roomName].players[client.number - 1].vel = vel;
            }
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
