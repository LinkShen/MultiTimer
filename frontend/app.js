const API_BASE_URL = 'http://localhost:5990/api';

// 获取当前用户信息
function getCurrentUser() {
    return JSON.parse(localStorage.getItem('currentUser') || 'null');
}

// 保存当前用户信息
function setCurrentUser(user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
}

// 清除当前用户信息
function clearCurrentUser() {
    localStorage.removeItem('currentUser');
}

// 计算计时器的显示时间
function calculateElapsedTime(timer) {
    if (!timer.start_time) {
        return 0;
    }
    
    const now = new Date().getTime();
    const startTime = new Date(timer.start_time).getTime();
    const pausedDuration = parseInt(timer.total_paused_duration) || 0;
    
    let elapsed = 0;
    
    if (timer.is_running === 1) {
        // 如果正在运行，计算从开始到现在的时间减去累计暂停时间
        // 注意：如果正在运行，paused_at 应该为 null（因为恢复时会清空）
        // 但为了安全，我们计算总时间减去已累计的暂停时间
        elapsed = now - startTime - pausedDuration;
    } else {
        // 如果暂停了，计算到暂停时刻的时间
        // paused_at 记录的是暂停的时刻
        // 到暂停时刻的时间 = paused_at - start_time - 之前累计的暂停时间
        if (timer.paused_at) {
            const pausedAt = new Date(timer.paused_at).getTime();
            // 需要减去在 paused_at 之前的暂停时间
            // 但 paused_at 本身是这次暂停的开始，所以需要减去这次暂停的时间
            // 实际上，total_paused_duration 不包括当前的暂停时间
            // 所以直接计算 paused_at - start_time - total_paused_duration 即可
            elapsed = pausedAt - startTime - pausedDuration;
        } else {
            // 如果没有 paused_at，说明从未暂停过，但也不是运行状态
            // 这种情况不应该存在，但为了安全返回0
            elapsed = 0;
        }
    }
    
    // 确保返回值不为负数（防止时间计算错误导致显示异常）
    return Math.max(0, elapsed);
}

// 格式化时间为 HH:MM:SS
function formatTime(milliseconds) {
    // 确保毫秒数不为负数
    const ms = Math.max(0, milliseconds);
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// 登录功能
if (document.getElementById('loginForm')) {
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');
    
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value.trim();
        
        if (!username) {
            showError('请输入用户名');
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE_URL}/users/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                setCurrentUser(data.user);
                window.location.href = 'index.html';
            } else {
                showError(data.error || '登录失败');
            }
        } catch (error) {
            console.error('Login error:', error);
            showError('登录失败，请检查服务器连接');
        }
    });
    
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.add('show');
        setTimeout(() => {
            errorMessage.classList.remove('show');
        }, 3000);
    }
}

