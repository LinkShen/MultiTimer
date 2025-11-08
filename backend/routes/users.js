const express = require('express');
const router = express.Router();
const { getUserOrCreate } = require('../database');

// 用户登录或创建
router.post('/login', async (req, res) => {
  try {
    const { username } = req.body;
    
    if (!username || username.trim() === '') {
      return res.status(400).json({ error: '用户名不能为空' });
    }
    
    const user = await getUserOrCreate(username.trim());
    res.json({ user });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: '登录失败' });
  }
});

module.exports = router;

