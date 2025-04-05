import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const NewMessageButton = ({ userId, username }) => {
  const navigate = useNavigate();
  const user = useSelector(state => state.user);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState(null);

  const handleStartConversation = async () => {
    // Redirect to login if not logged in
    if (!user.logged) {
      navigate('/login', { state: { from: `/user/${userId}` } });
      return;
    }

    // Can't message yourself
    if (userId === user.data._id) {
      return;
    }

    try {
      setIsCreating(true);
      setError(null);

      // Send an empty message to create the conversation
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
        // Navigate to the new conversation
        navigate(`/messages/${data.conversation._id}`);
      } else {
        setError(data.message || 'Could not start conversation');
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      setError('Failed to start conversation');
    } finally {
      setIsCreating(false);
    }
  };

  // Don't render the button if it's the current user's profile
  if (user.logged && userId === user.data._id) {
    return null;
  }

  return (
    <>
      <button
        onClick={handleStartConversation}
        disabled={isCreating}
        className="btn btn-primary flex items-center gap-2"
      >
        {isCreating ? (
          <span className="loading loading-spinner loading-xs"></span>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )}
        Message
      </button>
      
      {error && (
        <div className="text-error text-sm mt-2">{error}</div>
      )}
    </>
  );
};

export default NewMessageButton; 