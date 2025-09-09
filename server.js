const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const { loggerMiddleware, Logger } = require('./logger');
const urlRoutes = require('./src/routes/urlRoutes');
const redirectRoutes = require('./src/routes/redirectRoutes');

// Load environment variables
dotenv.config();

const logger = new Logger('Server');
const app = express();
const PORT = process.env.PORT || 4000; 

// Middleware
app.use(cors());
app.use(express.json());
app.use(loggerMiddleware);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/url-shortener')
    .then(() => {
        logger.info('Connected to MongoDB');
    })
    .catch((err) => {
        logger.error('MongoDB connection error', { error: err.message });
    });

// Routes
app.use(urlRoutes);
app.use(redirectRoutes);

// Start server
app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
});