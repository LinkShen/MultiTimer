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

// 静态文件服务（前端）
app.use(express.static(path.join(__dirname, '../frontend')));

// API路由
app.use('/api/users', usersRoutes);
app.use('/api/timers', timersRoutes);

// 根路径重定向到登录页
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

// 启动服务器
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://0.0.0.0:${PORT}`);
  console.log(`Server is accessible at http://localhost:${PORT}`);
});

