const nodemailer = require("nodemailer");
require("dotenv").config();

const sendWelcomeEmail = async (adminEmail, token) => {
  try {
    // Create a nodemailer transporter using Gmail service
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.GMAIL,
        pass: process.env.GMAIL_PSW_APP,
      },
    });

    const baseURL =
      process.env.NODE_ENV === "development"
        ? "http://localhost:5173"
        : "https://vicus.netlify.app/";
    const verifyEmailLink = `${baseURL}/admin/verify-email/${token}`;

    const mailOptions = {
      from: process.env.GMAIL,
      to: adminEmail,
      subject: "Welcome to Vicus!",
      html: `
            <p>Welcome to Vicus! Click <a href="${verifyEmailLink}">here</a> to verify your email and become an admin. Please use this <a href="${baseURL}/admin/login">login URL</a>.</p>
        `,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log("Welcome Email sent successfully:", info.response);
  } catch (err) {
    console.error("Error sending welcome email: ", err);
    throw err;
  }
};

module.exports = sendWelcomeEmail;
