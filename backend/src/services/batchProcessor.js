const CommunicationLog = require('../models/CommunicationLog');
const Campaign = require('../models/Campaign');

class BatchProcessor {
  constructor(batchSize = 100, flushInterval = 5000) {
    this.batchSize = batchSize;
    this.flushInterval = flushInterval;
    this.batch = new Map(); // Map of campaignId -> Map of customerId -> { status, channels }
    this.timer = null;
  }

  start() {
    this.timer = setInterval(() => this.flush(), this.flushInterval);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async addToBatch(campaignId, customerId, status, channels) {
    if (!this.batch.has(campaignId)) {
      this.batch.set(campaignId, new Map());
    }
    const campaignBatch = this.batch.get(campaignId);
    campaignBatch.set(customerId, { status, channels });

    if (campaignBatch.size >= this.batchSize) {
      await this.flushCampaign(campaignId);
    }
  }

  async flushCampaign(campaignId) {
    const campaignBatch = this.batch.get(campaignId);
    if (!campaignBatch || campaignBatch.size === 0) return;

    try {
      const updates = [];
      for (const [customerId, { status, channels }] of campaignBatch) {
        updates.push({
          updateOne: {
            filter: { campaign: campaignId, customer: customerId },
            update: { 
              $set: { 
                status,
                deliveredAt: status === 'delivered' ? new Date() : undefined,
                deliveryChannels: channels
              }
            }
          }
        });
      }

      if (updates.length > 0) {
        await CommunicationLog.bulkWrite(updates);
        
        // Update campaign stats
        const deliveredCount = Array.from(campaignBatch.values())
          .filter(({ status }) => status === 'delivered').length;
        
        await Campaign.findByIdAndUpdate(campaignId, {
          $inc: { 'stats.delivered': deliveredCount }
        });
      }
    } catch (error) {
      console.error(`Error flushing batch for campaign ${campaignId}:`, error);
    }

    this.batch.delete(campaignId);
  }

  async flush() {
    const campaignIds = Array.from(this.batch.keys());
    await Promise.all(campaignIds.map(campaignId => this.flushCampaign(campaignId)));
  }
}

// Create singleton instance
const batchProcessor = new BatchProcessor();

module.exports = batchProcessor; 