const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/user');
const FriendRequest = require('../models/friendRequest');
const Friendship = require('../models/friendship');

// 新增静态资源托管
router.use('/api/images/avatars', express.static(path.join(__dirname, '../public/images/avatars')));

// JWT密钥
const JWT_SECRET = 'your-secret-key';

// JWT鉴权中间件
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: '未授权访问' });
  }
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: '令牌无效' });
    }
    req.user = user;
    next();
  });
}

// Multer配置
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../public/images/avatars'));
  },
  filename: (req, file, cb) => {
    const username = req.user.username;
    const ext = path.extname(file.originalname);
    cb(null, `${username}_avatar${ext}`);
  }
});

// 文件过滤器 - 只允许图片文件
const fileFilter = (req, file, cb) => {
  // 检查文件类型
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('只允许上传图片文件'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 限制5MB
  fileFilter: fileFilter
});

// 用户注册
router.post('/register', async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ message: '请填写所有必填字段' });
    }
    
    // 验证邮箱格式
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: '邮箱格式不正确' });
    }
    
    // 检查用户名或邮箱是否已存在
    const existingUser = await User.findOne({ $or: [ { username }, { email } ] });
    if (existingUser) {
      if (existingUser.username === username) {
        return res.status(400).json({ message: '用户名已存在' });
      } else {
        return res.status(400).json({ message: '邮箱已被注册' });
      }
    }
    
    // 创建新用户
    const user = new User({ 
      username, 
      email, 
      password,
      avatar: '/images/default_avatar.svg',
      nickname: username
    });
    await user.save();
    
    res.status(201).json({ message: '注册成功' });
  } catch (error) {
    console.error('注册错误:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ 
      message: '注册失败', 
      error: error.message,
      details: error.stack
    });
  }
});

// 用户登录
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    // 查找用户
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }
    // 验证密码
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }
    // 生成JWT令牌
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    res.json({ token, username: user.username });
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

// 获取用户个人资料路由
// 返回当前登录用户的详细信息
router.get('/profile', authenticateToken, async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: '未授权访问' });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

// 单独处理头像上传
router.post('/uploadAvatar', authenticateToken, upload.single('avatarFile'), async (req, res) => {
  try {
    const username = req.user.username;
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }
    
    if (req.file) {
      const ext = path.extname(req.file.originalname);
      const avatarFilename = `${username}_avatar${ext}`;
      const newPath = path.join(__dirname, '../public/images/avatars', avatarFilename);
      
      // 删除旧头像
      // if (user.avatar && user.avatar !== '/images/default_avatar.svg') {
      //   console.log('删除旧头像:', user.avatar);
      //   const oldAvatarPath = path.join(__dirname, '../public', user.avatar);
      //   console.log('Old avatar path:', oldAvatarPath);
      //   if (fs.existsSync(oldAvatarPath)) {
      //     fs.unlinkSync(oldAvatarPath);
      //   }
      // }
      
      // 保存新头像
      console.log('New avatar path:', newPath);
      fs.renameSync(req.file.path, newPath);
      user.avatar = `/images/avatars/${avatarFilename}`;
      await user.save();
      
      res.json({ 
        success: true, 
        avatar: user.avatar,
        message: '头像上传成功'
      });
    } else {
      res.status(400).json({ success: false, message: '未上传头像文件' });
    }
  } catch (error) {
    console.error('头像上传失败:', error);
    res.status(501).json({ success: false, message: '服务器错误' });
  }
});

// 更新用户信息（不包含头像）
router.post('/updateProfile', authenticateToken, async (req, res) => {
  try {
    const username = req.user.username;
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }
    
    // 解析隐私设置
    let privacy = user.privacy;
    if (req.body.privacy) {
      try {
        privacy = JSON.parse(req.body.privacy);
      } catch (e) {
        console.error('解析隐私设置失败:', e);
        privacy = user.privacy;
      }
    }
    
    // 更新字段
    user.nickname = req.body.nickname || user.nickname;
    user.email = req.body.email || user.email;
    user.gender = req.body.gender || user.gender;
    
    // 处理生日字段
    if (req.body.birthday) {
      try {
        const birthdayDate = new Date(req.body.birthday);
        if (!isNaN(birthdayDate.getTime())) {
          user.birthday = birthdayDate;
        }
      } catch (e) {
        console.error('解析生日日期失败:', e);
      }
    } else {
      user.birthday = null;
    }
    
    user.location = req.body.location || user.location;
    user.bio = req.body.bio || user.bio;
    user.privacy = privacy;
    
    await user.save();
    res.json({ success: true, user });
  } catch (error) {
    console.error('更新用户信息失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});


// 搜索用户API
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { query } = req.query;
    if (!query || query.trim() === '') {
      return res.status(400).json({ message: '搜索关键词不能为空' });
    }
    
    // 构建搜索条件，考虑用户隐私设置
    const searchConditions = [
      // 搜索允许通过用户名搜索的用户
      { username: { $regex: query, $options: 'i' }, 'privacy.searchByUsername': true },
      // 搜索允许通过昵称搜索的用户
      { nickname: { $regex: query, $options: 'i' }, 'privacy.searchByNickname': true }
    ];
    
    // 执行搜索，限制返回10个结果
    const users = await User.find({ $or: searchConditions })
      .select('_id username nickname avatar')
      .limit(10);
    
    res.json(users);
  } catch (error) {
    console.error('搜索用户失败:', error);
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

// 根据ID获取用户信息
router.get('/profile/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }
    
    // 根据隐私设置过滤信息
    const userInfo = {
      _id: user._id,
      username: user.username,
      nickname: user.nickname,
      avatar: user.avatar,
      gender: user.gender,
      location: user.location,
      bio: user.bio
    };
    
    // 根据隐私设置决定是否返回生日和邮箱
    if (user.privacy.showBirthday) {
      userInfo.birthday = user.birthday;
    }
    
    if (user.privacy.showEmail) {
      userInfo.email = user.email;
    }
    
    res.json(userInfo);
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

module.exports = router;
