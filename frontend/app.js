// 根据当前访问路径自动判断 API 地址
const API_BASE_URL = (() => {
    // 自动检测当前路径前缀（支持任意路径，如 /timer, /multi-timer 等）
    const pathname = window.location.pathname;
    // 提取路径前缀（例如 /timer, /multi-timer）
    const pathMatch = pathname.match(/^\/([^\/]+)/);
    if (pathMatch) {
        // 如果通过路径访问（如 /timer, /multi-timer），使用相对路径
        const pathPrefix = pathMatch[0];
        return `${pathPrefix}/api`;
    }
    // 否则使用本地开发地址
    return 'http://localhost:5990/api';
})();

// 获取当前路径前缀（用于页面跳转）
function getPathPrefix() {
    const pathname = window.location.pathname;
    const pathMatch = pathname.match(/^\/([^\/]+)/);
    return pathMatch ? pathMatch[0] : '';
}

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
            // 如果没有 paused_at 且不是运行状态，但有 start_time
            // 说明刚刚设置了开始时间但还没有开始运行
            // 计算从开始时间到现在的时长，这样设置时间后可以立即看到显示
            elapsed = now - startTime - pausedDuration;
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
                // 使用路径前缀进行跳转
                const prefix = getPathPrefix();
                window.location.href = prefix ? `${prefix}/index.html` : 'index.html';
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
        // 使用路径前缀进行跳转
        const prefix = getPathPrefix();
        window.location.href = prefix ? `${prefix}/login.html` : 'login.html';
    }
    
    // 显示用户名
    document.getElementById('usernameDisplay').textContent = `用户: ${currentUser.username}`;
    
    // 退出功能
    document.getElementById('logoutBtn').addEventListener('click', () => {
        clearCurrentUser();
        // 使用路径前缀进行跳转
        const prefix = getPathPrefix();
        window.location.href = prefix ? `${prefix}/login.html` : 'login.html';
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
                // 返回加载的计时器数据，方便调用者使用
                return data.timers;
            } else {
                console.error('Load timers error:', data.error);
                return [];
            }
        } catch (error) {
            console.error('Load timers error:', error);
            return [];
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
                    <span class="timer-name" id="timer-name-${timer.id}" ondblclick="editTimerName(${timer.id})" title="双击编辑名称">${escapeHtml(timer.name)}</span>
                    <input type="text" class="timer-name-edit" id="timer-name-input-${timer.id}" value="${escapeHtml(timer.name)}" style="display: none;" onblur="saveTimerName(${timer.id})" onkeypress="handleTimerNameKeyPress(event, ${timer.id})">
                    <button class="timer-edit" onclick="editTimerName(${timer.id})" title="编辑名称">✏️</button>
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
                    <input type="text" id="set-time-input-${timer.id}" placeholder="HH:MM:SS 例如 01:30:00" pattern="^\\d{1,2}:\\d{2}:\\d{2}$" style="width: 150px;">
                    <button class="btn btn-info" onclick="setTimerTime(${timer.id})">
                        设置开始时刻
                    </button>
                    <span style="font-size: 12px; color: #666; margin-left: 10px;">
                        （例如：01:30:00 表示从1小时30分钟0秒开始计时）
                    </span>
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
    
    // 设置计时器开始时刻（从指定的时分秒开始计时）
    async function setTimerTime(timerId) {
        const input = document.getElementById(`set-time-input-${timerId}`);
        const timeString = input.value; // 格式: HH:MM 或 HH:MM:SS
        
        if (!timeString) {
            alert('请输入开始时刻（时分秒），例如：01:30:00 表示从1小时30分钟0秒开始计时');
            return;
        }
        
        try {
            // 解析时分秒，支持 HH:MM:SS 或 HH:MM 格式
            const timeParts = timeString.split(':');
            if (timeParts.length < 2 || timeParts.length > 3) {
                alert('时间格式不正确，请使用 HH:MM:SS 或 HH:MM 格式，例如：01:30:00');
                return;
            }
            
            const hours = parseInt(timeParts[0], 10);
            const minutes = parseInt(timeParts[1], 10);
            const seconds = timeParts.length === 3 ? parseInt(timeParts[2], 10) : 0;
            
            // 验证解析是否成功
            if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) {
                alert('时间格式不正确，请输入有效的数字');
                return;
            }
            
            // 验证时间范围（允许更大的小时数，因为这是计时器时间，不是时钟时间）
            if (hours < 0 || minutes < 0 || minutes > 59 || seconds < 0 || seconds > 59) {
                alert('时间范围不正确，小时: >= 0, 分钟: 0-59, 秒: 0-59');
                return;
            }
            
            // 将时分秒转换为毫秒数（用户想要计时器显示的初始值）
            const targetMilliseconds = (hours * 3600 + minutes * 60 + seconds) * 1000;
            
            // 计算应该设置的 start_time
            // 如果计时器要显示 targetMilliseconds，那么 start_time = 当前时间 - targetMilliseconds
            const now = new Date().getTime();
            const startTime = new Date(now - targetMilliseconds);
            
            // 转换为ISO格式
            const isoTime = startTime.toISOString();
            
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
                // 重新加载计时器列表
                await loadTimers();
                // 由于 calculateElapsedTime 已经修复，loadTimers 会正确显示时间
                // 但为了确保立即更新，我们再次更新显示（如果计时器正在运行）
                const timer = data.timer;
                if (timer && timer.is_running === 1) {
                    // 如果计时器正在运行，启动更新循环
                    updateAllTimers();
                } else {
                    // 如果计时器没有运行，立即更新一次显示
                    const elapsedTime = calculateElapsedTime(timer);
                    const displayTime = formatTime(elapsedTime);
                    const displayElement = document.getElementById(`timer-display-${timerId}`);
                    if (displayElement) {
                        displayElement.textContent = displayTime;
                    }
                }
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
                        const timerId = timer.id;
                        const isRunning = timer.is_running === 1;
                        
                        // 更新显示时间
                        if (isRunning) {
                            const elapsedTime = calculateElapsedTime(timer);
                            const displayTime = formatTime(elapsedTime);
                            const displayElement = document.getElementById(`timer-display-${timerId}`);
                            if (displayElement) {
                                displayElement.textContent = displayTime;
                            }
                        }
                        
                        // 检查并更新按钮状态（解决多窗口/多标签页状态不同步问题）
                        const startBtn = document.querySelector(`button[onclick="startTimer(${timerId})"]`);
                        const pauseBtn = document.querySelector(`button[onclick="pauseTimer(${timerId})"]`);
                        
                        if (startBtn && pauseBtn) {
                            // 如果按钮状态与服务器状态不一致，更新按钮状态
                            const startBtnDisabled = startBtn.disabled;
                            const pauseBtnDisabled = pauseBtn.disabled;
                            const shouldStartDisabled = isRunning;
                            const shouldPauseDisabled = !isRunning;
                            
                            if (startBtnDisabled !== shouldStartDisabled || pauseBtnDisabled !== shouldPauseDisabled) {
                                startBtn.disabled = shouldStartDisabled;
                                pauseBtn.disabled = shouldPauseDisabled;
                                
                                // 更新计时器卡片的 running 样式
                                const timerCard = document.querySelector(`.timer-card[data-timer-id="${timerId}"]`);
                                if (timerCard) {
                                    if (isRunning) {
                                        timerCard.classList.add('running');
                                    } else {
                                        timerCard.classList.remove('running');
                                    }
                                }
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
            await fetch(`${API_BASE_URL}/timers/user/${currentUser.id}/pause-all`, {
                method: 'PUT',
                keepalive: true
            });
        } catch (error) {
            console.error('Pause all timers error:', error);
            // 即使失败也继续，因为页面即将关闭
        }
    });
    
    // 页面卸载时暂停所有计时器（作为 beforeunload 的补充）
    window.addEventListener('unload', () => {
        // 使用 navigator.sendBeacon 确保请求能够发送（即使页面已关闭）
        // 注意：sendBeacon 只支持 POST，所以这里使用 fetch with keepalive
        if (navigator.sendBeacon) {
            // sendBeacon 不支持 PUT，所以使用 fetch with keepalive
            fetch(`${API_BASE_URL}/timers/user/${currentUser.id}/pause-all`, {
                method: 'PUT',
                keepalive: true,
                body: JSON.stringify({})
            }).catch(() => {}); // 忽略错误，因为页面正在关闭
        }
    });
    
    // 页面重新可见时刷新计时器状态（解决多标签页状态不同步问题）
    document.addEventListener('visibilitychange', async () => {
        if (!document.hidden) {
            // 页面重新可见时，重新加载计时器列表以同步状态
            // 这样当其他标签页修改了计时器状态时，当前标签页也能看到最新状态
            await loadTimers();
        }
    });
    
    // 初始加载
    loadTimers();
    
    // 编辑计时器名称
    function editTimerName(timerId) {
        const nameSpan = document.getElementById(`timer-name-${timerId}`);
        const nameInput = document.getElementById(`timer-name-input-${timerId}`);
        
        if (nameSpan && nameInput) {
            nameSpan.style.display = 'none';
            nameInput.style.display = 'inline-block';
            nameInput.focus();
            nameInput.select();
        }
    }
    
    // 保存计时器名称
    async function saveTimerName(timerId) {
        const nameSpan = document.getElementById(`timer-name-${timerId}`);
        const nameInput = document.getElementById(`timer-name-input-${timerId}`);
        
        if (!nameSpan || !nameInput) {
            return;
        }
        
        const newName = nameInput.value.trim();
        
        if (!newName) {
            // 如果名称为空，恢复原名称
            nameInput.value = nameSpan.textContent;
            nameSpan.style.display = 'inline-block';
            nameInput.style.display = 'none';
            alert('计时器名称不能为空');
            return;
        }
        
        if (newName === nameSpan.textContent) {
            // 名称没有变化，直接隐藏输入框
            nameSpan.style.display = 'inline-block';
            nameInput.style.display = 'none';
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE_URL}/timers/${timerId}/name`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name: newName })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                nameSpan.textContent = newName;
                nameSpan.style.display = 'inline-block';
                nameInput.style.display = 'none';
            } else {
                alert(data.error || '更新名称失败');
                // 恢复原名称
                nameInput.value = nameSpan.textContent;
                nameSpan.style.display = 'inline-block';
                nameInput.style.display = 'none';
            }
        } catch (error) {
            console.error('Save timer name error:', error);
            alert('更新名称失败，请检查服务器连接');
            // 恢复原名称
            nameInput.value = nameSpan.textContent;
            nameSpan.style.display = 'inline-block';
            nameInput.style.display = 'none';
        }
    }
    
    // 处理名称输入框的按键事件
    function handleTimerNameKeyPress(event, timerId) {
        if (event.key === 'Enter') {
            event.preventDefault();
            saveTimerName(timerId);
        } else if (event.key === 'Escape') {
            event.preventDefault();
            const nameSpan = document.getElementById(`timer-name-${timerId}`);
            const nameInput = document.getElementById(`timer-name-input-${timerId}`);
            if (nameSpan && nameInput) {
                nameInput.value = nameSpan.textContent;
                nameSpan.style.display = 'inline-block';
                nameInput.style.display = 'none';
            }
        }
    }
    
    // 将函数暴露到全局作用域，以便HTML中的onclick可以访问
    window.startTimer = startTimer;
    window.pauseTimer = pauseTimer;
    window.resetTimer = resetTimer;
    window.setTimerTime = setTimerTime;
    window.deleteTimer = deleteTimer;
    window.editTimerName = editTimerName;
    window.saveTimerName = saveTimerName;
    window.handleTimerNameKeyPress = handleTimerNameKeyPress;
}

