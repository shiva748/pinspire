// https://ui.shadcn.com/

// === === === imports === === === //\
require("dotenv").config();
const express = require("express");
const PORT = process.env.PORT || 3001;
const basic = require("./Routes/basic");
const auth = require("./Routes/authentication");
const image = require("./Routes/image");
const admin = require("./Routes/admin");
const chat = require("./Routes/chat");
const cookieParser = require("cookie-parser");
const path = require("path");
const visitorTracker = require("./middleware/visitorTracker");
const http = require("http");
const socketIo = require("socket.io");
const { Conversation } = require("./database/Schema/chat");
const User = require("./database/Schema/user");
const cookie = require("cookie");
const jwt = require("jsonwebtoken");

// === === === initialization === === === //

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? false : ["http://localhost:5173"],
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 30000,
  pingInterval: 25000
});

// Track online users and their socket IDs
const onlineUsers = new Map(); // userId -> socketId

require("./database/connection");

// === === === injecting middleware === === === //

app.use(express.json());

app.use(cookieParser());

// === === === visitor tracking === === === //
app.use(visitorTracker);

// === === === serving files === === === //

// Serve all static files from public directory
app.use("/api/images", express.static(path.join(__dirname, "public")));

// === === === use of routes === === === //

app.use("/api", basic);

app.use("/api/auth", auth);

app.use("/api/image", image);

app.use("/api/admin", admin);

app.use("/api/chat", chat);

// Serve React app in production
if (process.env.NODE_ENV === 'production') {
  // Serve static files from the React app build directory
  app.use(express.static(path.join(__dirname, 'front/build')));
  
  // For any request that doesn't match an API route, send the React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'front/build', 'index.html'));
  });
} else {
  // In development, add a catch-all route for client-side routing
  app.use('*', (req, res) => {
    res.status(200).sendFile(path.join(__dirname, 'front/public', 'index.html'));
  });
}

// Socket.io authentication and connection handling
io.use(async (socket, next) => {
  try {
    // Check if socket handshake headers exist
    if (!socket.handshake.headers) {
      console.error("No handshake headers");
      return next(new Error('Authentication error: Missing headers'));
    }
    
    const cookies = cookie.parse(socket.handshake.headers.cookie || '');
    console.log("Received cookies:", Object.keys(cookies));
    
    const token = cookies.auth_tkn;
    
    if (!token) {
      console.error("No auth token found in cookies");
      return next(new Error('Authentication error: Missing token'));
    }

    console.log("Token found, attempting verification");
    
    // Verify token
    let decoded;
    try {
      // Log the first few characters of the token for debugging
      console.log(`Verifying token (starts with): ${token.substring(0, 15)}...`);
      
      // IMPORTANT: Using process.env.KEY which matches the token generation in User.genrateauth
      console.log(`Using KEY env variable: ${process.env.KEY ? 'exists' : 'undefined'}`);
      
      // Use the exact same KEY as in the User.genrateauth method
      const JWT_KEY = process.env.KEY;
      if (!JWT_KEY) {
        console.error("ERROR: process.env.KEY is not defined");
        return next(new Error('Server configuration error: JWT key not defined'));
      }
      
      decoded = jwt.verify(token, JWT_KEY);
      
      console.log("Token verified successfully for user ID:", decoded._id);
    } catch (jwtError) {
      console.error("JWT verification error:", jwtError.name, jwtError.message);
      return next(new Error(`Authentication error: Invalid token (${jwtError.message})`));
    }
    
    const user = await User.findOne({ _id: decoded._id });
    
    if (!user) {
      console.error("User not found for ID:", decoded._id);
      return next(new Error('Authentication error: User not found'));
    }
    
    // Attach user to socket
    socket.user = {
      _id: user._id,
      username: user.username
    };
    
    console.log(`Socket authentication successful for: ${user.username}`);
    next();
  } catch (error) {
    console.error("Socket auth error:", error);
    next(new Error(`Authentication error: ${error.message || 'Unknown error'}`));
  }
});

