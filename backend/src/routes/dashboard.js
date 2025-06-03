const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const Segment = require('../models/Segment');
const Campaign = require('../models/Campaign');
const { isAuthenticated } = require('../middleware/auth');

// Get dashboard stats
router.get('/stats', isAuthenticated, async (req, res) => {
  try {
    // Get total customers (including those without createdBy field for backward compatibility)
    const totalCustomers = await Customer.countDocuments({
      $or: [
        { createdBy: req.user._id },
        { createdBy: { $exists: false } }
      ]
    });

    // Get total segments
    const totalSegments = await Segment.countDocuments({ createdBy: req.user._id });

    // Get active campaigns
    const activeCampaigns = await Campaign.countDocuments({
      createdBy: req.user._id,
      status: { $in: ['scheduled', 'running'] }
    });

    // Calculate total revenue from all customers (including those without createdBy field)
    const customers = await Customer.find({
      $or: [
        { createdBy: req.user._id },
        { createdBy: { $exists: false } }
      ]
    });
    const totalRevenue = customers.reduce((sum, customer) => sum + (customer.totalSpent || 0), 0);

    res.json({
      totalCustomers,
      totalSegments,
      activeCampaigns,
      totalRevenue
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get recent activity
router.get('/activity', isAuthenticated, async (req, res) => {
  try {
    // Get recent campaigns
    const recentCampaigns = await Campaign.find({ createdBy: req.user._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('segment');

    // Get recent customers
    const recentCustomers = await Customer.find({ createdBy: req.user._id })
      .sort({ createdAt: -1 })
      .limit(5);

    // Get recent segments
    const recentSegments = await Segment.find({ createdBy: req.user._id })
      .sort({ createdAt: -1 })
      .limit(5);

    // Combine and sort all activities
    const activities = [
      ...recentCampaigns.map(campaign => ({
        type: 'campaign',
        action: 'created',
        item: campaign,
        timestamp: campaign.createdAt
      })),
      ...recentCustomers.map(customer => ({
        type: 'customer',
        action: 'created',
        item: customer,
        timestamp: customer.createdAt
      })),
      ...recentSegments.map(segment => ({
        type: 'segment',
        action: 'created',
        item: segment,
        timestamp: segment.createdAt
      }))
    ].sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 10);

    res.json(activities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 