import { Resend } from "resend";
import * as dotenv from "dotenv";

dotenv.config();

const RESEND_API_KEY = process.env.RESEND_API_KEY; // Resend API key from environment variables
const resend = new Resend(RESEND_API_KEY);

export const sendEmail = async (to: string, subject: string, text: string) => {
  const htmlContent = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body {
        font-family: Arial, sans-serif;
        background-color: #f4f4f4;
        margin: 0;
        padding: 0;
      }
      .email-container {
        max-width: 600px;
        margin: 20px auto;
        background-color: #ffffff;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
      }
      .header {
        background-color: #0073e6;
        color: #ffffff;
        text-align: center;
        padding: 20px 0;
        border-top-left-radius: 8px;
        border-top-right-radius: 8px;
      }
      .header h1 {
        margin: 0;
        font-size: 24px;
      }
      .body {
        padding: 20px;
        color: #333333;
      }
      .body p {
        font-size: 16px;
        line-height: 1.6;
        margin: 0 0 10px;
      }
      .footer {
        text-align: center;
        color: #888888;
        font-size: 12px;
        padding: 20px;
        border-top: 1px solid #dddddd;
      }
      .footer p {
        margin: 0;
      }
      .button {
        display: inline-block;
        padding: 10px 20px;
        margin-top: 20px;
        background-color: #0073e6;
        color: #ffffff;
        text-decoration: none;
        border-radius: 4px;
        font-size: 16px;
      }
    </style>
  </head>
  <body>
    <div class="email-container">
      <div class="header">
        <h1>CloudApp Notifications</h1>
      </div>
      <div class="body">
        <p>Dear User,</p>
        <p>${text}</p>
        <p>Thank you for using our services.</p>
        <a href="https://yourapp.example.com" class="button">Visit Your Dashboard</a>
      </div>
      <div class="footer">
        <p>&copy; 2024 CloudApp. All rights reserved.</p>
        <p>If you have any questions, contact us at <a href="mailto:support@cloudapp.dev">support@cloudapp.dev</a>.</p>
      </div>
    </div>
  </body>
  </html>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: "info@cloudapp.dev", // Replace with your sender email
      to,
      subject,
      html: htmlContent, // Use the styled HTML content
    });

    if (error) {
      return console.error({ error });
    }
    console.log(`Email sent successfully to ${to}:`, data);
  } catch (error: any) {
    console.error(
      "Error sending email:",
      error.response?.data || error.message
    );
    throw new Error("Failed to send email.");
  }
};
