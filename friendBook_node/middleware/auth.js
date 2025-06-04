const jwt = require('jsonwebtoken');

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

module.exports = { authenticateToken, JWT_SECRET };