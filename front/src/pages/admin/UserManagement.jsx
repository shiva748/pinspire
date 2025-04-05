import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userImages, setUserImages] = useState([]);
  const [isLoadingUserImages, setIsLoadingUserImages] = useState(false);
  const [actionStatus, setActionStatus] = useState({
    message: '',
    type: '',
    visible: false
  });
  
  const handleSearch = async (e) => {
    e.preventDefault();
    
    try {
      setIsSearching(true);
      setError(null);
      
      const response = await fetch('/api/admin/getusers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username: searchTerm }),
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (response.ok && data.result) {
        setUsers(data.data || []);
        if (data.data && data.data.length === 0) {
          setActionStatus({
            message: 'No users found with that username',
            type: 'info',
            visible: true
          });
          
          setTimeout(() => {
            setActionStatus(prev => ({ ...prev, visible: false }));
          }, 3000);
        } else if (searchTerm.trim() !== '') {
          setActionStatus({
            message: `Found ${data.count} user${data.count !== 1 ? 's' : ''} matching "${searchTerm}"`,
            type: 'success',
            visible: true
          });
          
          setTimeout(() => {
            setActionStatus(prev => ({ ...prev, visible: false }));
          }, 3000);
        }
      } else {
        setError(data.message || 'Failed to search users');
      }
    } catch (error) {
      console.error('Error searching users:', error);
      setError('An error occurred while searching users');
    } finally {
      setIsSearching(false);
    }
  };
  
  const fetchAllUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/getusers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username: '' }),
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (response.ok && data.result) {
        setUsers(data.data || []);
        
        if (data.count >= 50) {
          setActionStatus({
            message: 'Showing 50 users (maximum limit). Use search to find specific users.',
            type: 'info',
            visible: true
          });
          
          setTimeout(() => {
            setActionStatus(prev => ({ ...prev, visible: false }));
          }, 5000);
        }
      } else {
        setError(data.message || 'Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('An error occurred while loading users');
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchAllUsers();
  }, []);
  
  const viewUserProfile = async (userId) => {
    try {
      setSelectedUser(users.find(user => user._id === userId));
      setIsLoadingUserImages(true);
      
      const response = await fetch(`/api/user/profile/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (response.ok && data.result) {
        setUserImages(data.data.images || []);
      } else {
        console.error('Failed to fetch user images:', data.message);
        setUserImages([]);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setUserImages([]);
    } finally {
      setIsLoadingUserImages(false);
    }
  };
  
  const closeUserProfile = () => {
    setSelectedUser(null);
    setUserImages([]);
  };
  
  // Function to make a user admin (this would need a corresponding backend endpoint)
  const toggleAdminStatus = async (userId, isCurrentlyAdmin) => {
    try {
      setActionStatus({
        message: 'Processing...',
        type: 'info',
        visible: true
      });
      
      const response = await fetch('/api/admin/toggleadmin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ user_id: userId }),
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (response.ok && data.result) {
        setActionStatus({
          message: data.message || 'Admin status toggled successfully',
          type: 'success',
          visible: true
        });
        
        // Update local user list
        setUsers(users.map(user => 
          user._id === userId 
            ? { ...user, isAdmin: !isCurrentlyAdmin } 
            : user
        ));
        
        // If we're viewing the user in the modal, update that too
        if (selectedUser && selectedUser._id === userId) {
          setSelectedUser(prev => ({
            ...prev,
            isAdmin: !isCurrentlyAdmin
          }));
        }
      } else {
        setActionStatus({
          message: data.message || 'Failed to update admin status',
          type: 'error',
          visible: true
        });
      }
      
      setTimeout(() => {
        setActionStatus(prev => ({ ...prev, visible: false }));
      }, 3000);
      
    } catch (error) {
      console.error('Error toggling admin status:', error);
      setActionStatus({
        message: 'Failed to update admin status',
        type: 'error',
        visible: true
      });
      
      setTimeout(() => {
        setActionStatus(prev => ({ ...prev, visible: false }));
      }, 3000);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-gray-600 mt-1">
            Search, view, and manage users
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
            className={`alert ${
              actionStatus.type === 'success' ? 'alert-success' : 
              actionStatus.type === 'error' ? 'alert-error' : 
              'alert-info'
            } mb-6`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              {actionStatus.type === 'success' ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              ) : actionStatus.type === 'error' ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              )}
            </svg>
            <span>{actionStatus.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Search Bar */}
      <div className="bg-base-200 p-6 rounded-lg mb-8">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search users by username..."
              className="input input-bordered w-full pl-10"
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg className="w-5 h-5 text-base-content/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSearching}
          >
            {isSearching ? (
              <span className="loading loading-spinner loading-xs"></span>
            ) : (
              'Search'
            )}
          </button>
          {searchTerm && (
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => {
                setSearchTerm('');
                fetchAllUsers();
              }}
            >
              Clear
            </button>
          )}
        </form>
      </div>
      
      {/* Error Display */}
      {error && (
        <div className="alert alert-error mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}
      
      {/* User List */}
      {users.length === 0 ? (
        <div className="bg-base-200 p-8 rounded-lg text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-base-content/30 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <h3 className="text-xl font-semibold mb-2">No users found</h3>
          <p className="text-base-content/70 max-w-md mx-auto mb-6">
            {searchTerm ? `No users match the search term "${searchTerm}"` : "No users found in the system"}
          </p>
          {searchTerm && (
            <button
              className="btn btn-primary"
              onClick={() => {
                setSearchTerm('');
                fetchAllUsers();
              }}
            >
              View All Users
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Followers</th>
                <th>Following</th>
                <th>Admin Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <motion.tr 
                  key={user._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover"
                >
                  <td>
                    <div className="flex items-center space-x-3">
                      <div className="avatar">
                        <div className="mask mask-squircle w-10 h-10 bg-base-300 flex items-center justify-center">
                          {user.profilePicture ? (
                            <img
                              src={`/api/images/${user.profilePicture}`}
                              alt={`${user.username}'s profile`}
                            />
                          ) : (
                            <span className="text-base-content font-bold">
                              {user.username.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="font-bold">{user.username}</div>
                        <div className="text-sm opacity-50">
                          {user.bio ? `${user.bio.substring(0, 20)}${user.bio.length > 20 ? '...' : ''}` : 'No bio'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>{user.email}</td>
                  <td>{user.followers?.length || 0}</td>
                  <td>{user.following?.length || 0}</td>
                  <td>
                    <div className="badge badge-lg badge-outline">
                      {user.isAdmin ? 'Admin' : 'User'}
                    </div>
                  </td>
                  <td className="flex gap-2">
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => viewUserProfile(user._id)}
                    >
                      View
                    </button>
                    <button
                      className={`btn btn-sm ${user.isAdmin ? 'btn-error' : 'btn-outline'}`}
                      onClick={() => toggleAdminStatus(user._id, user.isAdmin)}
                    >
                      {user.isAdmin ? 'Remove Admin' : 'Make Admin'}
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* User Profile Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-base-100 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">User Profile: {selectedUser.username}</h2>
                <button
                  className="btn btn-circle btn-ghost"
                  onClick={closeUserProfile}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="flex flex-col md:flex-row gap-6 mb-8">
                <div className="md:w-1/3">
                  <div className="aspect-square w-32 h-32 mx-auto bg-base-300 rounded-full flex items-center justify-center overflow-hidden">
                    {selectedUser.profilePicture ? (
                      <img
                        src={`/api/images/${selectedUser.profilePicture}`}
                        alt={`${selectedUser.username}'s profile`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-4xl font-bold text-base-content">
                        {selectedUser.username.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  
                  <div className="mt-4 text-center">
                    <h3 className="text-xl font-bold">{selectedUser.username}</h3>
                    <p className="text-base-content/70">{selectedUser.email}</p>
                    
                    <div className="flex justify-center gap-4 mt-2">
                      <div className="text-center">
                        <div className="font-semibold">{selectedUser.followers?.length || 0}</div>
                        <div className="text-xs text-base-content/50">Followers</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold">{selectedUser.following?.length || 0}</div>
                        <div className="text-xs text-base-content/50">Following</div>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <Link 
                        to={`/user/${selectedUser._id}`} 
                        className="btn btn-outline btn-sm w-full"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View Public Profile
                      </Link>
                    </div>
                  </div>
                </div>
                
                <div className="md:w-2/3">
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-2">Bio</h3>
                    <p className="bg-base-200 p-4 rounded-lg">
                      {selectedUser.bio || 'No bio provided'}
                    </p>
                  </div>
                  
                  {selectedUser.website && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-2">Website</h3>
                      <a 
                        href={selectedUser.website.startsWith('http') ? selectedUser.website : `https://${selectedUser.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {selectedUser.website}
                      </a>
                    </div>
                  )}
                  
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-2">Account Status</h3>
                    <div className="flex items-center gap-2">
                      <div className={`badge badge-lg ${selectedUser.isAdmin ? 'badge-primary' : 'badge-outline'}`}>
                        {selectedUser.isAdmin ? 'Admin' : 'Regular User'}
                      </div>
                      <button
                        className={`btn btn-sm ${selectedUser.isAdmin ? 'btn-error' : 'btn-success'}`}
                        onClick={() => toggleAdminStatus(selectedUser._id, selectedUser.isAdmin)}
                      >
                        {selectedUser.isAdmin ? 'Remove Admin' : 'Make Admin'}
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-4">User Images</h3>
                    {isLoadingUserImages ? (
                      <div className="flex justify-center py-8">
                        <div className="loading loading-spinner loading-md"></div>
                      </div>
                    ) : userImages.length === 0 ? (
                      <div className="bg-base-200 p-4 rounded-lg text-center">
                        <p className="text-base-content/70">No images found for this user</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {userImages.map((image) => (
                          <div 
                            key={image._id}
                            className="aspect-square bg-base-200 rounded-lg overflow-hidden relative group"
                          >
                            <img 
                              src={`/api/images/${image.imageUrl}`}
                              alt={image.title || "User image"}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 text-white">
                              <p className="font-semibold text-sm text-center line-clamp-2">
                                {image.title || "Untitled"}
                              </p>
                              <p className="text-xs mt-1 text-center line-clamp-2">
                                {image.description || "No description"}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default UserManagement; 