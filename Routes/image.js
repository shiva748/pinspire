const express = require("express");
const Router = express.Router();
const verify = require("../middleware/authenticate");
const {
  upload,
  search_image,
  like_image,
  unlike_image,
  get_all_images,
  delete_image,
} = require("../controller/imgcontroller");

// === === === upload image === === === //

Router.post("/upload", verify, upload);

// === === === search images === === === //

Router.post("/search", search_image);

// === === === get all approved images === === === //

Router.get("/all", get_all_images);

// === === === like a image === === === //

Router.post("/like", verify, like_image);

// === === === unlike image === === === //

Router.post("/unlike", verify, unlike_image);

// === === === delete image === === === //

Router.delete("/:id", verify, delete_image);

// === === === final exports === === === //

module.exports = Router;
