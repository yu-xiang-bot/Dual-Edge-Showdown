/*global $, supabaseClient*/

// 联机功能模块
class MultiplayerManager {
    constructor() {
        this.roomId = null;
        this.playerId = null;
        this.isHost = false;
        this.playerData = {};
        this.opponentData = {};
        this.subscription = null;
        this.gameState = 'waiting'; // waiting, ready, playing, ended
        this.channel = null;
        this.isSubscribing = false; // 防止重复订阅
        console.log('[联机管理器] MultiplayerManager 构造完成');
    }

    // 初始化联机功能
    async initialize() {
        console.log('[联机初始化] 开始初始化联机功能...');
        try {
            // 获取当前用户ID作为玩家ID
            if (window.userDataManager && window.userDataManager.currentUser) {
                this.playerId = window.userDataManager.currentUser.id;
                console.log('[联机初始化] ✓ 成功，玩家ID:', this.playerId);
                console.log('[联机初始化] 用户信息:', {
                    id: this.playerId,
                    email: window.userDataManager.currentUser.email
                });
                return true;
            } else {
                console.error('[联机初始化] ✗ 失败：用户未登录');
                console.error('[联机初始化] userDataManager 状态:', window.userDataManager);
                console.error('[联机初始化] currentUser 状态:', window.userDataManager?.currentUser);
                return false;
            }
        } catch (error) {
            console.error('[联机初始化] ✗ 异常:', error.message);
            console.error('[联机初始化] 错误堆栈:', error.stack);
            return false;
        }
    }

