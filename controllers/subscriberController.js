const Subscriber = require("../models/Subscriber");
const sendEmail = require("../utils/sendEmail");

exports.subscribe = async (req, res) => {
  try {
    const { email } = req.body;
    console.log("Subscription request for:", email);

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    // Check if already subscribed
    let subscriber = await Subscriber.findOne({ email });
    
    if (subscriber) {
      console.log("Existing subscriber found:", subscriber.email);
      if (subscriber.status === "active") {
        return res.status(400).json({ success: false, message: "You are already subscribed!" });
      } else {
        // Reactivate
        subscriber.status = "active";
        await subscriber.save();
        console.log("Subscriber reactivated:", email);
      }
    } else {
      // Create new subscriber
      subscriber = new Subscriber({ email });
      await subscriber.save();
      console.log("New subscriber saved to database:", email);
    }

    // Send Welcome Email
    try {
      const welcomeTemplate = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(135deg, #108ee9 0%, #00d2ff 100%); color: white; padding: 40px 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">Welcome to GiveHope! 🕊️</h1>
            <p style="margin-top: 10px; opacity: 0.9;">Building a better future together.</p>
          </div>
          <div style="padding: 40px 30px;">
            <p style="font-size: 18px;">Hi there,</p>
            <p>Thank you for subscribing to the <strong>GiveHope</strong> newsletter! You've joined a community of compassionate individuals dedicated to making a real-world impact.</p>
            
            <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 25px 0;">
              <h3 style="margin-top: 0; color: #108ee9;">What to expect:</h3>
              <ul style="padding-left: 20px; margin-bottom: 0;">
                <li>Exclusive updates on new campaigns</li>
                <li>Inspiring stories from our NGO partners</li>
                <li>Impact reports showing where your help goes</li>
                <li>Special event invitations</li>
              </ul>
            </div>

            <p>We believe in 100% transparency. Every donation on our platform is recorded on the blockchain, and now you'll be the first to know about our progress.</p>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="http://localhost:5173/compaigns" style="background: #108ee9; color: white; padding: 12px 25px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">Explore Campaigns</a>
            </div>

            <div style="margin-top: 40px; border-top: 1px solid #eee; padding-top: 25px; font-size: 12px; color: #888; text-align: center;">
              <p>You're receiving this because you signed up on our website.</p>
              <p>&copy; 2026 GiveHope. All rights reserved.</p>
            </div>
          </div>
        </div>
      `;

      await sendEmail({
        email: email,
        subject: "Welcome to the GiveHope Family! 🎉",
        message: welcomeTemplate,
      });
      console.log("Welcome email sent to:", email);
    } catch (emailErr) {
      console.error("Newsletter Welcome Email failed:", emailErr.message);
      // We don't return error here because the user IS subscribed in DB
    }

    res.status(201).json({
      success: true,
      message: "Subscribed successfully! 🎉",
    });
  } catch (err) {
    console.error("Subscription Error Detail:", err);
    res.status(500).json({ success: false, message: "Something went wrong. Please try again later." });
  }
};
