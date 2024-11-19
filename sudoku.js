let board = [];
let solution = [];
let selectedCell = null;
let mistakes = 0;
let hintsRemaining = 3;
let timer = 0;
let timerInterval = null;
let currentDifficulty = "easy";

const DIFFICULTY_LEVELS = {
  easy: { cellsToRemove: 30 },
  medium: { cellsToRemove: 40 },
  hard: { cellsToRemove: 50 },
};

// 初始化游戏
function initGame() {
  createBoard();
  addEventListeners();
  startNewGame("easy");
}

// 创建游戏面板
function createBoard() {
  const boardElement = document.getElementById("board");
  boardElement.innerHTML = "";

  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      const cell = document.createElement("div");
      cell.className =
        "cell w-12 h-12 flex items-center justify-center text-lg font-bold cursor-pointer border border-gray-200";

      // 添加边框样式
      if (i % 3 === 0) cell.classList.add("border-t-2", "border-t-gray-400");
      if (i === 8) cell.classList.add("border-b-2", "border-b-gray-400");
      if (j % 3 === 0) cell.classList.add("border-l-2", "border-l-gray-400");
      if (j === 8) cell.classList.add("border-r-2", "border-r-gray-400");

      cell.dataset.row = i;
      cell.dataset.col = j;
      boardElement.appendChild(cell);
    }
  }
}

// 添加事件监听器
function addEventListeners() {
  // 单元格点击事件
  document.getElementById("board").addEventListener("click", (e) => {
    const cell = e.target.closest(".cell");
    if (!cell) return;

    handleCellSelection(cell);
  });

  // 数字按钮点击事件
  document.querySelectorAll(".number-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!selectedCell || selectedCell.classList.contains("fixed")) return;
      const number = btn.textContent;
      placeNumber(number);
    });
  });

  // 键盘输入事件
  document.addEventListener("keydown", (e) => {
    if (!selectedCell) return;

    if (e.key >= "1" && e.key <= "9") {
      if (!selectedCell.classList.contains("fixed")) {
        placeNumber(e.key);
      }
    } else if (e.key === "Backspace" || e.key === "Delete") {
      if (!selectedCell.classList.contains("fixed")) {
        eraseNumber();
      }
    } else if (e.key.startsWith("Arrow")) {
      handleArrowKeys(e);
    }
  });

  // 擦除按钮
  document.getElementById("eraseBtn").addEventListener("click", eraseNumber);

  // 提示按钮
  document.getElementById("hintBtn").addEventListener("click", useHint);
}

// 开始新游戏
function startNewGame(difficulty) {
  // 清除之前的状态
  clearInterval(timerInterval);
  selectedCell = null;

  currentDifficulty = difficulty;
  mistakes = 0;
  hintsRemaining = 3;
  timer = 0;

  // 重置界面
  document.querySelectorAll(".cell").forEach((cell) => {
    cell.classList.remove("selected", "highlighted", "same-number", "error");
  });

  updateUI();
  updateTimer();
  timerInterval = setInterval(updateTimer, 1000);

  // 生成新的数独谜题
  generateNewPuzzle(difficulty);
}

// 生成数独谜题
function generateNewPuzzle(difficulty) {
  // 生成完整的解决方案
  solution = generateSolution();

  // 复制解决方案并移除部分数字
  board = JSON.parse(JSON.stringify(solution));
  const cellsToRemove = DIFFICULTY_LEVELS[difficulty].cellsToRemove;

  // 随机移除数字
  let removed = 0;
  while (removed < cellsToRemove) {
    const row = Math.floor(Math.random() * 9);
    const col = Math.floor(Math.random() * 9);
    if (board[row][col] !== 0) {
      board[row][col] = 0;
      removed++;
    }
  }

  // 更新界面
  updateBoard();
  document.getElementById("difficulty").textContent =
    difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
}

