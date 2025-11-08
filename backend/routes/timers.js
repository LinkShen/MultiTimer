const express = require('express');
const router = express.Router();
const {
  getTimersByUserId,
  createTimer,
  getTimerById,
  updateTimer,
  deleteTimer
} = require('../database');

// 获取用户的所有计时器
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const timers = await getTimersByUserId(userId);
    res.json({ timers });
  } catch (error) {
    console.error('Get timers error:', error);
    res.status(500).json({ error: '获取计时器失败' });
  }
});

// 创建计时器
router.post('/', async (req, res) => {
  try {
    const { user_id, name } = req.body;
    
    if (!user_id || !name || name.trim() === '') {
      return res.status(400).json({ error: '用户ID和计时器名称不能为空' });
    }
    
    const timer = await createTimer(user_id, name.trim());
    res.json({ timer });
  } catch (error) {
    console.error('Create timer error:', error);
    res.status(500).json({ error: '创建计时器失败' });
  }
});

// 开始计时器
router.put('/:timerId/start', async (req, res) => {
  try {
    const { timerId } = req.params;
    const timer = await getTimerById(timerId);
    
    if (!timer) {
      return res.status(404).json({ error: '计时器不存在' });
    }
    
    const now = new Date();
    const nowISO = now.toISOString();
    let updates = {
      is_running: 1,
      paused_at: null
    };
    
    // 如果计时器之前没有开始过，设置开始时间
    if (!timer.start_time) {
      updates.start_time = nowISO;
      updates.total_paused_duration = 0;
    } else {
      // 如果是从暂停状态恢复，需要累计暂停时间
      // paused_at 记录的是最后一次暂停的时刻
      // 从 paused_at 到 now 的时间就是这次暂停的时长
      if (timer.paused_at) {
        const pausedStart = new Date(timer.paused_at).getTime();
        const pausedEnd = now.getTime();
        const pausedDuration = pausedEnd - pausedStart;
        updates.total_paused_duration = (parseInt(timer.total_paused_duration) || 0) + pausedDuration;
      }
      // 如果没有 paused_at，说明之前是运行状态，不需要更新 total_paused_duration
    }
    
    await updateTimer(timerId, updates);
    const updatedTimer = await getTimerById(timerId);
    res.json({ timer: updatedTimer });
  } catch (error) {
    console.error('Start timer error:', error);
    res.status(500).json({ error: '启动计时器失败' });
  }
});

// 暂停计时器
router.put('/:timerId/pause', async (req, res) => {
  try {
    const { timerId } = req.params;
    const timer = await getTimerById(timerId);
    
    if (!timer) {
      return res.status(404).json({ error: '计时器不存在' });
    }
    
    if (!timer.is_running) {
      return res.status(400).json({ error: '计时器未运行' });
    }
    
    const now = new Date().toISOString();
    await updateTimer(timerId, {
      is_running: 0,
      paused_at: now
    });
    
    const updatedTimer = await getTimerById(timerId);
    res.json({ timer: updatedTimer });
  } catch (error) {
    console.error('Pause timer error:', error);
    res.status(500).json({ error: '暂停计时器失败' });
  }
});

// 重置计时器
router.put('/:timerId/reset', async (req, res) => {
  try {
    const { timerId } = req.params;
    const timer = await getTimerById(timerId);
    
    if (!timer) {
      return res.status(404).json({ error: '计时器不存在' });
    }
    
    await updateTimer(timerId, {
      start_time: null,
      paused_at: null,
      total_paused_duration: 0,
      is_running: 0
    });
    
    const updatedTimer = await getTimerById(timerId);
    res.json({ timer: updatedTimer });
  } catch (error) {
    console.error('Reset timer error:', error);
    res.status(500).json({ error: '重置计时器失败' });
  }
});

// 设置开始时刻
router.put('/:timerId/set-time', async (req, res) => {
  try {
    const { timerId } = req.params;
    const { startTime } = req.body;
    
    const timer = await getTimerById(timerId);
    if (!timer) {
      return res.status(404).json({ error: '计时器不存在' });
    }
    
    if (!startTime) {
      return res.status(400).json({ error: '开始时间不能为空' });
    }
    
    // 验证时间格式
    const time = new Date(startTime);
    if (isNaN(time.getTime())) {
      return res.status(400).json({ error: '无效的时间格式' });
    }
    
    await updateTimer(timerId, {
      start_time: time.toISOString(),
      total_paused_duration: 0,
      paused_at: null,
      is_running: timer.is_running
    });
    
    const updatedTimer = await getTimerById(timerId);
    res.json({ timer: updatedTimer });
  } catch (error) {
    console.error('Set time error:', error);
    res.status(500).json({ error: '设置时间失败' });
  }
});

// 批量暂停用户的所有计时器
router.put('/user/:userId/pause-all', async (req, res) => {
  try {
    const { userId } = req.params;
    const timers = await getTimersByUserId(userId);
    
    const now = new Date().toISOString();
    const promises = timers
      .filter(t => t.is_running === 1)
      .map(timer => updateTimer(timer.id, {
        is_running: 0,
        paused_at: now
      }));
    
    await Promise.all(promises);
    const updatedTimers = await getTimersByUserId(userId);
    res.json({ timers: updatedTimers });
  } catch (error) {
    console.error('Pause all timers error:', error);
    res.status(500).json({ error: '暂停所有计时器失败' });
  }
});

// 更新计时器名称
router.put('/:timerId/name', async (req, res) => {
  try {
    const { timerId } = req.params;
    const { name } = req.body;
    
    const timer = await getTimerById(timerId);
    if (!timer) {
      return res.status(404).json({ error: '计时器不存在' });
    }
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: '计时器名称不能为空' });
    }
    
    await updateTimer(timerId, { name: name.trim() });
    const updatedTimer = await getTimerById(timerId);
    res.json({ timer: updatedTimer });
  } catch (error) {
    console.error('Update timer name error:', error);
    res.status(500).json({ error: '更新计时器名称失败' });
  }
});

// 删除计时器
router.delete('/:timerId', async (req, res) => {
  try {
    const { timerId } = req.params;
    const result = await deleteTimer(timerId);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: '计时器不存在' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Delete timer error:', error);
    res.status(500).json({ error: '删除计时器失败' });
  }
});

module.exports = router;

