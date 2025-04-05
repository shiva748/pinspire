const mongoose = require("mongoose");
const { Schema } = mongoose;

// Schema for individual messages
const messageSchema = new Schema({
  sender: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  read: {
    type: Boolean,
    default: false
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Schema for conversations between two users
const conversationSchema = new Schema({
  participants: [{
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  }],
  messages: [messageSchema],
  lastMessageAt: {
    type: Date,
    default: Date.now
  },
  // This tracks who has unread messages in the conversation
  unreadBy: [{
    type: Schema.Types.ObjectId,
    ref: "User"
  }]
}, { timestamps: true });

// Create indexes for faster querying
conversationSchema.index({ participants: 1 });
conversationSchema.index({ lastMessageAt: -1 });

module.exports = {
  Conversation: mongoose.model("Conversation", conversationSchema),
  Message: mongoose.model("Message", messageSchema)
}; 