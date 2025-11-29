const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// POST /api/follow/:userId - Follow a user
router.post('/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    // Check if trying to follow self
    if (currentUserId === userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot follow yourself',
      });
    }

    // Find target user
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Find current user
    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'Current user not found',
      });
    }

    // Check if already following
    if (currentUser.following.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Already following this user',
      });
    }

    // Add to following and followers arrays
    currentUser.following.push(userId);
    targetUser.followers.push(currentUserId);

    // Save both users
    await currentUser.save();
    await targetUser.save();

    res.json({
      success: true,
      followerCount: targetUser.followers.length,
      followingCount: currentUser.following.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// DELETE /api/follow/:userId - Unfollow a user
router.delete('/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    // Find target user
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Find current user
    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'Current user not found',
      });
    }

    // Remove from following and followers arrays
    currentUser.following = currentUser.following.filter(
      (id) => id.toString() !== userId
    );
    targetUser.followers = targetUser.followers.filter(
      (id) => id.toString() !== currentUserId
    );

    // Save both users
    await currentUser.save();
    await targetUser.save();

    res.json({
      success: true,
      followerCount: targetUser.followers.length,
      followingCount: currentUser.following.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// GET /api/follow/check/:userId - Check if following a user
router.get('/check/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const isFollowing = currentUser.following.some(
      (id) => id.toString() === userId
    );

    res.json({
      success: true,
      isFollowing,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// GET /api/follow/suggestions - Get suggested users to follow
router.get('/suggestions', auth, async (req, res) => {
  try {
    const currentUserId = req.user.id;

    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Find users not in following array and not self
    const followingIds = currentUser.following.map((id) => id.toString());
    followingIds.push(currentUserId);

    const suggestedUsers = await User.find({
      _id: { $nin: followingIds },
    })
      .select('username email _id followers')
      .limit(10)
      .lean();

    // Format response with followerCount
    const suggestions = suggestedUsers.map((user) => ({
      id: user._id,
      username: user.username,
      email: user.email,
      followerCount: user.followers?.length || 0,
    }));

    res.json({
      success: true,
      suggestions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;

