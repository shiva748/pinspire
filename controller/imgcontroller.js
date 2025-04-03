const fs = require("fs");
const path = require("path");
const Busboy = require("busboy");
const uniqid = require("uniqid");
const { handleError } = require("../snippets/error");
const { fileupload } = require("../snippets/validation");
const image = require("../database/Schema/image");

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
      .json({ result: false, messgae: error.message });
  }
};

// === === === delete image === === === //

exports.delete_image = async (req, res) => {
  try {
    let user = req.user;
    let { image_id } = req.body;
    const uploadDir = path.join(__dirname, "../public/");
    if (!image_id) {
      handleError("Invalid request", 400);
    }
    let img = await image.findById(image_id);
    if (!img || img.user != user._id) {
      handleError("Invalid request", 400);
    }
    fs.unlinkSync(path.join(uploadDir, image.imageUrl));
    await Image.deleteOne({ _id: image_id });
    res
      .status(200)
      .json({ result: true, message: "Image deleted successfully" });
  } catch (error) {
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
