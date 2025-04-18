const fs = require("fs");
const path = require("path");
const Busboy = require("busboy");
const uniqid = require("uniqid");
const { handleError } = require("../snippets/error");
const { fileupload } = require("../snippets/validation");
const image = require("../database/Schema/image");
const mongoose = require('mongoose');

exports.upload = async (req, res) => {
  try {
    const user = req.user;
    const busboy = Busboy({ headers: req.headers });
    const uploadDir = path.join(__dirname, "../public/");

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    let fields = {};
    let uploadPath;
    let fileCount = 0;
    let savedFileName;
    let uploadRejected = false;

    busboy.on("field", (fieldname, value) => {
      fields = JSON.parse(value);
    });

    busboy.on("file", (fieldname, file, fileInfo) => {
      fileCount++;

      if (fileCount > 1) {
        uploadRejected = true;
        return handleError("Only one file is allowed.", 400);
      }

      const allowedMimeTypes = ["image/jpeg", "image/png"];
      if (!allowedMimeTypes.includes(fileInfo.mimeType)) {
        uploadRejected = true;
        return handleError("Only JPG and PNG files are allowed.", 400);
      }

      savedFileName = uniqid("img-") + `.${fileInfo.mimeType.split("/")[1]}`;
      uploadPath = path.join(uploadDir, savedFileName);
      const writeStream = fs.createWriteStream(uploadPath);

      file.pipe(writeStream);

      writeStream.on("finish", () => {
        console.log("File successfully saved:", uploadPath);
      });

      writeStream.on("error", (err) => {
        console.error("File write error:", err);
        uploadRejected = true;
        return handleError("File upload failed.", 500);
      });
    });

    busboy.on("finish", async () => {
      if (uploadRejected || fileCount > 1) {
        if (savedFileName) {
          fs.unlinkSync(path.join(uploadDir, savedFileName));
        }
        return res
          .status(400)
          .json({ result: false, message: "Only one file is allowed." });
      }

      if (!savedFileName) {
        return res
          .status(400)
          .json({ result: false, message: "No valid image file uploaded." });
      }
      let validate = fileupload(fields);
      if (!validate.result) {
        fs.unlinkSync(path.join(uploadDir, savedFileName));
        return res
          .status(validate.status)
          .json({ result: false, message: validate.message });
      }
      let img = new image({
        ...fields,
        imageUrl: savedFileName,
        user: user._id,
      });
      await img.save();
      return res.status(201).json({
        result: true,
        message:
          "Your file has been successfully uploaded. Please wait while we review and approve your image.",
        filePath: savedFileName,
      });
    });
    busboy.on("error", (error) => {
      console.error("Error during upload:", error);
      return handleError("File upload failed.", 500);
    });

    req.pipe(busboy);
  } catch (error) {
    res
      .status(error.status || 400)
      .json({ result: false, message: error.message });
  }
};

// === === === search images === === === //

exports.search_image = async (req, res) => {
  try {
    let { query } = req.body;
    if (!query) {
      return res
        .status(400)
        .json({ result: false, message: "Query is required" });
    }

    let queryWords = query.split(" ").map((word) => new RegExp(word, "i"));

    let images = await image.find({
      $or: [
        { title: { $in: queryWords } },
        { description: { $in: queryWords } },
        { tags: { $elemMatch: { $in: queryWords } } },
      ],
      approved: true,
    });

    res.status(200).json({ result: true, images });
  } catch (error) {
    res
      .status(error.status || 500)
      .json({ result: false, message: error.message });
  }
};

// === === === like image === === === //

exports.like_image = async (req, res) => {
  try {
    let { image_id } = req.body;
    if (!image_id) {
      handleError("Invalid request", 400);
    }
    let user = req.user;
    let img = await image.findById(image_id);
    if (!img) {
      handleError("Invalid request", 400);
    } else if (!img.approved) {
      handleError("Invalid request", 400);
    }
    if (img.likes.some((data) => data.user == user._id)) {
      handleError("Invalid request", 400);
    } else {
      img.likes.push({ user: user._id });
      img.likeCount++;
      await img.save();
      return res
        .status(200)
        .json({ result: true, message: "Added to liked images" });
    }
  } catch (error) {
    res
      .status(error.status || 500)
      .json({ result: false, message: error.message });
  }
};

// === === === unlike image === === === //

