# 服务管理指南

## systemd 服务管理命令

### 查看服务状态
```bash
systemctl status multi-timer.service
```

### 启动服务
```bash
systemctl start multi-timer.service
```

### 停止服务
```bash
systemctl stop multi-timer.service
```

### 重启服务
```bash
systemctl restart multi-timer.service
```

### 重新加载配置（修改服务文件后）
```bash
systemctl daemon-reload
systemctl restart multi-timer.service
```

### 查看服务日志
```bash
# 查看所有日志
journalctl -u multi-timer.service

# 查看最近50行日志
journalctl -u multi-timer.service -n 50

# 实时查看日志
journalctl -u multi-timer.service -f
```

### 启用/禁用开机自启
```bash
# 启用开机自启
systemctl enable multi-timer.service

# 禁用开机自启
systemctl disable multi-timer.service
```

### 检查服务是否开机自启
```bash
systemctl is-enabled multi-timer.service
```

## 服务配置文件位置
- 服务文件: `/etc/systemd/system/multi-timer.service`
- 工作目录: `/root/dev/multi-timer/backend`
- 端口: `5990`

## 注意事项
- 服务以 root 用户运行
- 服务会在系统启动时自动启动
- 如果服务崩溃，会自动重启（RestartSec=10秒后）
- 日志会记录到 systemd journal

