import React, { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { setUser } from "../redux/reducers/userSlice";

const Profile = () => {
  const user = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const [userImages, setUserImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    bio: user.data?.bio || "",
    website: user.data?.website || "",
  });
  const [activeTab, setActiveTab] = useState("pins");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchUserImages = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/user/profile/${user.data._id}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });
        
        const data = await response.json();
        
        if (response.ok && data.result) {
          setUserImages(data.data.images || []);
        } else {
          console.error("Failed to fetch user images:", data.message);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user.logged && user.data?._id) {
      fetchUserImages();
    }
  }, [user.logged, user.data?._id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch("/api/user/profile/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(profileData),
      });
      
      const data = await response.json();
      
      if (response.ok && data.result) {
        // Update the Redux state with the new user data
        dispatch(setUser({
          ...user,
          data: {
            ...user.data,
            ...profileData
          }
        }));
        setIsEditing(false);
      } else {
        console.error("Failed to update profile:", data.message);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  const handleProfilePictureClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // File size validation (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("File size should not exceed 5MB");
      return;
    }

    // File type validation
    if (!file.type.startsWith('image/')) {
      alert("Please select an image file");
      return;
    }

    const formData = new FormData();
    formData.append('profilePicture', file);

    try {
      setIsUploading(true);
      setUploadProgress(0);

      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(progress);
        }
      });

      xhr.onload = function() {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          if (response.result) {
            // Update Redux state with new profile picture
            dispatch(setUser({
              ...user,
              data: {
                ...user.data,
                profilePicture: response.data.profilePicture
              }
            }));
            alert("Profile picture updated successfully");
          } else {
            alert("Failed to upload profile picture: " + (response.message || "Unknown error"));
          }
        } else {
          alert("Error uploading profile picture: " + xhr.status);
        }
        setIsUploading(false);
      };

      xhr.onerror = function() {
        alert("Network error occurred");
        setIsUploading(false);
      };

      xhr.open('POST', '/api/user/profile/picture', true);
      xhr.withCredentials = true;
      xhr.send(formData);
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      alert("Failed to upload profile picture: " + error.message);
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100 py-12">
      <div className="container mx-auto px-4">
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {/* Profile Header */}
          <div className="relative">
            {/* Cover Photo */}
            <div className="h-48 w-full bg-gradient-to-r from-primary to-secondary"></div>
            
            {/* Profile Picture & Actions */}
            <div className="flex flex-col md:flex-row justify-between px-6 -mt-16 relative">
              <div className="flex flex-col md:flex-row items-center">
                <div className="w-32 h-32 rounded-full ring-4 ring-white bg-base-100 overflow-hidden">
                  {user.data?.profilePicture ? (
                    <img 
                      src={`/api/images/${user.data.profilePicture}`}
                      alt={user.data.username}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ccc'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E`;
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary text-primary-content text-4xl font-bold">
                      {user.data?.username?.charAt(0).toUpperCase() || '?'}
                    </div>
                  )}
                </div>
                
                <div className="mt-4 md:mt-16 md:ml-6 text-center md:text-left">
                  <h1 className="text-3xl font-bold">{user.data?.username || "User"}</h1>
                  {!isEditing && (
                    <>
                      <p className="mt-1 text-gray-600">{profileData.bio || "No bio yet"}</p>
                      {profileData.website && (
                        <a 
                          href={profileData.website.startsWith('http') ? profileData.website : `https://${profileData.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 text-primary hover:underline inline-flex items-center"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          {profileData.website.replace(/^(https?:\/\/)?(www\.)?/, '')}
                        </a>
                      )}
                    </>
                  )}
                </div>
              </div>
              
              {/* Stats & Actions */}
              <div className="mt-6 md:mt-16 flex flex-col items-center md:items-end">
                <div className="flex space-x-6 text-center">
                  <div>
                    <span className="block text-2xl font-bold">{userImages.length}</span>
                    <span className="text-gray-500">Pins</span>
                  </div>
                  <div>
                    <span className="block text-2xl font-bold">{user.data?.followers?.length || 0}</span>
                    <span className="text-gray-500">Followers</span>
                  </div>
                  <div>
                    <span className="block text-2xl font-bold">{user.data?.following?.length || 0}</span>
                    <span className="text-gray-500">Following</span>
                  </div>
                </div>
                
                <button 
                  onClick={() => setIsEditing(!isEditing)}
                  className="mt-4 btn btn-primary"
                >
                  {isEditing ? "Cancel" : "Edit Profile"}
                </button>
              </div>
            </div>
          </div>
          
          {/* Edit Profile Form */}
          {isEditing && (
            <div className="p-6 mt-6 border-t">
              <form onSubmit={handleSubmit} className="max-w-lg mx-auto">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Bio</span>
                  </label>
                  <textarea 
                    name="bio"
                    value={profileData.bio}
                    onChange={handleInputChange}
                    className="textarea textarea-bordered h-24"
                    placeholder="Tell something about yourself"
                    maxLength={160}
                  ></textarea>
                  <p className="text-xs text-right mt-1 text-gray-500">
                    {profileData.bio.length}/160
                  </p>
                </div>
                
                <div className="form-control mt-4">
                  <label className="label">
                    <span className="label-text">Website</span>
                  </label>
                  <input 
                    type="text"
                    name="website"
                    value={profileData.website}
                    onChange={handleInputChange}
                    className="input input-bordered"
                    placeholder="https://yourwebsite.com"
                  />
                </div>
                
                <div className="form-control mt-4">
                  <label className="label">
                    <span className="label-text">Profile Picture</span>
                  </label>
                  <div className="flex items-center">
                    <div className="w-16 h-16 rounded-full bg-base-200 mr-4 overflow-hidden">
                      {user.data?.profilePicture ? (
                        <img 
                          src={`/api/images/${user.data.profilePicture}`}
                          alt={user.data.username}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ccc'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E`;
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary text-primary-content text-xl font-bold">
                          {user.data?.username?.charAt(0).toUpperCase() || '?'}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        className="hidden"
                      />
                      <button 
                        type="button" 
                        onClick={handleProfilePictureClick}
                        className="btn btn-outline"
                        disabled={isUploading}
                      >
                        {isUploading ? 'Uploading...' : 'Change'}
                      </button>
                      {isUploading && (
                        <progress 
                          className="progress progress-primary w-full mt-2" 
                          value={uploadProgress} 
                          max="100"
                        ></progress>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="form-control mt-6">
                  <button type="submit" className="btn btn-primary">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Tabs */}
          <div className="px-6 mt-6 border-t">
            <div className="tabs tabs-bordered">
              <button 
                className={`tab tab-lg ${activeTab === 'pins' ? 'tab-active' : ''}`}
                onClick={() => setActiveTab('pins')}
              >
                Pins
              </button>
              <button 
                className={`tab tab-lg ${activeTab === 'saved' ? 'tab-active' : ''}`}
                onClick={() => setActiveTab('saved')}
              >
                Saved
              </button>
            </div>
          </div>
          
          {/* Content */}
          <div className="p-6">
            {activeTab === 'pins' && (
              <div>
                {userImages.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <h3 className="mt-4 text-xl font-semibold text-gray-700">No pins yet</h3>
                    <p className="mt-2 text-gray-500">Create your first pin to get started!</p>
                    <Link to="/create" className="mt-4 btn btn-primary">Create Pin</Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {userImages.map((image, index) => (
                      <motion.div 
                        key={image._id || index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="group relative rounded-xl overflow-hidden aspect-[3/4] bg-base-200"
                      >
                        <img 
                          src={`/api/images/${image.imageUrl}`} 
                          alt={image.title || "Image"} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ccc'%3E%3Cpath d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'/%3E%3C/svg%3E`;
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                          <h3 className="text-white font-medium truncate">{image.title}</h3>
                          <div className="flex justify-between items-center mt-2">
                            <span className="text-white/80 text-sm">{image.likeCount || 0} likes</span>
                            <div className="flex space-x-2">
                              <button className="btn btn-circle btn-sm btn-ghost text-white">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                              </button>
                              <button className="btn btn-circle btn-sm btn-ghost text-white">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'saved' && (
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                <h3 className="mt-4 text-xl font-semibold text-gray-700">No saved pins yet</h3>
                <p className="mt-2 text-gray-500">Save pins that inspire you!</p>
                <Link to="/explore" className="mt-4 btn btn-primary">Explore Pins</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;