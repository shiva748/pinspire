import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring, useAnimation } from "framer-motion";

const UploadImage = () => {
  const [step, setStep] = useState(1);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [imageAspectRatio, setImageAspectRatio] = useState(1);
  const [activeInput, setActiveInput] = useState(null);

  const fileInputRef = useRef(null);
  const uploadProgressRef = useRef(null);
  const titleInputRef = useRef(null);
  const descriptionInputRef = useRef(null);
  const tagInputRef = useRef(null);
  const formRef = useRef(null);
  const controls = useAnimation();
  const navigate = useNavigate();

  // Spring animation for progress bar
  const progressSpring = useSpring(0, { stiffness: 100, damping: 30 });
  
  useEffect(() => {
    progressSpring.set(uploadProgress);
  }, [uploadProgress, progressSpring]);
  
  const progressBarWidth = useTransform(progressSpring, [0, 100], ["0%", "100%"]);

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      validateAndSetImage(file);
    }
  };

  // Handle file drag events
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      validateAndSetImage(file);
    }
  };

  // Validate image file
  const validateAndSetImage = (file) => {
    const validTypes = ['image/jpeg', 'image/png'];
    const maxSizeInBytes = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
      setErrors({...errors, file: "Only JPG and PNG images are allowed"});
      return;
    }

    if (file.size > maxSizeInBytes) {
      setErrors({...errors, file: "Image must be smaller than 5MB"});
      return;
    }

    // Clear file error
    const newErrors = {...errors};
    delete newErrors.file;
    setErrors(newErrors);

    // Set file and preview
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Handle tag input
  const handleTagInputChange = (e) => {
    setTagInput(e.target.value);
  };

  const handleTagInputKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  };

  const addTag = () => {
    const trimmedInput = tagInput.trim();
    if (trimmedInput && trimmedInput.length >= 3 && trimmedInput.length <= 25) {
      if (!tags.includes(trimmedInput) && tags.length < 5) {
        setTags([...tags, trimmedInput]);
        setTagInput('');
        
        // Clear tag error if it exists
        const newErrors = {...errors};
        delete newErrors.tags;
        setErrors(newErrors);
      }
    } else if (trimmedInput) {
      setErrors({...errors, tags: "Tags must be between 3 and 25 characters"});
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  // Validate specific step
  const validateStep = (stepNumber) => {
    const newErrors = {};
    
    if (stepNumber === 1) {
      if (!imageFile) {
        newErrors.file = "Please select an image";
      }
    } else if (stepNumber === 2) {
      if (!title || title.length < 3 || title.length > 40) {
        newErrors.title = "Title must be between 3 and 40 characters";
      }

      if (!description || description.length < 50 || description.length > 500) {
        newErrors.description = "Description must be between 50 and 500 characters";
      }

      if (tags.length < 1) {
        newErrors.tags = "Please add at least 1 tag";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle next step
  const handleNextStep = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  // Handle previous step
  const handlePrevStep = () => {
    setStep(step - 1);
  };

  // Enhanced handleSubmit with progress simulation
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep(2)) {
      return;
    }

    setIsLoading(true);
    setIsUploading(true);
    setUploadProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        const newProgress = prev + (Math.random() * 15);
        return newProgress >= 90 ? 90 : newProgress;
      });
    }, 400);

    try {
      const formData = new FormData();
      
      // The backend expects a single file upload
      formData.append('file', imageFile);
      
      // The backend expects a field called 'metadata' with stringified JSON
      formData.append('metadata', JSON.stringify({
        title,
        description,
        tags
      }));

      const response = await fetch('/api/image/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      // Complete the progress
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Pause briefly at 100% before proceeding
      await new Promise(resolve => setTimeout(resolve, 500));

      const data = await response.json();

      if (response.ok) {
        setUploadedImageUrl(data.filePath);
        setStep(3); // Move to success step
      } else {
        setError(data.message || "Failed to upload image");
        controls.start({
          x: [0, -10, 10, -10, 10, 0],
          transition: { duration: 0.5 }
        });
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      setError("An unexpected error occurred");
      
      controls.start({
        x: [0, -10, 10, -10, 10, 0],
        transition: { duration: 0.5 }
      });
    } finally {
      clearInterval(progressInterval);
      setIsLoading(false);
      setIsUploading(false);
    }
  };

  // Step indicator component
  const StepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      <div className="flex items-center">
        <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 1 ? 'bg-primary text-primary-content' : 'bg-base-300'}`}>
          {step > 1 ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <span className="font-medium">1</span>
          )}
        </div>
        <div className={`w-20 h-1 ${step >= 2 ? 'bg-primary' : 'bg-base-300'}`}></div>
        <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 2 ? 'bg-primary text-primary-content' : 'bg-base-300'}`}>
          {step > 2 ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <span className="font-medium">2</span>
          )}
        </div>
        <div className={`w-20 h-1 ${step >= 3 ? 'bg-primary' : 'bg-base-300'}`}></div>
        <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 3 ? 'bg-primary text-primary-content' : 'bg-base-300'}`}>
          <span className="font-medium">3</span>
        </div>
      </div>
    </div>
  );

  // Render specific step content
  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full"
          >
            <h2 className="text-xl font-bold mb-6 text-center">Choose an image to upload</h2>
            
            <div 
              className={`border-2 border-dashed rounded-lg p-6 h-80 sm:h-96 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                isDragging ? 'border-primary bg-primary/5' : 'border-base-300 hover:border-primary/50 hover:bg-base-200/30'
              } ${errors.file ? 'border-error' : ''}`}
              onClick={() => fileInputRef.current.click()}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              {imagePreview ? (
                <div className="relative w-full h-full">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="w-full h-full object-contain rounded-lg"
                    style={{ maxHeight: "calc(100% - 10px)" }}
                  />
                  <button 
                    type="button" 
                    className="absolute top-2 right-2 bg-base-100/90 rounded-full p-2 shadow-sm hover:bg-error/10 hover:text-error"
                    onClick={(e) => {
                      e.stopPropagation();
                      setImageFile(null);
                      setImagePreview(null);
                    }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center">
                  <svg className="w-16 h-16 text-base-content/30 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-base-content/70 text-center text-lg">
                    <span className="font-medium text-primary">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-sm text-base-content/50 mt-2">PNG, JPG (max 5MB)</p>
                </div>
              )}
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/png, image/jpeg"
                className="hidden"
              />
            </div>
            
            {errors.file && (
              <p className="text-error text-sm mt-2 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {errors.file}
              </p>
            )}

            <div className="flex justify-between mt-8">
              <button 
                type="button" 
                onClick={() => navigate(-1)}
                className="btn btn-ghost"
              >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handleNextStep}
                className="btn btn-primary"
                disabled={!imageFile}
              >
                Next
                <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          </motion.div>
        );
      
      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full"
          >
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="w-full sm:w-1/3">
                <div className="aspect-square rounded-lg overflow-hidden bg-base-200 mb-4">
                  {imagePreview && (
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <button 
                  type="button" 
                  onClick={() => setStep(1)}
                  className="btn btn-outline btn-sm w-full"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                  Change Image
                </button>
              </div>
              
              <div className="w-full sm:w-2/3 space-y-5">
                <h2 className="text-xl font-bold mb-4">Add details to your Pin</h2>
                
                {/* Title */}
                <div>
                  <div className="flex justify-between mb-1">
                    <label htmlFor="title" className="block text-sm font-medium">
                      Title <span className="text-error">*</span>
                    </label>
                    <span className={`text-xs ${title.length > 35 ? 'text-warning' : 'text-base-content/50'}`}>
                      {title.length}/40
                    </span>
                  </div>
                  <input
                    type="text"
                    id="title"
                    ref={titleInputRef}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onFocus={() => setActiveInput('title')}
                    onBlur={() => setActiveInput(null)}
                    className={`input input-bordered w-full ${errors.title ? 'input-error' : ''}`}
                    placeholder="Add a title"
                  />
                  
                  {errors.title && (
                    <p className="text-error text-sm mt-1">
                      {errors.title}
                    </p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <div className="flex justify-between mb-1">
                    <label htmlFor="description" className="block text-sm font-medium">
                      Description <span className="text-error">*</span>
                    </label>
                    <span className={`text-xs ${description.length > 450 ? 'text-warning' : 'text-base-content/50'}`}>
                      {description.length}/500
                    </span>
                  </div>
                  <textarea
                    id="description"
                    ref={descriptionInputRef}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    onFocus={() => setActiveInput('description')}
                    onBlur={() => setActiveInput(null)}
                    className={`textarea textarea-bordered w-full min-h-[120px] ${errors.description ? 'textarea-error' : ''}`}
                    placeholder="Tell everyone what your Pin is about"
                  />
                  
                  {errors.description && (
                    <p className="text-error text-sm mt-1">
                      {errors.description}
                    </p>
                  )}
                </div>

                {/* Tags */}
                <div>
                  <div className="flex justify-between mb-1">
                    <label htmlFor="tags" className="block text-sm font-medium">
                      Tags <span className="text-error">*</span>
                    </label>
                    <span className={`text-xs text-base-content/50`}>
                      {tags.length}/5 tags
                    </span>
                  </div>
                  <div className={`flex flex-wrap gap-2 p-3 border rounded-lg input-bordered ${errors.tags ? 'border-error' : ''}`}>
                    <AnimatePresence>
                      {tags.map((tag) => (
                        <motion.div 
                          key={tag}
                          className="bg-primary/10 text-primary px-3 py-1 rounded-full flex items-center"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.2 }}
                        >
                          <span>#{tag}</span>
                          <button 
                            type="button" 
                            onClick={() => removeTag(tag)}
                            className="ml-2 text-primary/70 hover:text-error"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    <input
                      type="text"
                      ref={tagInputRef}
                      value={tagInput}
                      onChange={handleTagInputChange}
                      onKeyDown={handleTagInputKeyDown}
                      onFocus={() => setActiveInput('tags')}
                      onBlur={() => {
                        setActiveInput(null);
                        tagInput.trim() && addTag();
                      }}
                      className="input input-sm input-ghost flex-grow min-w-[120px]"
                      placeholder={tags.length === 0 ? "Add a tag (press Enter)" : "Add another tag"}
                      disabled={tags.length >= 5}
                    />
                  </div>
                  
                  {errors.tags && (
                    <p className="text-error text-sm mt-1">
                      {errors.tags}
                    </p>
                  )}
                  <p className="text-xs text-base-content/50 mt-1.5">
                    Add up to 5 tags (#) to help people discover your Pin
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-8">
              <button 
                type="button" 
                onClick={handlePrevStep}
                className="btn btn-ghost"
              >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back
              </button>
              
              <button 
                type="button" 
                onClick={handleSubmit}
                className={`btn btn-primary ${isLoading ? 'loading' : ''}`}
                disabled={isLoading}
              >
                {isLoading ? 'Publishing...' : 'Publish Pin'}
              </button>
            </div>
            
            {/* Upload Progress Indicator */}
            <AnimatePresence>
              {isUploading && (
                <motion.div
                  className="mt-4 bg-base-200 rounded-full overflow-hidden shadow-inner"
                  initial={{ opacity: 0, y: 10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.div 
                    className="h-2 bg-primary"
                    style={{ width: progressBarWidth }}
                  />
                  <div className="flex justify-between px-2 py-1 text-xs text-base-content/70">
                    <span>Uploading your Pin...</span>
                    <span>{Math.round(uploadProgress)}%</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      
      case 3:
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full flex flex-col items-center"
          >
            <div className="w-24 h-24 bg-success/10 rounded-full flex items-center justify-center mb-6">
              <svg className="w-12 h-12 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h2 className="text-2xl font-bold mb-2 text-center">Pin published successfully!</h2>
            <p className="text-base-content/70 text-center max-w-md mb-8">
              Your Pin has been uploaded and will be reviewed before appearing on the site. 
              You can view your pending Pins in your profile.
            </p>
            
            {imagePreview && (
              <div className="w-64 h-64 rounded-lg overflow-hidden shadow-md mb-8">
                <img 
                  src={imagePreview} 
                  alt="Uploaded Pin" 
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            <div className="flex gap-4">
              <button 
                type="button" 
                onClick={() => {
                  // Reset form for new upload
                  setStep(1);
                  setImageFile(null);
                  setImagePreview(null);
                  setTitle("");
                  setDescription("");
                  setTags([]);
                  setTagInput("");
                  setErrors({});
                  setUploadedImageUrl(null);
                }}
                className="btn btn-outline"
              >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Create Another Pin
              </button>
              
              <button 
                type="button" 
                onClick={() => navigate('/profile')}
                className="btn btn-primary"
              >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Go to Profile
              </button>
            </div>
          </motion.div>
        );
      
      default:
        return null;
    }
  };

  return (
    <motion.div 
      className="min-h-screen bg-base-100 py-10 px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className="container mx-auto max-w-3xl"
        initial={{ y: 30 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 15 }}
      >
        <motion.div 
          className="bg-base-100 shadow-lg rounded-xl overflow-hidden border border-base-300/50"
          transition={{ duration: 0.3 }}
        >
          <div className="p-6 md:p-8">
            <motion.h1 
              className="text-2xl font-bold mb-6 text-center"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
            >
              Create New Pin
            </motion.h1>
            
            <StepIndicator />
            
            {error && (
              <motion.div 
                className="alert alert-error mb-6"
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <svg className="w-6 h-6 stroke-current shrink-0" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
                <button 
                  className="btn btn-sm btn-circle btn-ghost"
                  onClick={() => setError(null)}
                >×</button>
              </motion.div>
            )}
            
            <motion.div 
              className="relative"
              animate={controls}
            >
              <AnimatePresence mode="wait">
                {renderStepContent()}
              </AnimatePresence>
            </motion.div>
          </div>
        </motion.div>
        
        {step !== 3 && (
          <motion.div 
            className="mt-6 p-5 bg-base-200 rounded-lg shadow-sm border border-base-300/50"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.3 }}
          >
            <motion.h2 
              className="text-lg font-semibold mb-3 flex items-center"
              initial={{ x: -5 }}
              animate={{ x: 0 }}
              transition={{ delay: 0.4, duration: 0.2 }}
            >
              <svg className="w-5 h-5 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Upload Guidelines
            </motion.h2>
            <ul className="space-y-2 pl-5 text-base-content/80 list-disc">
              <li>Only upload images you have the right to share</li>
              <li>Images must be in JPG or PNG format</li>
              <li>Maximum file size is 5MB</li>
              <li>Pins must be appropriate for all audiences</li>
              <li>All pins are reviewed before they appear on the site</li>
            </ul>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default UploadImage;
