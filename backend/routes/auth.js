const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const path = require('path');
const fs = require('fs-extra');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'secret123';

router.post('/register', async (req, res) => {
    const { username, password, firstName, lastName, dob } = req.body;
    console.log(`[AUTH] Register attempt for username: ${username}`);
    
    if (!username || !password || !firstName || !lastName || !dob) {
        console.warn(`[AUTH] Register failed: Missing fields for ${username}`);
        return res.status(400).json({ error: 'All fields (Username, Password, First Name, Last Name, DOB) are required' });
    }

    try {
        console.log(`[AUTH] Checking if user ${username} exists...`);
        const userResult = await db.query('SELECT id FROM users WHERE username = $1', [username]);
        console.log(`[AUTH] User check complete. Found: ${userResult.rows.length}`);

        if (userResult.rows.length > 0) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        console.log(`[AUTH] Hashing password for ${username}...`);
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        console.log(`[AUTH] Password hashed successfully.`);

        console.log(`[AUTH] Inserting user ${username} into database...`);
        await db.query(
            'INSERT INTO users (username, password, first_name, last_name, dob) VALUES ($1, $2, $3, $4, $5)', 
            [username, hashedPassword, firstName, lastName, dob]
        );
        console.log(`[AUTH] User inserted.`);

        console.log(`[AUTH] Ensuring workspace directory for ${username}...`);
        const userWorkspacePath = path.join(__dirname, '..', '..', 'workspace', username);
        await fs.ensureDir(userWorkspacePath);
        console.log(`[AUTH] Workspace ready: ${userWorkspacePath}`);

        console.log(`[AUTH] Generating token for ${username}...`);
        const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '1d' });
        console.log(`[AUTH] Registration complete for ${username}.`);

        res.status(201).json({ token, username });
    } catch (error) {
        console.error(`[AUTH] Registration error for ${username}:`, error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    console.log(`[AUTH] Login attempt for username: ${username}`);

    if (!username || !password) {
        console.warn(`[AUTH] Login failed: Missing credentials`);
        return res.status(400).json({ error: 'Username and password are required' });
    }

    try {
        console.log(`[AUTH] Fetching user ${username} from DB...`);
        const userResult = await db.query('SELECT * FROM users WHERE username = $1', [username]);
        console.log(`[AUTH] DB Fetch complete. Found: ${userResult.rows.length}`);

        if (userResult.rows.length === 0) {
            console.warn(`[AUTH] Login failed: User ${username} not found`);
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const user = userResult.rows[0];

        console.log(`[AUTH] Validating password for ${username}...`);
        const isValid = await bcrypt.compare(password, user.password);
        console.log(`[AUTH] Password validation result: ${isValid}`);

        if (!isValid) {
            console.warn(`[AUTH] Login failed: Invalid password for ${username}`);
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        console.log(`[AUTH] Ensuring workspace exists for ${username}...`);
        const userWorkspacePath = path.join(__dirname, '..', '..', 'workspace', username);
        await fs.ensureDir(userWorkspacePath);

        console.log(`[AUTH] Generating token for ${username}...`);
        const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '1d' });
        console.log(`[AUTH] Login successful for ${username}.`);

        res.json({ token, username });
    } catch (error) {
        console.error(`[AUTH] Login error for ${username}:`, error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
