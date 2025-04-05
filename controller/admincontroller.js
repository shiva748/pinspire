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

// === === === get stats === === === //

exports.get_stats = async (req, res) => {
  try {
    // Import Visitor model
    const Visitor = require("../database/Schema/visitor");
    
    // Get total users count
    const totalUsers = await user.countDocuments();
    
    // Get total images count
    const totalImages = await Image.countDocuments();
    
    // Get approved images count
    const approvedImages = await Image.countDocuments({ approved: true });
    
    // Get pending images count
    const pendingImages = await Image.countDocuments({ approved: false });
    
    // Get most viewed images (top 10)
    const mostViewedImages = await Image.find({ approved: true })
      .sort({ 'views.total': -1 })
      .limit(10)
      .select('title views.total views.unique');
    
    // Get most liked images (top 10)
    const mostLikedImages = await Image.find({ approved: true })
      .sort({ likeCount: -1 })
      .limit(10)
      .select('title likeCount');
    
    // Calculate total views across all images
    const imageStats = await Image.aggregate([
      { $match: { approved: true } },
      { $group: {
        _id: null,
        totalViews: { $sum: '$views.total' },
        totalUniqueViews: { $sum: '$views.unique' },
        averageViews: { $avg: '$views.total' },
        averageLikes: { $avg: '$likeCount' }
      }}
    ]);
    
    // Get visitor stats from real data
    // Get the current date at midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get the date 7 days ago at midnight
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);
    
    // Total visitors (count unique IPs)
    const totalIPs = await Visitor.distinct('ip');
    const totalVisitors = totalIPs.length;
    
    // Today's visitors (count unique IPs from today)
    const todayIPs = await Visitor.distinct('ip', {
      timestamp: { $gte: today }
    });
    const todayVisitors = todayIPs.length;
    
    // This week's visitors (count unique IPs from past 7 days)
    const weeklyIPs = await Visitor.distinct('ip', {
      timestamp: { $gte: weekAgo }
    });
    const weeklyVisitors = weeklyIPs.length;
    
    // Get visitor trend data
    const lastDays = 7;
    const dailyVisitors = [];
    
    for (let i = 0; i < lastDays; i++) {
      const day = new Date();
      day.setDate(day.getDate() - i);
      day.setHours(0, 0, 0, 0);
      
      const nextDay = new Date(day);
      nextDay.setDate(nextDay.getDate() + 1);
      
      const uniqueIPs = await Visitor.distinct('ip', {
        timestamp: { 
          $gte: day, 
          $lt: nextDay 
        }
      });
      
      dailyVisitors.push({
        date: day.toISOString().split('T')[0],
        count: uniqueIPs.length
      });
    }
    
    // Get most visited paths (excluding API calls)
    const popularPaths = await Visitor.aggregate([
      { 
        $match: { 
          path: { $not: /^\/api\// } 
        } 
      },
      { 
        $group: {
          _id: "$path",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    return res.status(200).json({
      result: true,
      data: {
        users: {
          total: totalUsers
        },
        images: {
          total: totalImages,
          approved: approvedImages,
          pending: pendingImages,
          mostViewed: mostViewedImages,
          mostLiked: mostLikedImages,
          engagement: imageStats.length > 0 ? imageStats[0] : {
            totalViews: 0,
            totalUniqueViews: 0,
            averageViews: 0,
            averageLikes: 0
          }
        },
        visitors: {
          total: totalVisitors,
          today: todayVisitors,
          week: weeklyVisitors,
          trend: dailyVisitors,
          popularPaths: popularPaths
        }
      }
    });
  } catch (error) {
    res
      .status(error.status || 500)
      .json({ result: false, message: error.message });
  }
};
