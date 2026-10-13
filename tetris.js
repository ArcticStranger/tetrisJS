const SHAPES = [
  // I
  [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  // J
  [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  // L
  [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0],
  ],
  // O
  [
    [1, 1],
    [1, 1],
  ],
  // S
  [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0],
  ],
  // Z
  [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0],
  ],
  // T
  [
    [1, 1, 1],
    [0, 1, 0],
    [0, 0, 0],
  ],
];

const SHAPE_COLORS = [
  '#00BCD4',
  '#485FE5',
  '#FF9800',
  '#FFE83B',
  '#4CAF50',
  '#A629BC',
  '#F44336',
];

const COLOR_SIDEBAR_BORDER = '#ddd';
const COLOR_EMPTY_BLOCK = '#343434';
const COLOR_GAME_OVERLAY = '#000000bb';
const COLOR_FONT = '#FFF';

const BLOCK_SIZE = 46;
const BLOCK_BACKGROUND = '#292929';

const GRAVITY_SPEED = 1;
const GRAVITY_ACCELERATION = 0.00001;
const GRAVITY_THRESHOLD = 1000;

const GRID_COLS = 10;
const GRID_ROWS = 20;

const SIDEBAR_BORDER = 20;
const SIDEBAR_WIDTH_BLOCKS = 6;

const MAX_DT = 100;

const INPUT_REPEAT_THRESHOLD = 400;
const INPUT_REPEAT_INTERVAL = 5;

const KEY_TO_INPUT_TYPE = {
  ArrowLeft: 'moveLeft',
  ArrowRight: 'moveRight',
  ArrowDown: 'moveDown',
  ArrowUp: 'rotate',
  ' ': 'hardDrop',
  r: 'restart',
};

const GRID_WIDTH = GRID_COLS * BLOCK_SIZE;
const GRID_HEIGHT = GRID_ROWS * BLOCK_SIZE;

const SIDEBAR_WIDTH = SIDEBAR_WIDTH_BLOCKS * BLOCK_SIZE;
const SIDEBAR_CONTENT_X = GRID_WIDTH + SIDEBAR_BORDER + BLOCK_SIZE;
const SIDEBAR_CONTENT_Y = BLOCK_SIZE;

const CANVAS_WIDTH = GRID_WIDTH + SIDEBAR_BORDER + SIDEBAR_WIDTH;
const CANVAS_HEIGHT = GRID_HEIGHT;

const BLOCK_EMPTY = -1;

const INPUT_STATE_INITIAL = 0;
const INPUT_STATE_CHARGING = 1;
const INPUT_STATE_REPEATING = 2;

function initCanvas() {
  const canvas = document.getElementById('game');
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  canvas.style.visibility = 'visible';

  return canvas.getContext('2d');
}

function makeEmptyGrid() {
  return Array.from({ length: GRID_ROWS }, () =>
    Array(GRID_COLS).fill(BLOCK_EMPTY)
  );
}
function getRandomIndex(n) {
  return Math.floor(Math.random() * n);
}

function getRandomShapeId() {
  return getRandomIndex(SHAPES.length);
}

function createCurrentPiece(shapeId) {
  const shape = SHAPES[shapeId];

  return {
    shapeId,
    shape,
    position: {
      x: getRandomIndex(GRID_COLS - shape[0].length + 1),
      y: 0,
    },
  };
}

function getInitialState() {
  const initialShapeId = getRandomShapeId();
  return {
    isGameOver: false,
    score: 0,
    gravity: {
      progress: 0,
      speed: GRAVITY_SPEED,
    },
    currentPiece: createCurrentPiece(initialShapeId),
    nextShapeId: getRandomShapeId(),
    grid: makeEmptyGrid(),
  }
}

function canGridFitShape(grid, shape, shapeX, shapeY) {
  return shape.every((row, i) => {
    const gridY = shapeY + i;

    return row.every((isSolid, j) => {
      if (!isSolid) {
        return true;
      }

      if (gridY >= grid.length) {
        return false;
      }

      const gridX = shapeX + j;
      if (gridX < 0 || gridX >= grid[0].length) {
        return false;
      }

      return grid[gridY][gridX] === BLOCK_EMPTY;
    })
  })
}

