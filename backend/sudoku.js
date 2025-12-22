/**
 * Sudoku puzzle generation and validation module
 */

/**
 * Difficulty settings for puzzle generation
 */
const DIFFICULTY_SETTINGS = {
  easy: { minClues: 40, maxClues: 45, entries: 1 },
  normal: { minClues: 30, maxClues: 35, entries: 2 },
  hard: { minClues: 25, maxClues: 28, entries: 3 }
};

/**
 * Check if placing a number at position is valid
 */
function isValid(board, row, col, num) {
  // Check row
  for (let x = 0; x < 9; x++) {
    if (board[row][x] === num) {
      return false;
    }
  }

  // Check column
  for (let x = 0; x < 9; x++) {
    if (board[x][col] === num) {
      return false;
    }
  }

  // Check 3x3 box
  const startRow = row - (row % 3);
  const startCol = col - (col % 3);
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (board[i + startRow][j + startCol] === num) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Solve sudoku using backtracking
 */
function solveSudoku(board) {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === 0) {
        for (let num = 1; num <= 9; num++) {
          if (isValid(board, row, col, num)) {
            board[row][col] = num;

            if (solveSudoku(board)) {
              return true;
            }

            board[row][col] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
}

/**
 * Generate a complete valid sudoku board
 */
function generateCompleteBoard() {
  const board = Array(9).fill(0).map(() => Array(9).fill(0));

  // Fill diagonal 3x3 boxes first (they don't depend on each other)
  for (let box = 0; box < 9; box += 3) {
    const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    // Shuffle array
    for (let i = nums.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [nums[i], nums[j]] = [nums[j], nums[i]];
    }

    let idx = 0;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        board[box + i][box + j] = nums[idx++];
      }
    }
  }

  // Solve the rest
  solveSudoku(board);
  return board;
}

/**
 * Create a puzzle by removing numbers from a complete board
 * @param {number} difficulty - Number of cells to remove (40-50 for medium difficulty)
 */
function createPuzzle(difficulty = 45) {
  const solution = generateCompleteBoard();
  const puzzle = solution.map(row => [...row]);

  let cellsToRemove = difficulty;
  while (cellsToRemove > 0) {
    const row = Math.floor(Math.random() * 9);
    const col = Math.floor(Math.random() * 9);

    if (puzzle[row][col] !== 0) {
      puzzle[row][col] = 0;
      cellsToRemove--;
    }
  }

  return { puzzle, solution };
}

/**
 * Validate a user's answer by checking Sudoku rules
 * This allows multiple valid solutions instead of requiring exact match
 */
function validateAnswer(userAnswer, puzzle) {
  if (!userAnswer || !puzzle) {
    return false;
  }

  // Check all cells are filled with numbers 1-9
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      const val = userAnswer[i][j];
      if (!val || val < 1 || val > 9) {
        return false;
      }

      // Check that initial puzzle values are unchanged
      if (puzzle[i][j] !== 0 && userAnswer[i][j] !== puzzle[i][j]) {
        return false;
      }
    }
  }

  // Check rows: each row must have 1-9 exactly once
  for (let row = 0; row < 9; row++) {
    const seen = new Set();
    for (let col = 0; col < 9; col++) {
      const num = userAnswer[row][col];
      if (seen.has(num)) {
        return false; // Duplicate in row
      }
      seen.add(num);
    }
    if (seen.size !== 9) {
      return false;
    }
  }

  // Check columns: each column must have 1-9 exactly once
  for (let col = 0; col < 9; col++) {
    const seen = new Set();
    for (let row = 0; row < 9; row++) {
      const num = userAnswer[row][col];
      if (seen.has(num)) {
        return false; // Duplicate in column
      }
      seen.add(num);
    }
    if (seen.size !== 9) {
      return false;
    }
  }

  // Check 3x3 boxes: each box must have 1-9 exactly once
  for (let boxRow = 0; boxRow < 3; boxRow++) {
    for (let boxCol = 0; boxCol < 3; boxCol++) {
      const seen = new Set();
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          const row = boxRow * 3 + i;
          const col = boxCol * 3 + j;
          const num = userAnswer[row][col];
          if (seen.has(num)) {
            return false; // Duplicate in box
          }
          seen.add(num);
        }
      }
      if (seen.size !== 9) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Generate a puzzle with specified difficulty level
 * @param {string} difficulty - Difficulty level: 'easy', 'normal', or 'hard'
 * @returns {object} Puzzle and solution
 */
function generatePuzzleWithDifficulty(difficulty = 'normal') {
  const settings = DIFFICULTY_SETTINGS[difficulty];
  if (!settings) {
    throw new Error(`Invalid difficulty: ${difficulty}`);
  }

  // Calculate number of clues to leave (random within range)
  const clues = Math.floor(Math.random() * (settings.maxClues - settings.minClues + 1)) + settings.minClues;

  // Calculate cells to remove (81 total cells - clues)
  const cellsToRemove = 81 - clues;

  return createPuzzle(cellsToRemove);
}

export { createPuzzle, validateAnswer, generatePuzzleWithDifficulty, DIFFICULTY_SETTINGS };
