// 游戏时长追踪器
// 功能：用户登录开始计时，退出登录后结束计时，实时保存到Supabase数据库

class PlaytimeTracker {
    constructor() {
        this.isPlaying = false;
        this.playStartTime = null;
        this.updateInterval = null;
        this.updateIntervalMs = 30000; // 每30秒更新一次数据库
        this.sessionPlayTime = 0; // 当前会话游戏时长(秒)
        this.currentUser = null;
    }

    // 初始化
    async initialize() {
        console.log('初始化游戏时长追踪器...');

        // 检查用户是否已登录
        if (window.userDataManager && window.userDataManager.currentUser) {
            this.currentUser = window.userDataManager.currentUser;
            console.log('用户已登录:', this.currentUser.email);
        }

        // 恢复之前的会话状态（如果页面刷新但用户仍在游戏中）
        this.restoreSession();

        // 监听页面可见性变化
        document.addEventListener('visibilitychange', () => this.handleVisibilityChange());

        // 监听页面卸载
        window.addEventListener('beforeunload', () => this.handlePageUnload());
        window.addEventListener('unload', () => this.handlePageUnload());

        // 监听用户登出事件
        this.setupLogoutListener();

        console.log('游戏时长追踪器初始化完成');
    }

    // 恢复会话状态
    restoreSession() {
        const savedSession = localStorage.getItem('playtimeSession');

        if (savedSession) {
            const sessionData = JSON.parse(savedSession);

            // 检查会话是否仍然有效（时间间隔不超过1小时）
            const sessionAge = Date.now() - sessionData.startTime;
            const maxSessionAge = 60 * 60 * 1000; // 1小时

            if (sessionAge < maxSessionAge && this.currentUser) {
                // 恢复计时
                this.isPlaying = true;
                this.playStartTime = sessionData.startTime;
                this.sessionPlayTime = Math.floor(sessionAge / 1000); // 转换为秒

                console.log('恢复游戏会话，已播放时间:', this.sessionPlayTime, '秒');

                // 重新开始定期更新
                this.startPeriodicUpdate();
            } else {
                // 会话已过期，清除
                this.clearSession();
            }
        }
    }

    // 开始计时（用户登录进入游戏）
    async startTracking() {
        if (!this.currentUser) {
            console.error('用户未登录，无法开始计时');
            return { success: false, error: '用户未登录' };
        }

        if (this.isPlaying) {
            console.log('已经在计时中');
            return { success: true, message: '已经在计时中' };
        }

        console.log('开始游戏时长追踪...');

        this.isPlaying = true;
        this.playStartTime = Date.now();
        this.sessionPlayTime = 0;

        // 保存会话状态
        this.saveSession();

        // 开始定期更新数据库
        this.startPeriodicUpdate();

        console.log('游戏时长追踪已启动');
        return { success: true, message: '计时已启动' };
    }

    // 停止计时（用户退出登录）
    async stopTracking() {
        if (!this.isPlaying) {
            console.log('当前没有在计时');
            return { success: true, message: '当前没有在计时' };
        }

        console.log('停止游戏时长追踪...');

        // 计算当前会话的游戏时长
        const currentSessionTime = this.calculateSessionTime();
        this.sessionPlayTime = currentSessionTime;

        // 停止定期更新
        this.stopPeriodicUpdate();

        // 保存最终的游戏时长到数据库
        try {
            if (this.currentUser) {
                const result = await window.userDataManager.updatePlayTime(currentSessionTime);

                if (result.success) {
                    console.log('游戏时长已保存到数据库:', currentSessionTime, '秒');
                } else {
                    console.error('保存游戏时长失败:', result.error);
                }
            }
        } catch (error) {
            console.error('保存游戏时长时出错:', error.message);
        }

        // 清除会话状态
        this.isPlaying = false;
        this.playStartTime = null;
        this.clearSession();

        console.log('游戏时长追踪已停止');
        return { success: true, message: '计时已停止' };
    }

    // 计算当前会话的游戏时长（秒）
    calculateSessionTime() {
        if (!this.playStartTime) {
            return 0;
        }
        return Math.floor((Date.now() - this.playStartTime) / 1000);
    }

