const FOOD_COLOUR = '#800000';
const POOP_COLOUR = '#000000';
const SNAKE_COLOUR = '#8fc859';
const SNAKE_2_COLOUR = '#c2aa22';
const BG_COLOUR = '#E7FAE5';

const socket = io();
var user = undefined;

socket.on('init', handleInit);
socket.on('quit', handleQuit);
socket.on('message', handleMessage);
socket.on('authentication', handleAuthentication);
socket.on('authentication-fail', handleAuthenticationFail);
socket.on('refresh', handleRefreshList);
socket.on('gameState', handleGameState);
socket.on('gameOver', handleGameOver);
socket.on('gameCode', handleGameCode);
socket.on('unknownCode', handleUnknownCode);
socket.on('tooManyPlayers', handleTooManyPlayers);

const newGameBtn = document.getElementById('newGameButton');
const joinGameBtn = document.getElementById('joinGameButton');
const gameCodeInput = document.getElementById('gameCodeInput');

newGameBtn.addEventListener('click', newGame);
joinGameBtn.addEventListener('click', joinGame);

function loginRegister() {
    var username = $('#username').val();
    var email = $('#email').val();
    var password = $('#password').val();

    if(!username) {
        alert('Erro no preenchimento do usuário, verifique o texto digitado e tente novamente.');
        return;
    } else if(username.length < 3) {
        alert('O usuário precisa ter ao menos 3 caracteres');
        return;
    }

    if(!email) {
        alert('Erro no preenchimento de email, verifique o texto digitado e tente novamente.');
        return;
    } else if(!email.includes("@")) {
        alert('O email digitado precisa ser um email valido');
        return;
    }

    if(!password) { 
        alert('Erro no preenchimento da senha, verifique o texto digitado e tente novamente.');
        return;
    } else if(password.length < 8) {
        alert('A senha precisa ter ao menos 8 caracteres');
        return;
    }

    socket.emit('login-register', { username: username, email: email, password: password });
}

function sendMessage() {
    if(!user) {
        alert("Erro ao mandar mensagem a partir deste usuário, recarregue a página e tente novamente");
        return;
    }

    if(!message) {
        alert("Escreva algo primeiro");
        return;
    }

    var message = $('#message').val();
    $('#message').val('');

    socket.emit('message', { sender: user, message: message });
}

function handleMessage(data) {
    $('#chatbox').prepend(`<p class="${(data.sender == user)? 'text-end text-primary' : 'text-start'} w-100"> <b><span>${data.sender}</span>:</b> ${data.message} </p>`);
}

function refreshList() {
    socket.emit('refresh');
}

function handleRefreshList(data) {
    $('#serverlist').html('');

    for (let i = 0; i < data.length; i++) {
        const element = data[i];
        $('#serverlist').append(`<tr class="${element.isFull? 'bg-secondary' : 'bg-success'} text-white"> <td scope="row">${element.room}</td> <td><button onclick="join('${element.room}')" class="btn btn-primary ${element.isFull? 'd-none' : 'd-block'}">Entrar</button></td> </tr>`);
    }
}

function handleAuthentication(data) {
    user = data.username;
    if(data.newUser) alert(`Novo usuário ${user} criado!`);

    $('#register').addClass("d-none");
    $('#lobby').removeClass("d-none");
}

function handleAuthenticationFail(message) {
    alert(message);
}

function newGame() {
    socket.emit('newGame');
    init();
}

function join(game) {
    socket.emit('joinGame', game);
    init();
}

function joinGame() {
    const code = gameCodeInput.value;
    join(code);
}

let canvas, ctx;
let playerNumber;
let gameActive = false;

function init() {
    $('#lobby').addClass("d-none");
    $('#gameScreen').removeClass("d-none");

    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');

    canvas.width = canvas.height = 600;

    ctx.fillStyle = BG_COLOUR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    document.addEventListener('keydown', keydown);
    gameActive = true;
}

function keydown(e) {
    socket.emit('keydown', e.keyCode);
}

function paintGame(state) {
    ctx.fillStyle = BG_COLOUR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const food = state.food;
    const poop = state.poop;
    const gridsize = state.gridsize;
    const size = canvas.width / gridsize;

    ctx.fillStyle = FOOD_COLOUR;
    ctx.fillRect(food.x * size, food.y * size, size, size);
    ctx.fillStyle = POOP_COLOUR;
    ctx.fillRect(poop.x * size, poop.y * size, size, size);

    paintPlayer(state.players[0], size, SNAKE_COLOUR);
    paintPlayer(state.players[1], size, SNAKE_2_COLOUR);
}

function paintPlayer(playerState, size, colour) {
    const snake = playerState.snake;

    ctx.fillStyle = colour;
    for (let cell of snake) {
        ctx.fillRect(cell.x * size, cell.y * size, size, size);
    }
}

function handleInit(number) {
    playerNumber = number;
}

function handleGameState(gameState) {
    if (!gameActive) {
        return;
    }
    gameState = JSON.parse(gameState);
    requestAnimationFrame(() => paintGame(gameState));
}

function handleGameOver(data) {
    if (!gameActive) {
        return;
    }
    data = JSON.parse(data);

    gameActive = false;

    if (data.winner === playerNumber) {
        alert('Você venceu!\n\nJogo encerrado. Recarregue a página para jogar novamente.');
    } else {
        alert('Você perdeu :(\n\nJogo encerrado. Recarregue a página para jogar novamente.');
    }


}

function handleGameCode(gameCode) {
    $('#gameCodeDisplay').attr("placeholder", gameCode);
    $('#gameCodeCopyPaste').text(gameCode);
}

function handleUnknownCode() {
    alert('Sala não encontrada ou já encerrada/cheia, recarregue a lista para ver as salas abertas atualmente.');
    location.reload();
}

function handleQuit() {
    alert('Partida encerrada a força! O oponente desistiu.');
    location.reload();
}

function handleTooManyPlayers() {
    alert('Esta partida já começou.');
    location.reload();
}