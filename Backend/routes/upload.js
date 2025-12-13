const express = require('express');
const router = express.Router();
const multer = require('multer');
const authMiddleware = require('../middleware/authMiddleware');
const s3Service = require('../services/s3Service');

// Configure multer for memory storage
const storage = multer.memoryStorage();

// Image upload configuration
const imageUpload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit for images
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    },
});

// Video upload configuration
const videoUpload = multer({
    storage,
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB limit for videos
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('video/')) {
            cb(null, true);
        } else {
            cb(new Error('Only video files are allowed'), false);
        }
    },
});

/**
 * POST /api/upload
 * Upload an image to S3
 * Requires authentication
 */
router.post('/', authMiddleware, imageUpload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file provided' });
        }

        const result = await s3Service.uploadImage(
            req.file.buffer,
            req.file.mimetype,
            req.file.originalname
        );

        res.json({
            success: true,
            url: result.url,
            key: result.key,
        });
    } catch (error) {
        console.error('Image upload error:', error);
        res.status(500).json({ error: 'Failed to upload image' });
    }
});

/**
 * POST /api/upload/video
 * Upload a video to S3
 * Requires authentication
 */
router.post('/video', authMiddleware, videoUpload.single('video'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No video file provided' });
        }

        const result = await s3Service.uploadVideo(
            req.file.buffer,
            req.file.mimetype,
            req.file.originalname
        );

        res.json({
            success: true,
            url: result.url,
            key: result.key,
            thumbnailUrl: result.thumbnailUrl,
        });
    } catch (error) {
        console.error('Video upload error:', error);
        res.status(500).json({ error: 'Failed to upload video' });
    }
});

/**
 * POST /api/upload/presigned
 * Get a presigned URL for direct upload from client
 * This allows faster uploads by bypassing the server
 */
router.post('/presigned', authMiddleware, async (req, res) => {
    try {
        const { fileName, fileType, folder } = req.body;

        if (!fileName || !fileType) {
            return res.status(400).json({ error: 'fileName and fileType are required' });
        }

        const folderPath = folder === 'video' ? 'reels' : 'images';
        const result = await s3Service.getPresignedUploadUrl(fileName, fileType, folderPath);

        res.json({
            success: true,
            uploadUrl: result.uploadUrl,
            fileUrl: result.fileUrl,
            key: result.key,
        });
    } catch (error) {
        console.error('Presigned URL error:', error);
        res.status(500).json({ error: 'Failed to generate upload URL' });
    }
});

/**
 * DELETE /api/upload
 * Delete a file from S3
 * Requires authentication
 * Pass the key in the request body
 */
router.delete('/', authMiddleware, async (req, res) => {
    try {
        const { key } = req.body;
        
        if (!key) {
            return res.status(400).json({ error: 'File key is required in body' });
        }

        await s3Service.deleteFile(key);
        res.json({ success: true, message: 'File deleted' });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ error: 'Failed to delete file' });
    }
});

module.exports = router;
