const express = require('express');
const router = express.Router();
const ChatMessage = require('../models/chatMessage');

// 获取与某用户的聊天记录
router.get('/:userId/:friendId', async (req, res) => {
  try {
    const { userId, friendId } = req.params;
    const messages = await ChatMessage.find({
      $or: [
        { senderId: userId, receiverId: friendId },
        { senderId: friendId, receiverId: userId }
      ]
    }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

// 发送消息
router.post('/', async (req, res) => {
  try {
    const { senderId, receiverId, message, messageType } = req.body;
    const chatMessage = new ChatMessage({ senderId, receiverId, message, messageType });
    await chatMessage.save();
    res.status(201).json(chatMessage);
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

// 标记消息为已读
router.post('/read', async (req, res) => {
  try {
    const { messageIds } = req.body;
    await ChatMessage.updateMany({ _id: { $in: messageIds } }, { isRead: true });
    res.json({ message: '消息已标记为已读' });
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

module.exports = router; 