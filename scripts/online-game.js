// 联机游戏功能扩展
(function() {
    'use strict';

    console.log('[联机游戏] ========== 联机游戏模块加载 ==========');

    // 全局变量
    let onlineGameLoop = null;
    let isOnlineMode = false;
    let playerCharacter = null; // 'mage' 或 'mech'
    let opponentCharacter = null; // 对手的角色
    let isHost = false;
    let lastStateSent = 0;

    console.log('[联机游戏] 全局变量初始化完成');

    // 创建一个辅助函数来播放音频
    function playAudio(audioElement) {
        if (typeof audioElement !== 'undefined' && audioElement) {
            try {
                // 检查是否有音量设置（从control.js获取）
                const volumeSlider = document.getElementById('volumeSlider');
                if (volumeSlider) {
                    const volume = parseInt(volumeSlider.value);
                    if (volume > 0) {
                        audioElement.volume = volume / 100;
                        audioElement.play().catch(e => {
                            console.log('[音效] 音频播放失败:', e);
                        });
                    }
                } else {
                    // 如果没有音量设置，使用默认音量50%
                    audioElement.volume = 0.5;
                    audioElement.play().catch(e => {
                        console.log('[音效] 音频播放失败:', e);
                    });
                }
            } catch(e) {
                console.error('[音效] 播放音频时出错:', e);
            }
        }
    }

    console.log('[联机游戏] playAudio函数已加载');

    // 等待隐藏等待房间的函数，由multiplayer.js调用
    window.hideWaitingRoom = function() {
        const waitingRoom = document.getElementById('waitingRoom');
        if (waitingRoom) {
            waitingRoom.style.display = 'none';
        }
    };
    
    // 开始在线游戏的函数，由multiplayer.js调用
    window.startOnlineGame = function(hostStatus) {
        console.log('[游戏启动] ========== 开始在线游戏 ==========');
        isHost = hostStatus;

        console.log('[游戏启动] 房主状态:', isHost);
        console.log('[游戏启动] 隐藏所有菜单界面');

        // 隐藏所有菜单界面
        const gameMainMenu = document.getElementById('gameMainMenu');
        const onlineBattle = document.getElementById('onlineBattle');
        const mapSelection = document.getElementById('mapSelection');

        if (gameMainMenu) {
            gameMainMenu.style.display = 'none';
            console.log('[游戏启动] ✓ 隐藏主菜单');
        }
        if (onlineBattle) {
            onlineBattle.style.display = 'none';
            console.log('[游戏启动] ✓ 隐藏联机界面');
        }
        if (mapSelection) {
            mapSelection.style.display = 'none';
            console.log('[游戏启动] ✓ 隐藏地图选择');
        }

        // 设置在线模式标志
        isOnlineMode = true;
        console.log('[游戏启动] ✓ 设置在线模式标志');

        // 房主选择法师，访客选择机械师（也可以随机分配）
        if (isHost) {
            playerCharacter = 'mage';
            opponentCharacter = 'mech';
            console.log('[游戏启动] 我是房主，选择法师');
        } else {
            playerCharacter = 'mech';
            opponentCharacter = 'mage';
            console.log('[游戏启动] 我是访客，选择机械师');
        }

        console.log('[游戏启动] 玩家角色:', playerCharacter, '对手角色:', opponentCharacter);
        
        // 随机选择地图或使用默认地图
        const randomMap = Math.floor(Math.random() * 6);
        window.selectedMap = randomMap;
        window.currentLevel = randomMap;
        
        // 启动游戏
        if (typeof game === 'function') {
            setTimeout(function() {
                game();
                // 游戏启动后，禁用对手的控制
                disableOpponentControls();
                // 开始发送游戏状态
                startOnlineGameLoop();
            }, 500);
        }
    };
    
    // 禁用对手的控制
    function disableOpponentControls() {
        console.log('[角色控制] ========== 禁用对手控制 ==========');
        console.log('[角色控制] 我的角色:', playerCharacter);

        // 如果玩家是法师，禁用机械师的控制
        if (playerCharacter === 'mage' && typeof window.mechanician !== 'undefined') {
            window.mechanician.cD[5] = false; // 禁用移动
            window.mechanician.press = [false, false, false, false]; // 清除按键状态
            console.log('[角色控制] ✓ 禁用机械师控制');
        }
        // 如果玩家是机械师，禁用法师的控制
        if (playerCharacter === 'mech' && typeof window.mage !== 'undefined') {
            window.mage.cD[5] = false; // 禁用移动
            window.mage.press = [false, false, false, false]; // 清除按键状态
            console.log('[角色控制] ✓ 禁用法师控制');
        }
        console.log('[角色控制] ========== 对手控制禁用完成 ==========');
    }

    // 禁用所有角色控制（游戏结束时使用）
    function disableAllCharacterControls() {
        console.log('[角色控制] ========== 禁用所有角色控制 ==========');

        if (typeof window.mage !== 'undefined') {
            window.mage.cD[5] = false;
            window.mage.press = [false, false, false, false];
            console.log('[角色控制] ✓ 禁用法师控制');
        }

        if (typeof window.mechanician !== 'undefined') {
            window.mechanician.cD[5] = false;
            window.mechanician.press = [false, false, false, false];
            console.log('[角色控制] ✓ 禁用机械师控制');
        }

        console.log('[角色控制] ========== 所有角色控制已禁用 ==========');
    }
    
    // 更新对手在游戏中的位置和状态
    window.updateOppponentInGame = function(opponentData) {
        if (!opponentData || !isOnlineMode) return;

        console.log('[对手同步] ========== 同步对手状态 ==========');
        console.log('[对手同步] 对手角色:', opponentData.character);
        console.log('[对手同步] 收到数据:', opponentData);

        try {
            // 获取对手角色对象
            const opponent = opponentData.character === 'mage' ? window.mage : window.mechanician;

            if (!opponent) {
                console.error('[对手同步] ✗ 对手角色对象不存在:', opponentData.character);
                return;
            }

            console.log('[对手同步] ✓ 对手对象获取成功');

            // 更新位置
            if (opponentData.x !== undefined) {
                opponent.x = opponentData.x;
                opponent.man.css('left', opponent.x + 'px');
                console.log('[对手同步] ✓ 更新X位置:', opponentData.x);
            }

            if (opponentData.y !== undefined) {
                opponent.y = opponentData.y;
                opponent.man.css('bottom', opponentData.y + 'px');
                console.log('[对手同步] ✓ 更新Y位置:', opponentData.y);
            }

            // 更新方向
            if (opponentData.dir !== undefined && opponentData.dir !== opponent.dir) {
                opponent.dir = opponentData.dir;
                opponent.play();
                console.log('[对手同步] ✓ 更新方向:', opponentData.dir);
            }

            // 更新血量
            if (opponentData.health !== undefined) {
                opponent.health = opponentData.health;
                updateHealthDisplay(opponent);
                console.log('[对手同步] ✓ 更新血量:', opponentData.health, '/', opponentData.maxHealth);
            }

            // 更新能量
            if (opponentData.energy !== undefined) {
                opponent.energy = opponentData.energy;
                updateEnergyDisplay(opponent);
                console.log('[对手同步] ✓ 更新能量:', opponentData.energy);
            }

            // 更新护盾
            if (opponentData.shield !== undefined) {
                opponent.shield = opponentData.shield;
                console.log('[对手同步] ✓ 更新护盾:', opponentData.shield);
            }

            console.log('[对手同步] ========== 对手状态同步完成 ==========');
        } catch (error) {
            console.error('[对手同步] ✗ 更新对手状态失败:', error);
            console.error('[对手同步] 错误堆栈:', error.stack);
        }
    };
    
    // 更新血量显示
    function updateHealthDisplay(character) {
        if (!character) return;
        
        const healthPercent = (character.health / character.healthMax) * 100;
        
        if (character.name === 'mage') {
            character.health0.css('width', healthPercent + '%');
            character.health1.css('width', healthPercent + '%');
        } else {
            character.health0.css('width', healthPercent + '%');
            character.health1.css('width', healthPercent + '%');
        }
    }
    
    // 更新能量显示
    function updateEnergyDisplay(character) {
        if (!character) return;
        
        const energyPercent = character.energy;
        
        if (character.name === 'mage') {
            character.enLine.css('width', energyPercent + '%');
        } else {
            character.enLine.css('width', energyPercent + '%');
        }
        

        // 更新大招CD显示
        if (character.energy >= 100) {
            character.cD4.html("就绪");
            character.cD4.css('background-color', '#ff0000');
            character.cD4.css('color', '#ffffff');
            character.final = true;
            // 大招就绪，添加ready类
            character.cD4.closest(".skill-cooldown").addClass("ready");
        } else {
            character.cD4.html("");
            character.cD4.css('background-color', '#666');
            character.cD4.css('color', '#999');
            character.final = false;
            // 大招未就绪，移除ready类
            character.cD4.closest(".skill-cooldown").removeClass("ready");
        }
    }
    
    // 应用对手动作
    window.applyOppponentAction = function(action) {
        if (!isOnlineMode || !action) return;

        console.log('[应用动作] ========== 应用对手动作 ==========');
        console.log('[应用动作] 动作类型:', action.type);
        console.log('[应用动作] 动作详情:', action);

        try {
            // 根据动作类型应用相应效果
            switch (action.type) {
                case 'attack':
                    console.log('[应用动作] 处理攻击动作');
                    handleAttackAction(action);
                    break;

                case 'skill':
                    console.log('[应用动作] 处理技能动作');
                    console.log('[应用动作] 技能类型:', action.skillType);
                    handleSkillAction(action);
                    break;

                case 'move':
                    console.log('[应用动作] 处理移动动作');
                    handleMoveAction(action);
                    break;

                default:
                    console.warn('[应用动作] ⚠ 未知动作类型:', action.type);
            }
            console.log('[应用动作] ✓ 对手动作应用完成');
        } catch (error) {
            console.error('[应用动作] ✗ 应用对手动作失败:', error);
            console.error('[应用动作] 错误堆栈:', error.stack);
        }
        console.log('[应用动作] ========== 对手动作应用完成 ==========');
    };
    
    // 处理攻击动作
    function handleAttackAction(action) {
        console.log('[攻击处理] ========== 处理攻击动作 ==========');
        console.log('[攻击处理] 动作数据:', action);

        const targetCharacter = action.target === 'mage' ? 'mech' : 'mage';

        // 只处理对己方角色的攻击
        if (targetCharacter !== playerCharacter) {
            console.log('[攻击处理] ⚠ 目标不是我的角色，忽略');
            return;
        }

        const target = playerCharacter === 'mage' ? window.mage : window.mechanician;
        const attacker = playerCharacter === 'mage' ? window.mechanician : window.mage;

        console.log('[攻击处理] 目标:', targetCharacter, '攻击者:', attacker.name);

        if (target && attacker && action.damage !== undefined) {
            const oldHealth = target.health;
            target.health -= action.damage;
            console.log('[攻击处理] ✓ 伤害应用成功');
            console.log('[攻击处理] 伤害值:', action.damage);
            console.log('[攻击处理] 血量变化:', oldHealth, '->', target.health);

            // 添加受击效果
            if (typeof blood === 'function') {
                const direction = attacker.dir || 'right';
                blood(target, 1, Math.ceil(action.damage / 40), Math.ceil(action.damage / 35), direction === 'left' ? -4 : 4);
                console.log('[攻击处理] ✓ 添加受击特效');
            }

            // 播放受击音效
            if (targetCharacter === 'mage') {
                const MageAudio = document.querySelectorAll('.MageAudio');
                if (MageAudio && MageAudio[2]) {
                    playAudio(MageAudio[2]);
                    console.log('[攻击处理] ✓ 播放法师受击音效');
                }
            } else {
                const MechAudio = document.querySelectorAll('.MechAudio');
                if (MechAudio) {
                    const randomHurt = [7, 8, 9];
                    const index = Math.floor(Math.random() * randomHurt.length);
                    if (MechAudio[randomHurt[index]]) {
                        playAudio(MechAudio[randomHurt[index]]);
                        console.log('[攻击处理] ✓ 播放机械师受击音效');
                    }
                }
            }

            // 增加攻击者的能量
            const oldEnergy = attacker.energy;
            attacker.energy = Math.min(100, attacker.energy + 5);
            console.log('[攻击处理] ✓ 增加攻击者能量');
            console.log('[攻击处理] 能量变化:', oldEnergy, '->', attacker.energy);
        }

        console.log('[攻击处理] ========== 攻击动作处理完成 ==========');
    }
    
    // 处理技能动作
    function handleSkillAction(action) {
        console.log('[技能处理] ========== 处理技能动作 ==========');
        console.log('[技能处理] 动作数据:', action);

        const targetCharacter = action.target === 'mage' ? 'mech' : 'mage';

        // 只处理对己方角色的技能
        if (targetCharacter !== playerCharacter) {
            console.log('[技能处理] ⚠ 目标不是我的角色，忽略');
            return;
        }

        const target = playerCharacter === 'mage' ? window.mage : window.mechanician;
        const attacker = playerCharacter === 'mage' ? window.mechanician : window.mage;

        console.log('[技能处理] 目标:', targetCharacter, '攻击者:', attacker.name);

        if (!target || !attacker) {
            console.error('[技能处理] ✗ 角色对象不存在');
            return;
        }

        console.log('[技能处理] 技能类型:', action.skillType);

        switch (action.skillType) {
            case 'shield':
                // 护盾技能
                console.log('[技能处理] 处理护盾技能');
                if (action.character === 'mage') {
                    const oldShield = target.shield;
                    target.shield += action.shieldAmount || 400;
                    console.log('[技能处理] ✓ 护盾增加:', oldShield, '->', target.shield);
                }
                break;

            case 'meteor':
                // 流星术
                console.log('[技能处理] 处理流星术');
                if (typeof meteor === 'function') {
                    const direction = attacker.dir || 'right';
                    meteor(direction, action.damage || 1775, action.size || 1);
                    console.log('[技能处理] ✓ 流星术发动');
                }
                break;

            case 'fire':
                // 魔焰射线
                console.log('[技能处理] 处理魔焰射线');
                if (typeof fire === 'function') {
                    const direction = attacker.dir || 'right';
                    fire(direction);
                    console.log('[技能处理] ✓ 魔焰射线发动');
                }
                break;

            case 'flash':
                // 突进技能
                console.log('[技能处理] 处理突进技能');
                if (attacker.name === 'mech' && typeof flash === 'function') {
                    flash(action.direction || 'right');
                    console.log('[技能处理] ✓ 突进发动');
                }
                break;

            case 'bomb':
                // 微型核弹
                console.log('[技能处理] 处理微型核弹');
                if (typeof grenade === 'function') {
                    grenade(action.x || attacker.x, action.y || attacker.y);
                    console.log('[技能处理] ✓ 微型核弹发射');
                }
                break;

            case 'drone':
                // 恐怖机器人
                console.log('[技能处理] 处理恐怖机器人');
                if (typeof enymyMonster === 'function') {
                    enymyMonster();
                    console.log('[技能处理] ✓ 恐怖机器人发射');
                }
                break;

            case 'servant':
                // 替身技能
                console.log('[技能处理] 处理替身技能');
                if (typeof Enemy === 'function') {
                    const en = new Enemy();
                    en.createEle();
                    enymyMonster();
                    console.log('[技能处理] ✓ 替身发动');
                }
                break;

            default:
                console.warn('[技能处理] ⚠ 未知技能类型:', action.skillType);
        }

        console.log('[技能处理] ========== 技能动作处理完成 ==========');
    }
    
    // 处理移动动作
    function handleMoveAction(action) {
        const opponent = action.character === 'mage' ? window.mage : window.mechanician;
        
        if (opponent && action.x !== undefined && action.y !== undefined) {
            opponent.x = action.x;
            opponent.y = action.y;
            opponent.dir = action.dir || 'right';
            opponent.play();
        }
    }
    
    // 开始在线游戏循环
    function startOnlineGameLoop() {
        console.log('[游戏循环] ========== 启动游戏状态循环 ==========');
        if (onlineGameLoop) {
            clearInterval(onlineGameLoop);
            console.log('[游戏循环] ✓ 清除旧的游戏循环');
        }

        let sendCount = 0;
        let skipCount = 0;

        onlineGameLoop = setInterval(function() {
            try {
                // 收集当前玩家数据并发送给对手
                const currentPlayer = playerCharacter === 'mage' ? window.mage : window.mechanician;

                if (!currentPlayer || !window.multiplayerManager) {
                    console.log('[游戏循环] ⚠ 玩家或管理器不存在，跳过');
                    return;
                }

                const now = Date.now();
                // 限制发送频率，每100ms最多发送一次
                if (now - lastStateSent < 100) {
                    skipCount++;
                    return;
                }

                lastStateSent = now;
                sendCount++;

                const playerData = {
                    character: playerCharacter,
                    x: currentPlayer.x,
                    y: currentPlayer.y,
                    health: currentPlayer.health,
                    maxHealth: currentPlayer.healthMax,
                    dir: currentPlayer.dir,
                    energy: currentPlayer.energy,
                    shield: currentPlayer.shield
                };

                if (sendCount % 50 === 0) {
                    console.log('[游戏循环] ========== 状态发送统计 ==========');
                    console.log('[游戏循环] 已发送:', sendCount, '次');
                    console.log('[游戏循环] 跳过:', skipCount, '次');
                    console.log('[游戏循环] 当前玩家数据:', playerData);
                    console.log('[游戏循环] ========== 统计完成 ==========');
                }

                // 发送玩家状态给对手
                window.multiplayerManager.sendGameState(playerData);
            } catch (error) {
                console.error('[游戏循环] ✗ 发送游戏状态失败:', error);
                console.error('[游戏循环] 错误堆栈:', error.stack);
            }
        }, 50); // 每50ms检查一次，但实际发送频率限制在100ms
        console.log('[游戏循环] ✓ 游戏状态循环已启动');
        console.log('[游戏循环] ========== 游戏状态循环启动完成 ==========');
    }
    
    // 停止在线游戏循环
    window.stopOnlineGameLoop = function() {
        console.log('[游戏循环] ========== 停止在线游戏循环 ==========');

        if (onlineGameLoop) {
            clearInterval(onlineGameLoop);
            onlineGameLoop = null;
            console.log('[游戏循环] ✓ 游戏循环已停止');
        }

        // 禁用所有角色控制
        disableAllCharacterControls();

        // 离开房间
        if (window.multiplayerManager) {
            window.multiplayerManager.leaveRoom().then(() => {
                console.log('[游戏循环] ✓ 已离开房间');
            }).catch(error => {
                console.error('[游戏循环] ✗ 离开房间失败:', error);
            });
        }

        isOnlineMode = false;
        playerCharacter = null;
        opponentCharacter = null;
        console.log('[游戏循环] ✓ 联机模式已关闭');
        console.log('[游戏循环] ========== 在线游戏循环停止完成 ==========');
    };

    // 处理游戏结束
    window.handleOnlineGameEnd = function(winner, rounds) {
        console.log('[游戏结束] ========== 在线游戏结束 ==========');
        console.log('[游戏结束] 胜利者:', winner);
        console.log('[游戏结束] 回合数:', rounds);

        try {
            // 判断自己是否获胜
            const isWinner = winner === playerCharacter;

            // 记录游戏结果
            if (window.recordOnlineGameResult) {
                window.recordOnlineGameResult(isWinner, rounds);
                console.log('[游戏结束] ✓ 游戏结果已记录');
            }

            // 显示游戏结果
            setTimeout(function() {
                alert(isWinner ? '恭喜你获胜！' : '很遗憾，你输了');
            }, 1000);

            // 停止游戏循环和清理状态
            setTimeout(function() {
                window.stopOnlineGameLoop();

                // 返回主菜单
                if (document.getElementById('gameMainMenu')) {
                    document.getElementById('gameMainMenu').style.display = 'block';
                }
            }, 3000);

            console.log('[游戏结束] ========== 游戏结束处理完成 ==========');
        } catch (error) {
            console.error('[游戏结束] ✗ 处理游戏结束失败:', error);
        }
    };
    
    // 发送玩家动作
    window.sendPlayerAction = function(actionType, actionData) {
        console.log('[发送动作] ========== 发送玩家动作 ==========');
        console.log('[发送动作] 动作类型:', actionType);
        console.log('[发送动作] 动作数据:', actionData);

        if (!isOnlineMode || !window.multiplayerManager) {
            console.log('[发送动作] ⚠ 未发送：未处于在线模式或管理器不可用');
            console.log('[发送动作] isOnlineMode:', isOnlineMode);
            console.log('[发送动作] multiplayerManager:', window.multiplayerManager ? '存在' : '不存在');
            return;
        }

        try {
            const action = {
                type: actionType,
                character: playerCharacter,
                target: opponentCharacter,
                ...actionData
            };

            console.log('[发送动作] 完整动作对象:', action);
            window.multiplayerManager.sendPlayerAction(action);
            console.log('[发送动作] ✓ 动作已发送到管理器');
        } catch (error) {
            console.error('[发送动作] ✗ 发送玩家动作失败:', error);
            console.error('[发送动作] 错误堆栈:', error.stack);
        }
        console.log('[发送动作] ========== 玩家动作发送完成 ==========');
    };
    
    // 获取玩家角色
    window.getPlayerCharacter = function() {
        return playerCharacter;
    };
    
    // 获取对手角色
    window.getOpponentCharacter = function() {
        return opponentCharacter;
    };
    
    // 检查是否在线模式
    window.isOnlineMode = function() {
        return isOnlineMode;
    };
    
    // 记录游戏结果（在游戏结束时调用）
    window.recordOnlineGameResult = function(isWinner, rounds) {
        if (!isOnlineMode || !window.multiplayerManager) return;
        
        try {
            const winnerId = isWinner ? window.userDataManager.currentUser.id : 'opponent';
            const loserId = isWinner ? 'opponent' : window.userDataManager.currentUser.id;
            
            window.multiplayerManager.recordGameResult(winnerId, loserId, rounds);
            console.log('游戏结果已记录:', isWinner ? '胜利' : '失败');
        } catch (error) {
            console.error('记录游戏结果失败:', error);
        }
    };
    
    console.log('联机游戏功能扩展已加载');
})();
