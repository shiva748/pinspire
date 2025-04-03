const { handleError } = require("../snippets/error");
const User = require("../database/Schema/user");
const image = require("../database/Schema/image");
const busboy = require("busboy");
const path = require("path");
const fs = require("fs");
const uniqid = require("uniqid");
// === === === follow a user === === === //

exports.follow = async (req, res) => {
  try {
    let { user_id } = req.body;
    let user = req.user;
    if (!user_id) {
      handleError("Invalid request", 400);
    }

    let users = await User.find({
      _id: { $in: [user_id, user._id] },
    });

    if (users.length !== 2) {
      handleError("Invalid request", 400);
    }
    let follower = users.find((u) => u._id.toString() === user._id.toString()); // The logged-in user
    let toBeFollowed = users.find(
      (u) => u._id.toString() === user_id.toString()
    );

    if (!follower || !toBeFollowed) {
      handleError("Invalid request", 400);
    }
    if (follower.following.includes(user_id)) {
      handleError("Invalid request", 400);
    }
    follower.following.push(user_id);
    toBeFollowed.followers.push(user._id);
    await follower.save();
    await toBeFollowed.save();
    return res.status(200).json({
      result: true,
      message: "you have followed the user successfully",
    });
  } catch (error) {
    res
      .status(error.status || 500)
      .json({ result: false, message: error.message });
  }
};

// === === === unfollow === === === //

exports.unfollow = async (req, res) => {
  try {
    let { user_id } = req.body;
    let user = req.user;
    if (!user_id) {
      handleError("Invalid request", 400);
    }

    let users = await User.find({
      _id: { $in: [user_id, user._id] },
    });

    if (users.length !== 2) {
      handleError("Invalid request", 400);
    }
    let follower = users.find((u) => u._id.toString() === user._id.toString()); // The logged-in user
    let toBeFollowed = users.find(
      (u) => u._id.toString() === user_id.toString()
    );

    if (!follower || !toBeFollowed) {
      handleError("Invalid request", 400);
    }
    if (!follower.following.includes(user_id)) {
      handleError("Invalid request", 400);
    }
    follower.following = follower.following.filter(
      (data) => data.toString() !== user_id.toString()
    );
    toBeFollowed.followers = toBeFollowed.followers.filter(
      (data) => data.toString() !== user._id.toString()
    );

    await follower.save();
    await toBeFollowed.save();
    return res.status(200).json({
      result: true,
      message: "you have unfollowed the user successfully",
    });
  } catch (error) {
    res
      .status(error.status || 500)
      .json({ result: false, message: error.message });
  }
};

// === === === get user profile === === === //

exports.getprofile = async (req, res) => {
  try {
    let { user_id } = req.params;
    if (!user_id) {
      handleError("Invalid request", 400);
    }
    let profile = await User.findById(user_id, {
      username: 1,
      profilePicture: 1,
      bio: 1,
      website: 1,
      followers: 1,
      following: 1,
    });
    if (!profile) {
      handleError("Invalid request", 404);
    }
    let images = await image.find({ user: profile._id }, { likes: 0 });
    return res
      .status(200)
      .json({ result: true, data: { ...profile._doc, images } });
  } catch (error) {
    res
      .status(error.status || 500)
      .json({ result: false, message: error.message });
  }
};

// === === === update user profile === === === //

exports.updateProfile = async (req, res) => {
  try {
    const { bio, website } = req.body;
    const user = req.user;

    // Validate the data
    if (bio && bio.length > 160) {
      handleError("Bio must be less than 160 characters", 400);
    }

    if (website) {
      // Simple URL validation
      if (!/^(https?:\/\/)?(www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/.test(website)) {
        handleError("Please enter a valid website URL", 400);
      }
    }

    // Update the user profile
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        $set: {
          bio: bio || "",
          website: website || "",
          updatedAt: Date.now(),
        },
      },
      { new: true, select: '-password -jwtTokens -__v' }
    );

    if (!updatedUser) {
      handleError("Failed to update profile", 404);
    }

    return res.status(200).json({
      result: true,
      message: "Profile updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    res
      .status(error.status || 500)
      .json({ result: false, message: error.message });
  }
};

// === === === upload profile picture === === === //

exports.uploadProfilePicture = async (req, res) => {
  try {
    const user = req.user;
    const profilePicDir = path.join(__dirname, "../public/profile");
    
    // Ensure directory exists
    if (!fs.existsSync(profilePicDir)) {
      fs.mkdirSync(profilePicDir, { recursive: true });
    }

    const bb = busboy({ headers: req.headers });
    
    let fileName = '';
    let fileReceived = false;
    let filePromise = new Promise((resolve, reject) => {
      bb.on('file', (name, file, info) => {
        fileReceived = true;
        const { filename, encoding, mimeType } = info;
        
        // Validate mime type
        if (!mimeType.startsWith('image/')) {
          return reject(new Error('Only image files are allowed'));
        }
        
        // Create unique filename
        const extension = path.extname(filename) || '.jpg'; // Default to jpg if no extension
        fileName = `${user._id}-${uniqid()}${extension}`;
        const filePath = path.join(profilePicDir, fileName);
        
        // Write the file
        const writeStream = fs.createWriteStream(filePath);
        file.pipe(writeStream);
        
        writeStream.on('finish', () => {
          resolve(fileName);
        });
        
        writeStream.on('error', (err) => {
          reject(new Error(`Error writing file: ${err.message}`));
        });
        
        file.on('end', () => {
          // This will be called when the file is fully read
          // but we wait for writeStream.finish for actual completion
        });
        
        file.on('error', (err) => {
          reject(new Error(`Error reading file: ${err.message}`));
        });
      });
      
      bb.on('error', (err) => {
        reject(new Error(`Busboy error: ${err.message}`));
      });
      
      bb.on('finish', () => {
        if (!fileReceived) {
          reject(new Error('No file was uploaded'));
        }
      });
    });
    
    req.pipe(bb);
    
    try {
      const profilePicFileName = await filePromise;
      
      // If user has an existing profile picture, delete it
      const existingUser = await User.findById(user._id);
      if (existingUser.profilePicture) {
        // Extract just the filename from the path
        const oldPicFileName = existingUser.profilePicture.replace('profile/', '');
        const oldPicPath = path.join(profilePicDir, oldPicFileName);
        if (fs.existsSync(oldPicPath)) {
          try {
            fs.unlinkSync(oldPicPath);
          } catch (err) {
            console.error("Failed to delete old profile picture:", err);
            // Continue with the update even if we couldn't delete the old file
          }
        }
      }
      
      // Update user with new profile picture
      const updatedUser = await User.findByIdAndUpdate(
        user._id,
        {
          $set: {
            profilePicture: `profile/${profilePicFileName}`,
            updatedAt: Date.now(),
          },
        },
        { new: true, select: '-password -jwtTokens -__v' }
      );
      
      if (!updatedUser) {
        handleError("Failed to update profile picture", 404);
      }
      
      return res.status(200).json({
        result: true,
        message: "Profile picture updated successfully",
        data: updatedUser,
      });
    } catch (fileError) {
      console.error("File processing error:", fileError);
      return res.status(400).json({
        result: false,
        message: fileError.message || "Error processing the uploaded file"
      });
    }
    
  } catch (error) {
    console.error("Profile picture upload error:", error);
    res
      .status(error.status || 500)
      .json({ result: false, message: error.message });
  }
};
