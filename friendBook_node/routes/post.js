const express = require('express');
const router = express.Router();
const Post = require('../models/post');
const User = require('../models/user');

// 获取所有动态（可根据需求加分页、筛选）
router.get('/', async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    
    // 获取每个帖子作者的信息
    const postsWithAuthorInfo = await Promise.all(posts.map(async (post) => {
      const postObj = post.toObject();
      try {
        const author = await User.findById(post.authorId);
        if (author) {
          postObj.authorName = author.nickname || author.username;
          postObj.authorAvatar = author.avatar;
        }
        
        // 获取每条评论的作者信息
        if (postObj.comments && postObj.comments.length > 0) {
          postObj.comments = await Promise.all(postObj.comments.map(async (comment) => {
            const commentObj = {...comment};
            try {
              const commentAuthor = await User.findById(comment.userId);
              if (commentAuthor) {
                commentObj.authorName = commentAuthor.nickname || commentAuthor.username;
              }
            } catch (err) {
              console.error('获取评论作者信息失败:', err);
            }
            return commentObj;
          }));
        }
      } catch (err) {
        console.error('获取作者信息失败:', err);
      }
      return postObj;
    }));
    
    res.json(postsWithAuthorInfo);
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

// 获取特定用户的所有帖子
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const posts = await Post.find({ authorId: userId }).sort({ createdAt: -1 });
    
    // 获取每个帖子作者的信息
    const postsWithAuthorInfo = await Promise.all(posts.map(async (post) => {
      const postObj = post.toObject();
      try {
        const author = await User.findById(post.authorId);
        if (author) {
          postObj.authorName = author.nickname || author.username;
          postObj.authorAvatar = author.avatar;
        }
        
        // 获取每条评论的作者信息
        if (postObj.comments && postObj.comments.length > 0) {
          postObj.comments = await Promise.all(postObj.comments.map(async (comment) => {
            const commentObj = {...comment};
            try {
              const commentAuthor = await User.findById(comment.userId);
              if (commentAuthor) {
                commentObj.authorName = commentAuthor.nickname || commentAuthor.username;
              }
            } catch (err) {
              console.error('获取评论作者信息失败:', err);
            }
            return commentObj;
          }));
        }
      } catch (err) {
        console.error('获取作者信息失败:', err);
      }
      return postObj;
    }));
    
    res.json(postsWithAuthorInfo);
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

// 发布动态
router.post('/', async (req, res) => {
  try {
    const { authorId, content, images, tags } = req.body;
    const post = new Post({ authorId, content, images, tags });
    await post.save();
    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

// 点赞/取消点赞
router.post('/:postId/like', async (req, res) => {
  try {
    const { postId } = req.params;
    // 修改：确保始终有userId，如果req.user不存在则从请求体获取
    const userId = req.body.userId;
    
    if (!userId) {
      return res.status(400).json({ message: '用户ID不能为空' });
    }
    
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: '帖子不存在' });
    
    // 检查用户是否已点赞
    const alreadyLiked = post.likes.some(like => like.userId.toString() === userId.toString());
    
    if (alreadyLiked) {
      return res.status(400).json({ message: '已经点过赞了' });
    }
    
    // 添加点赞
    post.likes.push({ userId });
    await post.save();
    
    res.json({ message: '点赞成功', likes: post.likes.length });
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

// 取消点赞
router.post('/:postId/unlike', async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.body.userId; // 从请求体获取用户ID
    
    if (!userId) {
      return res.status(400).json({ message: '用户ID不能为空' });
    }
    
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: '帖子不存在' });
    
    // 移除点赞
    post.likes = post.likes.filter(like => like.userId.toString() !== userId.toString());
    await post.save();
    
    res.json({ message: '取消点赞成功', likes: post.likes.length });
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

// 添加评论
router.post('/:postId/comment', async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    const userId = req.body.userId; // 从请求体获取用户ID
    
    if (!userId) {
      return res.status(400).json({ message: '用户ID不能为空' });
    }
    
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: '帖子不存在' });
    
    // 获取评论者信息
    const user = await User.findById(userId);
    const authorName = user ? (user.nickname || user.username) : '用户';
    
    // 添加评论
    const newComment = { userId, content, authorName };
    post.comments.push(newComment);
    await post.save();
    
    res.status(201).json({ message: '评论成功', comment: post.comments[post.comments.length - 1] });
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

// 删除评论
router.delete('/:postId/comment/:commentId', async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ message: '用户ID不能为空' });
    }
    
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: '帖子不存在' });
    
    // 找到要删除的评论
    const commentIndex = post.comments.findIndex(comment => 
      comment._id.toString() === commentId && comment.userId.toString() === userId
    );
    
    if (commentIndex === -1) {
      return res.status(403).json({ message: '没有权限删除此评论或评论不存在' });
    }
    
    // 删除评论
    post.comments.splice(commentIndex, 1);
    await post.save();
    
    res.json({ message: '评论已删除' });
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

// 修改删除动态API，添加权限验证
router.delete('/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ message: '用户ID不能为空' });
    }
    
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: '帖子不存在' });
    
    // 验证是否是帖子作者
    if (post.authorId.toString() !== userId) {
      return res.status(403).json({ message: '没有权限删除此帖子' });
    }
    
    await Post.findByIdAndDelete(postId);
    res.json({ message: '动态已删除' });
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

module.exports = router;