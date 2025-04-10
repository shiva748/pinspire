import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../context/SocketContext';

const Messages = () => {
  const user = useSelector(state => state.user);
  const navigate = useNavigate();
  const { socket, connected, isUserOnline, checkUserStatus } = useSocket();
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Fetch conversations on component mount
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch('/api/chat/conversations', {
          method: 'GET',
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch conversations');
        }
        
        const data = await response.json();
        
        if (data.result) {
          setConversations(data.conversations);
        } else {
          setError(data.message || 'Something went wrong');
        }
      } catch (error) {
        console.error('Error fetching conversations:', error);
        setError('Failed to load conversations');
      } finally {
        setIsLoading(false);
      }
    };
    
    // Only fetch if user is logged in
    if (user.logged) {
      fetchConversations();
    } else {
      // Redirect to login if not logged in
      navigate('/login', { state: { from: '/messages' } });
    }
  }, [user.logged, navigate]);
  
  // Request online status for all conversation participants
  useEffect(() => {
    if (socket && connected && conversations.length > 0) {
      // Collect all unique user IDs from conversations
      const userIds = conversations.map(conv => conv.otherUser._id);
      
      // Request their online status
      checkUserStatus(userIds);
    }
  }, [socket, connected, conversations, checkUserStatus]);
  
  // Socket.IO event listeners
  useEffect(() => {
    if (!socket || !connected) return;
    
    // Listen for new messages
    socket.on('newMessage', (data) => {
      setConversations(prev => {
        // Find the conversation that received a new message
        const conversationIndex = prev.findIndex(c => c._id === data.conversationId);
        
        if (conversationIndex === -1) {
          // This is a completely new conversation, fetch all conversations
          fetch('/api/chat/conversations', {
            method: 'GET',
            credentials: 'include'
          })
            .then(res => res.json())
            .then(data => {
              if (data.result) {
                setConversations(data.conversations);
              }
            })
            .catch(err => console.error('Error fetching conversations:', err));
          
          return prev;
        }
        
        // Create a copy of the conversations array
        const updatedConversations = [...prev];
        
        // Update the conversation that received a new message
        updatedConversations[conversationIndex] = {
          ...updatedConversations[conversationIndex],
          lastMessage: data.message,
          hasUnread: true,
          updatedAt: new Date().toISOString()
        };
        
        // Sort conversations by last message time (most recent first)
        return updatedConversations.sort((a, b) => 
          new Date(b.updatedAt) - new Date(a.updatedAt)
        );
      });
    });
    
    // Listen for conversation read receipts
    socket.on('conversationRead', (data) => {
      setConversations(prev => {
        // Find the conversation that was read
        const conversationIndex = prev.findIndex(c => c._id === data.conversationId);
        
        if (conversationIndex === -1) return prev;
        
        // Create a copy of the conversations array
        const updatedConversations = [...prev];
        
        // If the current user is the one who read the messages, remove the unread flag
        if (data.readBy === user.data._id) {
          updatedConversations[conversationIndex] = {
            ...updatedConversations[conversationIndex],
            hasUnread: false
          };
        }
        
        return updatedConversations;
      });
    });
    
    return () => {
      socket.off('newMessage');
      socket.off('conversationRead');
    };
  }, [socket, connected, user.data._id]);
  
  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffHours < 24) {
      // Today, show time only
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffHours < 48) {
      // Yesterday
      return 'Yesterday';
    } else if (diffHours < 168) {
      // This week, show day name
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      // Older, show date
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };
  
  // Get preview of the message text
  const getMessagePreview = (message) => {
    if (!message) return '';
    
    const content = message.content || '';
    return content.length > 30 ? `${content.substring(0, 30)}...` : content;
  };
  
  // Search for users to message
  const searchUsers = async (term) => {
    if (!term.trim()) {
      setUsers([]);
      return;
    }
    
    try {
      setIsSearching(true);
      
      const response = await fetch(`/api/auth/users/search?q=${encodeURIComponent(term)}`, {
        method: 'GET',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to search users');
      }
      
      const data = await response.json();
      
      if (data.result) {
        // Filter out current user
        const filteredUsers = data.users.filter(u => u._id !== user.data._id);
        setUsers(filteredUsers);
      } else {
        setError(data.message || 'Failed to search users');
      }
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setIsSearching(false);
    }
  };
  
  // Handle starting a conversation with a user
  const startConversation = async (userId, username) => {
    try {
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recipientId: userId,
          content: `Hello ${username}! 👋`
        }),
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.result) {
        setIsModalOpen(false);
        // Navigate to the new conversation
        navigate(`/messages/${data.conversation._id}`);
      } else {
        setError(data.message || 'Could not start conversation');
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      setError('Failed to start conversation');
    }
  };
  
  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      searchUsers(searchTerm);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchTerm]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="loading loading-spinner loading-lg text-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl flex flex-col min-h-[calc(100vh-4rem)]">
      <motion.div 
        className="flex justify-between items-center mb-6"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Messages</h1>
          {connected && (
            <div className="tooltip tooltip-right" data-tip="Real-time chat active">
              <div className="badge badge-xs badge-success animate-pulse"></div>
            </div>
          )}
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary btn-sm md:btn-md shadow-md hover:shadow-lg transition-all"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          New Message
        </button>
      </motion.div>
      
      {/* Error message with animation */}
      <AnimatePresence>
        {error && (
          <motion.div 
            className="alert alert-error mb-4 shadow-md"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
            <button className="btn btn-xs btn-ghost" onClick={() => setError(null)}>Dismiss</button>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* New Message Modal with improved styling */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4 backdrop-blur-sm">
          <motion.div 
            className="bg-base-100 rounded-lg shadow-xl w-full max-w-md overflow-hidden"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <div className="p-4 border-b border-base-200 bg-base-200">
              <h3 className="font-bold text-lg">New Message</h3>
            </div>
            
            <div className="p-4">
              <div className="form-control">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search users..."
                    className="input input-bordered w-full pl-10 pr-4 focus:input-primary"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    autoFocus
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/60">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  {isSearching && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="loading loading-spinner loading-xs"></div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-4 max-h-60 overflow-y-auto scrollbar-thin">
                {searchTerm.trim() !== '' && users.length === 0 && !isSearching ? (
                  <div className="text-center py-8 text-base-content/70">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 19l-7-7 7-7" />
                    </svg>
                    <p>No users found matching "{searchTerm}"</p>
                  </div>
                ) : (
                  <ul className="space-y-1">
                    {users.map(user => (
                      <li 
                        key={user._id}
                        className="flex items-center gap-3 p-3 hover:bg-base-200 rounded-lg cursor-pointer transition-colors"
                        onClick={() => startConversation(user._id, user.username)}
                      >
                        <div className="w-10 h-10 rounded-full bg-primary/10 overflow-hidden flex items-center justify-center shadow-sm">
                          {user.profilePicture ? (
                            <img 
                              src={`/api/images/${user.profilePicture}`} 
                              alt={user.username}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-lg font-bold text-primary">
                              {user.username.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="flex-1">
                          <span className="font-medium">{user.username}</span>
                        </div>
                        <div className="text-primary">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            
            <div className="border-t border-base-200 p-4 flex justify-end bg-base-200">
              <button 
                className="btn btn-ghost"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
      
      {/* Main content - flex-grow to push footer down */}
      <div className="flex-grow">
        {conversations.length === 0 && !isLoading && !error ? (
          <motion.div 
            className="text-center py-12 bg-base-200 rounded-xl shadow-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-6xl mb-4 opacity-80">💬</div>
            <h3 className="text-xl font-medium mb-3">No messages yet</h3>
            <p className="text-base-content/60 max-w-md mx-auto mb-6">
              When you start a conversation with someone, it will appear here.
            </p>
            <Link to="/explore" className="btn btn-primary btn-md shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
              </svg>
              Find People to Chat With
            </Link>
          </motion.div>
        ) : (
          <motion.div 
            className="space-y-2 bg-base-100 rounded-xl shadow-lg overflow-hidden border border-base-200"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {/* Conversation list header */}
            <div className="bg-base-200 px-4 py-3 font-medium text-sm text-base-content/70 flex justify-between items-center border-b border-base-300">
              <span>Recent Conversations</span>
              <span className="badge badge-sm">{conversations.length}</span>
            </div>
            
            {/* Conversations list */}
            <div className="divide-y divide-base-200">
              <AnimatePresence>
                {conversations.map((conversation) => {
                  const isOnline = isUserOnline(conversation.otherUser._id);
                  
                  return (
                  <motion.div 
                    key={conversation._id}
                    className={`flex items-center p-4 cursor-pointer hover:bg-base-200 transition-colors ${
                      conversation.hasUnread ? 'bg-base-200/50' : 'bg-base-100'
                    }`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    onClick={() => navigate(`/messages/${conversation._id}`)}
                    whileHover={{ x: 5 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* User avatar with online indicator */}
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-primary/10 overflow-hidden flex items-center justify-center shadow-md">
                        {conversation.otherUser.profilePicture ? (
                          <img 
                            src={`/api/images/${conversation.otherUser.profilePicture}`} 
                            alt={conversation.otherUser.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xl font-bold text-primary">
                            {conversation.otherUser.username.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      {conversation.hasUnread && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-content rounded-full border-2 border-base-100 flex items-center justify-center text-xs font-bold shadow-sm">
                          !
                        </div>
                      )}
                      {isOnline && (
                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-success rounded-full border-2 border-base-100 animate-pulse"></div>
                      )}
                    </div>
                    
                    {/* Message preview */}
                    <div className="ml-4 flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <h3 className={`font-semibold truncate ${conversation.hasUnread ? 'text-base-content' : 'text-base-content/90'}`}>
                          {conversation.otherUser.username}
                          {isOnline && <span className="ml-2 text-xs text-success">•</span>}
                        </h3>
                        <span className="text-xs text-base-content/60 whitespace-nowrap ml-2 tabular-nums">
                          {formatDate(conversation.updatedAt)}
                        </span>
                      </div>
                      
                      <p className={`text-sm truncate ${
                        conversation.hasUnread 
                          ? 'font-medium text-base-content' 
                          : 'text-base-content/70'
                      }`}>
                        {conversation.lastMessage ? (
                          conversation.lastMessage.sender.toString() === user.data._id ? (
                            <span className="flex items-center gap-1">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                              </svg>
                              <span>You: {getMessagePreview(conversation.lastMessage)}</span>
                            </span>
                          ) : (
                            getMessagePreview(conversation.lastMessage)
                          )
                        ) : (
                          <span className="text-base-content/50 italic">No messages yet</span>
                        )}
                      </p>
                    </div>
                    
                    {/* Right arrow icon */}
                    <div className="ml-2 text-base-content/40">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </motion.div>
                )})}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Messages; 