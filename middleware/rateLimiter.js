const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 5,  // Limit each IP to 5 requests per window
    message: 'Too many login attempts. Try again later.',
});

module.exports = authLimiter;
