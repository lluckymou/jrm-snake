// Jogo server-side

const { GRID_SIZE } = require('./constants');

const oldPos = [
    {
        x: 0,
        y: 0,
    },
    {
        x: 0,
        y: 0,
    }
];

module.exports = {
    initGame,
    gameLoop,
    getUpdatedVelocity,
}

function initGame() {
    const state = createGameState()
    rockCluster(state);
    randomFood(state);
    randomPoop(state);
    return state;
}

function createGameState() {
    return {
        players: [{
            id: 0,
            pos: {
                x: 3,
                y: 15,
            },
            vel: {
                x: 1,
                y: 0,
            },
            snake: [
                {x: 1, y: 15},
                {x: 2, y: 15},
                {x: 3, y: 15},
            ],
        }, {
            id: 1,
            pos: {
                x: 18,
                y: 15,
            },
            vel: {
                x: -1,
                y: 0,
            },
            snake: [
                {x: 20, y: 15},
                {x: 19, y: 15},
                {x: 18, y: 15},
            ],
        }],
        food: {},
        poop: {},
        rockCluster: [
            {},
            {},
            {},
            {},
            {},
            {},
            {},
        ],
        gridsize: GRID_SIZE,
    };
}

function gameLoop(state) {
    if (!state) {
        return;
    }

    const playerOne = state.players[0];
    const playerTwo = state.players[1];

    playerOne.pos.x += playerOne.vel.x;
    playerOne.pos.y += playerOne.vel.y;

    playerTwo.pos.x += playerTwo.vel.x;
    playerTwo.pos.y += playerTwo.vel.y;

    // Verify out-of-bounds
    
    if (playerOne.pos.x < 0 || playerOne.pos.x > GRID_SIZE || playerOne.pos.y < 0 || playerOne.pos.y > GRID_SIZE) {
        return 2;
    }

    if (playerTwo.pos.x < 0 || playerTwo.pos.x > GRID_SIZE || playerTwo.pos.y < 0 || playerTwo.pos.y > GRID_SIZE) {
        return 1;
    }

    // Verify rock cluster

    for (let rock of state.rockCluster) {
        if (playerOne.pos.x === rock.x && playerOne.pos.y === rock.y) {
            return 2;
        }

        if (playerTwo.pos.x === rock.x && playerTwo.pos.y === rock.y) {
            return 1;
        }
    }

    // Verify food

    if (state.food.x === playerOne.pos.x && state.food.y === playerOne.pos.y) {
        playerOne.snake.push({ ...playerOne.pos });
        playerOne.pos.x += playerOne.vel.x;
        playerOne.pos.y += playerOne.vel.y;
        randomFood(state);
    }

    if (state.food.x === playerTwo.pos.x && state.food.y === playerTwo.pos.y) {
        playerTwo.snake.push({ ...playerTwo.pos });
        playerTwo.pos.x += playerTwo.vel.x;
        playerTwo.pos.y += playerTwo.vel.y;
        randomFood(state);
    }

    // Verify poop

    if (state.poop.x === playerOne.pos.x && state.poop.y === playerOne.pos.y) {
        playerOne.snake.pop({ ...playerOne.pos });
        playerOne.pos.x -= playerOne.vel.x;
        playerOne.pos.y -= playerOne.vel.y;
        randomPoop(state);
    }

    if (state.poop.x === playerTwo.pos.x && state.poop.y === playerTwo.pos.y) {
        playerTwo.snake.pop({ ...playerTwo.pos });
        playerTwo.pos.x -= playerTwo.vel.x;
        playerTwo.pos.y -= playerTwo.vel.y;
        randomPoop(state);
    }

    // Verify size

    if (playerOne.snake.length <= 0)
    {
        return 2;
    }

    if (playerTwo.snake.length <= 0)
    {
        return 1;
    }

    // Verify self collision

    if (playerOne.vel.x || playerOne.vel.y) {
        for (let cell of playerOne.snake) {
            if (cell.x === playerOne.pos.x && cell.y === playerOne.pos.y) {
                return 2;
            }
        }

        playerOne.snake.push({ ...playerOne.pos });
        playerOne.snake.shift();
    }

    if (playerTwo.vel.x || playerTwo.vel.y) {
        for (let cell of playerTwo.snake) {
            if (cell.x === playerTwo.pos.x && cell.y === playerTwo.pos.y) {
                return 1;
            }
        }

        playerTwo.snake.push({ ...playerTwo.pos });
        playerTwo.snake.shift();
    }

    return false;
}

function rockCluster(state) {
    for (let i = 0; i < state.rockCluster.length; i++) {
        rock = {
            x: Math.floor(Math.random() * GRID_SIZE),
            y: Math.floor(Math.random() * GRID_SIZE),
        }

        for (let cell of state.players[0].snake) {
            if (cell.x === rock.x && cell.y === rock.y) {
                i--;
            }
        }

        for (let cell of state.players[1].snake) {
            if (cell.x === rock.x && cell.y === rock.y) {
                i--;
            }
        }

        state.rockCluster[i] = rock;
    }
}

function randomFood(state) {
    food = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
    }

    if (state.poop.x === food.x && state.poop.y === food.y) {
        return randomFood(state);
    }

    for (let cell of state.rockCluster) {
        if (cell.x === food.x && cell.y === food.y) {
            return randomFood(state);
        }
    }

    for (let cell of state.players[0].snake) {
        if (cell.x === food.x && cell.y === food.y) {
            return randomFood(state);
        }
    }

    for (let cell of state.players[1].snake) {
        if (cell.x === food.x && cell.y === food.y) {
            return randomFood(state);
        }
    }

    state.food = food;
}

function randomPoop(state) {
    poop = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
    }

    if (state.food.x === poop.x && state.food.y === poop.y) {
        return randomPoop(state);
    }

    for (let cell of state.rockCluster) {
        if (cell.x === poop.x && cell.y === poop.y) {
            return randomPoop(state);
        }
    }

    for (let cell of state.players[0].snake) {
        if (cell.x === poop.x && cell.y === poop.y) {
            return randomPoop(state);
        }
    }

    for (let cell of state.players[1].snake) {
        if (cell.x === poop.x && cell.y === poop.y) {
            return randomPoop(state);
        }
    }

    state.poop = poop;
}

function getUpdatedVelocity(keyCode, client) {
    currentVel = client.vel;
    currentPos = client.pos;
    if (currentPos.x === oldPos[client.id].x && currentPos.y === oldPos[client.id].y) {
        return { x: currentVel.x, y: currentVel.y };
    } else {
        switch (keyCode) {
            case 37: { // left
                if (currentVel.x === 1) {break;}
                oldPos[client.id].x = currentPos.x;
                oldPos[client.id].y = currentPos.y;
                return { x: -1, y: 0 };
            }
            case 38: { // down
                if (currentVel.y === 1) {break;}
                oldPos[client.id].x = currentPos.x;
                oldPos[client.id].y = currentPos.y;
                return { x: 0, y: -1 };
            }
            case 39: { // right
                if (currentVel.x === -1) {break;}
                oldPos[client.id].x = currentPos.x;
                oldPos[client.id].y = currentPos.y;
                return { x: 1, y: 0 };
            }
            case 40: { // up
                if (currentVel.y === -1) {break;}
                oldPos[client.id].x = currentPos.x;
                oldPos[client.id].y = currentPos.y;
                return { x: 0, y: 1 };
            }
        }
        return { x: currentVel.x, y: currentVel.y };
    }
}