exports.unlike_image = async (req, res) => {
  try {
    let { image_id } = req.body;
    if (!image_id) {
      handleError("Invalid request", 400);
    }
    let user = req.user;
    let img = await image.findById(image_id);
    if (!img) {
      handleError("Invalid request", 400);
    } else if (!img.approved) {
      handleError("Invalid request", 400);
    }
    if (!img.likes.some((data) => data.user == user._id)) {
      handleError("Invalid request", 400);
    } else {
      img.likes = img.likes.filter((data) => data.user != user._id);
      img.likeCount--;
      await img.save();
      return res
        .status(200)
        .json({ result: true, message: "Removed from liked images" });
    }
  } catch (error) {
    res
      .status(error.status || 500)
      .json({ result: false, message: error.message });
  }
};

// === === === get liked images === === === //

exports.get_liked_images = async (req, res) => {
  try {
    const user = req.user;
    const userId = mongoose.Types.ObjectId.isValid(user._id) 
      ? new mongoose.Types.ObjectId(user._id) 
      : user._id;
    
    console.log('Fetching liked images for user:', userId);
    
    // Find all approved images that the user has liked
    const likedImages = await image.find({
      approved: true,
      'likes.user': userId
    })
    .populate('user', 'username profilePicture')
    .sort({ createdAt: -1 });
    
    console.log('Found liked images count:', likedImages.length);
    
    // Make sure we're returning a properly formatted response
    const formattedImages = likedImages.map(img => {
      // Convert Mongoose document to plain object
      const plainImg = img.toObject ? img.toObject() : img;
      
      return {
        ...plainImg,
        // Ensure user field has consistent format
        user: {
          _id: plainImg.user._id || plainImg.user,
          username: plainImg.user.username || 'Unknown',
          profileImg: plainImg.user.profilePicture || null
        }
      };
    });
    
    return res.status(200).json({
      result: true,
      likedImages: formattedImages
    });
  } catch (error) {
    console.error('Error getting liked images:', error);
    res
      .status(error.status || 500)
      .json({ result: false, message: error.message || 'Failed to fetch liked images' });
  }
};

// === === === delete image === === === //

exports.delete_image = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    
    if (!id) {
      return handleError("Image ID is required", 400);
    }
    
    // Find the image
    const img = await image.findById(id);
    
    if (!img) {
      return handleError("Image not found", 404);
    }
    
    // Check if the user is the owner of the image
    if (img.user.toString() !== user._id.toString()) {
      return handleError("You are not authorized to delete this image", 403);
    }
    
    // Delete the image file from the server
    const uploadDir = path.join(__dirname, "../public/");
    const imagePath = path.join(uploadDir, img.imageUrl);
    
    try {
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    } catch (err) {
      console.error("Error deleting image file:", err);
      // Continue with deletion even if file removal fails
    }
    
    // Delete the image from the database
    await image.findByIdAndDelete(id);
    
    return res.status(200).json({
      result: true,
      message: "Image deleted successfully"
    });
    
  } catch (error) {
    console.error("Delete image error:", error);
    res
      .status(error.status || 500)
      .json({ result: false, message: error.message });
  }
};

// === === === get all approved images === === === //

exports.get_all_images = async (req, res) => {
  try {
    // Get query parameters for pagination and filtering
    const { page = 1, limit = 20, tag } = req.query;
    
    // Build the query - always get approved images only
    const query = { approved: true };
    
    // Add tag filter if provided
    if (tag && tag !== 'All') {
      query.tags = tag;
    }
    
    // Execute query with pagination
    const images = await image
      .find(query)
      .sort({ createdAt: -1 }) // Sort by newest first
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('user', 'username profileImg'); // Get user info
    
    // Get total count for pagination
    const count = await image.countDocuments(query);
    
    // Get all available tags for filtering
    const allTags = await image.distinct('tags', { approved: true });
    
    return res.status(200).json({
      result: true, 
      images,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalImages: count,
      availableTags: ['All', ...allTags]
    });
  } catch (error) {
    res
      .status(error.status || 500)
      .json({ result: false, message: error.message });
  }
};

// === === === track image view === === === //

