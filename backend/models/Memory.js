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
  visibility: { type: String, enum: ['public', 'friends', 'private'], default: 'public' },
  oceanVector: {
    O: { type: Number, default: null },
    C: { type: Number, default: null },
    E: { type: Number, default: null },
    A: { type: Number, default: null },
    N: { type: Number, default: null },
  },
  // ── NFT fields ─────────────────────────────────────────────────────────────
  nftTokenId: { type: Number, default: null },
  nftTxHash: { type: String, default: null },
  nftMintedAt: { type: Date, default: null },
});

memorySchema.virtual('likesCount').get(function () { return this.likes.length; });
memorySchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Memory', memorySchema);