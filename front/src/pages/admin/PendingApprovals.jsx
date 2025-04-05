import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const PendingApprovals = () => {
  const [pendingImages, setPendingImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionStatus, setActionStatus] = useState({
    message: '',
    type: '', // 'success' or 'error'
    visible: false,
    imageId: null
  });
  const [processingImageId, setProcessingImageId] = useState(null);
  
  const fetchPendingImages = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/pendingimage', {
        method: 'GET',
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (response.ok) {
        console.log('Pending images:', data.data);
        setPendingImages(data.data || []);
      } else {
        setError(data.message || 'Failed to fetch pending images');
      }
    } catch (error) {
      console.error('Error fetching pending images:', error);
      setError('An error occurred while loading pending images');
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchPendingImages();
  }, []);
  
  const handleAction = async (imageId, action) => {
    try {
      setProcessingImageId(imageId);
      
      let endpoint;
      if (action === 'approve') {
        endpoint = '/api/admin/approveimage';
      } else if (action === 'delete') {
        endpoint = '/api/admin/deleteimage';
      } else {
        return; // Invalid action
      }
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ image_id: imageId }),
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (response.ok && data.result) {
        setActionStatus({
          message: action === 'approve' ? 'Image approved successfully' : 'Image deleted successfully',
          type: 'success',
          visible: true,
          imageId
        });
        
        // Remove the image from the list
        setPendingImages(prev => prev.filter(img => img._id !== imageId));
        
        // Hide status message after 3 seconds
        setTimeout(() => {
          setActionStatus(prev => ({
            ...prev,
            visible: false
          }));
        }, 3000);
      } else {
        setActionStatus({
          message: data.message || `Failed to ${action} image`,
          type: 'error',
          visible: true,
          imageId
        });
      }
    } catch (error) {
      console.error(`Error ${action}ing image:`, error);
      setActionStatus({
        message: `Error ${action}ing image`,
        type: 'error',
        visible: true,
        imageId
      });
    } finally {
      setProcessingImageId(null);
    }
  };
  
  const handleApprove = (imageId) => handleAction(imageId, 'approve');
  const handleDelete = (imageId) => handleAction(imageId, 'delete');
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-error/10 text-error p-4 rounded-lg mb-6">
          <h2 className="text-lg font-semibold mb-2">Error</h2>
          <p>{error}</p>
        </div>
        <Link to="/admin" className="btn btn-primary">
          Return to Dashboard
        </Link>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Pending Approvals</h1>
          <p className="text-gray-600 mt-1">
            Review and approve images submitted by users
          </p>
        </div>
        <Link to="/admin" className="btn btn-outline mt-4 md:mt-0">
          ← Back to Dashboard
        </Link>
      </div>
      
      {/* Status Message */}
      <AnimatePresence>
        {actionStatus.visible && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`alert ${actionStatus.type === 'success' ? 'alert-success' : 'alert-error'} mb-6`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              {actionStatus.type === 'success' ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              )}
            </svg>
            <span>{actionStatus.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Pending Images List */}
      {pendingImages.length === 0 ? (
        <div className="bg-base-200 p-8 rounded-lg text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-base-content/30 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-xl font-semibold mb-2">No pending images</h3>
          <p className="text-base-content/70 max-w-md mx-auto mb-6">
            All images have been reviewed. Check back later for new submissions.
          </p>
          <Link to="/admin" className="btn btn-primary">
            Return to Dashboard
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pendingImages.map((image) => (
            <motion.div
              key={image._id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-base-100 rounded-lg overflow-hidden shadow-lg"
            >
              <div className="aspect-w-4 aspect-h-3 bg-base-300 relative">
                <img 
                  src={`/api/images/${image.imageUrl}`}
                  alt={image.title}
                  className="w-full h-full object-cover"
                />
                {/* User attribution */}
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/50 text-white flex items-center">
                  <div className="w-8 h-8 rounded-full bg-primary mr-2 flex items-center justify-center">
                    <span className="font-bold text-white text-sm">
                      {image.user && typeof image.user === 'object' && image.user.username
                        ? image.user.username.charAt(0).toUpperCase()
                        : '?'}
                    </span>
                  </div>
                  <span className="text-sm font-medium truncate">
                    {image.user && typeof image.user === 'object' && image.user.username
                      ? image.user.username
                      : 'Unknown user'}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-1">{image.title}</h3>
                <p className="text-base-content/70 text-sm mb-3 line-clamp-2">
                  {image.description || "No description provided"}
                </p>
                
                {/* Tags */}
                {image.tags && image.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {image.tags.map((tag, index) => (
                      <span 
                        key={index}
                        className="bg-base-200 text-base-content/70 px-2 py-1 rounded-full text-xs"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
                
                {/* Action buttons */}
                <div className="flex justify-between mt-2">
                  <button
                    className="btn btn-success btn-sm flex-1 mr-2"
                    onClick={() => handleApprove(image._id)}
                    disabled={processingImageId === image._id}
                  >
                    {processingImageId === image._id ? (
                      <span className="loading loading-spinner loading-xs"></span>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        Approve
                      </>
                    )}
                  </button>
                  <button
                    className="btn btn-error btn-sm flex-1"
                    onClick={() => handleDelete(image._id)}
                    disabled={processingImageId === image._id}
                  >
                    {processingImageId === image._id ? (
                      <span className="loading loading-spinner loading-xs"></span>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PendingApprovals; 