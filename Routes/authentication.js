const express = require("express");
const {
  register,
  login,
  auth,
  logout,
  searchUsers
} = require("../controller/authcontroller");
const Router = express.Router();
const verify = require("../middleware/authenticate");

// === === === register === === === //

Router.post("/register", register);

// === === === login === === === //

Router.post("/login", login);

// === === === auth === === === //

Router.get("/profile", verify, auth);

// === === === logout === === === //

Router.get("/logout", verify, logout);

// === === === search users === === === //

Router.get("/users/search", verify, searchUsers);

// === === === final exports === === === //
module.exports = Router;