// 生成完整的数独解决方案
function generateSolution() {
  const grid = Array(9)
    .fill()
    .map(() => Array(9).fill(0));

  if (solveSudoku(grid)) {
    return grid;
  }
  return generateSolution(); // 如果生成失败，重试
}

// 填充 3x3 方块
function fillBox(grid, row, col) {
  const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  shuffle(numbers);
  let index = 0;

  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      grid[row + i][col + j] = numbers[index++];
    }
  }
}

// 解决数独
function solveSudoku(grid) {
  const empty = findEmptyCell(grid);
  if (!empty) return true;

  const [row, col] = empty;
  const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  shuffle(numbers);

  for (const num of numbers) {
    if (isValid(grid, row, col, num)) {
      grid[row][col] = num;
      if (solveSudoku(grid)) return true;
      grid[row][col] = 0;
    }
  }
  return false;
}

// 查找空单元格
function findEmptyCell(grid) {
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      if (grid[i][j] === 0) return [i, j];
    }
  }
  return null;
}

// 检查数字是否有效
function isValid(grid, row, col, num) {
  // 检查行
  for (let x = 0; x < 9; x++) {
    if (x !== col && grid[row][x] === num) return false;
  }

  // 检查列
  for (let x = 0; x < 9; x++) {
    if (x !== row && grid[x][col] === num) return false;
  }

  // 检查 3x3 方块
  const startRow = Math.floor(row / 3) * 3;
  const startCol = Math.floor(col / 3) * 3;

  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      const currentRow = i + startRow;
      const currentCol = j + startCol;
      if (
        currentRow !== row &&
        currentCol !== col &&
        grid[currentRow][currentCol] === num
      ) {
        return false;
      }
    }
  }

  return true;
}

// 更新游戏面板
function updateBoard() {
  const cells = document.querySelectorAll(".cell");
  cells.forEach((cell) => {
    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);
    const value = board[row][col];

    cell.textContent = value || "";
    cell.classList.remove("fixed", "error");

    if (value !== 0) {
      cell.classList.add("fixed");
    }
  });
}

// 放置数字
function placeNumber(number) {
  if (!selectedCell || selectedCell.classList.contains("fixed")) return;

  const row = parseInt(selectedCell.dataset.row);
  const col = parseInt(selectedCell.dataset.col);
  const num = parseInt(number);

  // 清除之前的错误状态
  selectedCell.classList.remove("error");

  // 检查是否正确
  if (num === solution[row][col]) {
    selectedCell.textContent = number;
    board[row][col] = num;

    // 移除错误类
    selectedCell.classList.remove("error");

    // 更新高亮
    updateHighlights(num);

    // 检查是否完成
    if (isGameComplete()) {
      showWinModal();
    }
  } else {
    selectedCell.textContent = number;
    selectedCell.classList.add("error");
    mistakes++;
    updateUI();

    // 检查是否游戏结束
    if (mistakes >= 3) {
      showGameOverModal();
    }
  }
}

// 擦除数字
function eraseNumber() {
  if (!selectedCell || selectedCell.classList.contains("fixed")) return;
  selectedCell.textContent = "";
  selectedCell.classList.remove("error");
  const row = parseInt(selectedCell.dataset.row);
  const col = parseInt(selectedCell.dataset.col);
  board[row][col] = 0;
}

// 使用提示
function useHint() {
  if (
    !selectedCell ||
    hintsRemaining <= 0 ||
    selectedCell.classList.contains("fixed")
  )
    return;

  const row = parseInt(selectedCell.dataset.row);
  const col = parseInt(selectedCell.dataset.col);

  selectedCell.textContent = solution[row][col];
  board[row][col] = solution[row][col];
  selectedCell.classList.remove("error");
  hintsRemaining--;

  updateUI();

  // 检查是否完成
  if (isGameComplete()) {
    showWinModal();
  }
}

