/**
 * Upload an image to Cloudinary via the backend
 * @param imageUri - Local file URI from image picker
 * @returns Promise<string> - The Cloudinary URL
 */
import { getBaseUrl, DEFAULT_BASE_URL } from './config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export async function uploadImage(imageUri: string, mimeType?: string): Promise<string> {
    const base = await getBaseUrl().catch(() => DEFAULT_BASE_URL);
    const token = await AsyncStorage.getItem('token');

    if (!token) {
        throw new Error('Authentication required');
    }

    // Create form data
    const formData = new FormData();

    // Get the filename from the URI
    const uriParts = imageUri.split('/');
    const fileName = uriParts[uriParts.length - 1] || 'image.jpg';

    // Determine the mime type
    const type = mimeType || getMimeType(fileName);

    // Append the image to form data
    // React Native requires this specific format for file uploads
    formData.append('image', {
        uri: Platform.OS === 'android' ? imageUri : imageUri.replace('file://', ''),
        type,
        name: fileName,
    } as any);

    const response = await fetch(`${base}/api/upload`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
        },
        body: formData,
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('Upload failed:', errorText);
        throw new Error('Failed to upload image');
    }

    const data = await response.json();

    if (!data.url) {
        throw new Error('No URL returned from upload');
    }

    return data.url;
}

/**
 * Get mime type from file extension
 */
function getMimeType(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'heic': 'image/heic',
        'heif': 'image/heif',
    };
    return mimeTypes[extension || ''] || 'image/jpeg';
}
