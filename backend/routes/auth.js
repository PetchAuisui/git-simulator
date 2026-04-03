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
    
    if (!username || !password || !firstName || !lastName || !dob) {
        return res.status(400).json({ error: 'All fields (Username, Password, First Name, Last Name, DOB) are required' });
    }

    try {
        // Check if user exists
        const userResult = await db.query('SELECT id FROM users WHERE username = $1', [username]);
        if (userResult.rows.length > 0) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Store user
        await db.query(
            'INSERT INTO users (username, password, first_name, last_name, dob) VALUES ($1, $2, $3, $4, $5)', 
            [username, hashedPassword, firstName, lastName, dob]
        );

        // Create user workspace
        const userWorkspacePath = path.join(__dirname, '..', '..', 'workspace', username);
        await fs.ensureDir(userWorkspacePath);

        // Generate token
        const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '1d' });

        res.status(201).json({ token, username });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    try {
        const userResult = await db.query('SELECT * FROM users WHERE username = $1', [username]);
        if (userResult.rows.length === 0) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const user = userResult.rows[0];

        // Ensure user workspace exists just in case
        const userWorkspacePath = path.join(__dirname, '..', '..', 'workspace', username);
        await fs.ensureDir(userWorkspacePath);

        // Validate password
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Generate token
        const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '1d' });

        res.json({ token, username });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
