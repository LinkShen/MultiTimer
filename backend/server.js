const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const usersRoutes = require('./routes/users');
const timersRoutes = require('./routes/timers');

const app = express();
const PORT = process.env.PORT || 5990;

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// API路由（必须在静态文件之前）
app.use('/api/users', usersRoutes);
app.use('/api/timers', timersRoutes);

// 支持 /timer/:username 路径，自动登录
// 这个路由必须在静态文件服务之前，否则会被静态文件服务拦截
app.get('/timer/:username', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

app.get('/timer/:username/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

// 处理 /timer/ 路径（不带用户名）
app.get('/timer/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

// 静态文件服务（前端）- 排除 index.html，由路由处理
app.use(express.static(path.join(__dirname, '../frontend'), {
  index: false  // 禁用默认的 index.html
}));

// 根路径重定向到登录页
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

// index.html 由前端 JavaScript 处理登录检查
app.get('/index.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// 启动服务器
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://0.0.0.0:${PORT}`);
  console.log(`Server is accessible at http://localhost:${PORT}`);
});

