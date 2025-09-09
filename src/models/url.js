const mongoose = require('mongoose');
// Remove the nanoid import as we'll handle it in the controller

const clickSchema = new mongoose.Schema({
    timestamp: {
        type: Date,
        default: Date.now
    },
    referrer: {
        type: String,
        default: 'Direct'
    },
    location: {
        type: String,
        default: 'Unknown'
    }
});

const urlSchema = new mongoose.Schema({
    originalUrl: {
        type: String,
        required: true
    },
    shortCode: {
        type: String,
        required: true,
        unique: true
        // Remove the default function that uses nanoid
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    expiresAt: {
        type: Date,
        required: true,
        default: () => {
            const now = new Date();
            return new Date(now.getTime() + 30 * 60000); // Default 30 minutes
        }
    },
    clicks: [clickSchema]
});

module.exports = mongoose.model('Url', urlSchema);