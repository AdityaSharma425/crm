const express = require('express');
const router = express.Router();
const Segment = require('../models/Segment');
const Customer = require('../models/Customer');
const { isAuthenticated } = require('../middleware/auth');
const aiService = require('../services/aiService');

// Get all segments
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const segments = await Segment.find({ createdBy: req.user._id })
      .sort({ createdAt: -1 });
    res.json(segments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get segment by ID
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const segment = await Segment.findById(req.params.id);
    
    if (!segment) {
      return res.status(404).json({ message: 'Segment not found' });
    }
    
    if (segment.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    res.json(segment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create segment
router.post('/', isAuthenticated, async (req, res) => {
  try {
    const segment = new Segment({
      ...req.body,
      createdBy: req.user._id
    });
    
    // Calculate initial customer count
    const customers = await Customer.find({});
    segment.customerCount = customers.filter(customer => 
      segment.evaluateCustomer(customer)
    ).length;
    
    const savedSegment = await segment.save();
    res.status(201).json(savedSegment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update segment
router.put('/:id', isAuthenticated, async (req, res) => {
  try {
    const segment = await Segment.findById(req.params.id);
    
    if (!segment) {
      return res.status(404).json({ message: 'Segment not found' });
    }
    
    if (segment.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Update segment fields
    Object.assign(segment, req.body);
    
    // Recalculate customer count
    const customers = await Customer.find({});
    segment.customerCount = customers.filter(customer => 
      segment.evaluateCustomer(customer)
    ).length;
    
    const updatedSegment = await segment.save();
    res.json(updatedSegment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete segment
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    const segment = await Segment.findById(req.params.id);
    
    if (!segment) {
      return res.status(404).json({ message: 'Segment not found' });
    }
    
    if (segment.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    await Segment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Segment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Preview segment size
router.post('/preview', isAuthenticated, async (req, res) => {
  try {
    const segment = new Segment({
      ...req.body,
      createdBy: req.user._id
    });
    
    const customers = await Customer.find({});
    const matchingCustomers = customers.filter(customer => 
      segment.evaluateCustomer(customer)
    );
    
    res.json({
      totalCustomers: customers.length,
      matchingCustomers: matchingCustomers.length,
      preview: matchingCustomers.slice(0, 10) // Return first 10 matching customers
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Convert natural language to rules
router.post('/convert-rules', isAuthenticated, async (req, res) => {
  try {
    const { description } = req.body;
    const rules = await aiService.naturalLanguageToRules(description);
    res.json(rules);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 