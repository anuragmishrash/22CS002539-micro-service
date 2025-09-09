const express = require('express');
const urlController = require('../controllers/urlController');

const router = express.Router();

// Redirect to original URL
router.get('/:shortcode', urlController.redirectToUrl);

module.exports = router;