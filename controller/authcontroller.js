const { handleError, handleMongoError } = require("../snippets/error");
const { register, login } = require("../snippets/validation");
const bcrypt = require("bcrypt");
const User = require("../database/Schema/user");

exports.register = async (req, res) => {
  try {
    register(req.body);
    let { email, username, password } = req.body;
    let USR = new User({
      email: email.toLowerCase(),
      username,
      password: await bcrypt.hash(password, 12),
    });
    let result = await USR.save();
    return res.status(201).json({
      result: true,
      message: "Your account has been successfully created.",
    });
  } catch (error) {
    error = handleMongoError(error);
    res
      .status(error.status || 400)
      .json({ result: false, message: error.message });
  }
};

// === === === login === === === //

exports.login = async (req, res) => {
  try {
    login(req.body);
    let { email, username, password } = req.body;
    let user = await User.findOne(
      {
        $or: [email ? { email: email.toLowerCase() } : { username }],
      },
      { createdAt: 0, updatedAt: 0 }
    );
    if (user) {
      if (bcrypt.compare(password, user.password)) {
        let token = await user.genrateauth(user);
        res
          .status(200)
          .cookie("auth_tkn", token, {
            expires: new Date(Date.now() + 604800000),
            httpOnly: true,
          })
          .json({
            success: true,
            message: "Login successful",
            data: {
              email: user.email,
              username: user.username,
              profilePicture: user.profilePicture,
              bio: user.bio,
              website: user.website,
              followers: user.followers,
              following: user.following,
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
      .status(error.status || 400)
      .json({ result: false, message: error.message });
  }
};

// === === === auth === === === //

exports.auth = async (req, res) => {
  try {
    let user = req.user;
    let profile = await User.findOne(
      { _id: user._id },
      { password: 0, jwtTokens: 0, createdAt: 0, updatedAt: 0, __v: 0 }
    );
    return res.status(200).json({ result: false, data: profile });
  } catch (error) {
    res
      .status(error.status || 400)
      .json({ result: false, message: error.message });
  }
};

// === === === logout === === === //

exports.logout = async (req, res) => {
  try {
    let { _id, token } = req.user;
    let user = await User.findOne({ _id });
    user.jwtTokens = user.jwtTokens.filter((data) => data.token != token);
    user.save();
    res
      .status(200)
      .clearCookie("auth_tkn")
      .json({ result: true, message: "logout was successful" });
  } catch (error) {
    res
      .status(error.status || 400)
      .json({ result: false, message: error.message });
  }
};