function moveCurrentPiece(grid, currentPiece, moveX, moveY) {
  const { shape, position } = currentPiece;
  const { x, y } = position;

  const canMove = canGridFitShape(grid, shape, x + moveX, y + moveY);

  if (canMove) {
    currentPiece.position.x += moveX;
    currentPiece.position.y += moveY;
  }

  return canMove;
}

function rotate(shape) {
  return Array.from({ length: shape[0].length }, (_, i) =>
    Array.from(
      { length: shape.length },
      (_, j) => shape[shape.length - 1 - j][i]
    )
  );
}

function rotateCurrentPiece(grid, currentPiece) {
  const { shape, position } = currentPiece;

  const newShape = rotate(shape);

  if (canGridFitShape(grid, newShape, position.x, position.y)) {
    currentPiece.shape = newShape;
  }
}

function handleInputState(state, dt) {
  if (!input) {
    return false;
  }

  input.timer += dt;

  switch (input.state) {
    case INPUT_STATE_INITIAL:
      input.state = INPUT_STATE_CHARGING;
      return true;

    case INPUT_STATE_CHARGING:
      const isCharged = input.timer >= INPUT_REPEAT_THRESHOLD;
      if (isCharged) {
        input.state = INPUT_STATE_REPEATING;
        input.timer = 0;
      }

      return isCharged;

    case INPUT_STATE_REPEATING:
      const shouldRepeat = input.timer >= INPUT_REPEAT_INTERVAL;
      if (shouldRepeat) {
        input.timer = 0;
      }

      return shouldRepeat;
  }
}

function updateCurrentPiece(state, inputs, dt) {
  const { grid, currentPiece } = state;

  const isInputActive = (inputType) => handleInputState(inputs[inputType], dt);

  if (inputs.moveLeft) {
    moveCurrentPiece(grid, currentPiece, -1, 0);
  }
  if (inputs.moveRight) {
    moveCurrentPiece(grid, currentPiece, 1, 0);
  }
  if (inputs.moveDown) {
    moveCurrentPieceDown(state);
  }
  if (inputs.rotate) {
    rotateCurrentPiece(grid, currentPiece);
  }
  if (inputs.hardDrop) {
    while (moveCurrentPieceDown(state)) {

    }
  }
}

function attachToGrid(grid, currentPiece) {
  const { shapeId, shape, position } = currentPiece;

  for (let i = 0; i < shape.length; i++) {
    for (let j = 0; j < shape[0].length; j++) {
      if (shape[i][j]) {
        grid[position.y + i][position.x + j] = shapeId;
      }
    }
  }
}

function clearCompleteLines(grid) {
  let clearedLines = 0;

  for (let i = grid.length - 1; i >= 0; i--) {
    if (grid[i].every(cell => cell !== BLOCK_EMPTY)) {
      clearedLines++;
    } else if (clearedLines > 0) {
      grid[i + clearedLines] = [...grid[i]];
    }
  }

  for (let i = 0; i < clearedLines; i++) {
    grid[i].fill(BLOCK_EMPTY);
  }

  return clearedLines;
}

function handleCurrentPieceLanding(state) {
  // attach the piece to grid
  attachToGrid(state.grid, state.currentPiece);
  // clear complete lines
  const clearedLines = clearCompleteLines(state.grid);
  state.score += clearedLines;

  const newPiece = createCurrentPiece(state.nextShapeId);
  const { shape, position } = newPiece;

  if (canGridFitShape(state.grid, shape, position.x, position.y)) {
    state.currentPiece = newPiece;
    state.nextShapeId = getRandomShapeId();
  } else {
    state.isGameOver = true;
  }
  // update score

  // create new piece

  // if it doesnt fit - game over 
}

function moveCurrentPieceDown(state) {
  state.gravity.progress = 0;
  const didMove = moveCurrentPiece(state.grid, state.currentPiece, 0, 1);

  if (!didMove) {
    handleCurrentPieceLanding(state)
  }

}

