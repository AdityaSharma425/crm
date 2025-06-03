const mongoose = require('mongoose');

const communicationLogSchema = new mongoose.Schema({
  campaign: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  message: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'failed'],
    default: 'pending'
  },
  error: {
    type: String
  },
  sentAt: {
    type: Date
  },
  deliveredAt: {
    type: Date
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
communicationLogSchema.index({ campaign: 1 });
communicationLogSchema.index({ customer: 1 });
communicationLogSchema.index({ status: 1 });
communicationLogSchema.index({ createdAt: 1 });

module.exports = mongoose.model('CommunicationLog', communicationLogSchema); 