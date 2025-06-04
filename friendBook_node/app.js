var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/database');
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const postRouter = require('./routes/post');
const chatRouter = require('./routes/chat');
const aiRouter = require('./routes/ai');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST']
  }
});

// WebSocket连接处理模块
const setupWebSocket = (ioInstance) => {
  ioInstance.on('connection', (socket) => {
    console.log('用户已连接');

    socket.on('disconnect', () => {
      console.log('用户已断开连接');
    });

    socket.on('chatMessage', (msg) => {
      ioInstance.emit('chatMessage', msg);
    });
  });
};

// 初始化WebSocket
setupWebSocket(io);

// 连接数据库
connectDB();

// 中间件配置
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// CORS配置
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// 基础中间件
app.use(logger('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: false }));
app.use(cookieParser());
// 静态资源配置（保留一处即可）
const publicPath = path.join(__dirname, 'public');
app.use('/images', express.static(path.join(publicPath, 'images')));

// 访问路径应为：
// http://localhost:3000/images

app.use('/', indexRouter);
app.use('/api/users', usersRouter);
app.use('/api/posts', postRouter);
app.use('/chat', chatRouter);
app.use('/api/ai', aiRouter);

// 404错误处理
app.use(function(req, res, next) {
  next(createError(404, '请求的资源不存在'));
});

// 全局错误处理
app.use(function(err, req, res, next) {
  // 设置错误信息
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // 返回JSON格式错误响应
  res.status(err.status || 500);
  res.json({
    error: {
      message: err.message,
      status: err.status || 500,
      stack: req.app.get('env') === 'development' ? err.stack : undefined
    }
  });
});

module.exports = { app, server };
