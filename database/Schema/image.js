const mongoose = require("mongoose");
const { Schema } = mongoose;

const imageSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  imageUrl: {
    type: String,
    required: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  tags: [
    {
      type: String,
      trim: true,
    },
  ],
  likes: [
    {
      user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      likedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  likeCount: {
    type: Number,
    default: 0,
  },
  views: {
    total: {
      type: Number,
      default: 0
    },
    unique: {
      type: Number,
      default: 0
    },
    viewedBy: [{
      ip: String,
      timestamp: {
        type: Date,
        default: Date.now
      }
    }]
  },
  downloads: {
    total: {
      type: Number,
      default: 0
    },
    unique: {
      type: Number,
      default: 0
    },
    downloadedBy: [{
      ip: String,
      timestamp: {
        type: Date,
        default: Date.now
      }
    }]
  },
  approved: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

imageSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Image", imageSchema);
