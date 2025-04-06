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
const busboy = require("busboy");
const fs = require("fs");

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

// Setup directory for file uploads
const chatFilesDir = path.join(__dirname, 'public', 'chat_files');

// Create directory if it doesn't exist
if (!fs.existsSync(chatFilesDir)) {
  fs.mkdirSync(chatFilesDir, { recursive: true });
}

// Serve chat files directly
app.use("/api/chat/files", express.static(path.join(__dirname, "public", "chat_files")));

// Allowed file types
const allowedMimeTypes = [
  'image/jpeg', 
  'image/png', 
  'image/gif', 
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation'
];

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

// Handle file uploads for chat using busboy
app.post('/api/chat/upload', (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.cookies.auth_tkn) {
      return res.status(401).json({
        result: false,
        message: 'Not authenticated'
      });
    }
    
    // Verify token
    let userId;
    try {
      const decoded = jwt.verify(req.cookies.auth_tkn, process.env.KEY);
      userId = decoded._id;
    } catch (jwtError) {
      return res.status(401).json({
        result: false,
        message: 'Invalid authentication token'
      });
    }
    
    let conversationId;
    let fileUrl;
    let fileName;
    let fileType;
    let fileSize;
    let fileSavePath;
    let fileWriteStream;
    
    const bb = busboy({ 
      headers: req.headers,
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
        files: 1 // Only allow 1 file
      }
    });
    
    // Handle non-file fields (like conversationId)
    bb.on('field', (name, val) => {
      if (name === 'conversationId') {
        conversationId = val;
      }
    });
    
    // Handle file upload
    bb.on('file', async (name, file, info) => {
      const { filename, encoding, mimeType } = info;
      
      // Check if file type is allowed
      if (!allowedMimeTypes.includes(mimeType)) {
        return res.status(400).json({
          result: false,
          message: 'File type not allowed'
        });
      }
      
      // Create unique filename
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const fileExt = path.extname(filename);
      const uniqueFilename = `${uniqueSuffix}${fileExt}`;
      
      // Save file info for later use
      fileName = filename;
      fileType = mimeType;
      // Store the actual, accessible URL for the file - using the dedicated file serving route
      fileUrl = `/api/chat/files/${uniqueFilename}`;
      fileSavePath = path.join(chatFilesDir, uniqueFilename);
      
      // Create write stream for file
      fileWriteStream = fs.createWriteStream(fileSavePath);
      
      // Track file size
      let size = 0;
      
      // Pipe file data to the file system
      file.on('data', (data) => {
        size += data.length;
        
        // Check if exceeding size limit during upload
        if (size > 5 * 1024 * 1024) {
          file.resume(); // Stop reading
          fileWriteStream.end();
          
          // Clean up the partial file
          fs.unlink(fileSavePath, () => {});
          
          res.status(400).json({
            result: false,
            message: 'File too large, maximum 5MB allowed'
          });
          return;
        }
        
        fileWriteStream.write(data);
      });
      
      file.on('end', () => {
        fileWriteStream.end();
        fileSize = size;
      });
    });
    
    // Handle upload completion
    bb.on('close', async () => {
      try {
        // Validate we have required data
        if (!conversationId) {
          // Clean up file if it was uploaded
          if (fileSavePath && fs.existsSync(fileSavePath)) {
            fs.unlink(fileSavePath, () => {});
          }
          
          return res.status(400).json({
            result: false,
            message: 'Missing conversation ID'
          });
        }
        
        // Check if user is part of the conversation
        const conversation = await Conversation.findOne({
          _id: conversationId,
          participants: userId
        });
        
        if (!conversation) {
          // Clean up the file
          if (fileSavePath && fs.existsSync(fileSavePath)) {
            fs.unlink(fileSavePath, () => {});
          }
          
          return res.status(403).json({
            result: false,
            message: 'Not authorized to upload to this conversation'
          });
        }
        
        // Extract the unique filename from the fileUrl or the file path
        const uniqueFileName = fileUrl.split('/').pop() || path.basename(fileSavePath);
        
        // Return success with file URL and metadata
        res.json({
          result: true,
          fileUrl: fileUrl,
          fileName: fileName,
          uniqueFileName: uniqueFileName,  // Include the unique filename in the response
          fileType: fileType,
          fileSize: fileSize
        });
      } catch (error) {
        console.error('Error in busboy close handler:', error);
        
        // Clean up the file if there was an error
        if (fileSavePath && fs.existsSync(fileSavePath)) {
          fs.unlink(fileSavePath, () => {});
        }
        
        res.status(500).json({
          result: false,
          message: 'Server error processing upload'
        });
      }
    });
    
    // Handle busboy errors
    bb.on('error', (err) => {
      console.error('Busboy error:', err);
      
      // Clean up the file if there was an error
      if (fileSavePath && fs.existsSync(fileSavePath)) {
        fs.unlink(fileSavePath, () => {});
      }
      
      res.status(500).json({
        result: false,
        message: 'Error processing upload'
      });
    });
    
    // Pipe request to busboy
    req.pipe(bb);
    
  } catch (error) {
    console.error('Error in file upload route:', error);
    res.status(500).json({
      result: false,
      message: 'Server error'
    });
  }
});

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
        console.log(data);
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
    
    // Handle file message
    socket.on('sendFileMessage', async (data) => {
      try {
        if (!data || !data.conversationId || !data.fileUrl || !data.fileName) {
          console.error('Invalid sendFileMessage data:', data);
          socket.emit('error', { message: 'Invalid file message data' });
          return;
        }
        console.log(data);
        const { conversationId, fileUrl, fileName, fileType, fileSize } = data;
        
        // Extract the unique filename from the fileUrl
        const uniqueFileName = fileUrl.split('/').pop();
        
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
        
        // Add file message to conversation
        const newMessage = {
          sender: socket.user._id,
          content: `[File] ${fileName}`,
          fileUrl,
          fileName,          // Original filename for display
          uniqueFileName,    // Unique filename for retrieval
          fileType,
          fileSize,
          timestamp: new Date(),
          read: false,
          isFile: true
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
        
        console.log(`File message sent from ${socket.user.username} to conversation ${conversationId}`);
      } catch (error) {
        console.error('Error sending file message via socket:', error);
        socket.emit('error', { message: 'Failed to send file message' });
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