// Handle socket connections
io.on('connection', (socket) => {
  try {
    console.log(`User connected: ${socket.user.username} (${socket.user._id})`);
    
    // Join personal room for direct messages
    socket.join(socket.user._id.toString());
    
    // Add user to online users map
    const userId = socket.user._id.toString();
    onlineUsers.set(userId, socket.id);
    
    // Broadcast user's online status to users who might be chatting with them
    broadcastUserStatus(userId, true);
    
    // Handle new message
    socket.on('sendMessage', async (data) => {
      try {
        if (!data || !data.conversationId || !data.content) {
          console.error('Invalid sendMessage data:', data);
          socket.emit('error', { message: 'Invalid message data' });
          return;
        }
        
        const { conversationId, content } = data;
        
        // Find the conversation
        const conversation = await Conversation.findOne({
          _id: conversationId,
          participants: socket.user._id
        });
        
        if (!conversation) {
          console.error(`Conversation not found: ${conversationId}`);
          socket.emit('error', { message: 'Conversation not found' });
          return;
        }
        
        // Get recipient (the other participant)
        const recipientId = conversation.participants.find(
          p => p.toString() !== socket.user._id.toString()
        );
        
        if (!recipientId) {
          console.error(`Recipient not found in conversation: ${conversationId}`);
          socket.emit('error', { message: 'Recipient not found' });
          return;
        }
        
        // Add message to conversation
        const newMessage = {
          sender: socket.user._id,
          content,
          timestamp: new Date(),
          read: false
        };
        
        conversation.messages.push(newMessage);
        conversation.lastMessageAt = new Date();
        
        // Mark as unread for recipient
        if (!conversation.unreadBy.includes(recipientId)) {
          conversation.unreadBy.push(recipientId);
        }
        
        await conversation.save();
        
        // Get the saved message with the assigned _id
        const savedMessage = conversation.messages[conversation.messages.length - 1];
        
        // Emit message to recipient
        io.to(recipientId.toString()).emit('newMessage', {
          message: savedMessage,
          conversationId
        });
        
        // Emit back to sender with the saved message (with _id)
        socket.emit('messageSent', {
          message: savedMessage,
          conversationId
        });
        
        console.log(`Message sent from ${socket.user.username} to conversation ${conversationId}`);
      } catch (error) {
        console.error('Error sending message via socket:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });
    
    // Handle read receipts
    socket.on('markAsRead', async ({ conversationId }) => {
      try {
        if (!conversationId) {
          console.error('No conversationId provided for markAsRead');
          socket.emit('error', { message: 'Conversation ID required' });
          return;
        }
        
        const conversation = await Conversation.findOne({
          _id: conversationId,
          participants: socket.user._id
        });
        
        if (!conversation) {
          console.error(`Conversation not found for markAsRead: ${conversationId}`);
          socket.emit('error', { message: 'Conversation not found' });
          return;
        }
        
        // Remove user from unreadBy
        if (conversation.unreadBy.includes(socket.user._id)) {
          conversation.unreadBy = conversation.unreadBy.filter(
            id => id.toString() !== socket.user._id.toString()
          );
          await conversation.save();
          
          // Notify other participant that messages were read
          const otherParticipantId = conversation.participants.find(
            p => p.toString() !== socket.user._id.toString()
          );
          
          if (otherParticipantId) {
            io.to(otherParticipantId.toString()).emit('conversationRead', {
              conversationId,
              readBy: socket.user._id
            });
            
            console.log(`Conversation ${conversationId} marked as read by ${socket.user.username}`);
          }
        }
      } catch (error) {
        console.error('Error marking conversation as read via socket:', error);
        socket.emit('error', { message: 'Failed to mark conversation as read' });
      }
    });
    
    // Handle user requesting online status of specific users
    socket.on('checkOnlineStatus', async (userIds) => {
      try {
        if (!Array.isArray(userIds)) {
          userIds = [userIds]; // Convert to array if single ID
        }
        
        const onlineStatuses = {};
        userIds.forEach(id => {
          onlineStatuses[id] = onlineUsers.has(id.toString());
        });
        
        socket.emit('onlineStatusResponse', onlineStatuses);
      } catch (error) {
        console.error('Error checking online status:', error);
        socket.emit('error', { message: 'Failed to check online status' });
      }
    });
    
    // Handle socket errors
    socket.on('error', (error) => {
      console.error(`Socket error for user ${socket.user.username}:`, error);
    });
    
    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`User disconnected: ${socket.user.username}, reason: ${reason}`);
      
      // Remove user from online users map
      onlineUsers.delete(userId);
      
      // Broadcast user's offline status
      broadcastUserStatus(userId, false);
    });
  } catch (error) {
    console.error('Error in socket connection handler:', error);
  }
});

// Function to broadcast user's online/offline status to relevant users
async function broadcastUserStatus(userId, isOnline) {
  try {
    // Find all conversations this user is part of
    const conversations = await Conversation.find({
      participants: userId
    });
    
    // Get all other participants in these conversations
    const otherParticipants = new Set();
    conversations.forEach(conversation => {
      conversation.participants.forEach(participantId => {
        const participantIdStr = participantId.toString();
        if (participantIdStr !== userId) {
          otherParticipants.add(participantIdStr);
        }
      });
    });
    
    // Broadcast status update to each participant
    otherParticipants.forEach(participantId => {
      if (onlineUsers.has(participantId)) {
        io.to(participantId).emit('userStatusUpdate', {
          userId: userId,
          isOnline: isOnline
        });
      }
    });
    
    console.log(`Broadcasted ${isOnline ? 'online' : 'offline'} status for user ${userId} to ${otherParticipants.size} users`);
  } catch (error) {
    console.error('Error broadcasting user status:', error);
  }
}

// === server final listen === === //

server.listen(PORT, (err) => {
  console.log(err ? `some error occured` : `listining to port ${PORT}`);
});
