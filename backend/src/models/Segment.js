const mongoose = require('mongoose');

const segmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  rules: [{
    field: {
      type: String,
      required: true
    },
    operator: {
      type: String,
      enum: ['equals', 'not_equals', 'contains', 'not_contains', 'greater_than', 'less_than', 'between'],
      required: true
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    }
  }],
  ruleLogic: {
    type: String,
    enum: ['AND', 'OR'],
    default: 'AND'
  },
  customerCount: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
segmentSchema.index({ createdBy: 1 });
segmentSchema.index({ name: 1 });

// Method to evaluate if a customer matches the segment rules
segmentSchema.methods.evaluateCustomer = function(customer) {
  return this.rules.every(rule => {
    const value = customer[rule.field];
    switch (rule.operator) {
      case 'equals':
        return value === rule.value;
      case 'not_equals':
        return value !== rule.value;
      case 'contains':
        return value && value.includes(rule.value);
      case 'not_contains':
        return value && !value.includes(rule.value);
      case 'greater_than':
        return value > rule.value;
      case 'less_than':
        return value < rule.value;
      case 'between':
        return value >= rule.value[0] && value <= rule.value[1];
      default:
        return false;
    }
  });
};

module.exports = mongoose.model('Segment', segmentSchema); 