function updateGravity(state, dt) {
  state.gravity.speed += GRAVITY_ACCELERATION * dt;
  state.gravity.progress += state.gravity.speed * dt;

  if (state.gravity.progress >= GRAVITY_THRESHOLD) {
    moveCurrentPieceDown(state);
  }
}

function resetGameState(state) {
  Object.assign(state, getInitialState());
}


function update(state, inputs, dt) {
  if (state.isGameOver) {
    if (inputs.restart) {
      // reset game state
      resetGameState(state);
    }
  } else {
    updateCurrentPiece(state, inputs, dt);
    updateGravity(state, dt);
  }
}

function drawBlock(ctx, color, x, y) {
  ctx.fillStyle = color;
  ctx.fillRect(x + 1, y + 1, BLOCK_SIZE - 1, BLOCK_SIZE - 1);
}

function drawShape(ctx, shape, colorId, x, y) {
  const color = SHAPE_COLORS[colorId];

  for (let i = 0; i < shape.length; i++) {
    for (let j = 0; j < shape[0].length; j++) {
      if (shape[i][j]) {
        drawBlock(ctx, color, x + j * BLOCK_SIZE, y + i * BLOCK_SIZE);
      }
    }
  }
}

function render(ctx, state) {
  ctx.fillStyle = BLOCK_BACKGROUND;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  const { grid, currentPiece, nextShapeId } = state;

  for (let i = 0; i < grid.length; i++) {
    for (let j = 0; j < grid[0].length; j++) {
      const colorId = grid[i][j];

      const color = colorId === BLOCK_EMPTY ? COLOR_EMPTY_BLOCK : SHAPE_COLORS[colorId];

      drawBlock(ctx, color, j * BLOCK_SIZE, i * BLOCK_SIZE);
    }
  }

  drawShape(
    ctx,
    currentPiece.shape,
    currentPiece.shapeId,
    currentPiece.position.x * BLOCK_SIZE,
    currentPiece.position.y * BLOCK_SIZE
  )

  drawShape(
    ctx,
    SHAPES[nextShapeId],
    nextShapeId,
    SIDEBAR_CONTENT_X,
    BLOCK_SIZE
  )

  ctx.fillStyle = COLOR_SIDEBAR_BORDER;
  ctx.fillRect(GRID_WIDTH, 0, SIDEBAR_BORDER, CANVAS_HEIGHT);

  ctx.font = 'bold 32px monospace';
  ctx.fillStyle = COLOR_FONT;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  const score = `${state.score}`.padStart(7, '0');
  ctx.fillText('Score:', SIDEBAR_CONTENT_X, SIDEBAR_CONTENT_Y + BLOCK_SIZE * 5);
  ctx.fillText(state.score, SIDEBAR_CONTENT_X, SIDEBAR_CONTENT_Y + BLOCK_SIZE * 6);

  if (state.isGameOver) {
    ctx.fillStyle = COLOR_GAME_OVERLAY;
    ctx.fillRect(0, 0, GRID_WIDTH, GRID_HEIGHT);

    ctx.fillStyle = COLOR_FONT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Game Over!', GRID_WIDTH / 2, GRID_HEIGHT / 2);
  }
}

function startCollectingInputs(inputs) {
  function handleKeyEvent(event, inputValue) {
    if (event.repeat) {
      return;
    }

    const inputType = KEY_TO_INPUT_TYPE[event.key];
    if (inputType) {
      inputs[inputType] = inputValue;
    }
  };
  window.addEventListener('keydown', (event) => {
    handleKeyEvent(event, { state: INPUT_STATE_INITIAL, timer: 0 })
  })
  window.addEventListener('keyup', (event) => {
    handleKeyEvent(event, undefined)
  })
}

function main() {
  const ctx = initCanvas();
  const state = getInitialState();
  const inputs = {};

  let previousTime = performance.now();

  startCollectingInputs(inputs);

  function loop(currentTime) {
    const dt = Math.min(currentTime - previousTime, MAX_DT);
    previousTime = currentTime;

    update(state, inputs, dt);
    render(ctx, state);

    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}

main();