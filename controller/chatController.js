const { Conversation, Message } = require("../database/Schema/chat");
const User = require("../database/Schema/user");
const mongoose = require("mongoose");
const { handleError } = require("../snippets/error");

// Get all conversations for current user
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find all conversations where the current user is a participant
    const conversations = await Conversation.find({
      participants: userId
    })
    .populate({
      path: 'participants',
      select: 'username profilePicture'
    })
    .populate({
      path: 'messages',
      options: { 
        sort: { timestamp: -1 },
        limit: 1 
      }
    })
    .sort({ lastMessageAt: -1 });

    // Format the conversations for the frontend
    const formattedConversations = conversations.map(conv => {
      // Get the other participant (not the current user)
      const otherParticipant = conv.participants.find(p => 
        p._id.toString() !== userId.toString()
      );

      return {
        _id: conv._id,
        otherUser: otherParticipant,
        lastMessage: conv.messages.length > 0 ? conv.messages[0] : null,
        hasUnread: conv.unreadBy.some(id => id.toString() === userId.toString()),
        updatedAt: conv.lastMessageAt || conv.updatedAt
      };
    });

    return res.status(200).json({ 
      result: true, 
      conversations: formattedConversations 
    });
  } catch (error) {
    console.error("Error getting conversations:", error);
    return res.status(500).json({ 
      result: false, 
      message: error.message || "Failed to get conversations" 
    });
  }
};

// Get messages for a specific conversation
exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ 
        result: false, 
        message: "Invalid conversation ID" 
      });
    }

    // Find the conversation and check if user is a participant
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId
    }).populate({
      path: 'participants',
      select: 'username profilePicture'
    });

    if (!conversation) {
      return res.status(404).json({ 
        result: false, 
        message: "Conversation not found" 
      });
    }

    // Mark messages as read by the current user
    if (conversation.unreadBy.includes(userId)) {
      conversation.unreadBy = conversation.unreadBy.filter(
        id => id.toString() !== userId.toString()
      );
      await conversation.save();
    }

    // Get other participant's info
    const otherParticipant = conversation.participants.find(
      p => p._id.toString() !== userId.toString()
    );

    return res.status(200).json({
      result: true,
      conversation: {
        _id: conversation._id,
        otherUser: otherParticipant,
        messages: conversation.messages,
        updatedAt: conversation.lastMessageAt || conversation.updatedAt
      }
    });
  } catch (error) {
    console.error("Error getting messages:", error);
    return res.status(500).json({ 
      result: false, 
      message: error.message || "Failed to get messages" 
    });
  }
};

// Send a message to another user
exports.sendMessage = async (req, res) => {
  try {
    const { recipientId, content, conversationId } = req.body;
    const senderId = req.user._id;

    if (!content || content.trim() === '') {
      return res.status(400).json({ 
        result: false, 
        message: "Message content cannot be empty" 
      });
    }

    let conversation;

    // If a conversation ID is provided, use that
    if (conversationId && mongoose.Types.ObjectId.isValid(conversationId)) {
      conversation = await Conversation.findOne({
        _id: conversationId,
        participants: senderId
      });

      if (!conversation) {
        return res.status(404).json({ 
          result: false, 
          message: "Conversation not found" 
        });
      }
    } 
    // Otherwise, find or create a conversation with the recipient
    else if (recipientId && mongoose.Types.ObjectId.isValid(recipientId)) {
      if (recipientId === senderId.toString()) {
        return res.status(400).json({ 
          result: false, 
          message: "Cannot message yourself" 
        });
      }

      // Verify recipient exists
      const recipient = await User.findById(recipientId);
      if (!recipient) {
        return res.status(404).json({ 
          result: false, 
          message: "Recipient not found" 
        });
      }

      // Look for an existing conversation
      conversation = await Conversation.findOne({
        participants: { $all: [senderId, recipientId] }
      });

      // Create a new conversation if none exists
      if (!conversation) {
        conversation = new Conversation({
          participants: [senderId, recipientId],
          messages: [],
          unreadBy: []
        });
      }
    } else {
      return res.status(400).json({ 
        result: false, 
        message: "Either conversationId or recipientId is required" 
      });
    }

    // Add the message
    const newMessage = {
      sender: senderId,
      content,
      timestamp: new Date(),
      read: false
    };

    conversation.messages.push(newMessage);
    conversation.lastMessageAt = new Date();

    // Add recipient to unreadBy if not already there
    const recipientId2 = conversation.participants.find(
      p => p.toString() !== senderId.toString()
    );

    if (!conversation.unreadBy.includes(recipientId2)) {
      conversation.unreadBy.push(recipientId2);
    }

    await conversation.save();

    // Return the updated conversation
    const updatedConversation = await Conversation.findById(conversation._id)
      .populate({
        path: 'participants',
        select: 'username profilePicture'
      });

    // Format response
    const otherParticipant = updatedConversation.participants.find(
      p => p._id.toString() !== senderId.toString()
    );

    return res.status(201).json({
      result: true,
      message: "Message sent successfully",
      conversation: {
        _id: updatedConversation._id,
        otherUser: otherParticipant,
        lastMessage: newMessage,
        updatedAt: updatedConversation.lastMessageAt
      }
    });
  } catch (error) {
    console.error("Error sending message:", error);
    return res.status(500).json({ 
      result: false, 
      message: error.message || "Failed to send message" 
    });
  }
};

// Mark all messages in a conversation as read
exports.markAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ 
        result: false, 
        message: "Invalid conversation ID" 
      });
    }

    // Find the conversation and check if user is a participant
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId
    });

    if (!conversation) {
      return res.status(404).json({ 
        result: false, 
        message: "Conversation not found" 
      });
    }

    // Remove the user from unreadBy
    if (conversation.unreadBy.includes(userId)) {
      conversation.unreadBy = conversation.unreadBy.filter(
        id => id.toString() !== userId.toString()
      );
      await conversation.save();
    }

    return res.status(200).json({
      result: true,
      message: "Messages marked as read"
    });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    return res.status(500).json({ 
      result: false, 
      message: error.message || "Failed to mark messages as read" 
    });
  }
};

// Get unread messages count across all conversations
exports.getUnreadCount = async (req, res) => {
  try {
    const user = req.user;
    
    // Find all conversations where the user is a participant
    const conversations = await Conversation.find({
      participants: user._id
    });
    
    if (!conversations || conversations.length === 0) {
      return res.status(200).json({ result: true, unreadCount: 0 });
    }
    
    // Count unread messages across all conversations
    let unreadCount = 0;
    
    // Method 1: Count by unreadBy array membership
    const unreadConversations = conversations.filter(conv => 
      conv.unreadBy && conv.unreadBy.some(id => id.toString() === user._id.toString())
    );
    
    return res.status(200).json({
      result: true,
      unreadCount: unreadConversations.length
    });
  } catch (error) {
    console.error("Error getting unread count:", error);
    return res.status(500).json({ 
      result: false, 
      message: error.message || "Failed to get unread count" 
    });
  }
}; 