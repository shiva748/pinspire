import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useParams, useNavigate } from "react-router-dom";
import { followUser, unfollowUser } from "../redux/reducers/userSlice";

const UserProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.user);
  const [userProfile, setUserProfile] = useState(null);
  const [userImages, setUserImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("pins");
  const [followLoading, setFollowLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        if (!userId) {
          setError("User ID not found");
          setIsLoading(false);
          return;
        }
        
        const response = await fetch(`/api/user/profile/${userId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });
        
        const data = await response.json();
        
        if (response.ok && data.result) {
          console.log("User profile data:", data.data);
          console.log("User images:", data.data.images);
          setUserProfile(data.data);
          setUserImages(data.data.images || []);
          
          // Check if current user is following this user
          if (currentUser.logged && currentUser.data?.following) {
            const isUserFollowed = currentUser.data.following.some(followedId => 
              followedId === userId || followedId.toString() === userId
            );
            setIsFollowing(isUserFollowed);
          }
        } else {
          console.error("Failed to fetch user profile:", data.message);
          setError(data.message || "Failed to load profile data");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        setError("An error occurred while loading this profile");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [userId, currentUser.logged, currentUser.data]);

  const handleFollowToggle = async () => {
    if (!currentUser.logged) {
      navigate('/');
      return;
    }

    try {
      setFollowLoading(true);
      const endpoint = isFollowing ? "/api/user/unfollow" : "/api/user/follow";
      
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ user_id: userId }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.result) {
        // Update local state
        setIsFollowing(!isFollowing);
        
        // Show success message
        setSuccessMessage(isFollowing ? 
          `You have unfollowed ${userProfile.username}` : 
          `You are now following ${userProfile.username}`
        );
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
        
        // Update Redux state
        if (isFollowing) {
          dispatch(unfollowUser(userId));
        } else {
          dispatch(followUser(userId));
        }
        
        // Update follower count in UI without refetching
        setUserProfile(prev => ({
          ...prev,
          followers: isFollowing 
            ? prev.followers.filter(id => id !== currentUser.data._id)
            : [...prev.followers, currentUser.data._id]
        }));
      } else {
        console.error("Failed to follow/unfollow:", data.message);
      }
    } catch (error) {
      console.error("Error following/unfollowing user:", error);
    } finally {
      setFollowLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  if (error || !userProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h2 className="text-2xl font-bold text-red-500 mb-4">Error</h2>
        <p className="text-gray-700">{error || "User profile not found"}</p>
        <Link to="/" className="mt-4 btn btn-primary">
          Return to Home
        </Link>
      </div>
    );
  }

  // If viewing own profile, redirect to /profile
  if (currentUser.logged && currentUser.data._id === userId) {
    navigate('/profile');
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Success Message */}
      <AnimatePresence>
        {successMessage && (
          <motion.div 
            className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-success text-success-content px-6 py-3 rounded-lg shadow-lg"
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
          >
            {successMessage}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row items-center gap-6 mb-8">
        {/* Profile Picture */}
        <div className="relative w-24 h-24 md:w-32 md:h-32">
          <img
            src={userProfile.profilePicture ? `/api/images/${userProfile.profilePicture}` : "/default-profile.png"}
            alt={`${userProfile.username}'s profile`}
            className="w-full h-full rounded-full object-cover border-2 border-primary"
          />
        </div>
        
        {/* Profile Info */}
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold">{userProfile.username}</h1>
          
          <div className="flex items-center gap-4 my-2">
            <span className="text-gray-700">
              <span className="font-semibold">{userProfile.followers?.length || 0}</span> followers
            </span>
            <span className="text-gray-700">
              <span className="font-semibold">{userProfile.following?.length || 0}</span> following
            </span>
          </div>
          
          {userProfile.bio && (
            <p className="text-gray-600 my-2">{userProfile.bio}</p>
          )}
          
          {userProfile.website && (
            <a
              href={userProfile.website.startsWith('http') ? userProfile.website : `https://${userProfile.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline block mt-1"
            >
              {userProfile.website}
            </a>
          )}
          
          {/* Follow/Unfollow Button (only show if logged in and not viewing own profile) */}
          {currentUser.logged && (
            <button
              onClick={handleFollowToggle}
              disabled={followLoading}
              className={`mt-4 px-6 py-2 rounded-full font-medium ${
                isFollowing
                  ? "bg-gray-200 hover:bg-gray-300 text-gray-800"
                  : "bg-primary hover:bg-primary-focus text-white"
              }`}
            >
              {followLoading ? (
                <span className="loading loading-spinner loading-xs"></span>
              ) : isFollowing ? (
                "Unfollow"
              ) : (
                "Follow"
              )}
            </button>
          )}
        </div>
      </div>
      
      {/* Content Tabs */}
      <div className="border-b mb-6">
        <div className="flex space-x-8">
          <button
            className={`pb-2 px-1 ${
              activeTab === "pins"
                ? "border-b-2 border-primary font-medium"
                : "text-gray-500"
            }`}
            onClick={() => setActiveTab("pins")}
          >
            Pins
          </button>
        </div>
      </div>
      
      {/* User Images Grid */}
      {userImages.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {userImages.map((image) => (
            <motion.div
              key={image._id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="relative group aspect-[3/4] overflow-hidden rounded-lg shadow-md bg-gray-100"
            >
              <img
                src={`/api/images/${image.imageUrl}`}
                alt={image.description || "User image"}
                className="w-full h-full object-cover"
              />
              
              <div className="absolute inset-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-end">
                <div className="p-3 w-full translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  <p className="text-white font-medium truncate">
                    {image.title || "Untitled"}
                  </p>
                  <p className="text-white/70 text-sm truncate mt-1">
                    {image.description || "No description"}
                  </p>
                  {image.tags && image.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {image.tags.slice(0, 3).map((tag, i) => (
                        <span key={i} className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No pins to display</p>
        </div>
      )}
    </div>
  );
};

export default UserProfile; 