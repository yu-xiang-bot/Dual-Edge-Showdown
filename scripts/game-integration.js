// 游戏与Supabase数据库集成
// 此文件负责在游戏开始和结束时与游戏数据管理器交互

// 等待所有必要组件加载完成
document.addEventListener('DOMContentLoaded', function() {
    // 检查必要的依赖是否已加载
    if (typeof window.gameDataManager === 'undefined') {
        console.error('游戏数据管理器未加载');
        return;
    }
    
    // 保存原始的游戏函数
    const originalGame = window.game;
    
    // 重写游戏函数，添加数据跟踪功能
    window.game = function() {
        // 调用原始游戏函数
        const gameInstance = originalGame.call(this);
        
        // 等待游戏初始化完成
        setTimeout(async function() {
            try {
                // 确保游戏数据管理器已初始化
                const isInitialized = await window.gameDataManager.initialize();
                if (!isInitialized) {
                    console.error('游戏数据管理器初始化失败');
                    return;
                }
                
                // 监听游戏事件
                integrateGameDataTracking();
                
            } catch (error) {
                console.error('游戏数据集成失败:', error.message);
            }
        }, 1000);
        
        return gameInstance;
    };
});

// 集成游戏数据跟踪
function integrateGameDataTracking() {
    try {
        // 监听回合开始事件
        const originalRound = window.round;
        window.round = function() {
            // 获取当前关卡和角色信息
            const currentLevel = window.currentLevel || 0;
            
            // 确定玩家角色
            let playerCharacter = null;
            const trun = window.trun || 1;
            
            // 根据回合数决定玩家角色
            // 奇数回合玩家是法师，偶数回合玩家是机械师
            playerCharacter = (trun % 2 === 1) ? 'mage' : 'mech';
            
            // 开始新的游戏会话
            if (window.gameDataManager && window.gameDataManager.startGameSession) {
                window.gameDataManager.startGameSession(currentLevel, playerCharacter);
                console.log(`游戏会话已开始: 关卡${currentLevel}, 角色${playerCharacter}`);
            }
            
            // 调用原始回合函数
            return originalRound.call(this);
        };
        
        // 监听游戏结束事件
        const originalDeath = window.death;
        window.death = function(who) {
            if (!who) return;
            
            // 确定游戏结果
            let outcome = 'lose';
            const trun = window.trun || 1;
            const playerCharacter = (trun % 2 === 1) ? 'mage' : 'mech';
            
            // 如果获胜者与玩家角色相同，则玩家赢了
            if ((who.name === 'mage' && playerCharacter === 'mage') ||
                (who.name === 'mechanician' && playerCharacter === 'mech')) {
                outcome = 'win';
            }
            
            // 计算得分（可以根据游戏逻辑调整）
            let score = 0;
            
            if (outcome === 'win') {
                // 基础胜利分数
                score = 1000;
                
                // 根据关卡增加分数
                score += (window.currentLevel || 0) * 200;
                
                // 根据剩余生命值增加分数
                if (window.mage && window.mechanician) {
                    const playerChar = (playerCharacter === 'mage') ? window.mage : window.mechanician;
                    if (playerChar && playerChar.health > 0) {
                        score += Math.floor(playerChar.health / 38); // 健康值转换为分数
                    }
                }
                
                // 如果是连赢，增加额外分数
                if (who.win === 2) {
                    score += 500;
                }
            } else {
                // 失败也有基础分数
                score = 100;
                
                // 根据对敌人造成的伤害增加分数
                if (window.mage && window.mechanician) {
                    const enemyChar = (playerCharacter === 'mage') ? window.mechanician : window.mage;
                    if (enemyChar) {
                        const damageDealt = enemyChar.healthMax - enemyChar.health;
                        score += Math.floor(damageDealt / 38); // 伤害转换为分数
                    }
                }
            }
            
            // 更新分数
            if (window.gameDataManager && window.gameDataManager.updateScore) {
                window.gameDataManager.updateScore(score);
            }
            
            // 结束游戏会话并保存数据
            if (window.gameDataManager && window.gameDataManager.endGameSession) {
                window.gameDataManager.endGameSession(outcome).then(result => {
                    if (result.success) {
                        console.log(`游戏数据已保存: 结果=${outcome}, 分数=${score}`);
                    } else {
                        console.error('游戏数据保存失败:', result.error);
                    }
                });
            }
            
            // 调用原始游戏结束函数
            return originalDeath.call(this, who);
        };
        
        // 监听重新开始游戏
        const $replay = $('.replay');
        if ($replay.length > 0) {
            $replay.off('click').on('click', function() {
                // 保存游戏数据后重新加载页面
                if (window.gameDataManager && window.gameDataManager.endGameSession) {
                    window.gameDataManager.endGameSession('restart').then(() => {
                        location.reload();
                    });
                } else {
                    location.reload();
                }
            });
        }
        
        // 监听返回登录按钮
        const $returnToLogin = $('#returnToLogin');
        if ($returnToLogin.length > 0) {
            $returnToLogin.off('click').on('click', function() {
                // 清除登录状态
                localStorage.removeItem('user');

                // 跳转到登录页面
                window.location.href = 'login.html';
            });
        }
        
        // 监听选择关卡按钮
        const $selectLevel = $('#selectLevel');
        if ($selectLevel.length > 0) {
            $selectLevel.off('click').on('click', function() {
                // 显示关卡选择模态框
                $('#levelModal').css('display', 'flex');
            });
        }
        
        // 监听关卡选择
        $('.level-item').off('click').on('click', function() {
            const selectedLevel = parseInt($(this).data('level'));
            
            // 检查关卡是否解锁
            const gameSettings = window.gameDataManager ? window.gameDataManager.getGameSettings() : null;
            const unlockedLevels = gameSettings ? gameSettings.unlockedLevels : [0];
            
            if (unlockedLevels.includes(selectedLevel)) {
                // 设置当前关卡
                window.currentLevel = selectedLevel;
                
                // 更新UI
                $('.start').text(`关卡 ${selectedLevel + 1}`);
                
                // 关闭模态框
                $('#levelModal').hide();
                
                // 如果游戏已经开始，重新开始当前回合
                if (window.st && typeof window.round === 'function') {
                    window.round();
                }
            } else {
                // 关卡未解锁
                alert('该关卡尚未解锁！');
            }
        });
        
        // 监听关闭关卡模态框
        $('#closeLevel').off('click').on('click', function() {
            $('#levelModal').hide();
        });
        
        console.log('游戏数据跟踪集成完成');
    } catch (error) {
        console.error('游戏数据跟踪集成失败:', error.message);
    }
}

// 页面加载时的初始化
$(document).ready(function() {
    // 检查用户是否已登录
    const user = localStorage.getItem('user');
    if (!user) {
        // 如果未登录，重定向到登录页面
        window.location.href = 'login.html';
        return;
    }
});