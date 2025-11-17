const nodemailer = require('nodemailer');

const sendEmail = async options => {
    // 1) Create a transporter
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
            user: process.env.EMAIL_USERNAME, // Your email address
            pass: process.env.EMAIL_PASSWORD // Your email password or app password
        }
    });

    // 2) Define the email options
    const mailOptions = {
        from: 'Dalang Kwatpan Luka <support@kaypdom.com>', // Sender's email address
        to: options.email, // Recipient's email address
        subject: options.subject, // Subject of the email
        text: options.message, // Plain text body
        }

    // 3) Send the email
    await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;