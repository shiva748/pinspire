const jwt = require("jsonwebtoken");
const { handleError } = require("../snippets/error");
const User = require("../database/Schema/user");

const adminauth = async (req, res, next) => {
  try {
    if (!req.cookies) {
      handleError("No Authorization found", 401);
    }
    const userToken = req.cookies.auth_tkn;

    if (!userToken) {
      handleError("No Authorization found", 401);
    }

    let decodedUserToken = jwt.verify(userToken, process.env.KEY);
    if (!decodedUserToken) {
      handleError("No Authorization found", 401);
    }

    const user = await User.findById(decodedUserToken._id, {
      password: 0,
      jwtTokens: 0,
    });

    if (!user) {
      handleError("User not found", 404);
    }

    if (!user.isAdmin) {
      handleError("Not authorized as admin", 403);
    }

    // User is an admin, create admin object with necessary properties
    req.admin = {
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.isAdmin ? "admin" : "user",
      permissions: user.adminPermissions || [],
      isUserAdmin: true, // Flag to know this is a user with admin privileges
    };

    next();
  } catch (error) {
    console.error("Admin auth error:", error);
    res
      .status(error.status || 400)
      .json({ result: false, message: error.message });
  }
};

module.exports = adminauth;
