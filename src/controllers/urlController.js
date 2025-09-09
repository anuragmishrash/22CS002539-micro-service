const Url = require('../models/url');
// Replace the nanoid import
let nanoid;
(async () => {
    const module = await import('nanoid');
    nanoid = module.nanoid;
})();
const { Logger } = require('../../logger');

const logger = new Logger('UrlController');

// Create a short URL
exports.createShortUrl = async (req, res) => {
    try {
        const { url, validity, shortcode } = req.body;

        // Validate URL
        if (!url) {
            logger.error('URL is required');
            return res.status(400).json({ error: 'URL is required' });
        }

        try {
            new URL(url); // Will throw if URL is invalid
        } catch (err) {
            logger.error('Invalid URL format', { url });
            return res.status(400).json({ error: 'Invalid URL format' });
        }

        // Handle custom shortcode if provided
        if (shortcode) {
            // Check if shortcode already exists
            const existingUrl = await Url.findOne({ shortCode: shortcode });
            if (existingUrl) {
                logger.error('Shortcode already in use', { shortcode });
                return res.status(409).json({ error: 'Shortcode already in use' });
            }
        }

        // Calculate expiry time
        const now = new Date();
        const expiresAt = new Date(now.getTime() + (validity || 30) * 60000); // Default 30 minutes

        // Ensure nanoid is loaded
        let shortCode = shortcode;
        if (!shortCode) {
            if (!nanoid) {
                const module = await import('nanoid');
                nanoid = module.nanoid;
            }
            shortCode = nanoid(6);
        }

        // Create new URL document
        const newUrl = new Url({
            originalUrl: url,
            shortCode: shortCode,
            expiresAt
        });

        await newUrl.save();

        // Construct the short URL
        const protocol = req.protocol;
        const host = req.get('host');
        const shortUrl = `${protocol}://${host}/${newUrl.shortCode}`;

        logger.info('Short URL created', { shortCode: newUrl.shortCode });
        return res.status(201).json({
            shortLink: shortUrl,
            expiry: expiresAt.toISOString()
        });
    } catch (error) {
        logger.error('Error creating short URL', { error: error.message });
        return res.status(500).json({ error: 'Server error' });
    }
};

// Get URL statistics
exports.getUrlStats = async (req, res) => {
    try {
        const { shortcode } = req.params;

        const url = await Url.findOne({ shortCode: shortcode });

        if (!url) {
            logger.error('URL not found', { shortcode });
            return res.status(404).json({ error: 'URL not found' });
        }

        // Check if URL has expired
        if (url.expiresAt < new Date()) {
            logger.warn('URL has expired', { shortcode });
            return res.status(410).json({ error: 'URL has expired' });
        }

        const stats = {
            originalUrl: url.originalUrl,
            shortCode: url.shortCode,
            createdAt: url.createdAt,
            expiresAt: url.expiresAt,
            totalClicks: url.clicks.length,
            clickDetails: url.clicks
        };

        logger.info('URL stats retrieved', { shortcode });
        return res.status(200).json(stats);
    } catch (error) {
        logger.error('Error retrieving URL stats', { error: error.message });
        return res.status(500).json({ error: 'Server error' });
    }
};

// Redirect to original URL
exports.redirectToUrl = async (req, res) => {
    try {
        const { shortcode } = req.params;

        const url = await Url.findOne({ shortCode: shortcode });

        if (!url) {
            logger.error('URL not found', { shortcode });
            return res.status(404).json({ error: 'URL not found' });
        }

        // Check if URL has expired
        if (url.expiresAt < new Date()) {
            logger.warn('URL has expired', { shortcode });
            return res.status(410).json({ error: 'URL has expired' });
        }

        // Record click information
        const clickInfo = {
            timestamp: new Date(),
            referrer: req.get('Referrer') || 'Direct',
            location: req.ip || 'Unknown'
        };

        url.clicks.push(clickInfo);
        await url.save();

        logger.info('Redirecting to original URL', { shortcode, originalUrl: url.originalUrl });
        return res.redirect(url.originalUrl);
    } catch (error) {
        logger.error('Error redirecting to URL', { error: error.message });
        return res.status(500).json({ error: 'Server error' });
    }
};