// 主页面功能
if (document.getElementById('timersList')) {
    const currentUser = getCurrentUser();
    
    if (!currentUser) {
        window.location.href = 'login.html';
    }
    
    // 显示用户名
    document.getElementById('usernameDisplay').textContent = `用户: ${currentUser.username}`;
    
    // 退出功能
    document.getElementById('logoutBtn').addEventListener('click', () => {
        clearCurrentUser();
        window.location.href = 'login.html';
    });
    
    // 创建计时器
    const createTimerForm = document.getElementById('createTimerForm');
    createTimerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const timerName = document.getElementById('timerName').value.trim();
        
        if (!timerName) {
            alert('请输入计时器名称');
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE_URL}/timers`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_id: currentUser.id,
                    name: timerName
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                document.getElementById('timerName').value = '';
                loadTimers();
            } else {
                alert(data.error || '创建计时器失败');
            }
        } catch (error) {
            console.error('Create timer error:', error);
            alert('创建计时器失败，请检查服务器连接');
        }
    });
    
    // 加载计时器列表
    async function loadTimers() {
        try {
            const response = await fetch(`${API_BASE_URL}/timers/user/${currentUser.id}`);
            const data = await response.json();
            
            if (response.ok) {
                displayTimers(data.timers);
            } else {
                console.error('Load timers error:', data.error);
            }
        } catch (error) {
            console.error('Load timers error:', error);
        }
    }
    
    // 显示计时器列表
    function displayTimers(timers) {
        const timersList = document.getElementById('timersList');
        const emptyMessage = document.getElementById('emptyMessage');
        
        if (timers.length === 0) {
            timersList.innerHTML = '';
            emptyMessage.style.display = 'block';
            return;
        }
        
        emptyMessage.style.display = 'none';
        timersList.innerHTML = timers.map(timer => createTimerCard(timer)).join('');
        
        // 为每个计时器添加事件监听
        timers.forEach(timer => {
            setupTimerEvents(timer);
        });
        
        // 启动所有正在运行的计时器的更新
        updateAllTimers();
    }
    
    // 创建计时器卡片
    function createTimerCard(timer) {
        const elapsedTime = calculateElapsedTime(timer);
        const displayTime = formatTime(elapsedTime);
        const isRunning = timer.is_running === 1;
        
        return `
            <div class="timer-card ${isRunning ? 'running' : ''}" data-timer-id="${timer.id}">
                <div class="timer-header">
                    <span class="timer-name">${escapeHtml(timer.name)}</span>
                    <button class="timer-delete" onclick="deleteTimer(${timer.id})">删除</button>
                </div>
                <div class="timer-display" id="timer-display-${timer.id}">${displayTime}</div>
                <div class="timer-controls">
                    <button class="btn btn-success" onclick="startTimer(${timer.id})" ${isRunning ? 'disabled' : ''}>
                        开始
                    </button>
                    <button class="btn btn-warning" onclick="pauseTimer(${timer.id})" ${!isRunning ? 'disabled' : ''}>
                        暂停
                    </button>
                    <button class="btn btn-danger" onclick="resetTimer(${timer.id})">
                        重置
                    </button>
                </div>
                <div class="timer-set-time">
                    <input type="datetime-local" id="set-time-input-${timer.id}">
                    <button class="btn btn-info" onclick="setTimerTime(${timer.id})">
                        设置开始时刻
                    </button>
                </div>
            </div>
        `;
    }
    
    // 转义HTML
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // 设置计时器事件
    function setupTimerEvents(timer) {
        // 事件已经在HTML中通过onclick绑定
    }
    
    // 开始计时器
    async function startTimer(timerId) {
        try {
            const response = await fetch(`${API_BASE_URL}/timers/${timerId}/start`, {
                method: 'PUT'
            });
            
            const data = await response.json();
            
            if (response.ok) {
                loadTimers();
            } else {
                alert(data.error || '启动计时器失败');
            }
        } catch (error) {
            console.error('Start timer error:', error);
            alert('启动计时器失败，请检查服务器连接');
        }
    }
    
    // 暂停计时器
    async function pauseTimer(timerId) {
        try {
            const response = await fetch(`${API_BASE_URL}/timers/${timerId}/pause`, {
                method: 'PUT'
            });
            
            const data = await response.json();
            
            if (response.ok) {
                loadTimers();
            } else {
                alert(data.error || '暂停计时器失败');
            }
        } catch (error) {
            console.error('Pause timer error:', error);
            alert('暂停计时器失败，请检查服务器连接');
        }
    }
    
    // 重置计时器
    async function resetTimer(timerId) {
        if (!confirm('确定要重置这个计时器吗？')) {
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE_URL}/timers/${timerId}/reset`, {
                method: 'PUT'
            });
            
            const data = await response.json();
            
            if (response.ok) {
                loadTimers();
            } else {
                alert(data.error || '重置计时器失败');
            }
        } catch (error) {
            console.error('Reset timer error:', error);
            alert('重置计时器失败，请检查服务器连接');
        }
    }
    
    // 设置计时器开始时刻
    async function setTimerTime(timerId) {
        const input = document.getElementById(`set-time-input-${timerId}`);
        const startTime = input.value;
        
        if (!startTime) {
            alert('请选择开始时间');
            return;
        }
        
        try {
            // 将本地时间转换为ISO格式
            const time = new Date(startTime);
            const isoTime = time.toISOString();
            
            const response = await fetch(`${API_BASE_URL}/timers/${timerId}/set-time`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ startTime: isoTime })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                input.value = '';
                loadTimers();
            } else {
                alert(data.error || '设置时间失败');
            }
        } catch (error) {
            console.error('Set time error:', error);
            alert('设置时间失败，请检查服务器连接');
        }
    }
    
    // 删除计时器
    async function deleteTimer(timerId) {
        if (!confirm('确定要删除这个计时器吗？')) {
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE_URL}/timers/${timerId}`, {
                method: 'DELETE'
            });
            
            const data = await response.json();
            
            if (response.ok) {
                loadTimers();
            } else {
                alert(data.error || '删除计时器失败');
            }
        } catch (error) {
            console.error('Delete timer error:', error);
            alert('删除计时器失败，请检查服务器连接');
        }
    }
    
    // 更新所有计时器显示
    let updateInterval;
    function updateAllTimers() {
        // 清除之前的间隔
        if (updateInterval) {
            clearInterval(updateInterval);
        }
        
        // 每秒更新一次
        updateInterval = setInterval(async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/timers/user/${currentUser.id}`);
                const data = await response.json();
                
                if (response.ok) {
                    data.timers.forEach(timer => {
                        if (timer.is_running === 1) {
                            const elapsedTime = calculateElapsedTime(timer);
                            const displayTime = formatTime(elapsedTime);
                            const displayElement = document.getElementById(`timer-display-${timer.id}`);
                            if (displayElement) {
                                displayElement.textContent = displayTime;
                            }
                        }
                    });
                }
            } catch (error) {
                console.error('Update timers error:', error);
            }
        }, 1000);
    }
    
    // 页面关闭时暂停所有计时器
    window.addEventListener('beforeunload', async () => {
        try {
            // 使用 sendBeacon 确保请求能够发送
            const response = await fetch(`${API_BASE_URL}/timers/user/${currentUser.id}/pause-all`, {
                method: 'PUT',
                keepalive: true
            });
        } catch (error) {
            console.error('Pause all timers error:', error);
            // 即使失败也继续，因为页面即将关闭
        }
    });
    
    // 页面隐藏时也暂停所有计时器（移动端切换到后台）
    document.addEventListener('visibilitychange', async () => {
        if (document.hidden) {
            try {
                await fetch(`${API_BASE_URL}/timers/user/${currentUser.id}/pause-all`, {
                    method: 'PUT'
                });
            } catch (error) {
                console.error('Pause all timers error:', error);
            }
        }
    });
    
    // 初始加载
    loadTimers();
    
    // 将函数暴露到全局作用域，以便HTML中的onclick可以访问
    window.startTimer = startTimer;
    window.pauseTimer = pauseTimer;
    window.resetTimer = resetTimer;
    window.setTimerTime = setTimerTime;
    window.deleteTimer = deleteTimer;
}

