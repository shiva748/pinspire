const express = require("express");
const Router = express.Router();
const verify = require("../middleware/authenticate");
const {
  getConversations,
  getMessages,
  sendMessage,
  markAsRead,
  getUnreadCount
} = require("../controller/chatController");

// All chat routes require authentication
Router.use(verify);

// === === === get all conversations === === === //
Router.get("/conversations", getConversations);

// === === === get messages for a conversation === === === //
Router.get("/conversations/:conversationId", getMessages);

// === === === send a message === === === //
Router.post("/messages", sendMessage);

// === === === mark conversation as read === === === //
Router.put("/conversations/:conversationId/read", markAsRead);

// === === === get unread messages count === === === //
Router.get("/unread", getUnreadCount);

// === === === final exports === === === //
module.exports = Router; 