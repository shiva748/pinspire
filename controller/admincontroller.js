const { handleError } = require("../snippets/error");
const Admin = require("../database/Schema/admin");
let Image = require("../database/Schema/image");
const { login } = require("../snippets/validation");
const path = require("path");
const fs = require("fs");
const user = require("../database/Schema/user");

// === === === admin login === === === //

exports.login = async (req, res) => {
  try {
    login(req.body);
    let { email, username, password } = req.body;
    let admin = await Admin.findOne(
      {
        $or: [email ? { email: email.toLowerCase() } : { username }],
      },
      { createdAt: 0, updatedAt: 0 }
    );
    if (admin) {
      if (admin.comparePassword(password)) {
        let token = await admin.genrateauth(admin);
        res
          .status(200)
          .cookie("admin_auth_tkn", token, {
            expires: new Date(Date.now() + 86400000),
            httpOnly: true,
          })
          .json({
            success: true,
            message: "Login successful",
            data: {
              email: admin.email,
              username: admin.username,
              role: admin.role,
              Permissions: admin.permissions,
            },
          });
      } else {
        handleError("Invalid credentials", 400);
      }
    } else {
      handleError("Invalid credentials", 400);
    }
  } catch (error) {
    res
      .status(error.status || 500)
      .json({ result: false, message: error.message });
  }
};

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
    if (!image_id || !admin.permissions.includes("write")) {
      handleError("Invalid request", 400);
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
    if (!image_id || !admin.permissions.includes("write")) {
      handleError("Invalid request", 400);
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
    if (!username) {
      handleError("Invalid request", 400);
    }
    let users = await user.find(
      {
        username: { $in: new RegExp(username, "i") },
      },
      { jwtTokens: 0, password: 0 }
    );
    return res.status(200).json({ result: false, data: users });
  } catch (error) {
    res
      .status(error.status || 500)
      .json({ result: false, message: error.message });
  }
};
