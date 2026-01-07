// 联机界面UI控制器
document.addEventListener('DOMContentLoaded', function() {
    console.log('[UI控制器] ========== 联机UI加载 ==========');
    console.log('[UI控制器] DOM加载完成，开始初始化UI元素');

    // 界面元素引用
    const onlineBattleBtn = document.getElementById('onlineBattleBtn');
    const onlineBattle = document.getElementById('onlineBattle');
    const gameMainMenu = document.getElementById('gameMainMenu');
    const createRoomTab = document.getElementById('createRoomTab');
    const joinRoomTab = document.getElementById('joinRoomTab');
    const createRoomContent = document.getElementById('createRoomContent');
    const joinRoomContent = document.getElementById('joinRoomContent');
    const createRoomBtn = document.getElementById('createRoomBtn');
    const joinRoomBtn = document.getElementById('joinRoomBtn');
    const roomIdInput = document.getElementById('roomIdInput');
    const roomsList = document.getElementById('roomsList');
    const backFromOnlineBtn = document.getElementById('backFromOnlineBtn');

    console.log('[UI控制器] ✓ UI元素引用获取完成');
    
    // 创建房间相关元素
    const roomCreatedInfo = document.getElementById('roomCreatedInfo');
    const roomIdDisplay = document.getElementById('roomIdDisplay');
    const copyRoomIdBtn = document.getElementById('copyRoomIdBtn');
    const cancelRoomBtn = document.getElementById('cancelRoomBtn');
    const startGameBtn = document.getElementById('startGameBtn');
    const waitingStatus = document.getElementById('waitingStatus');
    
    // 等待房间界面元素
    const waitingRoom = document.getElementById('waitingRoom');
    const waitingRoomId = document.getElementById('waitingRoomId');
    const cancelWaitingBtn = document.getElementById('cancelWaitingBtn');
    const waitingMessage = document.getElementById('waitingMessage');
    const waitingRoomStartGameBtn = document.getElementById('waitingRoomStartGameBtn');
    
    // 当前创建的房间ID
    let currentRoomId = null;
    let roomCheckInterval = null;
    let startGameBtnEventAdded = false; // 防止重复添加事件监听器

    // 初始化联机功能
    async function initializeOnlineFeature() {
        console.log('[UI初始化] ========== 初始化联机功能 ==========');
        if (!window.multiplayerManager) {
            console.error('[UI初始化] ✗ 联机管理器未加载');
            return;
        }

        console.log('[UI初始化] ✓ 联机管理器存在');
        await window.multiplayerManager.initialize();
        console.log('[UI初始化] ========== 联机功能初始化完成 ==========');
    }

    // 显示在线对战界面
    function showOnlineBattle() {
        onlineBattle.style.display = 'block';
        gameMainMenu.style.display = 'none';
        resetUI(); // 重置UI状态，包括隐藏roomCreatedInfo
        loadAvailableRooms();
    }

    // 隐藏在线对战界面
    function hideOnlineBattle() {
        onlineBattle.style.display = 'none';
        gameMainMenu.style.display = 'block';
        clearRoomIntervals();
        resetUI();
    }

    // 重置UI状态
    function resetUI() {
        createRoomContent.style.display = 'block';
        joinRoomContent.style.display = 'none';
        createRoomTab.classList.add('active');
        joinRoomTab.classList.remove('active');
        roomCreatedInfo.style.display = 'none';
        createRoomBtn.style.display = 'block';
        roomIdInput.value = '';
        currentRoomId = null; // 重置当前房间ID
        waitingRoomStartGameBtn.style.display = 'none'; // 隐藏等待房间的开始游戏按钮
    }

    // 清除房间检查定时器
    function clearRoomIntervals() {
        if (roomCheckInterval) {
            clearInterval(roomCheckInterval);
            roomCheckInterval = null;
        }
    }

    // 切换选项卡
    createRoomTab.addEventListener('click', function() {
        createRoomTab.classList.add('active');
        joinRoomTab.classList.remove('active');
        createRoomContent.style.display = 'block';
        joinRoomContent.style.display = 'none';
    });

    joinRoomTab.addEventListener('click', function() {
        joinRoomTab.classList.add('active');
        createRoomTab.classList.remove('active');
        joinRoomContent.style.display = 'block';
        createRoomContent.style.display = 'none';
        loadAvailableRooms();
    });

    // 创建房间
    createRoomBtn.addEventListener('click', async function() {
        console.log('[UI事件] ========== 用户点击创建房间 ==========');
        try {
            await initializeOnlineFeature();

            console.log('[UI事件] 禁用创建按钮');
            createRoomBtn.disabled = true;
            createRoomBtn.textContent = '创建中...';

            console.log('[UI事件] 调用 multiplayerManager.createRoom()');
            const result = await window.multiplayerManager.createRoom();

            if (result.success) {
                console.log('[UI事件] ✓ 房间创建成功');
                currentRoomId = result.roomId;
                roomIdDisplay.textContent = currentRoomId;
                roomCreatedInfo.style.display = 'block';
                createRoomBtn.style.display = 'none';

                console.log('[UI事件] 开始检查房间状态');
                // 开始检查房间状态
                startRoomStatusCheck();

                console.log('[UI事件] 显示等待房间界面');
                // 显示等待房间界面
                showWaitingRoom(currentRoomId);
            } else {
                console.error('[UI事件] ✗ 房间创建失败:', result.error);
                alert('创建房间失败: ' + result.error);
                createRoomBtn.disabled = false;
                createRoomBtn.textContent = '创建新房间';
            }
        } catch (error) {
            console.error('[UI事件] ✗ 创建房间错误:', error);
            alert('创建房间失败，请重试');
            createRoomBtn.disabled = false;
            createRoomBtn.textContent = '创建新房间';
        }
        console.log('[UI事件] ========== 创建房间处理完成 ==========');
    });

    // 加入房间
    joinRoomBtn.addEventListener('click', async function() {
        console.log('[UI事件] ========== 用户点击加入房间 ==========');
        const roomId = roomIdInput.value.trim().toUpperCase();

        console.log('[UI事件] 输入的房间ID:', roomId);

        if (!roomId) {
            console.log('[UI事件] ⚠ 房间ID为空');
            alert('请输入房间ID');
            return;
        }

        if (roomId.length !== 6) {
            console.log('[UI事件] ⚠ 房间ID长度不正确:', roomId.length);
            alert('房间ID必须是6位字母或数字');
            return;
        }

        try {
            await initializeOnlineFeature();

            console.log('[UI事件] 禁用加入按钮');
            joinRoomBtn.disabled = true;
            joinRoomBtn.textContent = '加入中...';

            console.log('[UI事件] 调用 multiplayerManager.joinRoom()');
            const result = await window.multiplayerManager.joinRoom(roomId);

            if (result.success) {
                console.log('[UI事件] ✓ 成功加入房间');
                currentRoomId = roomId;

                console.log('[UI事件] 显示等待房间界面');
                // 显示等待房间界面
                showWaitingRoom(roomId);
            } else {
                console.error('[UI事件] ✗ 加入房间失败:', result.error);
                alert('加入房间失败: ' + result.error);
                joinRoomBtn.disabled = false;
                joinRoomBtn.textContent = '加入房间';
            }
        } catch (error) {
            console.error('[UI事件] ✗ 加入房间错误:', error);
            alert('加入房间失败，请重试');
            joinRoomBtn.disabled = false;
            joinRoomBtn.textContent = '加入房间';
        }
        console.log('[UI事件] ========== 加入房间处理完成 ==========');
    });

    // 复制房间ID
    copyRoomIdBtn.addEventListener('click', function() {
        if (!currentRoomId) return;
        
        navigator.clipboard.writeText(currentRoomId).then(() => {
            alert('房间ID已复制到剪贴板');
        }).catch(err => {
            console.error('复制失败:', err);
            alert('复制失败，请手动复制');
        });
    });

    // 取消房间
    cancelRoomBtn.addEventListener('click', async function() {
        try {
            await window.multiplayerManager.leaveRoom();
            resetUI();
        } catch (error) {
            console.error('取消房间错误:', error);
            alert('取消房间失败，请重试');
        }
    });

    // 开始游戏
    startGameBtn.addEventListener('click', async function(event) {
        console.log('[开始游戏按钮] ========== 按钮被点击 ==========');
        console.log('[开始游戏按钮] 按钮状态:', {
            disabled: this.disabled,
            display: this.style.display,
            textContent: this.textContent
        });
        console.log('[开始游戏按钮] 管理器状态:', {
            exists: !!window.multiplayerManager,
            isHost: window.multiplayerManager?.isHost,
            roomId: window.multiplayerManager?.roomId
        });
        console.log('[开始游戏按钮] 调用堆栈:', new Error().stack);
        console.log('[开始游戏按钮] =======================================');

        // 防止重复点击
        if (this.disabled) {
            console.log('[UI事件] ⚠ 按钮已禁用，忽略点击');
            event.preventDefault();
            event.stopPropagation();
            return;
        }

        // 只允许房主点击
        if (!window.multiplayerManager || !window.multiplayerManager.isHost) {
            console.log('[UI事件] ⚠ 非房主不能开始游戏');
            event.preventDefault();
            event.stopPropagation();
            return;
        }

        // 检查房间ID
        if (!window.multiplayerManager || !window.multiplayerManager.roomId) {
            console.log('[UI事件] ⚠ 房间ID不存在');
            event.preventDefault();
            event.stopPropagation();
            alert('房间已失效，请重新创建');
            hideWaitingRoom();
            showOnlineBattle();
            resetUI();
            return;
        }

        try {
            console.log('[UI事件] ========== 房主点击开始游戏 ==========');
            console.log('[UI事件] 房间ID:', window.multiplayerManager.roomId);
            console.log('[UI事件] 禁用按钮防止重复点击');
            this.disabled = true;
            this.textContent = '启动中...';
            event.preventDefault();
            event.stopPropagation();

            await window.multiplayerManager.startGame();

            // 游戏开始后隐藏等待界面
            hideWaitingRoom();
            console.log('[UI事件] ========== 游戏已启动 ==========');
        } catch (error) {
            console.error('[UI事件] ✗ 开始游戏错误:', error);
            alert('开始游戏失败，请重试');
            this.disabled = false;
            this.textContent = '开始游戏';
        }
    });

    // 等待房间的开始游戏按钮
    waitingRoomStartGameBtn.addEventListener('click', async function(event) {
        console.log('[等待房间开始游戏] ========== 按钮被点击 ==========');
        console.log('[等待房间开始游戏] 管理器状态:', {
            exists: !!window.multiplayerManager,
            isHost: window.multiplayerManager?.isHost,
            roomId: window.multiplayerManager?.roomId
        });

        // 防止重复点击
        if (this.disabled) {
            console.log('[等待房间开始游戏] ⚠ 按钮已禁用，忽略点击');
            event.preventDefault();
            event.stopPropagation();
            return;
        }

        // 只允许房主点击
        if (!window.multiplayerManager || !window.multiplayerManager.isHost) {
            console.log('[等待房间开始游戏] ⚠ 非房主不能开始游戏');
            event.preventDefault();
            event.stopPropagation();
            return;
        }

        // 检查房间ID
        if (!window.multiplayerManager || !window.multiplayerManager.roomId) {
            console.log('[等待房间开始游戏] ⚠ 房间ID不存在');
            event.preventDefault();
            event.stopPropagation();
            alert('房间已失效，请重新创建');
            hideWaitingRoom();
            showOnlineBattle();
            resetUI();
            return;
        }

        try {
            console.log('[等待房间开始游戏] ========== 房主点击开始游戏 ==========');
            console.log('[等待房间开始游戏] 房间ID:', window.multiplayerManager.roomId);
            console.log('[等待房间开始游戏] 禁用按钮防止重复点击');
            this.disabled = true;
            this.textContent = '启动中...';
            event.preventDefault();
            event.stopPropagation();

            await window.multiplayerManager.startGame();

            // 游戏开始后隐藏等待界面
            hideWaitingRoom();
            console.log('[等待房间开始游戏] ========== 游戏已启动 ==========');
        } catch (error) {
            console.error('[等待房间开始游戏] ✗ 开始游戏错误:', error);
            alert('开始游戏失败，请重试');
            this.disabled = false;
            this.textContent = '开始游戏';
        }
    });

    // 取消等待
    cancelWaitingBtn.addEventListener('click', async function() {
        try {
            await window.multiplayerManager.leaveRoom();
            hideWaitingRoom();
            showOnlineBattle();
        } catch (error) {
            console.error('取消等待错误:', error);
            alert('取消失败，请重试');
        }
    });

    // 返回主菜单
    backFromOnlineBtn.addEventListener('click', function() {
        hideOnlineBattle();
    });

    // 显示等待房间界面
    function showWaitingRoom(roomId) {
        waitingRoomId.textContent = roomId;
        waitingRoom.style.display = 'block';
        onlineBattle.style.display = 'none';
        
        // 根据是否是房主显示不同的消息
        if (window.multiplayerManager && window.multiplayerManager.isHost) {
            waitingMessage.textContent = '等待玩家加入房间...';
            waitingRoomStartGameBtn.style.display = 'none';
            startGameBtn.style.display = 'none';
        } else {
            waitingMessage.textContent = '等待房主开始游戏...';
        }
    }

    // 隐藏等待房间界面
    function hideWaitingRoom() {
        waitingRoom.style.display = 'none';
        clearRoomIntervals();
    }

    // 开始检查房间状态
    function startRoomStatusCheck() {
        if (roomCheckInterval) return;

        console.log('[房间检查] ========== 开始轮询房间状态 ==========');

        roomCheckInterval = setInterval(async function() {
            try {
                if (!window.multiplayerManager || !window.multiplayerManager.roomId) {
                    console.log('[房间检查] ⚠ 管理器或房间ID不存在，停止检查');
                    clearRoomIntervals();
                    return;
                }

                console.log('[房间检查] 查询房间状态...');
                // 检查房间状态 - 查询所有字段
                const { data, error } = await window.supabaseClient
                    .from('game_rooms')
                    .select('*')
                    .eq('id', currentRoomId)
                    .maybeSingle(); // 使用 maybeSingle 避免找不到记录时报错

                if (error) {
                    console.error('[房间检查] ✗ 查询失败:', error);
                    return;
                }

                if (!data) {
                    console.error('[房间检查] ✗ 房间不存在');
                    clearRoomIntervals();
                    alert('房间不存在');
                    hideWaitingRoom();
                    showOnlineBattle();
                    resetUI();
                    return;
                }

                console.log('[房间检查] ========== 房间状态详情 ==========');
                console.log('[房间检查] 房间ID:', data.id);
                console.log('[房间检查] 房间状态:', data.status);
                console.log('[房间检查] 房主ID:', data.host_id);
                console.log('[房间检查] 访客ID:', data.guest_id);
                console.log('[房间检查] 我的角色:', window.multiplayerManager.isHost ? '房主' : '访客');
                console.log('[房间检查] 查询时间:', new Date().toISOString());
                console.log('[房间检查] ===============================');

                if (data.status === 'ready' && data.guest_id) {
                    // 有玩家加入了
                    if (window.multiplayerManager.isHost) {
                        console.log('[房间检查] ✓✓✓ 检测到玩家加入，显示开始游戏按钮 ✓✓✓');
                        waitingMessage.textContent = '玩家已加入，可以开始游戏了！';
                        waitingRoomStartGameBtn.style.display = 'block';
                        waitingRoomStartGameBtn.disabled = false;
                        startGameBtn.style.display = 'block';
                        startGameBtn.disabled = false;
                    } else {
                        console.log('[房间检查] 我是访客，等待房主开始游戏...');
                        waitingMessage.textContent = '等待房主开始游戏...';
                    }
                } else if (data.status === 'waiting' && window.multiplayerManager.isHost && !data.guest_id) {
                    console.log('[房间检查] 房主等待中...');
                    waitingMessage.textContent = '等待玩家加入房间...';
                    waitingRoomStartGameBtn.style.display = 'none';
                    startGameBtn.style.display = 'none';
                } else if (data.status === 'playing') {
                    // 游戏已开始
                    console.log('[房间检查] ✓✓✓ 游戏已开始 ✓✓✓');
                    clearRoomIntervals();
                    if (window.multiplayerManager.startOnlineGame) {
                        window.multiplayerManager.startOnlineGame();
                    }
                } else if (data.status === 'cancelled' || data.status === 'left') {
                    // 房间已取消或玩家已离开
                    console.log('[房间检查] ⚠ 房间已解散');
                    clearRoomIntervals();
                    alert('房间已解散');
                    hideWaitingRoom();
                    showOnlineBattle();
                    resetUI();
                }
            } catch (error) {
                console.error('[房间检查] ✗ 检查房间状态错误:', error);
                console.error('[房间检查] 错误堆栈:', error.stack);
            }
        }, 1500); // 每1.5秒检查一次，加快检查频率
        console.log('[房间检查] ✓ 轮询已启动，间隔1.5秒');
    }

    // 加载可用房间列表
    async function loadAvailableRooms() {
        console.log('[房间列表] ========== 开始加载房间列表 ==========');
        try {
            await initializeOnlineFeature();

            console.log('[房间列表] 显示加载中提示');
            roomsList.innerHTML = '<p class="no-rooms">正在加载房间列表...</p>';

            console.log('[房间列表] 调用 getAvailableRooms()');
            const result = await window.multiplayerManager.getAvailableRooms();

            console.log('[房间列表] 查询结果:', result);

            if (result.success && result.rooms && result.rooms.length > 0) {
                console.log('[房间列表] ✓ 找到', result.rooms.length, '个可用房间');
                let roomsHtml = '';

                // 批量获取房主用户信息
                const hostIds = [...new Set(result.rooms.map(room => room.host_id))];
                const hostEmails = {};
                const roomMap = {}; // 创建房间映射

                // 先构建房间映射
                result.rooms.forEach(room => {
                    roomMap[room.host_id] = room;
                });

                console.log('[房间列表] 获取房主信息...');
                console.log('[房间列表] 需要查询的房主ID:', hostIds);

                for (const hostId of hostIds) {
                    try {
                        console.log('[房间列表] 查询房主:', hostId);
                        const { data: profileData, error: profileError } = await window.supabaseClient
                            .from('profiles')
                            .select('username')
                            .eq('id', hostId)
                            .maybeSingle();

                        console.log('[房间列表] 查询结果:', { profileData, error: profileError });

                        if (!profileError && profileData) {
                            hostEmails[hostId] = profileData.username || '未知玩家';
                            console.log('[房间列表] ✓ 房主', hostId, '用户名:', profileData.username);
                        } else {
                            // 从房间映射中获取邮箱
                            const roomData = roomMap[hostId];
                            hostEmails[hostId] = roomData ? (roomData.host_email || '未知玩家') : '未知玩家';
                            console.log('[房间列表] ⚠ 房主', hostId, '使用邮箱:', roomData ? roomData.host_email : '无');
                        }
                    } catch (e) {
                        hostEmails[hostId] = '未知玩家';
                        console.error('[房间列表] ✗ 获取房主信息失败:', e);
                    }
                }

                result.rooms.forEach((room, index) => {
                    const statusClass = room.status;
                    const statusText = getStatusText(room.status);
                    const hostName = hostEmails[room.host_id] || room.host_email || '未知玩家';

                    console.log('[房间列表] 房间', index + 1, ':', {
                        id: room.id,
                        hostId: room.host_id,
                        hostName: hostName,
                        status: statusText,
                        createdAt: room.created_at
                    });

                    roomsHtml += `
                        <div class="room-item" data-room-id="${room.id}">
                            <div>
                                <div class="room-id-text">${room.id}</div>
                                <div class="room-status ${statusClass}">${statusText}</div>
                            </div>
                            <div>
                                <div>创建者: ${hostName}</div>
                                <div>创建时间: ${formatTime(room.created_at)}</div>
                            </div>
                        </div>
                    `;
                });

                console.log('[房间列表] ✓ 渲染房间列表');
                roomsList.innerHTML = roomsHtml;

                // 添加点击事件
                document.querySelectorAll('.room-item').forEach((item, index) => {
                    item.addEventListener('click', function() {
                        const roomId = this.getAttribute('data-room-id');
                        console.log('[房间列表] 用户点击房间:', roomId);
                        roomIdInput.value = roomId;
                        // 切换到加入房间选项卡
                        joinRoomTab.click();
                    });
                });
            } else {
                console.log('[房间列表] ⚠ 没有可用房间');
                roomsList.innerHTML = '<p class="no-rooms">当前没有可用房间</p>';
            }
        } catch (error) {
            console.error('[房间列表] ✗ 加载房间列表错误:', error);
            roomsList.innerHTML = '<p class="no-rooms">加载房间列表失败</p>';
        }
        console.log('[房间列表] ========== 房间列表加载完成 ==========');
    }

    // 获取状态文本
    function getStatusText(status) {
        switch (status) {
            case 'waiting': return '等待中';
            case 'ready': return '已准备';
            case 'playing': return '游戏中';
            default: return '未知';
        }
    }

    // 格式化时间
    function formatTime(timeString) {
        const date = new Date(timeString);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) { // 小于1分钟
            return '刚刚';
        } else if (diff < 3600000) { // 小于1小时
            return Math.floor(diff / 60000) + '分钟前';
        } else {
            return Math.floor(diff / 3600000) + '小时前';
        }
    }

    // 在线对战按钮点击事件
    onlineBattleBtn.addEventListener('click', showOnlineBattle);

    // 初始化
    initializeOnlineFeature();
});