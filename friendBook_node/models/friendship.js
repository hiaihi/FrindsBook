const mongoose = require('mongoose');

const friendshipSchema = new mongoose.Schema({
  user1: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  user2: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  group: {
    type: String,
    default: '我的好友'
  },
  remark: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// 创建复合索引确保不会有重复的好友关系
friendshipSchema.index({ user1: 1, user2: 1 }, { unique: true });

module.exports = mongoose.model('Friendship', friendshipSchema);