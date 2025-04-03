const jwt = require("jsonwebtoken");
const { handleError } = require("../snippets/error");
const Admin = require("../database/Schema/admin");
const adminauth = async (req, res, next) => {
  try {
    if (!req.cookies) {
      handleError("No Authorization found", 401);
    }
    const token = req.cookies.admin_auth_tkn;
    if (!token) {
      handleError("No Authorization found", 401);
    }
    let decodedtoken = jwt.verify(token, process.env.KEY);
    if (!decodedtoken) {
      handleError("No Authorization found", 401);
    }
    const admin = await Admin.findById(decodedtoken._id, {
      password: 0,
      jwtToken: 0,
    });
    if (!admin) {
      handleError("Invalid request", 400);
    }
    req.admin = admin;
    next();
  } catch (error) {
    res
      .status(error.status || 400)
      .json({ result: false, message: error.message });
  }
};

module.exports = adminauth;
