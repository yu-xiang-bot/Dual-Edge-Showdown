// 联机功能增强修复脚本
// 解决"等待对手加入"问题

(function() {
    'use strict';

    console.log('[联机增强修复] ========== 开始加载增强修复脚本 ==========');

    // 增强的房间状态检查函数
    function enhanceRoomStatusCheck() {
        console.log('[联机增强修复] 增强房间状态检查功能');

        // 如果 window.multiplayerManager 不存在，等待其加载
        if (!window.multiplayerManager) {
            console.log('[联机增强修复] 等待 multiplayerManager 加载...');
            setTimeout(enhanceRoomStatusCheck, 500);
            return;
        }

        // 保存原始的 listenForRoomUpdates 方法
        const originalListenForUpdates = window.multiplayerManager.listenForRoomUpdates.bind(window.multiplayerManager);

        // 重写 listenForRoomUpdates 方法，增强错误处理和日志
        window.multiplayerManager.listenForRoomUpdates = function() {
            console.log('[联机增强修复] ========== 增强的房间订阅启动 ==========');
            console.log('[联机增强修复] 房间ID:', this.roomId);
            console.log('[联机增强修复] 是否为房主:', this.isHost);
            console.log('[联机增强修复] 我的ID:', this.playerId);

            if (!this.roomId) {
                console.error('[联机增强修复] ✗ 房间ID不存在');
                return;
            }

            // 防止重复订阅
            if (this.isSubscribing) {
                console.log('[联机增强修复] ⚠ 正在订阅中，跳过重复调用');
                return;
            }
            this.isSubscribing = true;

            // 先取消旧的订阅
            if (this.subscription) {
                console.log('[联机增强修复] 取消旧的数据库订阅');
                try {
                    this.subscription.unsubscribe();
                } catch (e) {
                    console.warn('[联机增强修复] 取消订阅失败:', e);
                }
                this.subscription = null;
            }

            if (this.channel) {
                console.log('[联机增强修复] 取消旧的广播订阅');
                try {
                    this.channel.unsubscribe();
                } catch (e) {
                    console.warn('[联机增强修复] 取消订阅失败:', e);
                }
                this.channel = null;
            }

            // 订阅数据库更新 - 增强版
            console.log('[联机增强修复] 订阅数据库更新...');
            this.subscription = window.supabaseClient
                .channel(`room:${this.roomId}`)
                .on('postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'game_rooms',
                        filter: `id=eq.${this.roomId}`
                    },
                    (payload) => {
                        console.log('[联机增强修复] ========== 收到数据库更新 ==========');
                        console.log('[联机增强修复] 事件类型:', payload.eventType);
                        console.log('[联机增强修复] 事件时间:', new Date().toISOString());

                        // 增强的日志输出
                        if (payload.eventType === 'UPDATE') {
                            const oldData = payload.old || {};
                            const newData = payload.new || {};

                            console.log('[联机增强修复] 更新详情:');
                            console.log('[联机增强修复]   状态:', oldData.status, '→', newData.status);
                            console.log('[联机增强修复]   访客ID:', oldData.guest_id, '→', newData.guest_id);
                            console.log('[联机增强修复]   房主ID:', newData.host_id);

                            // 检测访客加入
                            if (!oldData.guest_id && newData.guest_id) {
                                console.log('[联机增强修复] 🎉 检测到访客加入！');
                                console.log('[联机增强修复] 访客ID:', newData.guest_id);
                                this.triggerGuestJoined(newData);
                            }

                            // 检测访客离开
                            if (oldData.guest_id && !newData.guest_id) {
                                console.log('[联机增强修复] ⚠ 访客离开房间');
                                this.triggerGuestLeft();
                            }
                        }

                        // 调用原始的更新处理函数
                        this.handleRoomUpdate(payload);
                    }
                )
                .subscribe((status, err) => {
                    console.log('[联机增强修复] 数据库订阅状态:', status);
                    if (err) {
                        console.error('[联机增强修复] ✗ 订阅错误:', err);
                    }

                    if (status === 'SUBSCRIBED') {
                        console.log('[联机增强修复] ✓✓✓ 数据库订阅成功 ✓✓✓');
                        this.isSubscribing = false;

                        // 订阅成功后，立即查询一次当前房间状态
                        this.queryCurrentRoomState();
                    } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
                        console.error('[联机增强修复] ✗✗✗ 数据库订阅失败 ✗✗✗');
                        this.isSubscribing = false;

                        // 5秒后自动重试
                        console.log('[联机增强修复] 5秒后自动重试订阅...');
                        setTimeout(() => {
                            console.log('[联机增强修复] 正在重试订阅...');
                            this.listenForRoomUpdates();
                        }, 5000);
                    }
                });

            // 订阅广播更新 - 增强版
            console.log('[联机增强修复] 订阅广播更新...');
            this.channel = window.supabaseClient
                .channel(`game:${this.roomId}`)
                .on('broadcast', { event: 'game_state' }, (payload) => {
                    console.log('[联机增强修复] 收到游戏状态更新');
                    this.handleGameStateUpdate(payload);
                })
                .on('broadcast', { event: 'player_action' }, (payload) => {
                    console.log('[联机增强修复] 收到玩家动作');
                    this.handlePlayerAction(payload);
                })
                .subscribe((status, err) => {
                    console.log('[联机增强修复] 广播订阅状态:', status);
                    if (err) {
                        console.error('[联机增强修复] ✗ 广播订阅错误:', err);
                    }

                    if (status === 'SUBSCRIBED') {
                        console.log('[联机增强修复] ✓✓✓ 广播订阅成功 ✓✓✓');
                    } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
                        console.error('[联机增强修复] ✗✗✗ 广播订阅失败 ✗✗✗');

                        // 5秒后自动重试
                        console.log('[联机增强修复] 5秒后自动重试广播订阅...');
                        setTimeout(() => {
                            console.log('[联机增强修复] 正在重试广播订阅...');
                            this.listenForRoomUpdates();
                        }, 5000);
                    }
                });

            console.log('[联机增强修复] ========== 订阅设置完成 ==========');
        };

        // 添加查询当前房间状态的方法
        window.multiplayerManager.queryCurrentRoomState = async function() {
            console.log('[联机增强修复] ========== 查询当前房间状态 ==========');
            if (!this.roomId) {
                console.warn('[联机增强修复] 房间ID不存在，跳过查询');
                return;
            }

            try {
                const { data, error } = await window.supabaseClient
                    .from('game_rooms')
                    .select('*')
                    .eq('id', this.roomId)
                    .maybeSingle();

                if (error) {
                    console.error('[联机增强修复] ✗ 查询房间状态失败:', error);
                    return;
                }

                if (!data) {
                    console.error('[联机增强修复] ✗ 房间不存在');
                    return;
                }

                console.log('[联机增强修复] ✓ 房间状态查询成功');
                console.log('[联机增强修复] 房间ID:', data.id);
                console.log('[联机增强修复] 状态:', data.status);
                console.log('[联机增强修复] 房主ID:', data.host_id);
                console.log('[联机增强修复] 访客ID:', data.guest_id);
                console.log('[联机增强修复] 创建时间:', data.created_at);

                // 检查是否有访客
                if (data.guest_id && this.isHost) {
                    console.log('[联机增强修复] 🎉 检测到访客存在！触发访客加入逻辑');
                    this.triggerGuestJoined(data);
                } else if (data.guest_id && !this.isHost) {
                    console.log('[联机增强修复] 我是访客，已在房间中');
                } else {
                    console.log('[联机增强修复] 等待访客加入...');
                }

            } catch (error) {
                console.error('[联机增强修复] ✗ 查询房间状态异常:', error);
            }
            console.log('[联机增强修复] ========== 房间状态查询完成 ==========');
        };

        // 添加触发访客加入的方法
        window.multiplayerManager.triggerGuestJoined = function(roomData) {
            console.log('[联机增强修复] ========== 触发访客加入逻辑 ==========');
            console.log('[联机增强修复] 房间数据:', roomData);

            if (!this.isHost) {
                console.log('[联机增强修复] 我是访客，不处理访客加入事件');
                return;
            }

            try {
                // 更新等待消息
                const waitingMessage = document.getElementById('waitingMessage');
                const waitingRoomStartGameBtn = document.getElementById('waitingRoomStartGameBtn');
                const startGameBtn = document.getElementById('startGameBtn');

                if (waitingMessage) {
                    waitingMessage.textContent = '玩家已加入，可以开始游戏了！';
                    waitingMessage.style.color = '#2ecc71';
                    console.log('[联机增强修复] ✓ 更新等待消息');
                }

                // 显示开始游戏按钮
                if (waitingRoomStartGameBtn) {
                    waitingRoomStartGameBtn.style.display = 'block';
                    waitingRoomStartGameBtn.disabled = false;
                    console.log('[联机增强修复] ✓ 显示等待房间开始游戏按钮');
                }

                if (startGameBtn) {
                    startGameBtn.style.display = 'block';
                    startGameBtn.disabled = false;
                    console.log('[联机增强修复] ✓ 显示开始游戏按钮');
                }

                // 播放提示音（如果有）
                if (typeof playNotificationSound === 'function') {
                    playNotificationSound();
                }

                // 显示通知
                console.log('[联机增强修复] ✓✓✓ 访客加入成功，UI已更新 ✓✓✓');

            } catch (error) {
                console.error('[联机增强修复] ✗ 处理访客加入失败:', error);
            }
        };

        // 添加触发访客离开的方法
        window.multiplayerManager.triggerGuestLeft = function() {
            console.log('[联机增强修复] ========== 触发访客离开逻辑 ==========');

            if (!this.isHost) {
                console.log('[联机增强修复] 我是访客，不处理访客离开事件');
                return;
            }

            try {
                // 更新等待消息
                const waitingMessage = document.getElementById('waitingMessage');
                const waitingRoomStartGameBtn = document.getElementById('waitingRoomStartGameBtn');
                const startGameBtn = document.getElementById('startGameBtn');

                if (waitingMessage) {
                    waitingMessage.textContent = '等待玩家加入房间...';
                    waitingMessage.style.color = '#e0e0e0';
                    console.log('[联机增强修复] ✓ 恢复等待消息');
                }

                // 隐藏开始游戏按钮
                if (waitingRoomStartGameBtn) {
                    waitingRoomStartGameBtn.style.display = 'none';
                    console.log('[联机增强修复] ✓ 隐藏等待房间开始游戏按钮');
                }

                if (startGameBtn) {
                    startGameBtn.style.display = 'none';
                    console.log('[联机增强修复] ✓ 隐藏开始游戏按钮');
                }

                console.log('[联机增强修复] ✓✓✓ 访客离开处理完成 ✓✓✓');

            } catch (error) {
                console.error('[联机增强修复] ✗ 处理访客离开失败:', error);
            }
        };

        // 增强的加入房间方法
        const originalJoinRoom = window.multiplayerManager.joinRoom.bind(window.multiplayerManager);
        window.multiplayerManager.joinRoom = async function(roomId) {
            console.log('[联机增强修复] ========== 增强的加入房间 ==========');
            console.log('[联机增强修复] 目标房间ID:', roomId);
            console.log('[联机增强修复] 我的ID:', this.playerId);

            try {
                // 调用原始的加入房间方法
                const result = await originalJoinRoom(roomId);

                if (result.success) {
                    console.log('[联机增强修复] ✓✓✓ 成功加入房间 ✓✓✓');
                    console.log('[联机增强修复] 延迟2秒后验证房间状态...');
                    setTimeout(() => {
                        this.queryCurrentRoomState();
                    }, 2000);
                } else {
                    console.error('[联机增强修复] ✗ 加入房间失败:', result.error);

                    // 针对常见错误提供详细的错误信息
                    if (result.error.includes('permission')) {
                        console.error('[联机增强修复] ❌ 权限错误！这是最常见的问题。');
                        console.error('[联机增强修复] 解决方案：请运行 database/fix_join_policy.sql 脚本');
                        alert('加入房间失败：权限不足\n\n请按照以下步骤修复：\n1. 打开 pages/diagnose-online.html 页面\n2. 运行诊断测试\n3. 根据提示修复数据库权限\n\n或者直接在 Supabase SQL 编辑器中运行 database/fix_join_policy.sql');
                    }
                }

                return result;
            } catch (error) {
                console.error('[联机增强修复] ✗ 加入房间异常:', error);
                throw error;
            }
        };

        // 增强的创建房间方法
        const originalCreateRoom = window.multiplayerManager.createRoom.bind(window.multiplayerManager);
        window.multiplayerManager.createRoom = async function() {
            console.log('[联机增强修复] ========== 增强的创建房间 ==========');

            try {
                // 调用原始的创建房间方法
                const result = await originalCreateRoom();

                if (result.success) {
                    console.log('[联机增强修复] ✓✓✓ 成功创建房间 ✓✓✓');
                    console.log('[联机增强修复] 延迟2秒后验证房间状态...');
                    setTimeout(() => {
                        this.queryCurrentRoomState();
                    }, 2000);
                } else {
                    console.error('[联机增强修复] ✗ 创建房间失败:', result.error);
                }

                return result;
            } catch (error) {
                console.error('[联机增强修复] ✗ 创建房间异常:', error);
                throw error;
            }
        };

        // 添加手动刷新房间状态的方法
        window.refreshRoomStatus = function() {
            console.log('[联机增强修复] ========== 手动刷新房间状态 ==========');
            if (!window.multiplayerManager || !window.multiplayerManager.roomId) {
                alert('当前没有在房间中');
                return;
            }

            window.multiplayerManager.queryCurrentRoomState();
            alert('房间状态已刷新，请查看控制台日志');
        };

        // 添加显示调试信息的方法
        window.showDebugInfo = function() {
            console.log('[联机增强修复] ========== 调试信息 ==========');
            if (!window.multiplayerManager) {
                console.log('MultiplayerManager 不存在');
                return;
            }

            const info = {
                roomId: window.multiplayerManager.roomId,
                playerId: window.multiplayerManager.playerId,
                isHost: window.multiplayerManager.isHost,
                gameState: window.multiplayerManager.gameState,
                isSubscribing: window.multiplayerManager.isSubscribing,
                subscriptionExists: !!window.multiplayerManager.subscription,
                channelExists: !!window.multiplayerManager.channel
            };

            console.log('联机管理器状态:', info);
            alert(JSON.stringify(info, null, 2));
        };

        console.log('[联机增强修复] ========== 增强修复脚本加载完成 ==========');
        console.log('[联机增强修复] 可用方法:');
        console.log('[联机增强修复] - window.refreshRoomStatus(): 手动刷新房间状态');
        console.log('[联机增强修复] - window.showDebugInfo(): 显示调试信息');
        console.log('[联机增强修复] - window.multiplayerManager.queryCurrentRoomState(): 查询房间状态');
    }

    // 页面加载完成后执行
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', enhanceRoomStatusCheck);
    } else {
        enhanceRoomStatusCheck();
    }

    console.log('[联机增强修复] 增强修复脚本已注册');
})();
