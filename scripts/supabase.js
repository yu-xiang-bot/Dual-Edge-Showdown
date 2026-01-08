// 防止重复加载：如果已经初始化过，直接返回
if (window.supabaseClient && window.userDataManager) {
    console.log('Supabase已初始化，跳过重复加载');
} else {
    // Supabase数据库连接配置
    if (typeof SUPABASE_URL === 'undefined') {
        var SUPABASE_URL = 'https://vlturfwdcjlrsoswkzvr.supabase.co';
    }
    if (typeof SUPABASE_ANON_KEY === 'undefined') {
        var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsdHVyZndkY2pscnNvc3drenZyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjIyMjA2MiwiZXhwIjoyMDgxNzk4MDYyfQ.fZNNS_1n7HI4r9IaIydfaewXbvzwVonG8I8EGlTvqqc';
    }

    // 初始化Supabase客户端
    const { createClient } = window.supabase;
    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    window.supabaseClient = supabaseClient;

    // 用户数据管理
    class UserDataManager {
        constructor() {
            this.currentUser = null;
            this.initialized = false;
        }

        // 初始化用户会话
        async initialize() {
            try {
                // 检查当前会话
                const { data: { session }, error } = await supabaseClient.auth.getSession();
                
                if (error) {
                    console.error('获取会话失败:', error.message);
                    return false;
                }

                if (session) {
                    this.currentUser = session.user;
                    console.log('用户已登录:', this.currentUser.email);
                    await this.loadUserData();
                }
                
                this.initialized = true;
                return true;
            } catch (error) {
                console.error('初始化失败:', error.message);
                return false;
            }
        }

        // 用户登录
        async signIn(email, password) {
            try {
                const { data, error } = await supabaseClient.auth.signInWithPassword({
                    email: email,
                    password: password
                });

                if (error) {
                    throw error;
                }

                this.currentUser = data.user;
                await this.loadUserData();
                return { success: true, user: data.user };
            } catch (error) {
                console.error('登录失败:', error.message);
                return { success: false, error: error.message };
            }
        }

        // 用户注册
        async signUp(email, password, username) {
            try {
                // 验证邮箱格式
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(email)) {
                    return { success: false, error: '邮箱格式不正确' };
                }

                // 验证密码强度
                if (password.length < 6) {
                    return { success: false, error: '密码长度至少为6位' };
                }

                // 验证用户名
                if (!username || username.trim().length < 2) {
                    return { success: false, error: '用户名至少需要2个字符' };
                }

                if (username.length > 20) {
                    return { success: false, error: '用户名不能超过20个字符' };
                }

                // 验证用户名格式（只允许字母、数字、下划线和中文）
                const usernameRegex = /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/;
                if (!usernameRegex.test(username)) {
                    return { success: false, error: '用户名只能包含字母、数字、下划线和中文' };
                }

                // 检查用户名是否已被使用（可选，提供即时反馈）
                try {
                    const { data: existingUser, error: checkError } = await supabaseClient
                        .from('profiles')
                        .select('username')
                        .eq('username', username.trim())
                        .maybeSingle();

                    if (existingUser) {
                        return { success: false, error: '该用户名已被使用，请选择其他用户名' };
                    }
                    // 如果查询出错（比如用户未登录），忽略错误继续注册
                    // 数据库触发器会处理重复用户名的情况
                } catch (checkError) {
                    console.log('用户名检查跳过:', checkError.message);
                    // 继续注册流程
                }

                // 执行注册
                const { data, error } = await supabaseClient.auth.signUp({
                    email: email,
                    password: password,
                    options: {
                        data: {
                            username: username.trim()
                        },
                        emailRedirectTo: window.location.origin + '/pages/login.html?verified=true'
                    }
                });

                if (error) {
                    throw error;
                }

                return {
                    success: true,
                    user: data.user,
                    session: data.session,
                    needsVerification: data.user && !data.session
                };
            } catch (error) {
                console.error('注册失败:', error.message);

                // 友好的错误提示
                let errorMessage = error.message;
                if (error.message.includes('User already registered')) {
                    errorMessage = '该邮箱已被注册，请直接登录或使用其他邮箱';
                } else if (error.message.includes('Invalid login credentials')) {
                    errorMessage = '邮箱或密码格式不正确';
                } else if (error.message.includes('duplicate key') || error.message.includes('unique constraint')) {
                    errorMessage = '该用户名已被使用，请选择其他用户名';
                } else if (error.message.includes('Database error')) {
                    errorMessage = '注册失败，请稍后重试';
                }

                return { success: false, error: errorMessage };
            }
        }

        // 重发验证邮件
        async resendVerificationEmail(email) {
            try {
                const { data, error } = await supabaseClient.auth.resend({ 
                    type: 'signup',
                    email: email
                });

                if (error) {
                    throw error;
                }

                return { success: true, data: data };
            } catch (error) {
                console.error('重发验证邮件失败:', error.message);
                return { success: false, error: error.message };
            }
        }

        // 检查用户邮箱验证状态
        async checkEmailVerificationStatus() {
            if (!this.currentUser) {
                return { verified: false };
            }

            try {
                const { data: { user }, error } = await supabaseClient.auth.getUser();
                
                if (error) {
                    throw error;
                }

                return { verified: user.email_confirmed_at !== null };
            } catch (error) {
                console.error('检查邮箱验证状态失败:', error.message);
                return { verified: false, error: error.message };
            }
        }

        // 用户登出
        async signOut() {
            try {
                const { error } = await supabaseClient.auth.signOut();
                
                if (error) {
                    throw error;
                }

                this.currentUser = null;
                return { success: true };
            } catch (error) {
                console.error('登出失败:', error.message);
                return { success: false, error: error.message };
            }
        }

        // 保存游戏数据
        async saveGameData(gameData) {
            if (!this.currentUser) {
                console.error('用户未登录，无法保存游戏数据');
                return { success: false, error: '用户未登录' };
            }

            try {
                const { data, error } = await supabaseClient
                    .from('game_data')
                    .upsert({
                        user_id: this.currentUser.id,
                        data: gameData,
                        updated_at: new Date().toISOString()
                    });

                if (error) {
                    throw error;
                }

                return { success: true, data };
            } catch (error) {
                console.error('保存游戏数据失败:', error.message);
                return { success: false, error: error.message };
            }
        }

        // 加载游戏数据
        async loadUserData() {
            if (!this.currentUser) {
                console.error('用户未登录，无法加载游戏数据');
                return null;
            }

            try {
                const { data, error } = await supabaseClient
                    .from('game_data')
                    .select('data')
                    .eq('user_id', this.currentUser.id)
                    .single();

                if (error && error.code !== 'PGRST116') { // PGRST116 是没有找到记录的错误码
                    throw error;
                }

                return data ? data.data : null;
            } catch (error) {
                console.error('加载游戏数据失败:', error.message);
                return null;
            }
        }

        // 保存游戏分数
        async saveGameScore(score, level, character) {
            if (!this.currentUser) {
                console.error('用户未登录，无法保存游戏分数');
                return { success: false, error: '用户未登录' };
            }

            try {
                const { data, error } = await supabaseClient
                    .from('game_scores')
                    .insert({
                        user_id: this.currentUser.id,
                        score: score,
                        level: level,
                        character: character,
                        created_at: new Date().toISOString()
                    });

                if (error) {
                    throw error;
                }

                return { success: true, data };
            } catch (error) {
                console.error('保存游戏分数失败:', error.message);
                return { success: false, error: error.message };
            }
        }

        // 获取排行榜
        async getLeaderboard(limit = 10) {
            try {
                const { data, error } = await supabaseClient
                    .from('game_scores')
                    .select(`
                        score,
                        level,
                        character,
                        created_at,
                        user: profiles(username, avatar_url)
                    `)
                    .order('score', { ascending: false })
                    .limit(limit);

                if (error) {
                    throw error;
                }

                return { success: true, data };
            } catch (error) {
                console.error('获取排行榜失败:', error.message);
                return { success: false, error: error.message };
            }
        }

        // 获取用户资料信息
        async getUserProfile() {
            if (!this.currentUser) {
                console.error('用户未登录，无法获取用户资料');
                return null;
            }

            try {
                const { data, error } = await supabaseClient
                    .from('profiles')
                    .select('username, avatar_url, website')
                    .eq('id', this.currentUser.id)
                    .single();

                if (error) {
                    throw error;
                }

                return data;
            } catch (error) {
                console.error('获取用户资料失败:', error.message);
                return null;
            }
        }

        // 更新用户资料
        async updateUserProfile(profileData) {
            if (!this.currentUser) {
                console.error('用户未登录，无法更新用户资料');
                return { success: false, error: '用户未登录' };
            }

            try {
                const { data, error } = await supabaseClient
                    .from('profiles')
                    .upsert({
                        id: this.currentUser.id,
                        ...profileData,
                        updated_at: new Date().toISOString()
                    });

                if (error) {
                    throw error;
                }

                return { success: true, data };
            } catch (error) {
                console.error('更新用户资料失败:', error.message);
                return { success: false, error: error.message };
            }
        }

        // 上传头像
        async uploadAvatar(file) {
            if (!this.currentUser) {
                console.error('用户未登录，无法上传头像');
                return { success: false, error: '用户未登录' };
            }

            try {
                // 验证文件类型
                const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
                if (!allowedTypes.includes(file.type)) {
                    return { success: false, error: '不支持的文件类型，请上传 JPG、PNG、GIF 或 WebP 格式的图片' };
                }

                // 验证文件大小（2MB）
                const maxSize = 2 * 1024 * 1024;
                if (file.size > maxSize) {
                    return { success: false, error: '文件大小超过2MB限制' };
                }

                // 生成唯一文件名
                const fileExt = file.name.split('.').pop();
                const fileName = `${this.currentUser.id}-${Date.now()}.${fileExt}`;
                const filePath = `${this.currentUser.id}/${fileName}`;

                // 上传文件到存储桶
                const { data, error } = await supabaseClient.storage
                    .from('user-avatars')
                    .upload(filePath, file, {
                        cacheControl: '3600',
                        upsert: true
                    });

                if (error) {
                    console.error('存储上传错误:', error);
                    throw new Error(error.message);
                }

                // 获取公共URL
                const { data: urlData } = supabaseClient.storage
                    .from('user-avatars')
                    .getPublicUrl(filePath);

                // 更新用户资料中的头像URL
                const updateResult = await this.updateUserProfile({
                    avatar_url: urlData.publicUrl
                });

                if (!updateResult.success) {
                    console.error('更新用户资料失败:', updateResult.error);
                    throw new Error(updateResult.error);
                }

                console.log('头像上传成功:', urlData.publicUrl);
                return {
                    success: true,
                    url: urlData.publicUrl
                };
            } catch (error) {
                console.error('上传头像失败:', error);
                return { success: false, error: error.message || '上传失败，请重试' };
            }
        }

        // 计算等级函数：根据游戏总时长(分钟)计算等级
        // 等级公式：S(n) = n² + 4n (n为等级，S(n)为累计活跃分钟)
        calculateLevel(totalMinutes) {
            let level = 1;
            while (level <= 100) {
                const requiredMinutes = level * level + 4 * level;
                if (totalMinutes < requiredMinutes) {
                    return level - 1 === 0 ? 1 : level - 1;
                }
                level++;
            }
            return 100;
        }

        // 获取升级到下一级所需时长(分钟)
        getMinutesToNextLevel(currentLevel) {
            const nextLevel = currentLevel + 1;
            const currentRequired = currentLevel * currentLevel + 4 * currentLevel;
            const nextRequired = nextLevel * nextLevel + 4 * nextLevel;
            return nextRequired - currentRequired;
        }

        // 获取升级到指定等级所需累计时长(分钟)
        getRequiredMinutesForLevel(targetLevel) {
            return targetLevel * targetLevel + 4 * targetLevel;
        }

        // 向下兼容：获取升级到下一级所需时长(小时) - 已废弃，保留以兼容旧代码
        getHoursToNextLevel(currentLevel) {
            return this.getMinutesToNextLevel(currentLevel) / 60;
        }

        // 向下兼容：获取升级到指定等级所需累计时长(小时) - 已废弃，保留以兼容旧代码
        getRequiredHoursForLevel(targetLevel) {
            return this.getRequiredMinutesForLevel(targetLevel) / 60;
        }

        // 更新游戏统计：增加游戏时长(秒)
        async updatePlayTime(additionalSeconds) {
            if (!this.currentUser) {
                console.error('用户未登录，无法更新游戏时长');
                return { success: false, error: '用户未登录' };
            }

            try {
                // 首先获取当前的游戏时长
                const { data: currentStats, error: fetchError } = await supabaseClient
                    .from('game_stats')
                    .select('play_time')
                    .eq('user_id', this.currentUser.id)
                    .single();

                if (fetchError) {
                    // 如果记录不存在，创建新记录
                    if (fetchError.code === 'PGRST116') {
                        const { data: newData, error: insertError } = await supabaseClient
                            .from('game_stats')
                            .insert({
                                user_id: this.currentUser.id,
                                play_time: additionalSeconds,
                                total_games: 0,
                                wins: 0,
                                losses: 0,
                                highest_score: 0
                            })
                            .select()
                            .single();

                        if (insertError) {
                            throw insertError;
                        }

                        console.log('游戏时长已记录(新记录):', additionalSeconds, '秒');
                        return { success: true, data: newData };
                    }

                    throw fetchError;
                }

                // 增加游戏时长
                const newPlayTime = currentStats.play_time + additionalSeconds;

                const { data, error } = await supabaseClient
                    .from('game_stats')
                    .update({
                        play_time: newPlayTime
                    })
                    .eq('user_id', this.currentUser.id)
                    .select()
                    .single();

                if (error) {
                    throw error;
                }

                console.log('游戏时长已更新:', newPlayTime, '秒');
                // 等级会通过数据库触发器自动更新
                return { success: true, data };
            } catch (error) {
                console.error('更新游戏时长失败:', error.message);
                return { success: false, error: error.message };
            }
        }

        // 获取用户等级信息
        async getUserLevelInfo() {
            if (!this.currentUser) {
                console.error('用户未登录，无法获取等级信息');
                return null;
            }

            try {
                const { data, error } = await supabaseClient
                    .from('game_stats')
                    .select('play_time, level, login_days')
                    .eq('user_id', this.currentUser.id)
                    .single();

                if (error) {
                    throw error;
                }

                const totalMinutes = data.play_time / 60; // 转换为分钟
                const totalHours = data.play_time / 3600; // 转换为小时
                const currentLevel = data.level;
                const minutesToNext = this.getMinutesToNextLevel(currentLevel);
                const requiredForCurrent = this.getRequiredMinutesForLevel(currentLevel);
                const requiredForNext = this.getRequiredMinutesForLevel(currentLevel + 1);

                return {
                    totalMinutes: totalMinutes.toFixed(2),
                    totalHours: totalHours.toFixed(2),
                    totalSeconds: data.play_time,
                    currentLevel: currentLevel,
                    loginDays: data.login_days.toFixed(2),
                    minutesToNextLevel: minutesToNext.toFixed(2),
                    hoursToNextLevel: (minutesToNext / 60).toFixed(2),
                    progress: ((totalMinutes - requiredForCurrent) / minutesToNext * 100).toFixed(2),
                    currentLevelRequiredMinutes: requiredForCurrent,
                    nextLevelRequiredMinutes: requiredForNext,
                    // 向下兼容保留的字段
                    currentLevelRequired: requiredForCurrent / 60,
                    nextLevelRequired: requiredForNext / 60,
                    hoursToNextLevel: (minutesToNext / 60).toFixed(2)
                };
            } catch (error) {
                console.error('获取等级信息失败:', error.message);
                return null;
            }
        }
    }

    // 创建全局数据管理器实例，并立即开始初始化（避免页面之间的竞态问题）
    // 防止重复初始化
    if (!window.userDataManager) {
        const userDataManager = new UserDataManager();
        const userDataManagerReady = (async () => {
            const initSuccess = await userDataManager.initialize();
            if (!initSuccess) {
                console.error('Supabase初始化失败');
            }
            return initSuccess;
        })();

        // 导出供其他脚本使用
        if (typeof module !== 'undefined' && module.exports) {
            module.exports = { supabase: supabaseClient, userDataManager, userDataManagerReady };
        } else {
            window.supabase = supabaseClient;
            window.userDataManager = userDataManager;
            window.userDataManagerReady = userDataManagerReady;
        }
    } else {
        console.log('Supabase用户数据管理器已存在，跳过重复初始化');
    }
}
