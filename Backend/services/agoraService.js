const { RtcTokenBuilder, RtcRole } = require('agora-access-token');

/**
 * Generate Agora RTC token for a channel
 * @param {string} channelName - The channel name
 * @param {string} uid - User ID (can be 0 for auto-assignment)
 * @param {string} role - 'publisher' or 'subscriber'
 * @param {number} expirationTimeInSeconds - Token expiration time (default 3600 = 1 hour)
 * @returns {string} - The generated token
 */
const generateAgoraToken = (channelName, uid = 0, role = 'publisher', expirationTimeInSeconds = 3600) => {
    const appId = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;

    if (!appId) {
        throw new Error('AGORA_APP_ID is not configured in environment variables');
    }

    // If no certificate is provided, return empty token (works for testing without certificate)
    if (!appCertificate) {
        console.warn('AGORA_APP_CERTIFICATE not set. Token generation disabled. Use App ID only for testing.');
        return '';
    }

    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    // Convert role string to RtcRole enum
    const rtcRole = role === 'publisher' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;

    // Build the token
    const token = RtcTokenBuilder.buildTokenWithUid(
        appId,
        appCertificate,
        channelName,
        uid,
        rtcRole,
        privilegeExpiredTs
    );

    return token;
};

/**
 * Generate a unique channel name for a meeting
 * @param {string} meetingId - The meeting ID
 * @returns {string} - Channel name
 */
const generateChannelName = (meetingId) => {
    // Channel names should be alphanumeric and can include underscores
    // Remove any special characters and limit length
    return `meeting_${meetingId}`.replace(/[^a-zA-Z0-9_]/g, '').substring(0, 64);
};

module.exports = {
    generateAgoraToken,
    generateChannelName,
};
