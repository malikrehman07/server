const { Resend } = require("resend");

const sendEmail = async (options) => {
  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const data = await resend.emails.send({
      from: process.env.FROM_EMAIL || "GiveHope <onboarding@resend.dev>",
      to: options.email,
      subject: options.subject,
      html: options.message,
    });

    console.log("Email sent successfully via Resend:", data.id);
  } catch (error) {
    console.error("Resend Error:", error);
    throw error;
  }
};

module.exports = sendEmail;
