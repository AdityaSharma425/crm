const Campaign = require('../models/Campaign');
const { publishToChannel } = require('../config/redis');
const { sendCampaignNotification } = require('./campaignService');

// Check and update scheduled campaigns
const checkScheduledCampaigns = async () => {
  try {
    console.log('Checking for scheduled campaigns...');
    console.log('Current time:', new Date().toISOString());
    
    // Find all scheduled campaigns where scheduledFor time has passed
    const now = new Date();
    const campaigns = await Campaign.find({
      status: 'scheduled',
      scheduledFor: { $lte: now }
    }).populate('segment', 'name');

    console.log(`Found ${campaigns.length} campaigns to update`);
    if (campaigns.length > 0) {
      console.log('Campaigns to update:', campaigns.map(c => ({
        id: c._id,
        name: c.name,
        scheduledFor: c.scheduledFor,
        segment: c.segment?.name
      })));
    }

    for (const campaign of campaigns) {
      try {
        console.log(`Processing campaign ${campaign._id}:`);
        console.log('- Name:', campaign.name);
        console.log('- Scheduled for:', campaign.scheduledFor);
        console.log('- Current time:', now);
        console.log('- Segment:', campaign.segment?.name);
        
        // Update campaign status to running
        campaign.status = 'running';
        await campaign.save();
        console.log(`✓ Campaign ${campaign._id} status updated to running`);

        // Send notification email for campaign activation
        await sendCampaignNotification(campaign, 'activated');
        console.log(`✓ Campaign ${campaign._id} notification email sent`);

        // Publish to Redis for processing
        try {
          await publishToChannel('campaigns', {
            campaignId: campaign._id,
            type: 'NEW_CAMPAIGN'
          });
          console.log(`✓ Campaign ${campaign._id} published to Redis for processing`);
        } catch (redisError) {
          console.error(`✗ Failed to publish campaign ${campaign._id} to Redis:`, redisError);
          // Continue with the next campaign even if Redis publish fails
        }
      } catch (campaignError) {
        console.error(`✗ Error processing campaign ${campaign._id}:`, campaignError);
        // Continue with the next campaign even if one fails
      }
    }
  } catch (error) {
    console.error('Error checking scheduled campaigns:', error);
  }
};

// Start the scheduler
const startScheduler = () => {
  console.log('Starting campaign scheduler...');
  console.log('Scheduler will check for campaigns every minute');
  
  // Check every minute
  const interval = setInterval(async () => {
    try {
      await checkScheduledCampaigns();
    } catch (error) {
      console.error('Scheduler interval error:', error);
    }
  }, 60000);
  
  // Also check immediately on startup
  checkScheduledCampaigns().catch(error => {
    console.error('Initial scheduler check failed:', error);
  });

  // Handle process termination
  process.on('SIGTERM', () => {
    console.log('Stopping scheduler...');
    clearInterval(interval);
  });
};

module.exports = {
  startScheduler,
  checkScheduledCampaigns
}; 