// 高亮相关单元格
function highlightRelatedCells(row, col) {
  const cells = document.querySelectorAll(".cell");
  cells.forEach((cell) => {
    const cellRow = parseInt(cell.dataset.row);
    const cellCol = parseInt(cell.dataset.col);

    if (
      cellRow === row ||
      cellCol === col ||
      (Math.floor(cellRow / 3) === Math.floor(row / 3) &&
        Math.floor(cellCol / 3) === Math.floor(col / 3))
    ) {
      cell.classList.add("highlighted");
    }
  });
}

// 高亮相同数字
function highlightSameNumbers(number) {
  if (!number) return;
  const cells = document.querySelectorAll(".cell");
  cells.forEach((cell) => {
    if (cell.textContent === number) {
      cell.classList.add("same-number");
    }
  });
}

// 检查游戏是否完成
function isGameComplete() {
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      if (board[i][j] === 0 || board[i][j] !== solution[i][j]) {
        return false;
      }
    }
  }
  return true;
}

// 显示胜利弹窗
function showWinModal() {
  clearInterval(timerInterval);
  document.getElementById("finalTime").textContent = formatTime(timer);
  document.getElementById("finalMistakes").textContent = mistakes;
  document.getElementById("winModal").classList.remove("hidden");
}

// 显示游戏结束弹窗
function showGameOverModal() {
  clearInterval(timerInterval);
  document.getElementById("gameOverModal").classList.remove("hidden");
}

// 关闭胜利弹窗
function closeWinModal() {
  document.getElementById("winModal").classList.add("hidden");
}

// 更新界面
function updateUI() {
  document.getElementById("mistakes").textContent = `${mistakes}/3`;
  document.getElementById("hintBtn").textContent = `Hint (${hintsRemaining})`;
}

// 更新计时器
function updateTimer() {
  timer++;
  document.getElementById("timer").textContent = formatTime(timer);
}

// 格式化时间
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(
    remainingSeconds
  ).padStart(2, "0")}`;
}

// 打乱数组
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// 新增的更新高亮函数
function updateHighlights(number) {
  // 清除所有高亮
  document.querySelectorAll(".cell").forEach((cell) => {
    cell.classList.remove("highlighted", "same-number");
  });

  if (selectedCell) {
    const row = parseInt(selectedCell.dataset.row);
    const col = parseInt(selectedCell.dataset.col);

    // 重新添加高亮
    highlightRelatedCells(row, col);
    highlightSameNumbers(number);
  }
}

// 新增的单元格选择处理函数
function handleCellSelection(cell) {
  // 移除所有单元格的选中状态
  document.querySelectorAll(".cell").forEach((c) => {
    c.classList.remove("selected", "highlighted", "same-number");
  });

  // 设置新的选中状态
  cell.classList.add("selected");
  selectedCell = cell;

  // 高亮相关单元格
  const row = parseInt(cell.dataset.row);
  const col = parseInt(cell.dataset.col);
  highlightRelatedCells(row, col);

  // 高亮相同数字
  if (cell.textContent) {
    highlightSameNumbers(cell.textContent);
  }
}

// 新增的方向键处理函数
function handleArrowKeys(e) {
  const currentRow = parseInt(selectedCell.dataset.row);
  const currentCol = parseInt(selectedCell.dataset.col);
  let newRow = currentRow;
  let newCol = currentCol;

  switch (e.key) {
    case "ArrowUp":
      newRow = Math.max(0, currentRow - 1);
      break;
    case "ArrowDown":
      newRow = Math.min(8, currentRow + 1);
      break;
    case "ArrowLeft":
      newCol = Math.max(0, currentCol - 1);
      break;
    case "ArrowRight":
      newCol = Math.min(8, currentCol + 1);
      break;
  }

  if (newRow !== currentRow || newCol !== currentCol) {
    const newCell = document.querySelector(
      `.cell[data-row="${newRow}"][data-col="${newCol}"]`
    );
    if (newCell) {
      handleCellSelection(newCell);
    }
  }
}

// 初始化游戏
window.onload = initGame;
