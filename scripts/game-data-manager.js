// 游戏数据管理器 - 与Supabase数据库交互
class GameDataManager {
    constructor() {
        this.userData = null;
        this.gameSession = {
            startTime: Date.now(),
            level: 0,
            character: null,
            score: 0,
            outcome: null // 'win' 或 'lose'
        };
    }

    // 初始化游戏数据管理器
    async initialize() {
        // 等待Supabase客户端加载完成
        if (typeof window.supabase === 'undefined' || typeof window.userDataManager === 'undefined') {
            console.error('Supabase客户端未加载');
            return false;
        }

        try {
            // 初始化用户数据管理器
            const initSuccess = await window.userDataManager.initialize();
            if (!initSuccess) {
                throw new Error('用户数据管理器初始化失败');
            }

            // 加载用户数据
            this.userData = await window.userDataManager.loadUserData();
            if (!this.userData) {
                this.userData = this.createDefaultUserData();
            }

            console.log('游戏数据管理器初始化成功');
            return true;
        } catch (error) {
            console.error('游戏数据管理器初始化失败:', error.message);
            return false;
        }
    }

    // 创建默认用户数据
    createDefaultUserData() {
        return {
            settings: {
                soundEnabled: true,
                selectedCharacter: null,
                unlockedLevels: [0] // 默认解锁第一关
            },
            statistics: {
                totalGames: 0,
                wins: 0,
                losses: 0,
                playTime: 0,
                highestScore: 0,
                characterStats: {
                    mage: { wins: 0, losses: 0, totalGames: 0, highestScore: 0 },
                    mech: { wins: 0, losses: 0, totalGames: 0, highestScore: 0 }
                },
                levelStats: {}
            }
        };
    }

    // 开始新游戏会话
    startGameSession(level, character) {
        this.gameSession = {
            startTime: Date.now(),
            level: level,
            character: character,
            score: 0,
            outcome: null
        };
    }

    // 更新游戏分数
    updateScore(score) {
        this.gameSession.score = score;
    }

    // 结束游戏会话
    async endGameSession(outcome) {
        this.gameSession.outcome = outcome;
        this.gameSession.endTime = Date.now();
        this.gameSession.duration = Math.floor((this.gameSession.endTime - this.gameSession.startTime) / 1000);

        try {
            // 更新用户统计数据
            await this.updateUserStatistics();
            
            // 保存游戏分数
            const scoreResult = await window.userDataManager.saveGameScore(
                this.gameSession.score,
                this.gameSession.level,
                this.gameSession.character
            );

            if (!scoreResult.success) {
                throw new Error('保存游戏分数失败: ' + scoreResult.error);
            }

            // 保存更新后的用户数据
            const saveResult = await window.userDataManager.saveGameData(this.userData);
            if (!saveResult.success) {
                throw new Error('保存用户数据失败: ' + saveResult.error);
            }

            console.log('游戏数据保存成功');
            return { success: true, message: '游戏数据已保存' };
        } catch (error) {
            console.error('保存游戏数据失败:', error.message);
            return { success: false, error: error.message };
        }
    }

    // 更新用户统计数据
    async updateUserStatistics() {
        const stats = this.userData.statistics;
        const session = this.gameSession;
        
        // 更新总游戏次数
        stats.totalGames += 1;
        
        // 更新角色统计
        if (!stats.characterStats[session.character]) {
            stats.characterStats[session.character] = { wins: 0, losses: 0, totalGames: 0, highestScore: 0 };
        }
        
        stats.characterStats[session.character].totalGames += 1;
        
        // 更新胜负统计
        if (session.outcome === 'win') {
            stats.wins += 1;
            stats.characterStats[session.character].wins += 1;
        } else {
            stats.losses += 1;
            stats.characterStats[session.character].losses += 1;
        }
        
        // 更新最高分
        if (session.score > stats.highestScore) {
            stats.highestScore = session.score;
        }
        
        if (session.score > stats.characterStats[session.character].highestScore) {
            stats.characterStats[session.character].highestScore = session.score;
        }
        
        // 更新关卡统计
        const levelKey = `level${session.level}`;
        if (!stats.levelStats[levelKey]) {
            stats.levelStats[levelKey] = { wins: 0, losses: 0, highestScore: 0 };
        }
        
        stats.levelStats[levelKey].totalGames = (stats.levelStats[levelKey].totalGames || 0) + 1;
        
        if (session.outcome === 'win') {
            stats.levelStats[levelKey].wins += 1;
        } else {
            stats.levelStats[levelKey].losses += 1;
        }
        
        if (session.score > stats.levelStats[levelKey].highestScore) {
            stats.levelStats[levelKey].highestScore = session.score;
        }
        
        // 更新总游戏时间
        stats.playTime += session.duration;
        
        // 解锁下一关（如果赢了当前关卡）
        if (session.outcome === 'win') {
            const nextLevel = session.level + 1;
            if (nextLevel < 6 && !this.userData.settings.unlockedLevels.includes(nextLevel)) {
                this.userData.settings.unlockedLevels.push(nextLevel);
            }
        }
    }

    // 获取排行榜数据
    async getLeaderboard() {
        try {
            const result = await window.userDataManager.getLeaderboard();
            return result;
        } catch (error) {
            console.error('获取排行榜失败:', error.message);
            return { success: false, error: error.message };
        }
    }

    // 保存游戏设置
    async saveSettings(settings) {
        try {
            // 合并新设置
            this.userData.settings = { ...this.userData.settings, ...settings };
            
            // 保存到数据库
            const result = await window.userDataManager.saveGameData(this.userData);
            if (!result.success) {
                throw new Error(result.error);
            }
            
            console.log('设置保存成功');
            return { success: true, message: '设置已保存' };
        } catch (error) {
            console.error('保存设置失败:', error.message);
            return { success: false, error: error.message };
        }
    }

    // 获取用户统计数据
    getUserStatistics() {
        return this.userData.statistics;
    }

    // 获取游戏设置
    getGameSettings() {
        return this.userData.settings;
    }
}

// 创建全局游戏数据管理器实例
const gameDataManager = new GameDataManager();

// 在页面加载完成后初始化
document.addEventListener('DOMContentLoaded', async function() {
    const initSuccess = await gameDataManager.initialize();
    if (!initSuccess) {
        console.error('游戏数据管理器初始化失败');
    }
});

// 导出供其他脚本使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { gameDataManager };
} else {
    window.gameDataManager = gameDataManager;
}