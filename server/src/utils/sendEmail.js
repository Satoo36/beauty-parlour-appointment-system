import nodemailer from "nodemailer";

const sendResetEmail = async (email, token) => {
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD,
        },
    });

    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;

    const mailOptions = {
        from: `"Beauty Parlour" <noreply@beautyparlour.com>`,
        to: email,
        subject: "Password Reset Request",
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 8px;">
                <h2 style="color: #e11d48; text-align: center;">Password Reset Request</h2>
                <p>Hello,</p>
                <p>You requested to reset your password. Please click the button below to set a new password. This link is valid for 15 minutes.</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetUrl}" style="background-color: #e11d48; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
                </div>
                <p>If you did not request this, please ignore this email.</p>
                <p>Link: <a href="${resetUrl}">${resetUrl}</a></p>
                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;">
                <p style="font-size: 12px; color: #64748b; text-align: center;">&copy; 2026 Beauty Parlour. All rights reserved.</p>
            </div>
        `,
    };

    await transporter.sendMail(mailOptions);
};

export default sendResetEmail;
