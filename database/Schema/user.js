const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const { Schema } = mongoose;

const UserSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 50,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      match: [/.+@.+\..+/, "Please enter a valid email address"],
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
    },
    profilePicture: {
      type: String,
      default: null,
    },
    bio: {
      type: String,
      maxlength: 160,
      default: "",
    },
    website: {
      type: String,
      match: [/^https?:\/\/.+/, "Please enter a valid URL"],
      default: "",
    },
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    isAdmin: {
      type: Boolean,
      default: false,
    },
    adminPermissions: {
      type: [String],
      default: []
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    jwtTokens: [
      {
        token: {
          type: String,
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
          expires: 604800,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

UserSchema.methods.genrateauth = async function () {
  try {
    let token = await jwt.sign({ _id: this._id }, process.env.KEY, {
      expiresIn: "7 days",
    });
    this.jwtTokens.push({ token });
    await this.save();
    return token;
  } catch (error) {
    throw error;
  }
};

module.exports = mongoose.model("User", UserSchema);
