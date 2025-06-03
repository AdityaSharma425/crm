const Campaign = require('../models/Campaign');
const Customer = require('../models/Customer');
const Segment = require('../models/Segment');
const CommunicationLog = require('../models/CommunicationLog');
const { publishToChannel } = require('../config/redis');
const nodemailer = require('nodemailer');
const twilio = require('twilio');
const { sendMessage } = require('./vendorService');
const batchProcessor = require('./batchProcessor');

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
const sendMessageToVendor = async (customer, message) => {
  const results = {
    email: null,
    sms: null
  };

  try {
    // Send email if customer has email
    if (customer.email) {
      const emailResult = await emailTransporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: customer.email,
        subject: message.subject || 'New Message from XENO',
        html: message.content,
        text: message.text || message.content
      });
      results.email = { success: true, id: emailResult.messageId };
    }

    // Send SMS if customer has phone
    if (customer.phone) {
      const smsResult = await twilioClient.messages.create({
        body: message.text || message.content,
        to: customer.phone,
        from: process.env.TWILIO_PHONE_NUMBER
      });
      results.sms = { success: true, id: smsResult.sid };
    }

    return results;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

// Send campaign notification email
const sendCampaignNotification = async (campaign, status) => {
  try {
    // Get all customers in the segment
    const segment = await Segment.findById(campaign.segment);
    if (!segment) {
      throw new Error('Segment not found');
    }

    const customers = await Customer.find({});
    const segmentCustomers = customers.filter(customer => segment.evaluateCustomer(customer));

    const subject = status === 'scheduled' 
      ? `New Campaign "${campaign.name}" Coming Soon`
      : `New Campaign "${campaign.name}" is Live`;

    const scheduledTime = campaign.scheduledFor 
      ? new Date(campaign.scheduledFor).toLocaleString()
      : 'now';

    const content = `
      <h2>${status === 'scheduled' ? 'Upcoming Campaign' : 'New Campaign'}</h2>
      <p>${status === 'scheduled' 
        ? `We're excited to announce that "${campaign.name}" will be starting on ${scheduledTime}.` 
        : `We're excited to announce that "${campaign.name}" is now live!`}</p>
      <p>Campaign Details:</p>
      <ul>
        <li>Name: ${campaign.name}</li>
        ${campaign.description ? `<li>Description: ${campaign.description}</li>` : ''}
        ${status === 'scheduled' ? `<li>Start Time: ${scheduledTime}</li>` : ''}
      </ul>
      <p>Stay tuned for more updates!</p>
    `;

    // Send email to each customer in the segment
    for (const customer of segmentCustomers) {
      if (customer.email) {
        try {
          await emailTransporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: customer.email,
            subject: subject,
            html: content,
            text: content.replace(/<[^>]*>/g, '') // Strip HTML tags for plain text version
          });
          console.log(`Campaign notification email sent to customer ${customer._id}`);
        } catch (error) {
          console.error(`Failed to send email to customer ${customer._id}:`, error);
          // Continue with other customers even if one fails
        }
      }
    }

    // Also send a copy to admin
    try {
      await emailTransporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: process.env.ADMIN_EMAIL || process.env.SMTP_USER,
        subject: `[Admin] Campaign "${campaign.name}" ${status === 'scheduled' ? 'Scheduled' : 'Activated'}`,
        html: `
          <h2>Campaign Status Update (Admin Copy)</h2>
          <p>Campaign "${campaign.name}" has been ${status === 'scheduled' ? 'scheduled' : 'activated'}.</p>
          ${status === 'scheduled' ? `<p>It will start running on: ${scheduledTime}</p>` : ''}
          <p>Campaign Details:</p>
          <ul>
            <li>Total Audience: ${segmentCustomers.length}</li>
            <li>Status: ${campaign.status}</li>
            <li>Created: ${new Date(campaign.createdAt).toLocaleString()}</li>
          </ul>
        `,
        text: content.replace(/<[^>]*>/g, '')
      });
      console.log(`Admin notification email sent for campaign ${campaign._id}`);
    } catch (error) {
      console.error('Error sending admin notification email:', error);
      // Don't throw the error as this is a non-critical operation
    }

  } catch (error) {
    console.error('Error sending campaign notification emails:', error);
    // Don't throw the error as this is a non-critical operation
  }
};

// Create a new campaign
const createCampaign = async (campaignData, userId) => {
  try {
    const segment = await Segment.findById(campaignData.segment);
    if (!segment) {
      throw new Error('Segment not found');
    }

    // Get customers in segment
    const customers = await Customer.find({});
    const segmentCustomers = customers.filter(customer => segment.evaluateCustomer(customer));

    // Determine campaign status
    let status = campaignData.status; // Use the status from the request if provided
    if (!status) {
      if (campaignData.scheduledFor) {
        const scheduledTime = new Date(campaignData.scheduledFor);
        const now = new Date();
        status = scheduledTime > now ? 'scheduled' : 'draft';
      } else {
        status = 'draft';
      }
    }

    // Create campaign with initial stats
    const campaign = await Campaign.create({
      ...campaignData,
      createdBy: userId,
      status,
      stats: {
        totalAudience: segmentCustomers.length,
        sent: 0,
        failed: 0,
        delivered: 0
      }
    });

    // Create communication logs for each customer in the segment
    const communicationLogs = segmentCustomers.map(customer => ({
      campaign: campaign._id,
      customer: customer._id,
      message: campaignData.message,
      status: 'pending',
      createdAt: new Date()
    }));

    await CommunicationLog.insertMany(communicationLogs);

    // Send notification email if campaign is scheduled or activated immediately
    if (status === 'scheduled') {
      await sendCampaignNotification(campaign, status);
    }

    return campaign;
  } catch (error) {
    console.error('Error in createCampaign:', error);
    throw error;
  }
};

// Activate a campaign
const activateCampaign = async (campaignId) => {
  try {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    if (campaign.status !== 'draft' && campaign.status !== 'scheduled') {
      throw new Error(`Cannot activate campaign. Current status: ${campaign.status}`);
    }

    // Check if it's a scheduled campaign
    if (campaign.scheduledFor) {
      const scheduledTime = new Date(campaign.scheduledFor);
      const now = new Date();
      
      if (scheduledTime > now) {
        // If scheduled time is in the future, keep it scheduled
        campaign.status = 'scheduled';
        await campaign.save();
        
        // Send notification email for scheduled campaign
        sendCampaignNotification(campaign, 'scheduled').catch(error => {
          console.error('Error sending scheduled campaign notification:', error);
        });
        
        return campaign;
      }
    }

    // Activate the campaign
    campaign.status = 'running';
    await campaign.save();

    // Send notification email for activated campaign
    sendCampaignNotification(campaign, 'activated').catch(error => {
      console.error('Error sending campaign activation notification:', error);
    });

    // Start processing messages in the background
    processCampaignDelivery(campaignId).catch(error => {
      console.error('Error processing campaign delivery:', error);
    });

    return campaign;
  } catch (error) {
    console.error('Error in activateCampaign:', error);
    throw error;
  }
};

// Process campaign delivery
const processCampaignDelivery = async (campaignId) => {
  try {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    // Only process running campaigns
    if (campaign.status !== 'running') {
      console.log(`Campaign ${campaignId} is not running. Current status: ${campaign.status}`);
      return;
    }

    const pendingLogs = await CommunicationLog.find({
      campaign: campaignId,
      status: 'pending'
    }).populate('customer');

    console.log(`Processing ${pendingLogs.length} pending messages for campaign ${campaignId}`);

    for (const log of pendingLogs) {
      try {
        console.log(`Sending message to customer ${log.customer._id}`);
        
        // Send message via vendor API
        const result = await sendMessage(log.customer, {
          campaignId: campaign._id,
          content: campaign.message
        });
        
        // Update log status to sent
        log.status = 'sent';
        log.sentAt = new Date();
        log.messageId = result.messageId;
        log.channels = result.channels;
        await log.save();

        // Update campaign stats
        campaign.stats.sent += 1;
        await campaign.save();

        console.log(`Successfully sent message to customer ${log.customer._id} via channels:`, 
          Object.entries(result.channels)
            .filter(([_, r]) => r && r.success)
            .map(([channel]) => channel)
            .join(', ')
        );
      } catch (error) {
        console.error(`Failed to send message to customer ${log.customer._id}:`, error);
        
        // Update log status to failed
        log.status = 'failed';
        log.error = error.message;
        await log.save();

        // Update campaign stats
        campaign.stats.failed += 1;
        await campaign.save();
      }
    }

    // Update campaign status if all messages are processed
    const remainingPending = await CommunicationLog.countDocuments({
      campaign: campaignId,
      status: 'pending'
    });

    if (remainingPending === 0) {
      // Double check that campaign is still running before starting the completion timer
      const currentCampaign = await Campaign.findById(campaignId);
      if (currentCampaign && currentCampaign.status === 'running') {
        console.log(`Campaign ${campaignId} messages processed. Will be marked as completed after 10 minutes.`);
        
        // Set a timeout to mark the campaign as completed after 10 minutes
        setTimeout(async () => {
          try {
            const updatedCampaign = await Campaign.findById(campaignId);
            if (updatedCampaign && updatedCampaign.status === 'running') {
              updatedCampaign.status = 'completed';
              await updatedCampaign.save();
              console.log(`Campaign ${campaignId} marked as completed after 10 minutes.`);
            }
          } catch (error) {
            console.error(`Error marking campaign ${campaignId} as completed:`, error);
          }
        }, 10 * 60 * 1000); // 10 minutes in milliseconds
      } else {
        console.log(`Campaign ${campaignId} status changed to ${currentCampaign?.status}. Skipping completion timer.`);
      }
    }
  } catch (error) {
    console.error('Error in processCampaignDelivery:', error);
    throw error;
  }
};

// Handle delivery receipt
const handleDeliveryReceipt = async (campaignId, customerId, status, channels = {}) => {
  try {
    // Add to batch processor with channel information
    await batchProcessor.addToBatch(campaignId, customerId, status, channels);

    // Send email notification for delivery status
    const campaign = await Campaign.findById(campaignId).populate('createdBy');
    const customer = await Customer.findById(customerId);
    
    if (campaign && customer && campaign.createdBy?.email) {
      const subject = `Delivery Status Update - Campaign: ${campaign.name}`;
      const content = `
        <h2>Message Delivery Status Update</h2>
        <p>Campaign: ${campaign.name}</p>
        <p>Customer: ${customer.name}</p>
        <p>Status: ${status}</p>
        <p>Delivery Channels:</p>
        <ul>
          ${Object.entries(channels || {}).map(([channel, result]) => `
            <li>${channel}: ${result?.success ? 'Success' : 'Failed'} 
              ${result?.error ? `(${result.error})` : ''}
            </li>
          `).join('')}
        </ul>
        <p>Timestamp: ${new Date().toLocaleString()}</p>
      `;

      try {
        await emailTransporter.sendMail({
          from: process.env.EMAIL_FROM,
          to: campaign.createdBy.email,
          subject: subject,
          html: content,
          text: content.replace(/<[^>]*>/g, '') // Strip HTML tags for plain text version
        });
        console.log(`Delivery receipt notification sent to ${campaign.createdBy.email}`);
      } catch (emailError) {
        console.error('Failed to send delivery receipt notification:', emailError);
      }
    }
  } catch (error) {
    console.error('Error handling delivery receipt:', error);
    throw error;
  }
};

// Update delivery status
const updateDeliveryStatus = async (campaignId, customerId, status) => {
  try {
    const log = await CommunicationLog.findOne({
      campaign: campaignId,
      customer: customerId
    });

    if (!log) {
      throw new Error('Communication log not found');
    }

    log.status = status;
    if (status === 'delivered') {
      log.deliveredAt = new Date();
    }

    await log.save();

    // Update campaign stats
    const campaign = await Campaign.findById(campaignId);
    if (status === 'delivered') {
      campaign.stats.delivered += 1;
    }
    await campaign.save();

    return log;
  } catch (error) {
    console.error('Error in updateDeliveryStatus:', error);
    throw error;
  }
};

// Test email and SMS configuration
const testMessageDelivery = async () => {
  try {
    // Test email
    if (process.env.SMTP_USER) {
      const emailResult = await emailTransporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: process.env.SMTP_USER, // Send to yourself
        subject: 'XENO Test Email',
        text: 'This is a test email from XENO Campaign system.',
        html: '<p>This is a test email from XENO Campaign system.</p>'
      });
      console.log('Email test successful:', emailResult.messageId);
    }

    // Test SMS
    if (process.env.TWILIO_PHONE_NUMBER) {
      const smsResult = await twilioClient.messages.create({
        body: 'This is a test SMS from XENO Campaign system.',
        to: process.env.TWILIO_PHONE_NUMBER, // Send to your Twilio number
        from: process.env.TWILIO_PHONE_NUMBER
      });
      console.log('SMS test successful:', smsResult.sid);
    }

    return { success: true };
  } catch (error) {
    console.error('Test failed:', error);
    throw error;
  }
};

module.exports = {
  createCampaign,
  activateCampaign,
  processCampaignDelivery,
  updateDeliveryStatus,
  testMessageDelivery,
  handleDeliveryReceipt
}; 