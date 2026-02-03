module.exports = function requestLogger(req, res, next) {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);

    if (req.query && Object.keys(req.query).length > 0) {
        console.log('Query:', JSON.stringify(req.query, null, 2));
    }

    if (req.body && Object.keys(req.body).length > 0) {
        // Create a copy to avoid mutating the original body
        const sanitizedBody = { ...req.body };

        // List of keys to hide
        const sensitiveKeys = ['password', 'token', 'secret', 'authorization'];

        sensitiveKeys.forEach(key => {
            if (key in sanitizedBody) {
                sanitizedBody[key] = '*****';
            }
        });

        console.log('Body:', JSON.stringify(sanitizedBody, null, 2));
    }

    next();
};
