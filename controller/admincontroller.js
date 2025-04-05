const { handleError } = require("../snippets/error");
let Image = require("../database/Schema/image");
const path = require("path");
const fs = require("fs");
const user = require("../database/Schema/user");


// === === == admin profile === === === //

exports.admin_profile = async (req, res) => {
  try {
    let admin = req.admin;
    return res.status(200).json({ result: true, data: admin._doc });
  } catch (error) {
    res
      .status(error.status || 500)
      .json({ result: false, message: error.message });
  }
};

// === === === approve image === === === //

exports.approve_image = async (req, res) => {
  try {
    const admin = req.admin;
    let { image_id } = req.body;
    
    // Check if admin has write permission
    const hasPermission = admin.permissions && 
      (admin.permissions.includes('write') || admin.permissions.includes('superadmin'));
    
    if (!image_id || !hasPermission) {
      handleError("Invalid request or insufficient permissions", 400);
    }
    
    let result = await Image.updateOne({ _id: image_id }, { approved: true });
    return res
      .status(200)
      .json({ result: true, message: "Image approved successfully" });
  } catch (error) {
    res
      .status(error.status || 500)
      .json({ result: false, message: error.message });
  }
};

// === === === de-list image === === === //

exports.de_list = async (req, res) => {
  try {
    const admin = req.admin;
    let { image_id } = req.body;
    
    // Check if admin has write permission
    const hasPermission = admin.permissions && 
      (admin.permissions.includes('write') || admin.permissions.includes('superadmin'));
    
    if (!image_id || !hasPermission) {
      handleError("Invalid request or insufficient permissions", 400);
    }
    
    let result = await Image.updateOne({ _id: image_id }, { approved: false });
    return res
      .status(200)
      .json({ result: true, message: "Image de-listed successfully" });
  } catch (error) {
    res
      .status(error.status || 500)
      .json({ result: false, message: error.message });
  }
};

// === === === image waiting === === === //

exports.image_waiting = async (req, res) => {
  try {
    let images = await Image.find({ approved: false });
    return res.status(200).json({ result: false, data: images });
  } catch (error) {
    res
      .status(error.status || 500)
      .json({ result: false, message: error.message });
  }
};

// === === === delete image === === === //

exports.delete_image = async (req, res) => {
  try {
    let { image_id } = req.body;
    const uploadDir = path.join(__dirname, "../public/");
    if (!image_id) {
      handleError("Invalid request", 400);
    }
    let image = await Image.findById(image_id);
    if (!image) {
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

// === === === get user profile === === === //

exports.get_user_profile = async (req, res) => {
  try {
    let { username } = req.body;
    let query = {};
    
    // If username is provided, use it as a search parameter
    if (username && username.trim() !== '') {
      query.username = { $regex: new RegExp(username, "i") };
    }
    
    // Find users with the query, limit to 50 users max
    let users = await user.find(
      query,
      { jwtTokens: 0, password: 0 }
    ).limit(50);
    
    return res.status(200).json({ 
      result: true, 
      count: users.length,
      data: users 
    });
  } catch (error) {
    res
      .status(error.status || 500)
      .json({ result: false, message: error.message });
  }
};

// === === === toggle admin status === === === //

exports.toggle_admin_status = async (req, res) => {
  try {
    const admin = req.admin;
    const { user_id } = req.body;
    
    // Check if the admin has proper permissions
    const hasPermission = 
      (admin.role === 'superadmin') || 
      (admin.permissions && admin.permissions.includes('admin-management')) ||
      (admin.isUserAdmin && admin.permissions && admin.permissions.includes('admin-management'));
    
    if (!hasPermission) {
      handleError("You don't have permission to perform this action", 403);
    }
    
    if (!user_id) {
      handleError("User ID is required", 400);
    }
    
    const targetUser = await user.findById(user_id);
    
    if (!targetUser) {
      handleError("User not found", 404);
    }
    
    // Toggle the admin status
    targetUser.isAdmin = !targetUser.isAdmin;
    
    // If making user an admin, grant basic permissions
    if (targetUser.isAdmin && (!targetUser.adminPermissions || targetUser.adminPermissions.length === 0)) {
      targetUser.adminPermissions = ['read', 'write'];
    }
    
    // If removing admin status, clear admin permissions
    if (!targetUser.isAdmin) {
      targetUser.adminPermissions = [];
    }
    
    await targetUser.save();
    
    return res.status(200).json({
      result: true,
      message: targetUser.isAdmin ? "User is now an admin" : "Admin access has been removed",
      data: {
        isAdmin: targetUser.isAdmin,
        adminPermissions: targetUser.adminPermissions
      }
    });
    
  } catch (error) {
    res
      .status(error.status || 500)
      .json({ result: false, message: error.message });
  }
};
