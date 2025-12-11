import Fastify from 'fastify';
import cors from '@fastify/cors';
import { validateAnswer } from './sudoku.js';
import { initScheduler } from './scheduler.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const USERS_FILE = path.join(__dirname, 'data', 'users.json');
const PUZZLES_FILE = path.join(__dirname, 'data', 'puzzles.json');
const LOTTERY_FILE = path.join(__dirname, 'data', 'lottery.json');

// Load environment variables
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// Simple in-memory session storage
const adminSessions = new Set();

const fastify = Fastify({
    logger: true
});

// Register CORS
await fastify.register(cors, {
    origin: true // Allow all origins in development
});

/**
 * Get today's date in YYYY-MM-DD format (JST)
 */
function getTodayDate() {
    const now = new Date();
    const jst = new Date(now.getTime() + (9 * 60 * 60 * 1000));
    return jst.toISOString().split('T')[0];
}

/**
 * Read users data from JSON file
 */
async function readUsers() {
    try {
        const data = await fs.readFile(USERS_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (err) {
        return {};
    }
}

/**
 * Write users data to JSON file
 */
async function writeUsers(users) {
    await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
}

/**
 * Read puzzles data from JSON file
 */
async function readPuzzles() {
    try {
        const data = await fs.readFile(PUZZLES_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (err) {
        return {};
    }
}

/**
 * Read lottery data from JSON file
 */
async function readLottery() {
    try {
        const data = await fs.readFile(LOTTERY_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (err) {
        return { history: [] };
    }
}

/**
 * Write lottery data to JSON file
 */
async function writeLottery(lottery) {
    await fs.writeFile(LOTTERY_FILE, JSON.stringify(lottery, null, 2));
}

// API Routes

/**
 * Register user with email address
 */
fastify.post('/api/register', async (request, reply) => {
    const { email } = request.body;

    if (!email || !email.includes('@')) {
        return reply.code(400).send({ error: 'Invalid email address' });
    }

    const users = await readUsers();

    if (!users[email]) {
        users[email] = {
            entries: 0,
            solvedDates: []
        };
        await writeUsers(users);
    }

    return {
        success: true,
        email,
        entries: users[email].entries
    };
});

/**
 * Get today's puzzle
 */
fastify.get('/api/puzzle/today', async (request, reply) => {
    const todayDate = getTodayDate();
    const puzzles = await readPuzzles();

    if (!puzzles[todayDate]) {
        return reply.code(404).send({ error: 'No puzzle available for today' });
    }

    // Don't send the solution to the client
    return {
        date: todayDate,
        puzzle: puzzles[todayDate].puzzle
    };
});

/**
 * Submit answer and validate
 */
fastify.post('/api/submit', async (request, reply) => {
    const { email, answer } = request.body;

    if (!email || !answer) {
        return reply.code(400).send({ error: 'Email and answer are required' });
    }

    const users = await readUsers();
    if (!users[email]) {
        return reply.code(404).send({ error: 'User not found. Please register first.' });
    }

    const todayDate = getTodayDate();
    const puzzles = await readPuzzles();

    if (!puzzles[todayDate]) {
        return reply.code(404).send({ error: 'No puzzle available for today' });
    }

    // Check if already solved today
    if (users[email].solvedDates.includes(todayDate)) {
        return {
            success: false,
            alreadySolved: true,
            message: 'You have already solved today\'s puzzle',
            entries: users[email].entries
        };
    }

    const puzzle = puzzles[todayDate].puzzle;
    const isCorrect = validateAnswer(answer, puzzle);

    if (isCorrect) {
        users[email].entries += 1;
        users[email].solvedDates.push(todayDate);
        await writeUsers(users);

        return {
            success: true,
            correct: true,
            entries: users[email].entries,
            message: 'Correct! Your entry count has been increased.'
        };
    } else {
        return {
            success: true,
            correct: false,
            entries: users[email].entries,
            message: 'Incorrect answer. Please try again.'
        };
    }
});

/**
 * Get user's entry count
 */
fastify.get('/api/entries/:email', async (request, reply) => {
    const { email } = request.params;
    const users = await readUsers();

    if (!users[email]) {
        return reply.code(404).send({ error: 'User not found' });
    }

    return {
        email,
        entries: users[email].entries,
        solvedDates: users[email].solvedDates
    };
});

// Health check
fastify.get('/api/health', async (request, reply) => {
    return { status: 'ok', date: getTodayDate() };
});

// Admin Routes

/**
 * Admin login
 */
fastify.post('/api/admin/login', async (request, reply) => {
    const { password } = request.body;

    if (!password) {
        return reply.code(400).send({ error: 'Password is required' });
    }

    if (password === ADMIN_PASSWORD) {
        // Generate a simple session token
        const token = crypto.randomBytes(32).toString('hex');
        adminSessions.add(token);

        return {
            success: true,
            token,
            message: 'Login successful'
        };
    } else {
        return reply.code(401).send({ error: 'Invalid password' });
    }
});

/**
 * Verify admin token
 */
function verifyAdminToken(request, reply) {
    const token = request.headers.authorization?.replace('Bearer ', '');

    if (!token || !adminSessions.has(token)) {
        reply.code(401).send({ error: 'Unauthorized' });
        return false;
    }
    return true;
}

/**
 * Get all users (admin only)
 */
fastify.get('/api/admin/users', async (request, reply) => {
    if (!verifyAdminToken(request, reply)) return;

    const users = await readUsers();

    // Convert to array format for easier display
    const userList = Object.entries(users).map(([email, data]) => ({
        email,
        entries: data.entries,
        solvedDates: data.solvedDates,
        totalSolved: data.solvedDates.length
    }));

    return {
        success: true,
        users: userList,
        total: userList.length
    };
});

/**
 * Get statistics (admin only)
 */
fastify.get('/api/admin/stats', async (request, reply) => {
    if (!verifyAdminToken(request, reply)) return;

    const users = await readUsers();
    const puzzles = await readPuzzles();

    const totalUsers = Object.keys(users).length;
    const totalEntries = Object.values(users).reduce((sum, user) => sum + user.entries, 0);
    const totalPuzzlesSolved = Object.values(users).reduce((sum, user) => sum + user.solvedDates.length, 0);
    const totalPuzzles = Object.keys(puzzles).length;

    // Get today's stats
    const todayDate = getTodayDate();
    const todaySolvers = Object.values(users).filter(user =>
        user.solvedDates.includes(todayDate)
    ).length;

    return {
        success: true,
        stats: {
            totalUsers,
            totalEntries,
            totalPuzzlesSolved,
            totalPuzzles,
            todaySolvers,
            averageEntriesPerUser: totalUsers > 0 ? (totalEntries / totalUsers).toFixed(2) : 0
        }
    };
});

/**
 * Admin logout
 */
fastify.post('/api/admin/logout', async (request, reply) => {
    const token = request.headers.authorization?.replace('Bearer ', '');

    if (token) {
        adminSessions.delete(token);
    }

    return { success: true, message: 'Logged out successfully' };
});

/**
 * Reset all entries (admin only)
 */
fastify.post('/api/admin/reset-entries', async (request, reply) => {
    if (!verifyAdminToken(request, reply)) return;

    const users = await readUsers();

    // Reset all entries to 0
    for (const email in users) {
        users[email].entries = 0;
    }

    await writeUsers(users);

    return {
        success: true,
        message: 'All entries have been reset to 0',
        totalUsers: Object.keys(users).length
    };
});

// Lottery Routes

/**
 * Perform weighted lottery based on entry counts
 */
function performWeightedLottery(users, winnerCount) {
    // Filter users with at least 1 entry
    const eligibleUsers = Object.entries(users)
        .filter(([_, data]) => data.entries > 0)
        .map(([email, data]) => ({ email, entries: data.entries }));

    if (eligibleUsers.length === 0) {
        return [];
    }

    // Calculate total entries
    const totalEntries = eligibleUsers.reduce((sum, user) => sum + user.entries, 0);

    // Perform weighted random selection
    const winners = [];
    const remainingUsers = [...eligibleUsers];

    for (let i = 0; i < winnerCount && remainingUsers.length > 0; i++) {
        // Calculate cumulative weights
        const weights = [];
        let cumulative = 0;

        for (const user of remainingUsers) {
            cumulative += user.entries;
            weights.push({ email: user.email, entries: user.entries, cumulative });
        }

        // Random selection
        const random = Math.random() * cumulative;
        const winner = weights.find(w => random <= w.cumulative);

        if (winner) {
            winners.push({
                email: winner.email,
                entries: winner.entries,
                probability: (winner.entries / cumulative).toFixed(4)
            });

            // Remove winner from remaining users to avoid duplicate selection
            const index = remainingUsers.findIndex(u => u.email === winner.email);
            remainingUsers.splice(index, 1);
        }
    }

    return winners;
}

/**
 * Execute lottery draw (admin only)
 */
fastify.post('/api/admin/lottery/draw', async (request, reply) => {
    if (!verifyAdminToken(request, reply)) return;

    const { winnerCount = 1 } = request.body;

    if (winnerCount < 1 || winnerCount > 100) {
        return reply.code(400).send({ error: 'Winner count must be between 1 and 100' });
    }

    const users = await readUsers();
    const lottery = await readLottery();

    // Get eligible users count
    const eligibleUsers = Object.entries(users).filter(([_, data]) => data.entries > 0);
    const totalEntries = eligibleUsers.reduce((sum, [_, data]) => sum + data.entries, 0);

    if (eligibleUsers.length === 0) {
        return reply.code(400).send({ error: 'No users with entries available for lottery' });
    }

    // Perform lottery
    const winners = performWeightedLottery(users, winnerCount);

    // Save lottery result
    const lotteryResult = {
        id: crypto.randomBytes(16).toString('hex'),
        date: getTodayDate(),
        timestamp: new Date().toISOString(),
        winners,
        totalParticipants: eligibleUsers.length,
        totalEntries,
        requestedWinners: winnerCount,
        actualWinners: winners.length
    };

    lottery.history.unshift(lotteryResult); // Add to beginning of array
    await writeLottery(lottery);

    return {
        success: true,
        lottery: lotteryResult
    };
});

/**
 * Get lottery history (admin only)
 */
fastify.get('/api/admin/lottery/history', async (request, reply) => {
    if (!verifyAdminToken(request, reply)) return;

    const { limit = 20 } = request.query;
    const lottery = await readLottery();

    // Return limited history
    const history = lottery.history.slice(0, limit);

    return {
        success: true,
        history,
        total: lottery.history.length
    };
});

// Start server
const start = async () => {
    try {
        // Initialize scheduler for daily puzzle generation
        initScheduler();

        await fastify.listen({ port: 3000, host: '0.0.0.0' });
        console.log('Server is running on http://localhost:3000');
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();
