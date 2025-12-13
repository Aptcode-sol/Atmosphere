const cloudinary = require('./cloudinaryConfig');

/**
 * Upload an image buffer to Cloudinary
 * @param {Buffer} fileBuffer - The image file buffer
 * @param {string} folder - The Cloudinary folder to upload to
 * @returns {Promise<{url: string, publicId: string}>}
 */
exports.uploadImage = async (fileBuffer, folder = 'atmosphere/posts') => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: 'image',
                transformation: [
                    { quality: 'auto:good' },
                    { fetch_format: 'auto' }
                ]
            },
            (error, result) => {
                if (error) {
                    console.error('Cloudinary upload error:', error);
                    reject(error);
                } else {
                    resolve({
                        url: result.secure_url,
                        publicId: result.public_id
                    });
                }
            }
        );

        // Write buffer to the upload stream
        uploadStream.end(fileBuffer);
    });
};

/**
 * Delete an image from Cloudinary
 * @param {string} publicId - The Cloudinary public ID
 * @returns {Promise<void>}
 */
exports.deleteImage = async (publicId) => {
    try {
        await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        console.error('Cloudinary delete error:', error);
        throw error;
    }
};

/**
 * Upload a video buffer to Cloudinary
 * @param {Buffer} fileBuffer - The video file buffer
 * @param {string} folder - The Cloudinary folder to upload to
 * @returns {Promise<{url: string, publicId: string, thumbnailUrl: string, duration: number}>}
 */
exports.uploadVideo = async (fileBuffer, folder = 'atmosphere/reels') => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: 'video',
                transformation: [
                    { quality: 'auto:good' }
                ]
            },
            (error, result) => {
                if (error) {
                    console.error('Cloudinary video upload error:', error);
                    reject(error);
                } else {
                    // Generate thumbnail URL from video
                    const thumbnailUrl = result.secure_url.replace(/\.[^.]+$/, '.jpg');
                    resolve({
                        url: result.secure_url,
                        publicId: result.public_id,
                        thumbnailUrl,
                        duration: result.duration || 0
                    });
                }
            }
        );

        // Write buffer to the upload stream
        uploadStream.end(fileBuffer);
    });
};

