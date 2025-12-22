import cron from 'node-cron';
import { generatePuzzleWithDifficulty } from './sudoku.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUZZLES_FILE = path.join(__dirname, 'data', 'puzzles.json');

/**
 * Get today's date in YYYY-MM-DD format (JST)
 */
function getTodayDate() {
    const now = new Date();
    // Convert to JST (UTC+9)
    const jst = new Date(now.getTime() + (9 * 60 * 60 * 1000));
    return jst.toISOString().split('T')[0];
}

/**
 * Generate and save today's puzzle for all difficulty levels
 */
async function generateTodayPuzzle() {
    try {
        const todayDate = getTodayDate();
        console.log(`Generating puzzle for ${todayDate}...`);

        // Read existing puzzles
        let puzzles = {};
        try {
            const data = await fs.readFile(PUZZLES_FILE, 'utf-8');
            puzzles = JSON.parse(data);
        } catch (err) {
            // File doesn't exist or is empty, start fresh
            puzzles = {};
        }

        // Check if today's puzzle already exists
        if (puzzles[todayDate]) {
            console.log(`Puzzle for ${todayDate} already exists.`);
            return;
        }

        // Generate puzzles for all three difficulty levels
        const easyPuzzle = generatePuzzleWithDifficulty('easy');
        const normalPuzzle = generatePuzzleWithDifficulty('normal');
        const hardPuzzle = generatePuzzleWithDifficulty('hard');

        puzzles[todayDate] = {
            easy: { puzzle: easyPuzzle.puzzle, solution: easyPuzzle.solution },
            normal: { puzzle: normalPuzzle.puzzle, solution: normalPuzzle.solution },
            hard: { puzzle: hardPuzzle.puzzle, solution: hardPuzzle.solution }
        };

        // Save to file
        await fs.writeFile(PUZZLES_FILE, JSON.stringify(puzzles, null, 2));
        console.log(`Puzzles for ${todayDate} generated successfully (easy, normal, hard)!`);
    } catch (error) {
        console.error('Error generating puzzle:', error);
    }
}

/**
 * Initialize scheduler to generate daily puzzles at midnight JST
 */
export function initScheduler() {
    // Generate puzzle immediately on startup if needed
    generateTodayPuzzle();

    // Schedule daily generation at midnight JST (15:00 UTC)
    // Cron runs in server's local time, but we handle JST in the function
    cron.schedule('0 0 * * *', () => {
        console.log('Running daily puzzle generation...');
        generateTodayPuzzle();
    });

    console.log('Scheduler initialized: Daily puzzle generation at midnight JST');
}
