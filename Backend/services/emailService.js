const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');

const sesClient = new SESClient({
    region: process.env.AWS_REGION,
});

const sendEmail = async (to, subject, html) => {
    if (process.env.OTP_MODE === 'dev') {
        console.log('DEV MODE EMAIL:', { to, subject, html });
        return;
    }

    const params = {
        Source: process.env.EMAIL_FROM,
        Destination: {
            ToAddresses: Array.isArray(to) ? to : [to],
        },
        Message: {
            Subject: { Data: subject, Charset: 'UTF-8' },
            Body: {
                Html: { Data: html, Charset: 'UTF-8' },
            },
        },
    };

    return sesClient.send(new SendEmailCommand(params));
};

module.exports = { sendEmail };
