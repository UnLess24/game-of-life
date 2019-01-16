const TABLE_ROWS = 36;
const TABLE_COLS = 64;
const TABLE_WIDTH = 1280;
const TABLE_HEIGHT = 720;
const GAME_SPEED = 1000;
let gameSpeedValue = 0;
let interval = null;
let isPaying = false;

const root = document.getElementById('root');
root.className = 'container';

const controls = createControls();
root.appendChild(controls);

const table = createTable(TABLE_ROWS, TABLE_COLS, TABLE_HEIGHT, TABLE_WIDTH);
let currentGrid = createUpdateGrid(TABLE_ROWS, TABLE_COLS);
table.addEventListener('click', tableClick);
root.appendChild(table);

function tableClick(event) {
    if (!event.target.classList.contains('cell')) return;

    const cell = event.target;
    const rowIndex = cell.parentNode.rowIndex;
    const colIndex = cell.cellIndex;

    const isAlive = !!currentGrid[rowIndex][colIndex];
    currentGrid[rowIndex][colIndex] = isAlive ? 0 : 1;

    cell.classList.toggle('alive', !isAlive);
}

function play(grid, table) {
    return createUpdateGrid(undefined, undefined, 'play', table, grid);
}

function createTable(rows, cols, height, width) {
    const table = document.createElement('table');
    table.className = 'table';
    table.style.width = width + 'px';
    table.style.height = height + 'px';

    for (let i = 0; i < rows; i++) {
        const row = document.createElement('tr');
        row.className = 'row';

        for (let j = 0; j < cols; j++) {
            const cell = document.createElement('td');
            cell.className = 'cell';
            cell.width = width / rows;
            cell.height = height / cols;
            row.appendChild(cell);
        }
        table.appendChild(row);
    }
    return table;
}

function createUpdateGrid(rows, cols, type = 'standart', table, grid) {
    let count = 0;
    let nextGrid = [];

    if (grid) {
        rows = grid.length;
        cols = grid[0].length;
    }

    for (let i = 0; i < rows; i++) {
        nextGrid[i] = [];
        for (let j = 0; j < cols; j++) {
            switch (type) {
                case 'shuffle':
                    nextGrid[i][j] = Math.round(Math.random());
                    break;
                case 'play':
                    const isCellAlive = !!grid[i][j];
                    nextGrid[i][j] = cellValue(aliveNeighbors(grid, i, j), isCellAlive);
                    count += nextGrid[i][j];
                    break;
                default:
                    nextGrid[i][j] = 0;
            }
            if (table) table.rows[i].cells[j].classList.toggle('alive', !!nextGrid[i][j]);
        }
    }

    if (!count && isPaying) {
        const playButton = controls.querySelector('button[data-param="play"]');
        const speedButton = controls.querySelector('input[data-param="speed"]');
        isPaying = false;
        playButton.textContent = 'play_arrow';
        clearInterval(interval);
        speedButton.value = gameSpeedValue = 0;
    }

    return nextGrid;
}

function aliveNeighbors(grid, rowIndex, colIndex) {
    let count = 0;

    count += calculateUpRow(grid, rowIndex - 1, colIndex);
    count += calculateLeftField(grid, rowIndex, colIndex - 1);
    count += calculateRightField(grid, rowIndex, colIndex + 1);
    count += calculateDownRow(grid, rowIndex + 1, colIndex);

    function calculateUpRow(grid, rowIndex, colIndex) {
        let count = 0;
        if (rowIndex >= 0) {
            count += calculateLeftField(grid, rowIndex, colIndex - 1);
            count += grid[rowIndex][colIndex];
            count += calculateRightField(grid, rowIndex, colIndex + 1);
        } else {
            count += calculateLeftField(grid, TABLE_ROWS - 1, colIndex - 1);
            count += grid[TABLE_ROWS - 1][colIndex];
            count += calculateRightField(grid, TABLE_ROWS - 1, colIndex + 1);
        }
        return count;
    }

    function calculateDownRow(grid, rowIndex, colIndex) {
        let count = 0;
        if (rowIndex < TABLE_ROWS) {
            count += calculateLeftField(grid, rowIndex, colIndex - 1);
            count += grid[rowIndex][colIndex];
            count += calculateRightField(grid, rowIndex, colIndex + 1);
        } else {
            count += calculateLeftField(grid, 0, colIndex - 1);
            count += grid[0][colIndex];
            count += calculateRightField(grid, 0, colIndex + 1);
        }
        return count;
    }

    function calculateLeftField(grid, rowIndex, colIndex) {
        return grid[rowIndex][(colIndex >= 0) ? colIndex : TABLE_COLS - 1];
    }

    function calculateRightField(grid, rowIndex, colIndex) {
        return grid[rowIndex][(colIndex < TABLE_COLS) ? colIndex : 0];
    }

    return count;
}

function cellValue(aliveNeighbors, isCellAlive) {
    if (isCellAlive) {
        if (aliveNeighbors === 2 || aliveNeighbors === 3)
            return 1;
    } else {
        if (aliveNeighbors === 3)
            return 1;
    }
    return 0;
}

function createControls() {
    const div = document.createElement('div');
    div.className = 'controls';

    const playButton = createButton({
        text: 'play_arrow',
        title: 'Старт/Пауза',
        param: 'play',
        listener: (event) => {
            if (isPaying) {
                isPaying = false;
                event.target.textContent = 'play_arrow';
                clearInterval(interval);
            } else {
                isPaying = true;
                event.target.textContent = 'pause';
                currentGrid = play(currentGrid, table);
                interval = setInterval(() => {
                    currentGrid = play(currentGrid, table)
                }, GAME_SPEED - gameSpeedValue);
            }
        }
    });
    const resetButton = createButton({
        text: 'clear',
        title: 'Сброс таблицы',
        param: 'clear',
        listener: (event) => {
            isPaying = false;
            playButton.textContent = 'play_arrow';
            clearInterval(interval);
            currentGrid = createUpdateGrid(TABLE_ROWS, TABLE_COLS, undefined, table);
            speedButton.value = gameSpeedValue = 0;
        }
    });
    const randomizeButton = createButton({
        text: 'shuffle',
        title: 'Случайное заполнение таблицы',
        param: 'random',
        listener: (event) => {
            isPaying = false;
            playButton.textContent = 'play_arrow';
            clearInterval(interval);
            currentGrid = createUpdateGrid(TABLE_ROWS, TABLE_COLS, 'shuffle', table);
            speedButton.value = gameSpeedValue = 0;
        }
    });

    const speedButton = document.createElement('input');
    speedButton.className = 'speed-input';
    speedButton.type = 'range';
    speedButton.min = 0;
    speedButton.max = 900;
    speedButton.step = 25;
    speedButton.value = gameSpeedValue;
    speedButton.title = 'Скорость обновления';
    speedButton.setAttribute('data-param', 'speed');
    speedButton.addEventListener('input', function(event) {
        if (!isPaying) {
            this.value = gameSpeedValue;
            return;
        }
        gameSpeedValue = this.value;
        clearInterval(interval);
        interval = setInterval(() => {
            currentGrid = play(currentGrid, table)
        }, GAME_SPEED - gameSpeedValue);
    });

    div.append(playButton, resetButton, randomizeButton, speedButton);

    return div;
}

function createButton(data) {
    const button = document.createElement('button');
    button.className = 'material-icons button';
    button.textContent = data.text;
    button.title = data.title;
    button.setAttribute('data-param', data.param);
    button.addEventListener('click', data.listener);

    return button;
}

