const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const { isAuthenticated } = require('../middleware/auth');
const { publishToChannel } = require('../config/redis');

// Get all customers
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const customers = await Customer.find({});
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get customer by ID
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.json(customer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create customer
router.post('/', isAuthenticated, async (req, res) => {
  try {
    const customer = new Customer({
      ...req.body,
      createdBy: req.user._id
    });
    const savedCustomer = await customer.save();
    
    // Publish customer creation event
    await publishToChannel('customers', {
      type: 'CUSTOMER_CREATED',
      customerId: savedCustomer._id
    });
    
    res.status(201).json(savedCustomer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update customer
router.put('/:id', isAuthenticated, async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    // Publish customer update event
    await publishToChannel('customers', {
      type: 'CUSTOMER_UPDATED',
      customerId: customer._id
    });
    
    res.json(customer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete customer
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    // Publish customer deletion event
    await publishToChannel('customers', {
      type: 'CUSTOMER_DELETED',
      customerId: req.params.id
    });
    
    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Bulk create customers
router.post('/bulk', isAuthenticated, async (req, res) => {
  try {
    const customers = await Customer.insertMany(
      req.body.customers.map(customer => ({
        ...customer,
        createdBy: req.user._id
      }))
    );
    
    // Publish bulk customer creation event
    await publishToChannel('customers', {
      type: 'CUSTOMERS_BULK_CREATED',
      customerIds: customers.map(c => c._id)
    });
    
    res.status(201).json(customers);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update customer's total spent
router.post('/:id/transactions', isAuthenticated, async (req, res) => {
  try {
    const { amount } = req.body;
    
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ message: 'Valid amount is required' });
    }

    const customer = await Customer.findById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Update total spent
    customer.totalSpent = (customer.totalSpent || 0) + amount;
    await customer.save();

    // Publish customer update event
    await publishToChannel('customers', {
      type: 'CUSTOMER_UPDATED',
      customerId: customer._id
    });

    res.json({
      message: 'Transaction recorded successfully',
      customer: {
        _id: customer._id,
        name: customer.name,
        totalSpent: customer.totalSpent
      }
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router; 