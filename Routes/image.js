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
  get_liked_images,
  track_view,
  get_popular_images,
  track_download
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

// === === === get liked images === === === //

Router.get("/liked", verify, get_liked_images);

// === === === delete image === === === //

Router.delete("/:id", verify, delete_image);

// === === === track image view === === === //

Router.post("/view/:image_id", track_view);

// === === === track image download === === === //

Router.post("/download/:image_id", track_download);

// === === === get popular images === === === //

Router.get("/popular", get_popular_images);

// === === === final exports === === === //

module.exports = Router;
