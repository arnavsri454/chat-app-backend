const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');
const rateLimiter = require('../middleware/rateLimiter');
const passwordValidator = require('password-validator');

const router = express.Router();

// Password validation rules
const schema = new passwordValidator();
schema
    .is().min(8)  // Minimum 8 characters
    .has().uppercase()  // At least one uppercase letter
    .has().lowercase()  // At least one lowercase letter
    .has().digits(1)  // At least one number
    .has().not().spaces();  // No spaces

// User Registration
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    // Validate password strength
    if (!schema.validate(password)) {
        return res.status(400).json({ msg: 'Password must be at least 8 characters, with uppercase, lowercase, and a number.' });
    }

    try {
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ msg: 'User already exists' });

        user = new User({ username, email, password });

        // Hash the password before saving
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        await user.save();

        // Generate JWT tokens
        const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '15m' });
        const refreshToken = jwt.sign({ id: user._id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });

        res.json({ accessToken, refreshToken });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// User Login with Rate Limiting
router.post('/login', rateLimiter, async (req, res) => {
    const { email, password } = req.body;
    try {
        let user = await User.findOne({ email });
        if (!user) return res.status(400).json({ msg: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

        const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '15m' });
        const refreshToken = jwt.sign({ id: user._id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });

        res.json({ accessToken, refreshToken });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Refresh Token Route
router.post('/refresh', (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ msg: 'No token provided' });

    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
        if (err) return res.status(403).json({ msg: 'Invalid refresh token' });

        const newAccessToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '15m' });
        res.json({ accessToken: newAccessToken });
    });
});

// Get user profile (Protected Route)
router.get('/profile', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
