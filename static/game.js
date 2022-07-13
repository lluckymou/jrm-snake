const FOOD_COLOUR = '#670000';
const SNAKE_COLOUR = '#8fc859';
const SNAKE_2_COLOUR = '#c2aa22';
const BG_COLOUR = '#E7FAE5';

const socket = io();

socket.on('init', handleInit);
socket.on('quit', handleQuit);
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


function newGame() {
    socket.emit('newGame');
    init();
}

function joinGame() {
    const code = gameCodeInput.value;
    socket.emit('joinGame', code);
    init();
}

let canvas, ctx;
let playerNumber;
let gameActive = false;

function init() {
    $('#lobby').addClass("d-none");
    $('#gameScreen').addClass("d-block");

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
    const gridsize = state.gridsize;
    const size = canvas.width / gridsize;

    ctx.fillStyle = FOOD_COLOUR;
    ctx.fillRect(food.x * size, food.y * size, size, size);

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
    alert('Sala não encontrada ou já encerrada, recarregue a lista para ver as salas abertas atualmente.');
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