exports.track_view = async (req, res) => {
  try {
    const { image_id } = req.params;
    if (!image_id) {
      return res.status(400).json({ result: false, message: "Image ID is required" });
    }
    
    // Get visitor IP
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    
    // Find the image
    const img = await image.findById(image_id);
    if (!img) {
      return res.status(404).json({ result: false, message: "Image not found" });
    }
    
    // Only track views for approved images
    if (!img.approved) {
      return res.status(400).json({ result: false, message: "Image is not approved" });
    }
    
    // Initialize views object if it doesn't exist
    if (!img.views) {
      img.views = {
        total: 0,
        unique: 0,
        viewedBy: []
      };
    }
    
    // Always increment total views
    img.views.total += 1;
    
    // Check if this IP has viewed before
    const hasViewed = img.views.viewedBy.some(view => view.ip === ip);
    
    // If it's a new viewer, add to unique count
    if (!hasViewed) {
      img.views.unique += 1;
      img.views.viewedBy.push({
        ip,
        timestamp: new Date()
      });
    } else {
      // Update timestamp for returning viewer
      const viewerIndex = img.views.viewedBy.findIndex(view => view.ip === ip);
      if (viewerIndex !== -1) {
        img.views.viewedBy[viewerIndex].timestamp = new Date();
      }
    }
    
    // Limit the size of viewedBy array to prevent it from growing too large
    // Keep only the most recent 1000 viewers
    if (img.views.viewedBy.length > 1000) {
      img.views.viewedBy = img.views.viewedBy
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 1000);
    }
    
    await img.save();
    
    return res.status(200).json({
      result: true,
      totalViews: img.views.total,
      uniqueViews: img.views.unique
    });
  } catch (error) {
    console.error('Error tracking view:', error);
    res
      .status(error.status || 500)
      .json({ result: false, message: error.message });
  }
};

// === === === get popular images === === === //

exports.get_popular_images = async (req, res) => {
  try {
    const { period = 'week', limit = 20 } = req.query;
    let cutoffDate = new Date();
    
    // Determine the cutoff date based on the requested period
    switch (period) {
      case 'day':
        cutoffDate.setDate(cutoffDate.getDate() - 1);
        break;
      case 'week':
        cutoffDate.setDate(cutoffDate.getDate() - 7);
        break;
      case 'month':
        cutoffDate.setMonth(cutoffDate.getMonth() - 1);
        break;
      default:
        cutoffDate.setDate(cutoffDate.getDate() - 7); // Default to week
    }
    
    // Find approved images with recent views
    const popularImages = await image.aggregate([
      { $match: { approved: true } },
      { 
        $addFields: {
          // Count recent views (views within the cutoff period)
          recentViews: {
            $size: {
              $filter: {
                input: "$views.viewedBy",
                as: "view",
                cond: { $gte: ["$$view.timestamp", cutoffDate] }
              }
            }
          }
        }
      },
      { $sort: { recentViews: -1, likeCount: -1, "views.total": -1 }},
      { $limit: parseInt(limit) },
      { 
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "userDetails"
        }
      },
      { 
        $addFields: {
          user: { $arrayElemAt: ["$userDetails", 0] }
        }
      },
      { 
        $project: {
          userDetails: 0,
          "user.password": 0,
          "user.jwtTokens": 0,
          "views.viewedBy": 0
        }
      }
    ]);
    
    return res.status(200).json({
      result: true,
      images: popularImages,
      period
    });
  } catch (error) {
    console.error('Error getting popular images:', error);
    res
      .status(error.status || 500)
      .json({ result: false, message: error.message });
  }
};

// === === === track image download === === === //

exports.track_download = async (req, res) => {
  try {
    const { image_id } = req.params;
    if (!image_id) {
      return res.status(400).json({ result: false, message: "Image ID is required" });
    }
    
    // Get visitor IP
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    
    // Find the image
    const img = await image.findById(image_id);
    if (!img) {
      return res.status(404).json({ result: false, message: "Image not found" });
    }
    
    // Only track downloads for approved images
    if (!img.approved) {
      return res.status(400).json({ result: false, message: "Image is not approved" });
    }
    
    // Initialize downloads object if it doesn't exist
    if (!img.downloads) {
      img.downloads = {
        total: 0,
        unique: 0,
        downloadedBy: []
      };
    }
    
    // Always increment total downloads
    img.downloads.total += 1;
    
    // Check if this IP has downloaded before
    const hasDownloaded = img.downloads.downloadedBy.some(download => download.ip === ip);
    
    // If it's a new downloader, add to unique count
    if (!hasDownloaded) {
      img.downloads.unique += 1;
      img.downloads.downloadedBy.push({
        ip,
        timestamp: new Date()
      });
    } else {
      // Update timestamp for returning downloader
      const downloaderIndex = img.downloads.downloadedBy.findIndex(download => download.ip === ip);
      if (downloaderIndex !== -1) {
        img.downloads.downloadedBy[downloaderIndex].timestamp = new Date();
      }
    }
    
    // Limit the size of downloadedBy array to prevent it from growing too large
    // Keep only the most recent 1000 downloaders
    if (img.downloads.downloadedBy.length > 1000) {
      img.downloads.downloadedBy = img.downloads.downloadedBy
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 1000);
    }
    
    await img.save();
    
    return res.status(200).json({
      result: true,
      totalDownloads: img.downloads.total,
      uniqueDownloads: img.downloads.unique
    });
  } catch (error) {
    console.error('Error tracking download:', error);
    res
      .status(error.status || 500)
      .json({ result: false, message: error.message });
  }
};
