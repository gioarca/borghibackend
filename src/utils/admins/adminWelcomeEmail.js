import nodemailer from "nodemailer";

export const sendWelcomeEmail = async (email, password, token) => {
  try {
    // Create a nodemailer transporter using Gmail service
    const transporter = nodemailer.createTransport({
      service: "gmail",
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
      to: email,
      subject: "Welcome to Vicus!",
      html: `
            <p>Welcome to our Vicus! Click <a href="${verifyEmailLink}">here</a> to verify your email. Your temporary password is: ${password}, you can change it later. Please use this <a href="${baseURL}/admin/login">login URL</a>.</p>
        `,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log("Welcome Email sent successfully:", info.response);
  } catch (err) {
    console.error("Error sending welcome email: ", err);
    throw err;
  }
};
