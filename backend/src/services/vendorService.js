const axios = require('axios');
const nodemailer = require('nodemailer');
const twilio = require('twilio');

// Configure email transporter
const emailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Configure Twilio client
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Send message through appropriate channels
const sendMessage = async (customer, message) => {
  try {
    const results = {
      email: null,
      sms: null
    };

    // Send email if customer has email
    if (customer.email) {
      try {
        const emailResult = await emailTransporter.sendMail({
          from: process.env.EMAIL_FROM,
          to: customer.email,
          subject: 'New Message from XENO',
          html: message.content,
          text: message.content
        });
        results.email = { success: true, id: emailResult.messageId };
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        results.email = { success: false, error: emailError.message };
      }
    }

    // Send SMS if customer has phone
    if (customer.phone) {
      try {
        // Format phone number to E.164 format
        let formattedPhone = customer.phone.replace(/\D/g, '');
        
        // Add country code if not present (assuming Indian numbers)
        if (!formattedPhone.startsWith('91')) {
          formattedPhone = '91' + formattedPhone;
        }
        
        // Validate phone number length
        if (formattedPhone.length < 12 || formattedPhone.length > 13) {
          throw new Error(`Invalid phone number length: ${formattedPhone.length} digits`);
        }
        
        const smsResult = await twilioClient.messages.create({
          body: message.text || message.content,
          to: `+${formattedPhone}`,
          from: process.env.TWILIO_PHONE_NUMBER
        });
        results.sms = { success: true, id: smsResult.sid };
      } catch (error) {
        console.error('SMS sending failed:', error.message);
        results.sms = { success: false, error: error.message };
      }
    }

    // Send delivery receipt to webhook
    setTimeout(async () => {
      try {
        // Use the server's own URL for internal webhook
        const serverUrl = process.env.SERVER_URL || 'http://localhost:3001';
        const webhookUrl = `${serverUrl}/api/campaigns/delivery-receipt`;
        
        console.log('Sending delivery receipt to:', webhookUrl);
        
        await axios.post(webhookUrl, {
          campaignId: message.campaignId,
          customerId: customer._id,
          status: 'delivered',
          channels: results
        }, {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 5000 // 5 second timeout
        });
        
        console.log('Delivery receipt sent successfully');
      } catch (error) {
        console.error('Failed to send delivery receipt:', error.message);
        if (error.response) {
          console.error('Response status:', error.response.status);
          console.error('Response data:', error.response.data);
        }
        // Don't throw the error as this is a background task
      }
    }, 5000);

    // Consider the message sent if at least one channel succeeded
    const isSuccess = Object.values(results).some(result => result && result.success);

    if (!isSuccess) {
      throw new Error('All message delivery channels failed');
    }

    return {
      success: true,
      messageId: `MSG_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      channels: results,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Vendor API error:', error);
    throw error;
  }
};

module.exports = {
  sendMessage
}; 