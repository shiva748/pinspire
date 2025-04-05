import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { useSelector } from 'react-redux';
import { io } from 'socket.io-client';

// Create context
const SocketContext = createContext(null);

// Socket.io provider component
export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Map());
  const user = useSelector(state => state.user);
  const socketRef = useRef(null);
  const connectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  useEffect(() => {
    // Clean up function to handle unmounting and disconnection
    const cleanup = () => {
      if (socketRef.current) {
        console.log('[Socket] Disconnecting socket');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      if (connectTimeoutRef.current) {
        clearTimeout(connectTimeoutRef.current);
        connectTimeoutRef.current = null;
      }
      setSocket(null);
      setConnected(false);
      setOnlineUsers(new Map());
      reconnectAttemptsRef.current = 0;
    };

    // Only connect if user is logged in
    if (!user.logged) {
      console.log('[Socket] User not logged in, skipping connection');
      cleanup();
      return;
    }

    // Prevent creating multiple connections
    if (socketRef.current) {
      console.log('[Socket] Socket already exists, skipping connection setup');
      return;
    }

    console.log('[Socket] Initializing socket connection');
    
    // Log user auth token status
    try {
      const cookies = document.cookie;
      const hasAuthToken = cookies.includes('auth_tkn');
      console.log('[Socket] Auth token cookie present:', hasAuthToken);
      
      if (!hasAuthToken) {
        console.error('[Socket] No auth_tkn cookie found - connection will likely fail');
        // Consider redirecting to login or showing a message
      }
    } catch (e) {
      console.error('[Socket] Error checking cookies:', e);
    }

    // Initialize socket with reconnection options
    const serverUrl = process.env.NODE_ENV === 'production' 
      ? '/' 
      : 'http://localhost:3001';
    
    console.log(`[Socket] Connecting to ${serverUrl}`);
      
    const socketInstance = io(serverUrl, {
      withCredentials: true,
      reconnectionAttempts: maxReconnectAttempts,
      reconnectionDelay: 2000,
      timeout: 10000,
      transports: ['websocket', 'polling'],
      autoConnect: true,
      query: { 
        timestamp: new Date().getTime(),
        userId: user.data._id
      }
    });
    
    socketRef.current = socketInstance;

    // Set up event listeners
    socketInstance.on('connect', () => {
      console.log('[Socket] Connected successfully');
      setConnected(true);
      setError(null);
      reconnectAttemptsRef.current = 0;
    });

    // Handle user status updates
    socketInstance.on('userStatusUpdate', ({ userId, isOnline }) => {
      console.log(`[Socket] User ${userId} is now ${isOnline ? 'online' : 'offline'}`);
      setOnlineUsers(prev => {
        const newMap = new Map(prev);
        newMap.set(userId, isOnline);
        return newMap;
      });
    });

    // Handle bulk status response
    socketInstance.on('onlineStatusResponse', (statusMap) => {
      console.log('[Socket] Received online status for multiple users:', statusMap);
      setOnlineUsers(prev => {
        const newMap = new Map(prev);
        Object.entries(statusMap).forEach(([userId, isOnline]) => {
          newMap.set(userId, isOnline);
        });
        return newMap;
      });
    });

    socketInstance.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err.message);
      setConnected(false);
      setError(`Connection error: ${err.message}`);
      
      // Increment reconnection attempts counter
      reconnectAttemptsRef.current += 1;
      
      if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
        console.error('[Socket] Max reconnection attempts reached');
        socketInstance.disconnect();
      }
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
      setConnected(false);
      
      if (reason === 'io server disconnect') {
        // The server has forcefully disconnected the socket
        console.log('[Socket] Server disconnected the socket, attempting to reconnect');
        socketInstance.connect();
      }
    });

    socketInstance.on('error', (error) => {
      console.error('[Socket] Socket error:', error);
      setError(`Socket error: ${error.message || 'Unknown error'}`);
    });

    socketInstance.on('reconnect', (attemptNumber) => {
      console.log(`[Socket] Reconnected after ${attemptNumber} attempts`);
      setConnected(true);
      setError(null);
    });

    socketInstance.on('reconnect_attempt', (attemptNumber) => {
      console.log(`[Socket] Reconnection attempt ${attemptNumber}/${maxReconnectAttempts}`);
    });

    socketInstance.on('reconnect_failed', () => {
      console.log('[Socket] Reconnection failed');
      setError('Could not reconnect to the chat server. Please refresh the page.');
    });

    // Save the socket instance
    setSocket(socketInstance);

    // Cleanup on unmount
    return cleanup;
  }, [user.logged]);

  // Context value
  const value = {
    socket,
    connected,
    error,
    onlineUsers,
    isUserOnline: (userId) => {
      return onlineUsers.get(userId) === true;
    },
    checkUserStatus: (userIds) => {
      if (socket && connected) {
        console.log('[Socket] Checking online status for users:', userIds);
        socket.emit('checkOnlineStatus', userIds);
      }
    },
    reconnect: () => {
      if (socketRef.current) {
        console.log('[Socket] Manual reconnection attempt');
        socketRef.current.connect();
      }
    }
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
      {error && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          background: '#f44336',
          color: 'white',
          padding: '10px 15px',
          borderRadius: '4px',
          zIndex: 9999,
          maxWidth: '300px'
        }}>
          <strong>Socket Error:</strong> {error}
          <button 
            onClick={() => value.reconnect()} 
            style={{
              marginLeft: '10px',
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              padding: '2px 8px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      )}
    </SocketContext.Provider>
  );
};

// Custom hook to use the socket context
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export default SocketContext; 