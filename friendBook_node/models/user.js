const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    minlength: 3
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    match: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  avatar: {
    type: String,
    default: '/images/default_avatar.svg'
  },
  nickname: {
    type: String,
    default: function() {
      return this.username;
    }
  },
  // 新增个人信息字段
  gender: {
    type: String,
    enum: ['male', 'female', 'other', ''],
    default: ''
  },
  birthday: {
    type: Date,
    default: null
  },
  bio: {
    type: String,
    maxlength: 500,
    default: ''
  },
  location: {
    type: String,
    default: ''
  },
  // 隐私设置
  privacy: {
    searchByUsername: {
      type: Boolean,
      default: true
    },
    searchByNickname: {
      type: Boolean,
      default: true
    },
    showBirthday: {
      type: Boolean,
      default: true
    },
    showEmail: {
      type: Boolean,
      default: false
    }
  },
  friends: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// 密码加密中间件
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// 密码比较方法
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);