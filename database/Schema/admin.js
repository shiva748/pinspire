const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const AdminSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      enum: ["superadmin", "admin", "moderator"],
      default: "admin",
    },
    permissions: {
      type: [String],
      default: ["read"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    jwtToken: {
      token: {
        type: String,
        required: true,
      },
      createdAt: {
        type: Date,
        default: Date.now,
        expires: 86400,
      },
    },
  },
  {
    timestamps: true,
  }
);

AdminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

AdminSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

AdminSchema.methods.genrateauth = async function () {
  try {
    let token = await jwt.sign({ _id: this._id }, process.env.KEY, {
      expiresIn: "1 days",
    });
    this.jwtToken = {
      token,
    };
    await this.save();
    return token;
  } catch (error) {
    throw error;
  }
};

const Admin = mongoose.model("Admin", AdminSchema);
module.exports = Admin;
