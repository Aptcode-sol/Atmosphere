const otpStore = {}; // { email: { otp: "123456", expiresAt: timestamp } }

const OTP_VALIDITY_DURATION = 10 * 60 * 1000; // 10 minutes

const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

const createOtp = (email) => {
    const otp = generateOTP();
    const expiresAt = Date.now() + OTP_VALIDITY_DURATION;

    otpStore[email] = {
        otp,
        expiresAt
    };

    return otp;
};

const verifyOtp = (email, otp) => {
    const record = otpStore[email];

    if (!record) {
        return { valid: false, message: 'No OTP found for this email.' };
    }

    if (Date.now() > record.expiresAt) {
        delete otpStore[email];
        return { valid: false, message: 'OTP has expired.' };
    }

    if (record.otp !== otp) {
        return { valid: false, message: 'Invalid OTP.' };
    }

    // OTP matches and is valid
    delete otpStore[email]; // Clear OTP after successful use
    return { valid: true };
};

module.exports = {
    createOtp,
    verifyOtp
};