    // 创建游戏房间
    async createRoom() {
        console.log('[房间创建] ========== 开始创建房间 ==========');
        if (!this.playerId) {
            console.log('[房间创建] 玩家ID不存在，尝试初始化...');
            await this.initialize();
        }

        try {
            // 生成房间ID
            this.roomId = this.generateRoomId();
            this.isHost = true;

            // 获取房主邮箱
            const userEmail = window.userDataManager && window.userDataManager.currentUser
                ? window.userDataManager.currentUser.email
                : '未知';

            console.log('[房间创建] 房间信息:', {
                roomId: this.roomId,
                hostId: this.playerId,
                hostEmail: userEmail,
                status: 'waiting',
                created_at: new Date().toISOString()
            });

            // 创建房间记录
            const { data, error } = await window.supabaseClient
                .from('game_rooms')
                .insert([
                    {
                        id: this.roomId,
                        host_id: this.playerId,
                        host_email: userEmail,
                        status: 'waiting',
                        created_at: new Date().toISOString()
                    }
                ]);

            if (error) {
                console.error('[房间创建] ✗ 数据库插入失败:', error);
                throw error;
            }

            console.log('[房间创建] ✓ 房间创建成功');
            console.log('[房间创建] 房间ID:', this.roomId);
            console.log('[房间创建] 开始监听房间更新...');
            this.listenForRoomUpdates();

            console.log('[房间创建] ========== 房间创建完成 ==========');
            return {
                success: true,
                roomId: this.roomId
            };
        } catch (error) {
            console.error('[房间创建] ✗ 创建房间失败:', error.message);
            console.error('[房间创建] 错误详情:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // 加入游戏房间
    async joinRoom(roomId) {
        console.log('[房间加入] ========== 开始加入房间 ==========');
        console.log('[房间加入] 目标房间ID:', roomId);
        if (!this.playerId) {
            console.log('[房间加入] 玩家ID不存在，尝试初始化...');
            await this.initialize();
        }

        try {
            this.roomId = roomId;
            this.isHost = false;

            console.log('[房间加入] 我的玩家ID:', this.playerId);

            console.log('[房间加入] 检查房间状态...');
            // 检查房间是否存在
            const { data: roomData, error: roomError } = await window.supabaseClient
                .from('game_rooms')
                .select('*')
                .eq('id', roomId)
                .maybeSingle(); // 使用 maybeSingle

            if (roomError && roomError.code !== 'PGRST116') {
                console.error('[房间加入] ✗ 查询房间失败:', roomError);
                throw roomError;
            }

            if (!roomData) {
                console.error('[房间加入] ✗ 房间不存在');
                throw new Error('房间不存在');
            }

            console.log('[房间加入] ========== 房间信息 ==========');
            console.log('[房间加入] 房间ID:', roomData.id);
            console.log('[房间加入] 房间状态:', roomData.status);
            console.log('[房间加入] 房主ID:', roomData.host_id);
            console.log('[房间加入] 当前访客ID:', roomData.guest_id);
            console.log('[房间加入] ===========================');

            if (roomData.status !== 'waiting') {
                console.error('[房间加入] ✗ 房间状态不可加入:', roomData.status);
                throw new Error('房间已满或游戏已开始');
            }

            console.log('[房间加入] 尝试更新数据库...');
            console.log('[房间加入] 将设置访客ID:', this.playerId);
            console.log('[房间加入] 将更新状态为: ready');

            // 加入房间
            const { data, error } = await window.supabaseClient
                .from('game_rooms')
                .update({
                    guest_id: this.playerId,
                    status: 'ready'
                })
                .eq('id', roomId)
                .select(); // 返回更新后的数据

            if (error) {
                console.error('[房间加入] ✗✗✗ 数据库更新失败 ✗✗✗');
                console.error('[房间加入] 错误信息:', error);
                console.error('[房间加入] 错误代码:', error.code);
                console.error('[房间加入] 错误详情:', error.details);
                console.error('[房间加入] 错误提示:', error.hint);
                throw error;
            }

            console.log('[房间加入] ========== 数据库更新成功 ==========');
            console.log('[房间加入] 更新后的数据:', data);
            if (data && data.length > 0) {
                console.log('[房间加入] 访客ID已设置:', data[0].guest_id);
                console.log('[房间加入] 房间状态已更新:', data[0].status);
            }
            console.log('[房间加入] ===============================');

            console.log('[房间加入] ✓✓✓ 成功加入房间: ' + roomId + ' ✓✓✓');
            console.log('[房间加入] 开始监听房间更新...');
            this.listenForRoomUpdates();

            console.log('[房间加入] ========== 房间加入完成 ==========');
            return {
                success: true,
                roomId: roomId
            };
        } catch (error) {
            console.error('[房间加入] ✗✗✗ 加入房间失败 ✗✗✗');
            console.error('[房间加入] 错误消息:', error.message);
            console.error('[房间加入] 错误详情:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // 监听房间更新
    listenForRoomUpdates() {
        console.log('[实时订阅] ========== 开始设置订阅 ==========');
        if (!this.roomId) {
            console.error('[实时订阅] ✗ 房间ID不存在');
            return;
        }

        // 标志位：防止重复订阅
        if (this.isSubscribing) {
            console.log('[实时订阅] ⚠ 正在订阅中，跳过重复调用');
            return;
        }
        this.isSubscribing = true;

        // 先取消旧的订阅
        if (this.subscription) {
            console.log('[实时订阅] 取消旧的数据库订阅');
            try {
                this.subscription.unsubscribe();
            } catch (e) {
                console.warn('[实时订阅] 取消订阅失败:', e);
            }
            this.subscription = null;
        }

        if (this.channel) {
            console.log('[实时订阅] 取消旧的广播订阅');
            try {
                this.channel.unsubscribe();
            } catch (e) {
                console.warn('[实时订阅] 取消订阅失败:', e);
            }
            this.channel = null;
        }

        console.log('[实时订阅] 订阅房间数据库更新:', `room:${this.roomId}`);
        // 订阅房间更新
        this.subscription = window.supabaseClient
            .channel(`room:${this.roomId}`)
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'game_rooms', filter: `id=eq.${this.roomId}` },
                (payload) => {
                    this.handleRoomUpdate(payload);
                }
            )
            .subscribe((status, err) => {
                if (err) {
                    console.error('[实时订阅] ✗ 数据库订阅错误:', err);
                    console.error('[实时订阅] 订阅状态:', status);
                    return;
                }
                if (status === 'SUBSCRIBED') {
                    console.log('[实时订阅] ✓ 数据库订阅成功: room:' + this.roomId);
                    // 订阅成功后，重置标志位
                    this.isSubscribing = false;
                } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
                    console.error('[实时订阅] ✗ 数据库订阅失败:', status);
                    // 订阅失败后重置标志位
                    this.isSubscribing = false;
                    // 3秒后自动重试
                    setTimeout(() => {
                        console.log('[实时订阅] 尝试重新订阅数据库...');
                        this.listenForRoomUpdates();
                    }, 3000);
                }
            });

        console.log('[实时订阅] 订阅游戏状态和玩家动作:', `game:${this.roomId}`);
        // 订阅游戏状态更新
        this.channel = window.supabaseClient
            .channel(`game:${this.roomId}`)
            .on('broadcast', { event: 'game_state' }, (payload) => {
                console.log('[实时订阅] 收到游戏状态更新:', payload);
                this.handleGameStateUpdate(payload);
            })
            .on('broadcast', { event: 'player_action' }, (payload) => {
                console.log('[实时订阅] 收到玩家动作:', payload);
                this.handlePlayerAction(payload);
            })
            .subscribe((status, err) => {
                if (err) {
                    console.error('[实时订阅] ✗ 广播订阅错误:', err);
                    console.error('[实时订阅] 订阅状态:', status);
                    return;
                }
                if (status === 'SUBSCRIBED') {
                    console.log('[实时订阅] ✓ 广播订阅成功: game:' + this.roomId);
                } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
                    console.error('[实时订阅] ✗ 广播订阅失败:', status);
                    // 订阅失败后重置标志位
                    this.isSubscribing = false;
                    // 3秒后自动重试
                    setTimeout(() => {
                        console.log('[实时订阅] 尝试重新订阅广播...');
                        this.listenForRoomUpdates();
                    }, 3000);
                }
            });
        console.log('[实时订阅] ========== 订阅设置完成 ==========');
    }

    // 处理房间更新
    handleRoomUpdate(payload) {
        console.log('[房间更新] ========== 处理房间更新 ==========');
        console.log('[房间更新] 事件类型:', payload.eventType);
        console.log('[房间更新] 是否为房主:', this.isHost);
        console.log('[房间更新] 我的ID:', this.playerId);

        switch (payload.eventType) {
            case 'UPDATE':
                const roomData = payload.new;
                console.log('[房间更新] ========== 数据库更新事件 ==========');
                console.log('[房间更新] 房间ID:', roomData.id);
                console.log('[房间更新] 新房间状态:', roomData.status);
                console.log('[房间更新] 房主ID:', roomData.host_id);
                console.log('[房间更新] 是否有访客:', !!roomData.guest_id);
                console.log('[房间更新] 访客ID:', roomData.guest_id);
                console.log('[房间更新] 当前时间:', new Date().toISOString());

                // 如果是房主，并且状态变为ready，更新UI显示开始游戏按钮
                if (this.isHost && roomData.status === 'ready' && roomData.guest_id) {
                    console.log('[房间更新] ✓✓✓ 检测到玩家加入，更新UI ✓✓✓');
                    const waitingMessage = document.getElementById('waitingMessage');
                    const startGameBtn = document.getElementById('startGameBtn');
                    if (waitingMessage) {
                        waitingMessage.textContent = '玩家已加入，可以开始游戏了！';
                        console.log('[房间更新] ✓ 更新等待消息');
                    }
                    if (startGameBtn) {
                        startGameBtn.style.display = 'block';
                        startGameBtn.disabled = false;
                        console.log('[房间更新] ✓ 显示开始游戏按钮');
                    }
                } else if (this.isHost && roomData.status === 'waiting' && !roomData.guest_id) {
                    console.log('[房间更新] 房主检测到房间仍在等待中');
                }

                // 如果房间状态变为playing，开始游戏
                if (roomData.status === 'playing' && this.gameState !== 'playing') {
                    console.log('[房间更新] ✓✓✓ 检测到游戏开始，启动游戏 ✓✓✓');
                    this.startOnlineGame();
                }

                break;
            case 'INSERT':
                console.log('[房间更新] ========== 数据库插入事件 ==========');
                console.log('[房间更新] 房间被创建:', payload.new);
                break;
            case 'DELETE':
                console.log('[房间更新] ========== 数据库删除事件 ==========');
                console.log('[房间更新] 房间被删除:', payload.old);
                break;
            default:
                console.log('[房间更新] 未知事件类型:', payload.eventType);
        }
        console.log('[房间更新] ========== 房间更新处理完成 ==========');
    }

    // 处理游戏状态更新
    handleGameStateUpdate(payload) {
        console.log('[游戏状态] ========== 收到游戏状态更新 ==========');
        console.log('[游戏状态] 发送者ID:', payload.payload.playerId);
        console.log('[游戏状态] 我的ID:', this.playerId);
        console.log('[游戏状态] 游戏状态:', this.gameState);
        console.log('[游戏状态] 玩家数据:', payload.payload.playerData);

        // 如果游戏还没启动，自动启动游戏
        if (this.gameState !== 'playing' && window.startOnlineGame) {
            console.log('[游戏状态] ✓✓✓ 游戏未启动，检测到游戏状态，自动启动游戏 ✓✓✓');
            this.gameState = 'playing';
            this.startOnlineGame();
        }

        // 更新对手数据
        if (payload.payload.playerData && payload.payload.playerId !== this.playerId) {
            this.opponentData = payload.payload.playerData;
            console.log('[游戏状态] ✓ 更新对手状态');
            console.log('[游戏状态] 对手位置:', {
                x: this.opponentData.x,
                y: this.opponentData.y,
                dir: this.opponentData.dir
            });
            console.log('[游戏状态] 对手属性:', {
                health: this.opponentData.health,
                maxHealth: this.opponentData.maxHealth,
                energy: this.opponentData.energy,
                shield: this.opponentData.shield
            });
            // 更新对手在游戏中的位置和状态
            this.updateOpponentInGame();
        } else {
            console.log('[游戏状态] 收到自己的状态，忽略');
        }
        console.log('[游戏状态] ========== 游戏状态更新完成 ==========');
    }

    // 处理玩家动作
    handlePlayerAction(payload) {
        console.log('[玩家动作] ========== 收到玩家动作 ==========');
        console.log('[玩家动作] 发送者ID:', payload.payload.playerId);
        console.log('[玩家动作] 我的ID:', this.playerId);
        console.log('[玩家动作] 动作类型:', payload.payload.action.type);
        console.log('[玩家动作] 动作详情:', payload.payload.action);
        console.log('[玩家动作] 时间戳:', payload.payload.timestamp);

        // 如果不是自己的动作，则应用到游戏中
        if (payload.payload.playerId !== this.playerId) {
            console.log('[玩家动作] ✓ 应用对手动作');
            this.applyOpponentAction(payload.payload.action);
        } else {
            console.log('[玩家动作] 收到自己的动作，忽略');
        }
        console.log('[玩家动作] ========== 玩家动作处理完成 ==========');
    }

    // 开始在线游戏
    startOnlineGame() {
        // 防止重复启动
        if (this.gameState === 'playing') {
            console.log('[开始游戏] ⚠ 游戏已在运行，跳过重复启动');
            return;
        }

        console.log('[开始游戏] ========== 启动在线游戏 ==========');
        this.gameState = 'playing';

        // 隐藏等待界面，开始游戏
        if (window.hideWaitingRoom) {
            window.hideWaitingRoom();
        }

        // 启动游戏循环
        if (window.startOnlineGame) {
            console.log('[开始游戏] 调用 window.startOnlineGame');
            window.startOnlineGame(this.isHost);
        }
        console.log('[开始游戏] ========== 在线游戏启动完成 ==========');
    }

    // 发送玩家动作
    sendPlayerAction(action) {
        console.log('[发送动作] ========== 发送玩家动作 ==========');
        if (!this.channel || this.gameState !== 'playing') {
            console.log('[发送动作] ⚠ 未发送：通道未就绪或游戏未开始');
            console.log('[发送动作] 通道状态:', this.channel ? '已连接' : '未连接');
            console.log('[发送动作] 游戏状态:', this.gameState);
            return;
        }

        console.log('[发送动作] 动作类型:', action.type);
        console.log('[发送动作] 动作详情:', action);
        console.log('[发送动作] 发送时间:', Date.now());

        this.channel.send({
            type: 'broadcast',
            event: 'player_action',
            payload: {
                playerId: this.playerId,
                action: action,
                timestamp: Date.now()
            }
        });

        console.log('[发送动作] ✓ 动作已发送');
        console.log('[发送动作] ========== 玩家动作发送完成 ==========');
    }

    // 发送游戏状态
    sendGameState(playerData) {
        if (!this.channel || this.gameState !== 'playing') {
            return;
        }

        this.playerData = playerData;

        this.channel.send({
            type: 'broadcast',
            event: 'game_state',
            payload: {
                playerId: this.playerId,
                playerData: playerData,
                timestamp: Date.now()
            }
        });
    }

    // 更新对手在游戏中的位置和状态
    updateOpponentInGame() {
        console.log('[对手更新] ========== 更新对手状态 ==========');
        console.log('[对手更新] 对手数据:', this.opponentData);
        // 这个函数需要根据实际的游戏实现来更新对手的位置
        // 例如更新对手的角色位置、血量、技能状态等

        if (window.updateOppponentInGame) {
            console.log('[对手更新] ✓ 调用 updateOppponentInGame');
            window.updateOppponentInGame(this.opponentData);
        } else {
            console.error('[对手更新] ✗ updateOppponentInGame 函数不存在');
        }
        console.log('[对手更新] ========== 对手状态更新完成 ==========');
    }

    // 应用对手动作
    applyOpponentAction(action) {
        console.log('[应用动作] ========== 应用对手动作 ==========');
        console.log('[应用动作] 动作数据:', action);
        // 这个函数需要根据实际的游戏实现来应用对手的动作
        // 例如对手移动、攻击、使用技能等

        if (window.applyOppponentAction) {
            console.log('[应用动作] ✓ 调用 applyOppponentAction');
            window.applyOppponentAction(action);
        } else {
            console.error('[应用动作] ✗ applyOppponentAction 函数不存在');
        }
        console.log('[应用动作] ========== 对手动作应用完成 ==========');
    }

    // 开始游戏（房主调用）
    async startGame() {
        console.log('[开始游戏] ========== 开始游戏 ==========');
        console.log('[开始游戏] 是否为房主:', this.isHost);
        console.log('[开始游戏] 房间ID:', this.roomId);

        if (!this.isHost || !this.roomId) {
            console.error('[开始游戏] ⚠ 拒绝：非房主或房间ID不存在');
            return;
        }

        try {
            console.log('[开始游戏] 更新房间状态为 playing...');
            const { error } = await window.supabaseClient
                .from('game_rooms')
                .update({ status: 'playing' })
                .eq('id', this.roomId);

            if (error) {
                console.error('[开始游戏] ✗ 更新失败:', error);
                throw error;
            }

            console.log('[开始游戏] ✓ 游戏状态已更新为 playing');
            console.log('[开始游戏] ========== 游戏开始完成 ==========');
        } catch (error) {
            console.error('[开始游戏] ✗ 开始游戏失败:', error.message);
            console.error('[开始游戏] 错误详情:', error);
        }
    }

    // 离开房间
    async leaveRoom() {
        if (!this.roomId) return;

        try {
            // 取消订阅
            if (this.subscription) {
                this.subscription.unsubscribe();
            }
            
            if (this.channel) {
                this.channel.unsubscribe();
            }

            // 更新房间状态
            const { error } = await window.supabaseClient
                .from('game_rooms')
                .update({ 
                    status: this.isHost ? 'cancelled' : 'left',
                    ended_at: new Date().toISOString()
                })
                .eq('id', this.roomId);

            if (error) {
                throw error;
            }

            // 重置状态
            this.roomId = null;
            this.isHost = false;
            this.gameState = 'waiting';
            this.playerData = {};
            this.opponentData = {};

            console.log('已离开房间');
        } catch (error) {
            console.error('离开房间失败:', error.message);
        }
    }

    // 记录游戏结果
    async recordGameResult(winner, loser, rounds) {
        if (!window.userDataManager || !window.userDataManager.currentUser) {
            console.error('用户未登录，无法记录游戏结果');
            return { success: false, error: '用户未登录' };
        }

        try {
            // 计算得分
            const baseScore = 1000;
            const roundsBonus = rounds * 100;
            const winnerScore = baseScore + roundsBonus;
            const loserScore = Math.floor(baseScore / 2);

            // 记录胜者的分数
            if (winner === this.playerId) {
                await window.userDataManager.saveGameScore(winnerScore, rounds, 
                    window.getPlayerCharacter ? window.getPlayerCharacter() : 'unknown');
            }

            // 更新统计信息
            await this.updateGameStats(this.playerId, winner === this.playerId, rounds);

            return { success: true };
        } catch (error) {
            console.error('记录游戏结果失败:', error.message);
            return { success: false, error: error.message };
        }
    }

    // 更新游戏统计
    async updateGameStats(userId, isWin, rounds) {
        try {
            // 获取当前统计数据
            const { data: currentStats, error: statsError } = await window.supabaseClient
                .from('game_stats')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (statsError && statsError.code !== 'PGRST116') {
                throw statsError;
            }

            // 计算新的统计数据
            const newStats = {
                total_games: (currentStats?.total_games || 0) + 1,
                wins: (currentStats?.wins || 0) + (isWin ? 1 : 0),
                losses: (currentStats?.losses || 0) + (isWin ? 0 : 1),
                highest_score: Math.max(currentStats?.highest_score || 0, 
                    isWin ? 1000 + rounds * 100 : 0)
            };

            // 更新统计信息
            const { error: updateError } = await window.supabaseClient
                .from('game_stats')
                .update(newStats)
                .eq('user_id', userId);

            if (updateError) {
                throw updateError;
            }

            console.log('游戏统计已更新');
        } catch (error) {
            console.error('更新游戏统计失败:', error.message);
        }
    }

    // 生成房间ID
    generateRoomId() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    // 获取可用房间列表
    async getAvailableRooms() {
        try {
            const { data, error } = await window.supabaseClient
                .from('game_rooms')
                .select('*')
                .eq('status', 'waiting')
                .order('created_at', { ascending: false });

            if (error) {
                throw error;
            }

            return {
                success: true,
                rooms: data || []
            };
        } catch (error) {
            console.error('获取房间列表失败:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// 创建全局联机管理器实例
const multiplayerManager = new MultiplayerManager();

// 导出供其他脚本使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { multiplayerManager };
} else {
    window.multiplayerManager = multiplayerManager;
}