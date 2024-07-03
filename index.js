const canvas = document.getElementById("gameCanvas");
const context = canvas.getContext("2d");
const offscreenCanvas = document.createElement("canvas");
const offscreenContext = offscreenCanvas.getContext("2d");

const widthInput = document.getElementById("widthInput");
const heightInput = document.getElementById("heightInput");
const cellChance = document.getElementById("cellChance");

const changeGridBtn = document.getElementById("changeGridBtn");
const randomBtn = document.getElementById("randomBtn");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const resetBtn = document.getElementById("resetBtn");

const cellSize = 5;
let rows, cols;
let grid = new Uint8Array(0);
let animationFrameId = null;
let generationTime = 0;

function setWidth() {
    widthInput.value = Math.max(1, widthInput.value);
}

function setHeight() {
    heightInput.value = Math.max(1, heightInput.value);
}

function setChance() {
    cellChance.value = Math.min(100, Math.max(0, cellChance.value));
}

function createGrid(rows, cols) {
    return new Uint8Array(rows * cols);
}

function setSize() {
    cols = parseInt(widthInput.value);
    rows = parseInt(heightInput.value);

    canvas.width = cols * cellSize;
    canvas.height = rows * cellSize;
    offscreenCanvas.width = canvas.width;
    offscreenCanvas.height = canvas.height;

    grid = createGrid(rows, cols);
}

function drawCellOffscreen(row, col) {
    const x = col * cellSize;
    const y = row * cellSize;
    const color = grid[row * cols + col] ? "red" : "white";
    offscreenContext.fillStyle = color;
    offscreenContext.fillRect(x, y, cellSize, cellSize);
}

function drawGrid() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(offscreenCanvas, 0, 0);
}

function copyGrid(grid) {
    return new Uint8Array(grid);
}

function getNextGeneration() {
    const start = performance.now();
    const nextGen = copyGrid(grid);
    const changes = [];

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const currentState = grid[row * cols + col];
            const neighbors = countNeighbors(row, col);
            let nextState = 0;

            if (currentState === 1) {
                nextState = neighbors === 2 || neighbors === 3 ? 1 : 0;
            } else {
                nextState = neighbors === 3 ? 1 : 0;
            }

            if (nextState !== currentState) {
                nextGen[row * cols + col] = nextState;
                changes.push({ row, col });
            }
        }
    }

    const end = performance.now();
    generationTime = end - start;
    document.getElementById("timeUpdate").textContent = generationTime.toFixed(2) + " ms";

    grid = nextGen;

    return changes;
}

function countNeighbors(row, col) {
    let count = 0;
    for (let i = Math.max(0, row - 1); i <= Math.min(rows - 1, row + 1); i++) {
        for (let j = Math.max(0, col - 1); j <= Math.min(cols - 1, col + 1); j++) {
            if (i !== row || j !== col) {
                count += grid[i * cols + j];
            }
        }
    }
    return count;
}

function startGame() {
    if (!animationFrameId) {
        const gameLoop = () => {
            const changes = getNextGeneration();
            changes.forEach(({ row, col }) => drawCellOffscreen(row, col));

            if (changes.length > 0) {
                animationFrameId = requestAnimationFrame(gameLoop);
                drawGrid();
            } else {
                stopGame();
            }
        };

        animationFrameId = requestAnimationFrame(gameLoop);
    }
}

function stopGame() {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
}

function resetGame() {
    stopGame();
    setSize();
    drawGrid();
}

function randomizeGrid() {
    stopGame();
    setSize()

    let probability = parseInt(cellChance.value);
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            grid[row * cols + col] = Math.random() * 100 < probability ? 1 : 0;
            drawCellOffscreen(row, col);
        }
    }

    drawGrid(); 
}

function toggleCell(event) {
    const x = event.offsetX;
    const y = event.offsetY;
    const col = Math.floor(x / cellSize);
    const row = Math.floor(y / cellSize);
    grid[row * cols + col] = grid[row * cols + col] ? 0 : 1;
    drawCellOffscreen(row, col);
    drawGrid();
}

widthInput.addEventListener("change", setWidth);
heightInput.addEventListener("change", setHeight);
cellChance.addEventListener("change", setChance);

changeGridBtn.addEventListener("click", setSize);
randomBtn.addEventListener("click", randomizeGrid);
startBtn.addEventListener("click", startGame);
stopBtn.addEventListener("click", stopGame);
resetBtn.addEventListener("click", resetGame);

canvas.addEventListener("mousedown", toggleCell);

setSize();
