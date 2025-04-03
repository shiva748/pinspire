const { handleError } = require("../snippets/error");
const User = require("../database/Schema/user");
const image = require("../database/Schema/image");
// === === === follow a user === === === //

exports.follow = async (req, res) => {
  try {
    let { user_id } = req.body;
    let user = req.user;
    if (!user_id) {
      handleError("Invalid request", 400);
    }

    let users = await User.find({
      _id: { $in: [user_id, user._id] },
    });

    if (users.length !== 2) {
      handleError("Invalid request", 400);
    }
    let follower = users.find((u) => u._id.toString() === user._id.toString()); // The logged-in user
    let toBeFollowed = users.find(
      (u) => u._id.toString() === user_id.toString()
    );

    if (!follower || !toBeFollowed) {
      handleError("Invalid request", 400);
    }
    if (follower.following.includes(user_id)) {
      handleError("Invalid request", 400);
    }
    follower.following.push(user_id);
    toBeFollowed.followers.push(user._id);
    await follower.save();
    await toBeFollowed.save();
    return res.status(200).json({
      result: true,
      message: "you have followed the user successfully",
    });
  } catch (error) {
    res
      .status(error.status || 500)
      .json({ result: false, message: error.message });
  }
};

// === === === unfollow === === === //

exports.unfollow = async (req, res) => {
  try {
    let { user_id } = req.body;
    let user = req.user;
    if (!user_id) {
      handleError("Invalid request", 400);
    }

    let users = await User.find({
      _id: { $in: [user_id, user._id] },
    });

    if (users.length !== 2) {
      handleError("Invalid request", 400);
    }
    let follower = users.find((u) => u._id.toString() === user._id.toString()); // The logged-in user
    let toBeFollowed = users.find(
      (u) => u._id.toString() === user_id.toString()
    );

    if (!follower || !toBeFollowed) {
      handleError("Invalid request", 400);
    }
    if (!follower.following.includes(user_id)) {
      handleError("Invalid request", 400);
    }
    follower.following = follower.following.filter(
      (data) => data.toString() !== user_id.toString()
    );
    toBeFollowed.followers = toBeFollowed.followers.filter(
      (data) => data.toString() !== user._id.toString()
    );

    await follower.save();
    await toBeFollowed.save();
    return res.status(200).json({
      result: true,
      message: "you have unfollowed the user successfully",
    });
  } catch (error) {
    res
      .status(error.status || 500)
      .json({ result: false, message: error.message });
  }
};

// === === === get user profile === === === //

exports.getprofile = async (req, res) => {
  try {
    let { user_id } = req.params;
    if (!user_id) {
      handleError("Invalid request", 400);
    }
    let profile = await User.findById(user_id, {
      username: 1,
      profilePicture: 1,
      bio: 1,
      website: 1,
      followers: 1,
      following: 1,
    });
    if (!profile) {
      handleError("Invalid request", 404);
    }
    let images = await image.find({ user: profile._id }, { likes: 0 });
    return res
      .status(200)
      .json({ result: true, data: { ...profile._doc, images } });
  } catch (error) {
    res
      .status(error.status || 500)
      .json({ result: false, message: error.message });
  }
};
