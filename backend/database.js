const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.db');

// 创建数据库连接
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
    initDatabase();
  }
});

// 初始化数据库表
function initDatabase() {
  // 创建用户表
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error('Error creating users table:', err.message);
    }
  });

  // 创建计时器表
  db.run(`CREATE TABLE IF NOT EXISTS timers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    start_time DATETIME,
    paused_at DATETIME,
    total_paused_duration INTEGER DEFAULT 0,
    is_running INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`, (err) => {
    if (err) {
      console.error('Error creating timers table:', err.message);
    }
  });
}

// 用户相关操作
function getUserByUsername(username) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

function createUser(username) {
  return new Promise((resolve, reject) => {
    db.run('INSERT INTO users (username) VALUES (?)', [username], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID, username });
      }
    });
  });
}

function getUserOrCreate(username) {
  return new Promise(async (resolve, reject) => {
    try {
      let user = await getUserByUsername(username);
      if (!user) {
        user = await createUser(username);
      }
      resolve(user);
    } catch (err) {
      reject(err);
    }
  });
}

// 计时器相关操作
function getTimersByUserId(userId) {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM timers WHERE user_id = ? ORDER BY created_at DESC', [userId], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

function createTimer(userId, name) {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO timers (user_id, name, is_running) VALUES (?, ?, 0)',
      [userId, name],
      function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, user_id: userId, name, is_running: 0 });
        }
      }
    );
  });
}

function getTimerById(timerId) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM timers WHERE id = ?', [timerId], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

function updateTimer(timerId, updates) {
  return new Promise((resolve, reject) => {
    const fields = [];
    const values = [];
    
    for (const [key, value] of Object.entries(updates)) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
    
    values.push(timerId);
    
    const query = `UPDATE timers SET ${fields.join(', ')} WHERE id = ?`;
    
    db.run(query, values, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ changes: this.changes });
      }
    });
  });
}

function deleteTimer(timerId) {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM timers WHERE id = ?', [timerId], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ changes: this.changes });
      }
    });
  });
}

module.exports = {
  db,
  getUserByUsername,
  createUser,
  getUserOrCreate,
  getTimersByUserId,
  createTimer,
  getTimerById,
  updateTimer,
  deleteTimer
};

