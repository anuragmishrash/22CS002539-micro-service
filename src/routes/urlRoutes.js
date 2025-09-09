const express = require('express');
const urlController = require('../controllers/urlController');

const router = express.Router();

// Create short URL
router.post('/shorturls', urlController.createShortUrl);

// Get URL statistics
router.get('/shorturls/:shortcode', urlController.getUrlStats);

module.exports = router;