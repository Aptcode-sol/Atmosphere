const bcrypt = require('bcrypt');

const otpStore = {}; // TEMP store
const OTP_VALIDITY_DURATION = 10 * 60 * 1000; // 10 minutes

const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

const createOtp = async (email) => {
    if (!email) throw new Error('Email is required to create OTP');
    const key = String(email).toLowerCase().trim();
    const otp = await generateOTP();
    const expiresAt = Date.now() + OTP_VALIDITY_DURATION;
    const otpHash = await bcrypt.hash(otp, 10);

    otpStore[key] = {
        otpHash,
        expiresAt
    };

    return otp; // only returned to send via email
};

const verifyOtp = async (email, otp, deleteOnVerified = true) => {
    if (!email) return { valid: false, message: 'Email is required.' };
    const key = String(email).toLowerCase().trim();
    const record = otpStore[key];

    if (!record) {
        return { valid: false, message: 'No OTP found for this email.' };
    }

    if (Date.now() > record.expiresAt) {
        delete otpStore[key];
        return { valid: false, message: 'OTP has expired.' };
    }

    // DEV ONLY bypass (safe)
    if (process.env.OTP_MODE === 'dev' && otp === '000000') {
        delete otpStore[key];
        return { valid: true };
    }

    const isValid = await bcrypt.compare(otp, record.otpHash);
    if (!isValid) {
        return { valid: false, message: 'Invalid OTP.' };
    }

    if (deleteOnVerified) {
        delete otpStore[key];
    }

    return { valid: true };
};

module.exports = {
    createOtp,
    verifyOtp
};
