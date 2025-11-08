@echo off
REM 多计时器后端启动脚本（Windows）

echo 正在启动多计时器后端服务...
echo 端口: 5990

REM 设置端口环境变量
set PORT=5990

REM 启动服务器
node server.js

