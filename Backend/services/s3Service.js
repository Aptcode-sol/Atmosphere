const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const crypto = require('crypto');

// Lazy initialization of S3 client to ensure env vars are loaded
let s3Client = null;

const getS3Client = () => {
    if (!s3Client) {
        // Validate credentials
        if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
            console.error('AWS credentials missing! Check your .env file.');
            console.error('Required: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, AWS_S3_BUCKET');
            throw new Error('AWS credentials not configured');
        }
        
        s3Client = new S3Client({
            region: process.env.AWS_REGION || 'ap-south-1',
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            },
        });
        console.log('S3 Client initialized for region:', process.env.AWS_REGION);
    }
    return s3Client;
};

const getBucketName = () => process.env.AWS_S3_BUCKET || 'atmosphere-media';

/**
 * Generate a unique filename
 */
const generateFileName = (originalName, prefix = 'upload') => {
    const ext = originalName.split('.').pop();
    const uniqueId = crypto.randomBytes(16).toString('hex');
    const timestamp = Date.now();
    return `${prefix}/${timestamp}-${uniqueId}.${ext}`;
};

/**
 * Upload an image to S3
 */
exports.uploadImage = async (fileBuffer, mimetype = 'image/jpeg', originalName = 'image.jpg') => {
    const client = getS3Client();
    const bucket = getBucketName();
    const key = generateFileName(originalName, 'images');
    
    const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: fileBuffer,
        ContentType: mimetype,
    });

    await client.send(command);

    const url = `https://${bucket}.s3.${process.env.AWS_REGION || 'ap-south-1'}.amazonaws.com/${key}`;
    
    return { url, key };
};

/**
 * Upload a video to S3
 */
exports.uploadVideo = async (fileBuffer, mimetype = 'video/mp4', originalName = 'video.mp4') => {
    const client = getS3Client();
    const bucket = getBucketName();
    const key = generateFileName(originalName, 'reels');
    
    const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: fileBuffer,
        ContentType: mimetype,
    });

    await client.send(command);

    // Generate presigned URL for video access (valid for 7 days)
    const getCommand = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
    });
    
    const url = await getSignedUrl(client, getCommand, { expiresIn: 604800 }); // 7 days
    const thumbnailUrl = url; // Use same URL as thumbnail for now
    
    return { url, key, thumbnailUrl };
};

/**
 * Delete a file from S3
 */
exports.deleteFile = async (key) => {
    if (!key) return;
    
    try {
        const client = getS3Client();
        const bucket = getBucketName();
        
        const command = new DeleteObjectCommand({
            Bucket: bucket,
            Key: key,
        });
        await client.send(command);
    } catch (error) {
        console.error('S3 delete error:', error);
        throw error;
    }
};

/**
 * Generate a presigned URL for direct upload from client
 */
exports.getPresignedUploadUrl = async (fileName, fileType, folder = 'uploads') => {
    const client = getS3Client();
    const bucket = getBucketName();
    const key = generateFileName(fileName, folder);
    
    const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: fileType,
    });

    const uploadUrl = await getSignedUrl(client, command, { expiresIn: 3600 });
    const fileUrl = `https://${bucket}.s3.${process.env.AWS_REGION || 'ap-south-1'}.amazonaws.com/${key}`;
    
    return { uploadUrl, fileUrl, key };
};

exports.getS3Client = getS3Client;
exports.getBucketName = getBucketName;
