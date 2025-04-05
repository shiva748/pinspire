const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema({
  ip: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  // Optional user ID if visitor is logged in
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  }
}, { timestamps: true });

// Add index for better query performance
visitorSchema.index({ timestamp: -1 });
visitorSchema.index({ ip: 1, timestamp: -1 });
visitorSchema.index({ userId: 1 });

module.exports = mongoose.model('Visitor', visitorSchema); 