    // 开始定期更新数据库
    startPeriodicUpdate() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }

        this.updateInterval = setInterval(async () => {
            await this.updateDatabase();
        }, this.updateIntervalMs);
    }

    // 停止定期更新
    stopPeriodicUpdate() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    // 更新数据库
    async updateDatabase() {
        if (!this.isPlaying || !this.currentUser) {
            return;
        }

        try {
            const currentSessionTime = this.calculateSessionTime();
            this.sessionPlayTime = currentSessionTime;

            const result = await window.userDataManager.updatePlayTime(currentSessionTime);

            if (result.success) {
                console.log('游戏时长已实时更新:', currentSessionTime, '秒');
            } else {
                console.error('实时更新游戏时长失败:', result.error);
            }
        } catch (error) {
            console.error('更新数据库时出错:', error.message);
        }
    }

    // 处理页面可见性变化
    handleVisibilityChange() {
        if (document.hidden) {
            // 页面隐藏（用户切换标签页或最小化窗口）
            // 暂停定期更新，但保持计时
            console.log('页面隐藏，暂停定期更新');
            this.stopPeriodicUpdate();
        } else {
            // 页面可见（用户回到页面）
            console.log('页面可见，恢复定期更新');

            if (this.isPlaying) {
                // 重新开始定期更新
                this.startPeriodicUpdate();

                // 立即更新一次数据库
                this.updateDatabase();
            }
        }
    }

    // 处理页面卸载（关闭标签页或刷新页面）
    handlePageUnload() {
        if (this.isPlaying && this.currentUser) {
            // 使用navigator.sendBeacon发送最后一次数据
            // 这样可以在页面卸载时可靠地发送请求

            try {
                const currentSessionTime = this.calculateSessionTime();

                // 构造要发送的数据
                const data = {
                    user_id: this.currentUser.id,
                    play_time: currentSessionTime,
                    timestamp: Date.now()
                };

                // 使用sendBeacon发送数据
                // 注意：这需要在服务器端有相应的API来处理这个请求
                const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
                const url = `${window.supabaseClient.supabaseUrl}/rest/v1/game_stats`;

                navigator.sendBeacon(url, blob);

                console.log('页面卸载，游戏时长数据已发送:', currentSessionTime, '秒');
            } catch (error) {
                console.error('页面卸载时发送数据失败:', error.message);
            }

            // 保存会话状态到localStorage，以便页面刷新后恢复
            this.saveSession();
        }
    }

    // 设置登出监听
    setupLogoutListener() {
        // 监听自定义的登出事件
        window.addEventListener('userLoggedOut', async () => {
            console.log('检测到用户登出事件');
            await this.stopTracking();
        });

        // 监听Supabase的auth状态变化
        if (window.supabaseClient) {
            window.supabaseClient.auth.onAuthStateChange(async (event, session) => {
                console.log('Auth状态变化:', event);

                if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED' && !session) {
                    // 用户登出或会话过期
                    await this.stopTracking();
                } else if (event === 'SIGNED_IN' && session) {
                    // 用户登录
                    this.currentUser = session.user;
                    await this.startTracking();
                }
            });
        }
    }

    // 保存会话状态到localStorage
    saveSession() {
        if (!this.playStartTime) {
            return;
        }

        const sessionData = {
            startTime: this.playStartTime,
            userId: this.currentUser ? this.currentUser.id : null,
            isPlaying: this.isPlaying
        };

        localStorage.setItem('playtimeSession', JSON.stringify(sessionData));
    }

    // 清除会话状态
    clearSession() {
        localStorage.removeItem('playtimeSession');
    }

    // 获取当前会话的游戏时长
    getCurrentSessionTime() {
        return this.isPlaying ? this.calculateSessionTime() : 0;
    }

    // 获取格式化的游戏时长显示
    getFormattedPlaytime(seconds) {
        if (!seconds || seconds <= 0) {
            return '0秒';
        }

        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours}小时${minutes}分钟${secs}秒`;
        } else if (minutes > 0) {
            return `${minutes}分钟${secs}秒`;
        } else {
            return `${secs}秒`;
        }
    }
}

// 创建全局实例
const playtimeTracker = new PlaytimeTracker();

// 在页面加载完成后初始化
document.addEventListener('DOMContentLoaded', async function() {
    // 等待Supabase和userDataManager初始化完成
    if (window.userDataManagerReady) {
        await window.userDataManagerReady;
    }

    // 初始化时长追踪器
    await playtimeTracker.initialize();

    // 如果用户已登录，开始计时
    if (playtimeTracker.currentUser) {
        await playtimeTracker.startTracking();
    }
});

// 导出供其他脚本使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { playtimeTracker };
} else {
    window.playtimeTracker = playtimeTracker;
}
