const express = require('express');
const router = express.Router();
const campaignService = require('../services/campaignService');

// Update delivery status
router.post('/receipt', async (req, res) => {
  try {
    const { campaignId, customerId, status, error } = req.body;
    
    if (!campaignId || !customerId || !status) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    await campaignService.updateDeliveryStatus(campaignId, customerId, status);
    res.json({ message: 'Delivery status updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 