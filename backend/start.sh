#!/bin/bash

# 多计时器后端启动脚本

echo "正在启动多计时器后端服务..."
echo "端口: 5990"

# 设置端口环境变量
export PORT=5990

# 启动服务器
node server.js

