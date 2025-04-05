import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../context/SocketContext';

const Conversation = () => {
  const { conversationId } = useParams();
  const user = useSelector(state => state.user);
  const navigate = useNavigate();
  const { socket, connected, isUserOnline, checkUserStatus } = useSocket();
  
  const [conversation, setConversation] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const [socketStatus, setSocketStatus] = useState('');
  
  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);
  
  // Fetch conversation and messages
  useEffect(() => {
    const fetchConversation = async () => {
      if (!user.logged) {
        navigate('/login', { state: { from: `/messages/${conversationId}` } });
        return;
      }
      
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(`/api/chat/conversations/${conversationId}`, {
          method: 'GET',
          credentials: 'include'
        });
        
        if (!response.ok) {
          if (response.status === 404) {
            navigate('/messages');
            return;
          }
          throw new Error('Failed to fetch conversation');
        }
        
        const data = await response.json();
        
        if (data.result) {
          setConversation(data.conversation);
          setOtherUser(data.conversation.otherUser);
          setMessages(data.conversation.messages);
        } else {
          setError(data.message || 'Something went wrong');
        }
      } catch (error) {
        console.error('Error fetching conversation:', error);
        setError('Failed to load conversation');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (conversationId) {
      fetchConversation();
    }
  }, [conversationId, user.logged, navigate]);
  
  // Check user's online status
  useEffect(() => {
    if (otherUser && socket && connected) {
      // Request online status for the other user
      checkUserStatus(otherUser._id);
    }
  }, [otherUser, socket, connected, checkUserStatus]);
  
  // Socket.IO event listeners
  useEffect(() => {
    if (!socket) {
      console.log('[Conversation] No socket instance available');
      return;
    }
    
    // Set up socket event handlers
    const handleNewMessage = (data) => {
      if (data.conversationId === conversationId) {
        console.log('[Conversation] Received new message:', data.message.content);
        setMessages(prev => [...prev, data.message]);
        
        // Mark as read immediately
        if (socket.connected) {
          socket.emit('markAsRead', { conversationId });
        }
      }
    };
    
    const handleMessageSent = (data) => {
      if (data.conversationId === conversationId) {
        console.log('[Conversation] Message sent confirmation received');
        
        // Update the placeholder message with the confirmed one
        setMessages(prev => {
          // Find any temporary messages that might match this confirmed message
          const tempMessageIds = prev
            .filter(msg => msg.pending && msg._id && msg._id.startsWith('temp-'))
            .map(msg => msg._id);
          
          // Remove all temporary messages and add the confirmed one
          // This handles cases where there might be multiple pending messages
          const messagesWithoutTemp = prev.filter(msg => !tempMessageIds.includes(msg._id));
          return [...messagesWithoutTemp, data.message];
        });
      }
    };
    
    const handleConversationRead = (data) => {
      if (data.conversationId === conversationId) {
        console.log(`[Conversation] Conversation was read by: ${data.readBy}`);
        // Could update UI to show read receipts if desired
      }
    };
    
    // Connection status updates
    if (connected) {
      setSocketStatus('Connected');
    } else {
      setSocketStatus('Disconnected');
    }
    
    // Register event listeners
    socket.on('newMessage', handleNewMessage);
    socket.on('messageSent', handleMessageSent);
    socket.on('conversationRead', handleConversationRead);
    
    // Clean up event listeners
    return () => {
      if (socket) {
        socket.off('newMessage', handleNewMessage);
        socket.off('messageSent', handleMessageSent);
        socket.off('conversationRead', handleConversationRead);
      }
    };
  }, [socket, connected, conversationId]);
  
  // Mark conversation as read
  useEffect(() => {
    const markAsRead = async () => {
      if (!conversationId || !user.logged) return;
      
      try {
        // REST API call to mark as read (fallback)
        await fetch(`/api/chat/conversations/${conversationId}/read`, {
          method: 'PUT',
          credentials: 'include'
        });
        
        // Also use socket for real-time marking as read
        if (socket && connected) {
          socket.emit('markAsRead', { conversationId });
        }
      } catch (error) {
        console.error('Error marking conversation as read:', error);
      }
    };
    
    if (conversationId && !isLoading && conversation) {
      markAsRead();
    }
  }, [conversationId, user.logged, isLoading, conversation, socket, connected]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Format time for message display
  const formatMessageTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Format date for message groups
  const formatMessageDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString([], { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
  };
  
  // Group messages by date
  const getMessageGroups = () => {
    const groups = [];
    let currentDate = null;
    let currentGroup = [];
    
    messages.forEach(message => {
      const messageDate = new Date(message.timestamp).toDateString();
      
      if (messageDate !== currentDate) {
        if (currentGroup.length > 0) {
          groups.push({
            date: currentDate,
            messages: currentGroup
          });
        }
        currentDate = messageDate;
        currentGroup = [message];
      } else {
        currentGroup.push(message);
      }
    });
    
    if (currentGroup.length > 0) {
      groups.push({
        date: currentDate,
        messages: currentGroup
      });
    }
    
    return groups;
  };
  
  // Send a message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;
    
    try {
      setIsSending(true);
      
      // Store message content before clearing the input
      const messageContent = newMessage;
      
      // Generate a unique ID for the temporary message
      const tempId = `temp-${Date.now()}`;
      
      // Create a temporary message for immediate display
      const tempMessage = {
        _id: tempId,
        sender: user.data._id,
        content: messageContent,
        timestamp: new Date().toISOString(),
        read: false,
        pending: true
      };
      
      // Optimistically add message to UI
      setMessages(prev => [...prev, tempMessage]);
      
      // Clear the input field and focus it
      setNewMessage('');
      messageInputRef.current?.focus();
      
      // Try to send via Socket.IO first for real-time delivery
      if (socket && connected) {
        socket.emit('sendMessage', {
          conversationId,
          content: messageContent
        });
      } else {
        // Fallback to REST API
        const response = await fetch('/api/chat/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            conversationId,
            content: messageContent
          }),
          credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.result) {
          // Replace temporary message with the real one
          setMessages(prev => {
            const withoutTemp = prev.filter(msg => msg._id !== tempId);
            return [...withoutTemp, data.message];
          });
        } else {
          setError(data.message || 'Failed to send message');
          // Remove the temporary message
          setMessages(prev => prev.filter(msg => msg._id !== tempId));
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
      // Remove any temporary messages that might have been added
      setMessages(prev => prev.filter(msg => !msg.pending));
    } finally {
      setIsSending(false);
    }
  };
  
  // Get other user's online status
  const isOtherUserOnline = otherUser ? isUserOnline(otherUser._id) : false;
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }
  
  if (!conversation && !isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-4">Conversation not found</h2>
          <Link to="/messages" className="btn btn-primary">Back to Messages</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-0 md:px-2 py-0 max-w-4xl h-[calc(100vh-4rem)] flex flex-col bg-base-100/80 shadow-lg rounded-md overflow-hidden">
      {/* Conversation header - enhanced with better styling */}
      <motion.div 
        className="flex items-center px-4 py-4 bg-base-200 sticky top-0 z-10 border-b border-base-300 shadow-sm"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <button 
          onClick={() => navigate('/messages')} 
          className="mr-3 md:mr-4 btn btn-circle btn-ghost btn-sm hover:bg-base-300"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        {otherUser && (
          <Link to={`/user/${otherUser._id}`} className="flex items-center flex-1">
            <div className="w-12 h-12 rounded-full bg-primary/10 overflow-hidden flex items-center justify-center shadow-md hover:shadow-lg transition-shadow">
              {otherUser.profilePicture ? (
                <img 
                  src={`/api/images/${otherUser.profilePicture}`} 
                  alt={otherUser.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xl font-bold text-primary">
                  {otherUser.username.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="ml-3 flex-1">
              <h3 className="font-semibold text-lg">{otherUser.username}</h3>
              <div className="flex items-center">
                {isOtherUserOnline ? (
                  <div className="text-xs text-success flex items-center">
                    <span className="w-2 h-2 bg-success rounded-full mr-1 animate-pulse"></span>
                    Online
                  </div>
                ) : (
                  <div className="text-xs text-base-content/60 flex items-center">
                    <span className="w-2 h-2 bg-gray-400 rounded-full mr-1"></span>
                    Offline
                  </div>
                )}
              </div>
            </div>
          </Link>
        )}
      </motion.div>
      
      {/* Error display - improved with animation */}
      <AnimatePresence>
        {error && (
          <motion.div 
            className="p-4"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="alert alert-error shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
              <button className="btn btn-xs btn-ghost" onClick={() => setError(null)}>Dismiss</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Messages area - improved bubble design and spacing */}
      <motion.div 
        className="flex-1 overflow-y-auto py-6 px-4 bg-base-100/50 bg-[url('/chat-bg.png')] bg-opacity-5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-6xl mb-6 opacity-80">👋</div>
            <h3 className="text-xl font-medium mb-3">Start a conversation</h3>
            <p className="text-base-content/60 max-w-md">
              Say hello to <span className="font-medium text-primary">{otherUser?.username}</span> and start chatting!
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {getMessageGroups().map((group, groupIndex) => (
              <div key={groupIndex} className="space-y-3">
                <div className="text-center my-5">
                  <span className="px-4 py-1.5 bg-base-200 rounded-full text-xs text-base-content/70 shadow-sm font-medium">
                    {formatMessageDate(group.messages[0].timestamp)}
                  </span>
                </div>
                
                {group.messages.map((message, messageIndex) => {
                  const isCurrentUser = message.sender.toString() === user.data._id;
                  const showAvatar = !isCurrentUser && 
                    (messageIndex === 0 || 
                     group.messages[messageIndex - 1].sender.toString() !== message.sender.toString());
                  
                  return (
                    <div 
                      key={message._id || messageIndex} 
                      className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} items-end gap-2`}
                    >
                      {/* Avatar for other user's messages */}
                      {showAvatar ? (
                        <div className="w-8 h-8 rounded-full bg-primary/10 overflow-hidden flex items-center justify-center flex-shrink-0">
                          {otherUser.profilePicture ? (
                            <img 
                              src={`/api/images/${otherUser.profilePicture}`} 
                              alt={otherUser.username}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-sm font-bold text-primary">
                              {otherUser.username.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                      ) : !isCurrentUser && (
                        <div className="w-8 flex-shrink-0"></div>
                      )}
                      
                      {/* Message bubble */}
                      <motion.div 
                        className={`max-w-[75%] px-4 py-2.5 rounded-2xl shadow-sm ${
                          isCurrentUser 
                            ? message.pending 
                              ? 'bg-primary/70 text-primary-content rounded-br-md' 
                              : 'bg-primary text-primary-content rounded-br-md' 
                            : 'bg-base-200 text-base-content rounded-bl-md'
                        }`}
                        initial={{ opacity: 0, scale: 0.8, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <p className="break-words text-sm md:text-base">{message.content}</p>
                        <div className="text-xs opacity-70 text-right mt-1 flex items-center justify-end gap-1">
                          {formatMessageTime(message.timestamp)}
                          {message.pending ? (
                            <span className="ml-1">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </span>
                          ) : isCurrentUser && (
                            <span className="ml-1">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </span>
                          )}
                        </div>
                      </motion.div>
                    </div>
                  );
                })}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </motion.div>
      
      {/* Message input - enhanced with better styling */}
      <motion.div 
        className="p-3 bg-base-200 border-t border-base-300 shadow-inner"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <input
            type="text"
            ref={messageInputRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="input input-bordered focus:input-primary flex-1 bg-base-100 shadow-sm"
            disabled={isSending}
          />
          <button 
            type="submit" 
            className="btn btn-primary shadow-md" 
            disabled={!newMessage.trim() || isSending}
          >
            {isSending ? (
              <span className="loading loading-spinner loading-xs"></span>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default Conversation; 