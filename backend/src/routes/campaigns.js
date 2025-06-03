const express = require('express');
const router = express.Router();
const Campaign = require('../models/Campaign');
const { isAuthenticated } = require('../middleware/auth');
const campaignService = require('../services/campaignService');
const aiService = require('../services/aiService');
const Customer = require('../models/Customer');
const { publishToChannel } = require('../services/redisService');
const CommunicationLog = require('../models/CommunicationLog');
const Segment = require('../models/Segment');
const twilio = require('twilio');

// Get all campaigns
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const campaigns = await Campaign.find({ createdBy: req.user._id })
      .populate({
        path: 'segment',
        select: 'name description'
      })
      .sort({ createdAt: -1 });
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get campaign by ID
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    console.log('Fetching campaign with ID:', req.params.id);
    console.log('User ID:', req.user._id);
    
    const campaign = await Campaign.findById(req.params.id)
      .populate({
        path: 'segment',
        select: 'name description'
      });
    
    console.log('Found campaign:', campaign);
    
    if (!campaign) {
      console.log('Campaign not found');
      return res.status(404).json({ message: 'Campaign not found' });
    }
    
    if (campaign.createdBy.toString() !== req.user._id.toString()) {
      console.log('User not authorized. Campaign created by:', campaign.createdBy);
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    res.json(campaign);
  } catch (error) {
    console.error('Error fetching campaign:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create campaign
router.post('/', isAuthenticated, async (req, res) => {
  try {
    const campaign = await campaignService.createCampaign(req.body, req.user._id);
    res.status(201).json(campaign);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update campaign
router.put('/:id', isAuthenticated, async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    
    if (campaign.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    if (campaign.status !== 'draft' && campaign.status !== 'scheduled') {
      return res.status(400).json({ message: 'Can only update draft or scheduled campaigns' });
    }

    // If segment is being updated, recalculate totalAudience
    if (req.body.segment && req.body.segment !== campaign.segment.toString()) {
      const segment = await Segment.findById(req.body.segment);
      if (!segment) {
        return res.status(400).json({ message: 'Segment not found' });
      }

      // Get customers in segment
      const customers = await Customer.find({});
      const segmentCustomers = customers.filter(customer => segment.evaluateCustomer(customer));
      
      // Update totalAudience in the request body
      req.body.stats = {
        ...campaign.stats,
        totalAudience: segmentCustomers.length
      };
    }
    
    const updatedCampaign = await Campaign.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate({
      path: 'segment',
      select: 'name description'
    });
    
    res.json(updatedCampaign);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete campaign
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    console.log('Delete request received for campaign:', req.params.id);
    console.log('User ID:', req.user._id);
    
    const campaign = await Campaign.findById(req.params.id);
    console.log('Found campaign:', campaign);
    
    if (!campaign) {
      console.log('Campaign not found');
      return res.status(404).json({ message: 'Campaign not found' });
    }
    
    if (campaign.createdBy.toString() !== req.user._id.toString()) {
      console.log('User not authorized. Campaign created by:', campaign.createdBy);
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Allow deletion of campaigns in draft or running status
    if (!['draft', 'scheduled', 'stopped', 'running'].includes(campaign.status)) {
      console.log('Campaign cannot be deleted. Current status:', campaign.status);
      return res.status(400).json({ 
        message: `Cannot delete campaign. Campaign must be in draft or running status. Current status: ${campaign.status}` 
      });
    }
    
    console.log('Deleting communication logs for campaign:', campaign._id);
    const deleteLogsResult = await CommunicationLog.deleteMany({ campaign: campaign._id });
    console.log('Communication logs deleted:', deleteLogsResult);
    
    console.log('Deleting campaign:', campaign._id);
    const deleteResult = await Campaign.findByIdAndDelete(req.params.id);
    console.log('Campaign deleted:', deleteResult);
    
    res.json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get message suggestions
router.post('/suggest-messages', isAuthenticated, async (req, res) => {
  try {
    const { campaignObjective, audienceDescription } = req.body;
    const suggestions = await aiService.generateMessageSuggestions(
      campaignObjective,
      audienceDescription
    );
    res.json(suggestions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get image suggestions
router.post('/suggest-images', isAuthenticated, async (req, res) => {
  try {
    const { message, tone } = req.body;
    const suggestions = await aiService.suggestProductImages(message, tone);
    res.json(suggestions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get target customers for a campaign
router.get('/:id/customers', isAuthenticated, async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id)
      .populate({
        path: 'segment',
        select: 'name description rules ruleLogic'
      });
    
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    
    if (campaign.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (!campaign.segment) {
      return res.status(400).json({ message: 'Campaign has no associated segment' });
    }

    // Get all customers
    const customers = await Customer.find({});
    
    // Filter customers based on segment rules
    const matchingCustomers = customers.filter(customer => {
      if (typeof campaign.segment === 'string') {
        return false; // If segment is just an ID, we can't evaluate
      }
      return campaign.segment.evaluateCustomer(customer);
    });
    
    res.json(matchingCustomers);
  } catch (error) {
    console.error('Error fetching campaign customers:', error);
    res.status(500).json({ message: error.message });
  }
});

// Test message delivery configuration
router.post('/test-delivery', isAuthenticated, async (req, res) => {
  try {
    const result = await campaignService.testMessageDelivery();
    res.json(result);
  } catch (error) {
    console.error('Error testing message delivery:', error);
    res.status(500).json({ message: error.message });
  }
});

// Activate campaign
router.post('/:id/activate', isAuthenticated, async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    
    if (campaign.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const updatedCampaign = await campaignService.activateCampaign(req.params.id);
    
    res.json({ 
      message: 'Campaign activated successfully',
      campaign: updatedCampaign
    });
  } catch (error) {
    console.error('Error activating campaign:', error);
    res.status(500).json({ message: error.message });
  }
});

// Stop campaign
router.post('/:id/stop', isAuthenticated, async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    
    if (campaign.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    if (campaign.status !== 'running') {
      return res.status(400).json({ 
        message: `Cannot stop campaign. Current status: ${campaign.status}` 
      });
    }
    
    // Update campaign status to stopped
    campaign.status = 'stopped';
    await campaign.save();
    
    // Optionally, you might want to stop any ongoing message processing here,
    // though for simplicity, we'll just prevent new messages from being sent
    // by checking the status in the message processing logic.
    
    res.json({ 
      message: 'Campaign stopped successfully',
      campaign 
    });
  } catch (error) {
    console.error('Error stopping campaign:', error);
    res.status(500).json({ message: error.message });
  }
});

// Handle delivery receipt from vendor API
router.post('/delivery-receipt', async (req, res) => {
  try {
    const { campaignId, customerId, status, timestamp } = req.body;
    
    if (!campaignId || !customerId || !status) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    await campaignService.handleDeliveryReceipt(campaignId, customerId, status);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error handling delivery receipt:', error);
    res.status(500).json({ message: error.message });
  }
});

// Test SMS configuration
router.post('/test-sms', isAuthenticated, async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    // Format phone number to E.164 format
    let formattedPhone = phoneNumber.replace(/\D/g, '');
    
    // Add country code if not present (assuming Indian numbers)
    if (!formattedPhone.startsWith('91')) {
      formattedPhone = '91' + formattedPhone;
    }
    
    // Validate phone number length
    if (formattedPhone.length < 12 || formattedPhone.length > 13) {
      return res.status(400).json({ 
        message: `Invalid phone number length: ${formattedPhone.length} digits`,
        formattedNumber: formattedPhone
      });
    }

    const twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    const smsResult = await twilioClient.messages.create({
      body: 'This is a test SMS from XENO Campaign system.',
      to: `+${formattedPhone}`,
      from: process.env.TWILIO_PHONE_NUMBER
    });

    res.json({ 
      success: true, 
      messageId: smsResult.sid,
      formattedNumber: formattedPhone
    });
  } catch (error) {
    console.error('SMS test failed:', error);
    res.status(500).json({ 
      message: error.message,
      code: error.code,
      moreInfo: error.moreInfo
    });
  }
});

module.exports = router; 