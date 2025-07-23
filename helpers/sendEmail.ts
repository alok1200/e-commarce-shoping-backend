import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

interface SendEmailOptions {
  to: string;
  subject: string;
  emailhtml: string;
  emailtext?: string;
}

const sendEmail = (options: SendEmailOptions): void => {
  const transporter = nodemailer.createTransport({
    service: process.env.MAIL_SERVICE,
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: `My Company <${process.env.EMAIL_FROM}>`,
    to: options.to,
    subject: options.subject,
    html: options.emailhtml,
    text: options.emailtext || options.emailhtml,
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.error("Error sending email:", err);
    } else {
      console.log("Email sent:", info.response);
    }
  });
};

export default sendEmail;
