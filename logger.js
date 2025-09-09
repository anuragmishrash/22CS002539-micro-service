const fs = require('fs');
const path = require('path');

// Ensure logs directory exists
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Log levels
const LOG_LEVELS = {
    ERROR: 'ERROR',
    WARN: 'WARN',
    INFO: 'INFO',
    DEBUG: 'DEBUG'
};

// Current log level (can be set via environment variable)
const currentLogLevel = process.env.LOG_LEVEL || LOG_LEVELS.INFO;

// Logger class
class Logger {
    constructor(module) {
        this.module = module;
        this.logFilePath = path.join(logsDir, `${new Date().toISOString().split('T')[0]}.log`);
    }

    // Format log message
    formatMessage(level, message, meta = {}) {
        const timestamp = new Date().toISOString();
        return JSON.stringify({
            timestamp,
            level,
            module: this.module,
            message,
            ...meta
        }) + '\n';
    }

    // Write to log file
    writeLog(level, message, meta) {
        const formattedMessage = this.formatMessage(level, message, meta);
        fs.appendFileSync(this.logFilePath, formattedMessage);
        
        // Also log to console in development
        if (process.env.NODE_ENV !== 'production') {
            console.log(formattedMessage);
        }
    }

    error(message, meta) {
        this.writeLog(LOG_LEVELS.ERROR, message, meta);
    }

    warn(message, meta) {
        this.writeLog(LOG_LEVELS.WARN, message, meta);
    }

    info(message, meta) {
        this.writeLog(LOG_LEVELS.INFO, message, meta);
    }

    debug(message, meta) {
        this.writeLog(LOG_LEVELS.DEBUG, message, meta);
    }
}

// Express middleware
const loggerMiddleware = (req, res, next) => {
    const logger = new Logger('HTTP');
    const startTime = Date.now();
    
    // Log request
    logger.info(`${req.method} ${req.url}`, {
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        body: req.body
    });

    // Capture response
    const originalSend = res.send;
    res.send = function(body) {
        const responseTime = Date.now() - startTime;
        
        // Log response
        logger.info(`Response ${res.statusCode}`, {
            statusCode: res.statusCode,
            responseTime: `${responseTime}ms`,
            size: body ? body.length : 0
        });
        
        return originalSend.call(this, body);
    };

    next();
};

module.exports = {
    Logger,
    loggerMiddleware,
    LOG_LEVELS
};