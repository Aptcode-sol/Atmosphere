const getOtpEmailTemplate = (otp, username) => {
    // Colors based on a modern dark/premium aesthetic
    const bgColor = '#121212';
    const containerColor = '#1e1e1e';
    const textColor = '#e0e0e0';
    const accentColor = '#0095f6'; // Matches the blue used in the app (e.g. checkbox, links)
    const codeColor = '#ffffff';

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify your Email</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${bgColor}; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: ${textColor};">
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: ${bgColor}; min-height: 100vh;">
        <tr>
            <td align="center" style="padding: 40px 10px;">
                <!-- Main Container -->
                <table role="presentation" width="100%" maxWidth="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 500px; background-color: ${containerColor}; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.3); overflow: hidden;">
                    
                    <!-- Header -->
                    <tr>
                        <td align="center" style="padding: 40px 40px 30px 40px; border-bottom: 1px solid #333;">
                            <h1 style="margin: 0; font-size: 24px; letter-spacing: 2px; color: ${codeColor}; text-transform: uppercase; font-weight: 700;">Atmosphere</h1>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td align="center" style="padding: 40px 40px;">
                            <h2 style="margin: 0 0 20px 0; font-size: 20px; font-weight: 600; color: ${textColor};">Verify your email address</h2>
                            <p style="margin: 0 0 30px 0; font-size: 15px; line-height: 1.6; color: #b0b0b0;">
                                Hi ${username || 'there'},<br>
                                Use the verification code below to complete your sign-up process.
                            </p>
                            
                            <!-- OTP Box -->
                            <div style="background-color: #2a2a2a; border-radius: 8px; padding: 20px; margin-bottom: 30px; text-align: center; border: 1px solid #333;">
                                <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: ${accentColor}; font-family: monospace;">${otp}</span>
                            </div>

                            <p style="margin: 0; font-size: 13px; color: #888;">
                                This code will expire in 10 minutes.<br>
                                If you didn't request this, please ignore this email.
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td align="center" style="padding: 30px; background-color: #181818; border-top: 1px solid #333;">
                            <p style="margin: 0; font-size: 12px; color: #666;">
                                © ${new Date().getFullYear()} Atmosphere. All rights reserved.
                            </p>
                            <div style="margin-top: 10px;">
                                <a href="#" style="color: #666; text-decoration: none; font-size: 11px; margin: 0 5px;">Privacy Policy</a> • 
                                <a href="#" style="color: #666; text-decoration: none; font-size: 11px; margin: 0 5px;">Terms of Service</a>
                            </div>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `;
};

module.exports = {
    getOtpEmailTemplate
};
