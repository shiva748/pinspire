const express = require("express");
const Router = express.Router();
const {
  follow,
  unfollow,
  getprofile,
} = require("../controller/basicontroller");
const verify = require("../middleware/authenticate");

// === === === follow a user === === === //

Router.post("/user/follow", verify, follow);

// === === === unfollow a user === === === //

Router.post("/user/unfollow", verify, unfollow);

// === === === get user profile === === === //

Router.get("/user/profile/:user_id", verify, getprofile);

// === === === final exports === === === //

module.exports = Router;
