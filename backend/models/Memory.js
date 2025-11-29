const mongoose = require('mongoose');

// Comment subdocument schema
const commentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Memory schema
const memorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  caption: {
    type: String,
    required: [true, 'Caption is required'],
    maxlength: [500, 'Caption cannot exceed 500 characters'],
  },
  image: {
    type: String,
    default: null,
  },
  emotions: {
    type: [String],
    default: [],
  },
  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
  comments: [commentSchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  visibility: {
    type: String,
    enum: ['public', 'friends', 'private'],
    default: 'public',
  },
});

// Virtual field for likes count
memorySchema.virtual('likesCount').get(function () {
  return this.likes.length;
});

// Ensure virtual fields are serialized
memorySchema.set('toJSON', {
  virtuals: true,
});

const Memory = mongoose.model('Memory', memorySchema);

module.exports = Memory;

