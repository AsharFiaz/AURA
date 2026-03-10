const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const memorySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  caption: {
    type: String,
    required: [true, 'Caption is required'],
    maxlength: [500, 'Caption cannot exceed 500 characters'],
  },
  image: { type: String, default: null },
  video: { type: String, default: null },
  emotions: { type: [String], default: [] },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [commentSchema],
  createdAt: { type: Date, default: Date.now },
  visibility: {
    type: String,
    enum: ['public', 'friends', 'private'],
    default: 'public',
  },
  // ── OCEAN vector derived from AI analysis of this memory ──────────────────
  oceanVector: {
    O: { type: Number, default: null },  // Openness
    C: { type: Number, default: null },  // Conscientiousness
    E: { type: Number, default: null },  // Extraversion
    A: { type: Number, default: null },  // Agreeableness
    N: { type: Number, default: null },  // Neuroticism
  },
});

memorySchema.virtual('likesCount').get(function () {
  return this.likes.length;
});

memorySchema.set('toJSON', { virtuals: true });

const Memory = mongoose.model('Memory', memorySchema);
module.exports = Memory;