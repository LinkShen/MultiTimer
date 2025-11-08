# 多计时器应用

一个功能完整的网页版计时器应用，支持多用户管理和多个计时器。

## 功能特性

- ✅ 用户管理：无需密码验证，输入用户名即可登录或自动创建用户
- ✅ 多计时器：每个用户可以创建多个计时器
- ✅ 计时器控制：开始、暂停、重置、设置开始时刻
- ✅ 持久化存储：计时器进度自动保存到数据库
- ✅ 自动暂停：网页关闭时自动暂停所有运行中的计时器

## 技术栈

- **后端**: Node.js + Express + SQLite
- **前端**: HTML + CSS + JavaScript (原生)

## 项目结构

```
multi-timer/
├── backend/           # 后端服务
│   ├── server.js     # 服务器主文件
│   ├── database.js   # 数据库操作
│   ├── routes/       # API路由
│   │   ├── users.js  # 用户相关路由
│   │   └── timers.js # 计时器相关路由
│   └── package.json  # 后端依赖
├── frontend/         # 前端文件
│   ├── index.html    # 主页面
│   ├── login.html    # 登录页面
│   ├── app.js        # 前端逻辑
│   └── styles.css    # 样式文件
└── README.md         # 项目说明
```

## 安装和运行

### 1. 安装后端依赖

```bash
cd backend
npm install
```

### 2. 启动后端服务器

**方式一：使用 npm 命令**
```bash
npm start
```

**方式二：使用启动脚本（Linux/Mac）**
```bash
./start.sh
```

**方式三：使用启动脚本（Windows）**
```bash
start.bat
```

服务器将在 `http://localhost:5990` 启动

### 3. 访问前端

在浏览器中打开 `http://localhost:5990`，会自动跳转到登录页面。

## 使用说明

1. **登录**: 在登录页面输入用户名，如果用户不存在会自动创建
2. **创建计时器**: 在主页面输入计时器名称，点击"创建"按钮
3. **控制计时器**:
   - **开始**: 启动计时器
   - **暂停**: 暂停计时器
   - **重置**: 将计时器重置为0
   - **设置开始时刻**: 可以手动设置计时器的开始时间
4. **删除计时器**: 点击计时器卡片上的"删除"按钮
5. **退出登录**: 点击右上角的"退出"按钮

## API 接口

### 用户接口

- `POST /api/users/login` - 用户登录/创建
  ```json
  {
    "username": "用户名"
  }
  ```

### 计时器接口

- `GET /api/timers/user/:userId` - 获取用户的所有计时器
- `POST /api/timers` - 创建计时器
  ```json
  {
    "user_id": 1,
    "name": "计时器名称"
  }
  ```
- `PUT /api/timers/:timerId/start` - 开始计时器
- `PUT /api/timers/:timerId/pause` - 暂停计时器
- `PUT /api/timers/:timerId/reset` - 重置计时器
- `PUT /api/timers/:timerId/set-time` - 设置开始时刻
  ```json
  {
    "startTime": "2024-01-01T00:00:00.000Z"
  }
  ```
- `PUT /api/timers/user/:userId/pause-all` - 暂停用户所有计时器
- `DELETE /api/timers/:timerId` - 删除计时器

## 数据库结构

### users 表
- `id`: 用户ID（主键）
- `username`: 用户名（唯一）
- `created_at`: 创建时间

### timers 表
- `id`: 计时器ID（主键）
- `user_id`: 用户ID（外键）
- `name`: 计时器名称
- `start_time`: 开始时间
- `paused_at`: 暂停时间
- `total_paused_duration`: 累计暂停时长（毫秒）
- `is_running`: 是否运行中（0=否，1=是）
- `created_at`: 创建时间

## 注意事项

- 数据存储在 SQLite 数据库中（`backend/database.db`）
- 页面关闭时会自动暂停所有运行中的计时器
- 计时器时间计算考虑了暂停时间，确保准确性

## 开发说明

- 后端使用 Express 框架，提供 RESTful API
- 前端使用原生 JavaScript，无需构建工具
- 数据库使用 SQLite，无需单独安装数据库服务
- 支持跨域请求（CORS）

