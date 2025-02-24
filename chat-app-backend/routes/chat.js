const express = require('express');
const router = express.Router();
const Message = require('../models/Message');

// Get all messages
router.get('/', async (req, res) => {
    try {
        const messages = await Message.find().populate('sender', 'username');
        res.json(messages);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Post a new message (if not using WebSocket for storage)
router.post('/', async (req, res) => {
    const { sender, content } = req.body;
    try {
        const newMessage = new Message({ sender, content });
        const message = await newMessage.save();
        res.json(message);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
