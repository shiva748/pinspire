const express = require("express");
const {
  login,
  admin_profile,
  approve_image,
  de_list,
  image_waiting,
  delete_image,
  get_user_profile,
} = require("../controller/admincontroller");
const Router = express.Router();
const adminauth = require("../middleware/adminauth");
// === === === admin login === === === //

Router.post("/login", login);

// === === === admin profile === === === //

Router.get("/profile", adminauth, admin_profile);

// === === === admin approve image === === === //

Router.post("/approveimage", adminauth, approve_image);

// === === === de-list image === === === //

Router.post("/delistimage", adminauth, de_list);

// === === === get images waiting for approval === === === //

Router.get("/pendingimage", adminauth, image_waiting);

// === === === delete image === === === //

Router.post("/deleteimage", adminauth, delete_image);

// === === === get user profile === === === //

Router.post("/getusers", adminauth, get_user_profile);

module.exports = Router;
