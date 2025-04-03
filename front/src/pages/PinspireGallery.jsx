import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";

const PinspireGallery = () => {
  const [images, setImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState("All");
  const [availableTags, setAvailableTags] = useState(["All"]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchMode, setSearchMode] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  
  const user = useSelector(state => state.user);

  // Fetch images from backend
  const fetchImages = async (page = 1, tag = "All") => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/image/all?page=${page}&limit=12&tag=${tag}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok) {
        setImages(data.images);
        setAvailableTags(data.availableTags);
        setTotalPages(data.totalPages);
        setCurrentPage(data.currentPage);
      } else {
        setError(data.message || "Failed to fetch images");
      }
    } catch (error) {
      console.error("Error fetching images:", error);
      setError("Failed to connect to server");
    } finally {
      setIsLoading(false);
    }
  };

  // Search images
  const searchImages = async () => {
    if (!search.trim()) {
      return;
    }

    setIsLoading(true);
    setSearchMode(true);
    
    try {
      const response = await fetch("/api/image/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: search }),
      });

      const data = await response.json();

      if (response.ok) {
        setSearchResults(data.images);
      } else {
        setError(data.message || "Search failed");
      }
    } catch (error) {
      console.error("Error searching images:", error);
      setError("Failed to connect to server");
    } finally {
      setIsLoading(false);
    }
  };

  // Reset search and go back to browsing
  const resetSearch = () => {
    setSearch("");
    setSelectedTag("All");
    setSearchMode(false);
    fetchImages(1, "All");
  };

  // Handle tag selection
  const handleTagSelect = (tag) => {
    setSelectedTag(tag);
    setCurrentPage(1);
    fetchImages(1, tag);
  };

  // Load next page
  const loadNextPage = () => {
    if (currentPage < totalPages) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      fetchImages(nextPage, selectedTag);
    }
  };

  // Load previous page
  const loadPreviousPage = () => {
    if (currentPage > 1) {
      const prevPage = currentPage - 1;
      setCurrentPage(prevPage);
      fetchImages(prevPage, selectedTag);
    }
  };

  // Open image modal
  const openImageModal = (image) => {
    setSelectedImage(image);
    setIsModalOpen(true);
    
    // Check if user has liked this image
    if (user.logged && image.likes) {
      console.log(image.likes)
      console.log(user)
      setIsLiked(image.likes.some(like => like.user === user.data._id));
    } else {
      setIsLiked(false);
    }
    
    // Prevent scrolling on body when modal is open
    document.body.style.overflow = 'hidden';
  };

  // Close image modal
  const closeImageModal = () => {
    setIsModalOpen(false);
    setSelectedImage(null);
    
    // Restore scrolling
    document.body.style.overflow = 'auto';
  };
  
  // Handle like/unlike functionality
  const handleLikeToggle = async () => {
    console.log(isLiked)
    if (!user.logged) {
      setError("Please log in to like images");
      return;
    }
    
    try {
      const endpoint = isLiked ? '/api/image/unlike' : '/api/image/like';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image_id: selectedImage._id }),
        credentials: 'include',
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Update like state
        setIsLiked(!isLiked);
        
        // Update the like count in the selectedImage
        const newLikeCount = isLiked ? selectedImage.likeCount - 1 : selectedImage.likeCount + 1;
        
        // Update the selectedImage state with new like count and likes array
        setSelectedImage(prev => {
          const updatedLikes = isLiked 
            ? (prev.likes || []).filter(like => like.user !== user.data._id)
            : [...(prev.likes || []), { user: user.data._id, likedAt: new Date() }];
            
          return {
            ...prev,
            likeCount: newLikeCount,
            likes: updatedLikes
          };
        });
        
        // Also update in the main images list for when modal is closed
        const updatedImages = displayedImages.map(img => {
          if (img._id === selectedImage._id) {
            const updatedLikes = isLiked 
              ? (img.likes || []).filter(like => like.user !== user.data._id)
              : [...(img.likes || []), { user: user.data._id, likedAt: new Date() }];
              
            return {
              ...img,
              likeCount: newLikeCount,
              likes: updatedLikes
            };
          }
          return img;
        });
        
        if (searchMode) {
          setSearchResults(updatedImages);
        } else {
          setImages(updatedImages);
        }
      } else {
        setError(data.message || "Failed to update like status");
      }
    } catch (error) {
      console.error("Error updating like status:", error);
      setError("An error occurred while updating like status");
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchImages();
  }, []);

  // Determine which images to display
  const displayedImages = searchMode ? searchResults : images;
  
  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        type: "spring", 
        stiffness: 100, 
        damping: 12 
      }
    }
  };
  
  const modalVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { 
        type: "spring", 
        stiffness: 400, 
        damping: 25 
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.8,
      transition: { 
        duration: 0.2 
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-100 to-base-200 py-12">
      <div className="container mx-auto px-4">
        <motion.h1 
          className="text-4xl font-bold mb-2 text-center bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          Explore Pins
        </motion.h1>
        
        <motion.p 
          className="text-center text-base-content/70 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          Discover and collect ideas that inspire you
        </motion.p>

        {/* Search & Filter Section */}
        <motion.div 
          className="bg-base-100 rounded-2xl p-5 mb-12 shadow-lg border border-base-300"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search pins..."
                  className="input input-bordered w-full pr-16 rounded-full shadow-sm focus:shadow-md transition-shadow duration-300"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && searchImages()}
                />
                <button
                  className="btn btn-primary absolute right-0 top-0 rounded-l-none rounded-r-full"
                  onClick={searchImages}
                  disabled={!search.trim()}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </div>
            
            {searchMode ? (
              <motion.button 
                className="btn btn-outline rounded-full"
                onClick={resetSearch}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Clear Search
              </motion.button>
            ) : (
              <div className="relative">
                <select
                  value={selectedTag}
                  onChange={(e) => handleTagSelect(e.target.value)}
                  className="select select-bordered rounded-full pl-5 pr-10 appearance-none bg-base-100"
                >
                  {availableTags.map((tag) => (
                    <option key={tag} value={tag}>
                      {tag}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-base-content/50">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Status Messages */}
        {isLoading && (
          <motion.div 
            className="flex flex-col items-center justify-center my-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="loading loading-spinner loading-lg text-primary mb-4"></div>
            <p className="text-base-content/70">Finding beautiful pins for you...</p>
          </motion.div>
        )}

        {error && !isLoading && (
          <motion.div 
            className="alert alert-error my-8 max-w-md mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <svg className="w-6 h-6 stroke-current shrink-0" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </motion.div>
        )}

        {!isLoading && !error && displayedImages.length === 0 && (
          <motion.div 
            className="text-center my-16"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="bg-base-200/50 w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-16 h-16 text-base-content/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-2">No pins found</h3>
            <p className="text-base-content/70 max-w-md mx-auto">
              {searchMode
                ? "No pins match your search query. Try a different search term."
                : "There are no pins to display at the moment."}
            </p>
          </motion.div>
        )}

        {/* Image Gallery */}
        {!isLoading && displayedImages.length > 0 && (
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {displayedImages.map((img, index) => (
              <motion.div 
                key={img._id} 
                className="flex flex-col"
                variants={itemVariants}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
              >
                <div 
                  className="bg-base-100 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300"
                >
                  <div 
                    className="relative cursor-pointer overflow-hidden group"
                    onClick={() => openImageModal(img)}
                  >
                    <motion.img
                      src={`/api/images/${img.imageUrl}`}
                      alt={img.title}
                      className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-700"
                      loading="lazy"
                      layoutId={`image-${img._id}`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                      <h3 className="text-white font-medium truncate opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                        {img.title}
                      </h3>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium truncate">{img.title}</h3>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-base-300 overflow-hidden shadow-sm">
                          {img.user?.profileImg ? (
                            <img 
                              src={`/public/${img.user.profileImg}`} 
                              alt={img.user.username} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-primary text-primary-content text-xs font-bold">
                              {img.user?.username?.charAt(0).toUpperCase() || '?'}
                            </div>
                          )}
                        </div>
                        <span className="text-sm font-medium truncate max-w-[100px]">
                          {img.user?.username || 'User'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-base-content/70">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        <span className="text-sm font-medium">{img.likeCount || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Pagination */}
        {!searchMode && !isLoading && totalPages > 1 && (
          <motion.div 
            className="flex justify-center items-center gap-2 mt-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <motion.button
              className="btn btn-circle btn-outline"
              onClick={loadPreviousPage}
              disabled={currentPage === 1}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </motion.button>
            
            <div className="flex items-center px-6 py-2 bg-base-100 rounded-full shadow">
              <span className="font-medium">Page {currentPage}</span>
              <span className="mx-2 text-base-content/30">/</span>
              <span>{totalPages}</span>
            </div>
            
            <motion.button
              className="btn btn-circle btn-outline"
              onClick={loadNextPage}
              disabled={currentPage === totalPages}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </motion.button>
          </motion.div>
        )}
        
        {/* Image Modal */}
        <AnimatePresence>
          {isModalOpen && selectedImage && (
            <motion.div 
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeImageModal}
            >
              <motion.div 
                className="bg-base-100 rounded-2xl overflow-hidden max-w-4xl w-full max-h-[90vh] shadow-2xl flex flex-col md:flex-row"
                onClick={(e) => e.stopPropagation()}
                variants={modalVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                {/* Image Section */}
                <div className="md:w-1/2 bg-base-300/50 flex items-center justify-center p-4">
                  <motion.img 
                    layoutId={`image-${selectedImage._id}`}
                    src={`/api/images/${selectedImage.imageUrl}`}
                    alt={selectedImage.title}
                    className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
                  />
                </div>
                
                {/* Details Section */}
                <div className="md:w-1/2 p-6 flex flex-col max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-start mb-6">
                    <h2 className="text-2xl font-bold">{selectedImage.title}</h2>
                    <motion.button 
                      className="btn btn-circle btn-sm btn-ghost"
                      onClick={closeImageModal}
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </motion.button>
                  </div>
                  
                  {/* User Info */}
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-full bg-base-300 overflow-hidden ring-2 ring-primary/20">
                      {selectedImage.user?.profileImg ? (
                        <img 
                          src={`/public/${selectedImage.user.profileImg}`} 
                          alt={selectedImage.user.username} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary text-primary-content text-lg font-bold">
                          {selectedImage.user?.username?.charAt(0).toUpperCase() || '?'}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-lg">{selectedImage.user?.username || 'User'}</div>
                      <div className="text-xs text-base-content/60">
                        {selectedImage.createdAt && formatDate(selectedImage.createdAt)}
                      </div>
                    </div>
                  </div>
                  
                  {/* Description */}
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-base-content/60 uppercase tracking-wider mb-2">Description</h3>
                    <p className="text-base-content whitespace-pre-wrap bg-base-200/50 p-4 rounded-lg">
                      {selectedImage.description || "No description provided."}
                    </p>
                  </div>
                  
                  {/* Tags */}
                  {selectedImage.tags && selectedImage.tags.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-base-content/60 uppercase tracking-wider mb-2">Tags</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedImage.tags.map((tag, index) => (
                          <motion.span 
                            key={index}
                            className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm cursor-pointer"
                            onClick={() => {
                              closeImageModal();
                              handleTagSelect(tag);
                            }}
                            whileHover={{ scale: 1.05, backgroundColor: "rgba(var(--p), 0.2)" }}
                            whileTap={{ scale: 0.95 }}
                          >
                            #{tag}
                          </motion.span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Actions */}
                  <div className="mt-auto pt-4 border-t border-base-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <motion.button 
                        className={`btn btn-circle ${isLiked ? 'bg-red-50 text-red-500 hover:bg-red-100' : 'btn-ghost'}`}
                        onClick={handleLikeToggle}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        animate={{ 
                          scale: isLiked ? [1, 1.2, 1] : 1,
                          transition: { duration: 0.3 }
                        }}
                      >
                        <svg className="w-6 h-6" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </motion.button>
                      <span className="font-medium">{selectedImage.likeCount || 0} likes</span>
                    </div>
                    
                    {user.logged && selectedImage.user && user.data._id === selectedImage.user._id && (
                      <motion.button 
                        className="btn btn-error btn-sm"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </motion.button>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default PinspireGallery;
