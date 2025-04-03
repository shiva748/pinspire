import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

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

  const fileInputRef = useRef(null);
  const navigate = useNavigate();

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

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep(2)) {
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      
      // The backend expects a single file upload
      formData.append('file', imageFile);
      
      // The backend expects a field called 'metadata' with stringified JSON
      // The busboy parser will parse this JSON directly in the backend
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

      const data = await response.json();

      if (response.ok) {
        // Add custom success notification
        const successNotification = document.createElement('div');
        successNotification.className = 'fixed top-20 right-4 z-50 bg-white rounded-lg shadow-md p-4 flex items-start gap-3 max-w-xs animate-slide-in';
        successNotification.innerHTML = `
          <div class="flex-shrink-0 w-5 h-5 mt-0.5 rounded-full bg-success/10 flex items-center justify-center">
            <svg class="w-3 h-3 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p class="font-medium text-sm">Your Pin has been successfully uploaded. Please wait while we review and approve your image.</p>
          </div>
        `;
        successNotification.style.cssText = 'animation: slideIn 0.3s ease-out forwards;';
        document.body.appendChild(successNotification);
        
        // Add animation to CSS
        const styleTag = document.createElement('style');
        styleTag.textContent = `
          @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
        `;
        document.head.appendChild(styleTag);
        
        // Remove after 5 seconds
        setTimeout(() => {
          successNotification.style.cssText = 'animation: slideOut 0.3s ease-in forwards;';
          styleTag.textContent += `
            @keyframes slideOut {
              from { transform: translateX(0); opacity: 1; }
              to { transform: translateX(100%); opacity: 0; }
            }
          `;
          setTimeout(() => {
            document.body.removeChild(successNotification);
            document.head.removeChild(styleTag);
          }, 300);
        }, 5000);
        
        setUploadedImageUrl(data.filePath);
        setStep(3); // Move to success step
      } else {
        setError(data.message || "Failed to upload image");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Step indicator component
  const StepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      <div className="flex items-center">
        <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 1 ? 'bg-primary text-primary-content' : 'bg-base-300'}`}>
          1
        </div>
        <div className={`w-20 h-1 ${step >= 2 ? 'bg-primary' : 'bg-base-300'}`}></div>
        <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 2 ? 'bg-primary text-primary-content' : 'bg-base-300'}`}>
          2
        </div>
        <div className={`w-20 h-1 ${step >= 3 ? 'bg-primary' : 'bg-base-300'}`}></div>
        <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 3 ? 'bg-primary text-primary-content' : 'bg-base-300'}`}>
          3
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
              className={`border-2 border-dashed rounded-lg p-4 h-80 sm:h-96 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                isDragging ? 'border-primary bg-primary/5' : 'border-base-300 hover:border-primary/50'
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
                    className="w-full h-full object-contain"
                  />
                  <button 
                    type="button" 
                    className="absolute top-2 right-2 bg-base-100 rounded-full p-1 shadow-md hover:bg-base-200"
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
                <>
                  <svg className="w-16 h-16 text-base-content/30 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-base-content/70 text-center text-lg">
                    <span className="font-medium text-primary">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-sm text-base-content/50 mt-1">PNG, JPG (max 5MB)</p>
                </>
              )}
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/png, image/jpeg"
                className="hidden"
              />
            </div>
            {errors.file && <p className="text-error text-sm mt-2">{errors.file}</p>}

            <div className="flex justify-between mt-8">
              <button 
                type="button" 
                onClick={() => navigate(-1)}
                className="btn btn-ghost"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handleNextStep}
                className="btn btn-primary"
                disabled={!imageFile}
              >
                Next
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
                  Change Image
                </button>
              </div>
              
              <div className="w-full sm:w-2/3 space-y-5">
                <h2 className="text-xl font-bold mb-4">Add details to your Pin</h2>
                
                {/* Title */}
                <div>
                  <label htmlFor="title" className="block text-sm font-medium mb-1">
                    Title <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className={`input input-bordered w-full ${errors.title ? 'input-error' : ''}`}
                    placeholder="Add a title"
                  />
                  {errors.title && <p className="text-error text-sm mt-1">{errors.title}</p>}
                  <p className="text-xs text-base-content/50 mt-1">{title.length}/40 characters</p>
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium mb-1">
                    Description <span className="text-error">*</span>
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className={`textarea textarea-bordered w-full min-h-[120px] ${errors.description ? 'textarea-error' : ''}`}
                    placeholder="Tell everyone what your Pin is about"
                  />
                  {errors.description && <p className="text-error text-sm mt-1">{errors.description}</p>}
                  <p className="text-xs text-base-content/50 mt-1">{description.length}/500 characters</p>
                </div>

                {/* Tags */}
                <div>
                  <label htmlFor="tags" className="block text-sm font-medium mb-1">
                    Tags <span className="text-error">*</span>
                  </label>
                  <div className={`flex flex-wrap gap-2 p-2 border rounded-lg ${errors.tags ? 'border-error' : 'border-base-300'}`}>
                    {tags.map((tag, index) => (
                      <div key={index} className="bg-base-200 text-base-content px-3 py-1 rounded-full flex items-center">
                        <span>{tag}</span>
                        <button 
                          type="button" 
                          onClick={() => removeTag(tag)}
                          className="ml-2 text-base-content/70 hover:text-error"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                    <input
                      type="text"
                      value={tagInput}
                      onChange={handleTagInputChange}
                      onKeyDown={handleTagInputKeyDown}
                      onBlur={() => tagInput.trim() && addTag()}
                      className="input input-sm input-ghost flex-grow min-w-[120px]"
                      placeholder={tags.length === 0 ? "Add a tag (press Enter)" : "Add another tag"}
                      disabled={tags.length >= 5}
                    />
                  </div>
                  {errors.tags && <p className="text-error text-sm mt-1">{errors.tags}</p>}
                  <p className="text-xs text-base-content/50 mt-1">
                    Add up to 5 tags to help people find your Pin (3-25 characters each)
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
          </motion.div>
        );
      
      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
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
              <div className="w-48 h-48 rounded-lg overflow-hidden shadow-md mb-8">
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
                Create Another Pin
              </button>
              <button 
                type="button" 
                onClick={() => navigate('/profile')}
                className="btn btn-primary"
              >
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
    <div className="container mx-auto max-w-3xl py-8 px-4">
      <div className="bg-base-100 shadow-lg rounded-lg overflow-hidden">
        <div className="p-6 md:p-8">
          <h1 className="text-2xl font-bold mb-6 text-center">Create New Pin</h1>
          
          <StepIndicator />
          
          <AnimatePresence mode="wait">
            {renderStepContent()}
          </AnimatePresence>
        </div>
      </div>
      
      {step !== 3 && (
        <div className="mt-8 p-6 bg-base-200 rounded-lg">
          <h2 className="text-lg font-semibold mb-3">Upload Guidelines</h2>
          <ul className="space-y-2 list-disc pl-5 text-base-content/80">
            <li>Only upload images you have the right to share</li>
            <li>Images must be in JPG or PNG format</li>
            <li>Maximum file size is 5MB</li>
            <li>Pins must be appropriate for all audiences</li>
            <li>All pins are reviewed before they appear on the site</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default UploadImage;
