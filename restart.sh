#!/bin/bash
# 重启 multi-timer 服务脚本
# 如果当前用户不是 root，使用 sudo（已配置无密码）
if [ "$EUID" -eq 0 ]; then
    systemctl restart multi-timer
else
    sudo systemctl restart multi-timer
fi
echo "服务已重启"

