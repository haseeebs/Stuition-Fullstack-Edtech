import { createTransport } from "nodemailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";

const transporter = createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT),
  secure: process.env.MAIL_SECURE,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
} as SMTPTransport.Options);

const mailSender = async ({email, subject, body}: {email:string, subject:string, body:string}) => {
  const info = await transporter.sendMail({
    from: `"Haseeb || Stuition" <${process.env.MAIL_USER}>`,
    to: email,
    subject,
    text: body,
    html: body,
  });

  console.log("Email sent successfully...");
  return info;
};

export default mailSender;
