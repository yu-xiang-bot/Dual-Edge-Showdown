// 联机功能集成补丁
// 此脚本需要在 game.html 中的 online-game.js 之前加载

(function() {
    'use strict';
    
    console.log('加载联机集成补丁...');
    
    // 等待游戏初始化完成
    function patchGameWhenReady() {
        if (typeof window.mage !== 'undefined' && typeof window.mechanician !== 'undefined') {
            // 游戏已初始化，应用补丁
            applyMultiplayerPatch();
        } else {
            // 游戏未初始化，等待
            setTimeout(patchGameWhenReady, 100);
        }
    }
    
    function applyMultiplayerPatch() {
        console.log('应用联机补丁...');
        
        // 保存原始函数
        const originalMageShoot = window.mage?.shoot;
        const originalMechHit = window.mechanician ? window.mechanician.hit : null;
        
        // 补丁：法师普攻
        if (originalMageShoot) {
            window.mage.shoot = function() {
                // 调用原始函数
                originalMageShoot.call(this);
                
                // 联机：发送攻击动作（修复：isOnlineMode 是函数）
                if (typeof window.isOnlineMode === 'function' && window.isOnlineMode() && window.sendPlayerAction) {
                    setTimeout(function() {
                        window.sendPlayerAction('attack', {
                            damage: window.mage.damage,
                            target: 'mech',
                            character: 'mage'
                        });
                    }, 100); // 延迟发送，确保碰撞检测完成
                }
            };
            console.log('法师普攻已集成联机');
        }
        
        // 补丁：机械师普攻（在 control.js 的 hit 函数中已经集成）
        if (originalMechHit) {
            console.log('机械师普攻在 control.js 中已集成');
        }
        
        // 补丁：法师技能
        patchMageSkills();
        
        // 补丁：机械师技能
        patchMechSkills();
        
        console.log('联机补丁应用完成');
    }
    
    function patchMageSkills() {
        // 法师技能需要在 control.js 中的对应位置手动添加
        // 这里我们提供钩子函数
        
        window.onMageMeteorUsed = function(damage, size) {
            if (typeof window.isOnlineMode === 'function' && window.isOnlineMode() && window.sendPlayerAction) {
                window.sendPlayerAction('skill', {
                    skillType: 'meteor',
                    damage: damage,
                    size: size,
                    target: 'mech',
                    character: 'mage',
                    direction: window.mage?.dir || 'right'
                });
            }
        };
        
        window.onMageShieldUsed = function(shieldAmount) {
            if (typeof window.isOnlineMode === 'function' && window.isOnlineMode() && window.sendPlayerAction) {
                window.sendPlayerAction('skill', {
                    skillType: 'shield',
                    shieldAmount: shieldAmount,
                    character: 'mage',
                    target: 'mech'
                });
            }
        };

        // 添加新钩子：法师炎爆术（V键）
        window.onMageFireUsed = function() {
            if (typeof window.isOnlineMode === 'function' && window.isOnlineMode() && window.sendPlayerAction) {
                window.sendPlayerAction('skill', {
                    skillType: 'fire',
                    target: 'mech',
                    character: 'mage',
                    direction: window.mage?.dir || 'right'
                });
            }
        };

        // 添加新钩子：法师替身（Q键）
        window.onMageServantUsed = function() {
            if (typeof window.isOnlineMode === 'function' && window.isOnlineMode() && window.sendPlayerAction) {
                window.sendPlayerAction('skill', {
                    skillType: 'servant',
                    target: 'mech',
                    character: 'mage'
                });
            }
        };
        
        console.log('法师技能钩子已设置');
    }
    
    function patchMechSkills() {
        window.onMechFlashUsed = function() {
            if (typeof window.isOnlineMode === 'function' && window.isOnlineMode() && window.sendPlayerAction) {
                window.sendPlayerAction('skill', {
                    skillType: 'flash',
                    target: 'mage',
                    character: 'mech',
                    direction: window.mechanician?.dir || 'right'
                });
            }
        };
        
        window.onMechGrenadeUsed = function(grenadeSpeed, x, y) {
            if (typeof window.isOnlineMode === 'function' && window.isOnlineMode() && window.sendPlayerAction) {
                window.sendPlayerAction('skill', {
                    skillType: 'bomb',
                    target: 'mage',
                    character: 'mech',
                    x: x,
                    y: y
                });
            }
        };

        // 添加新钩子：机械师血祭（M键）
        window.onMechBloodSacrificeUsed = function() {
            if (typeof window.isOnlineMode === 'function' && window.isOnlineMode() && window.sendPlayerAction) {
                window.sendPlayerAction('skill', {
                    skillType: 'bloodSacrifice',
                    target: 'mage',
                    character: 'mech'
                });
            }
        };
        
        window.onMechDroneUsed = function() {
            if (typeof window.isOnlineMode === 'function' && window.isOnlineMode() && window.sendPlayerAction) {
                window.sendPlayerAction('skill', {
                    skillType: 'drone',
                    target: 'mage',
                    character: 'mech'
                });
            }
        };
        
        console.log('机械师技能钩子已设置');
    }
    
    // 启动补丁
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', patchGameWhenReady);
    } else {
        patchGameWhenReady();
    }
    
    // 导出钩子函数供control.js使用
    window.mageSkillHooks = {
        meteor: function(damage, size) {
            if (window.onMageMeteorUsed) {
                window.onMageMeteorUsed(damage, size);
            }
        },
        shield: function(amount) {
            if (window.onMageShieldUsed) {
                window.onMageShieldUsed(amount);
            }
        },
        fire: function() {
            if (window.onMageFireUsed) {
                window.onMageFireUsed();
            }
        },
        servant: function() {
            if (window.onMageServantUsed) {
                window.onMageServantUsed();
            }
        }
    };

    window.mechSkillHooks = {
        bloodSacrifice: function() {
            if (window.onMechBloodSacrificeUsed) {
                window.onMechBloodSacrificeUsed();
            }
        },
        flash: function() {
            if (window.onMechFlashUsed) {
                window.onMechFlashUsed();
            }
        },
        grenade: function(speed, x, y) {
            if (window.onMechGrenadeUsed) {
                window.onMechGrenadeUsed(speed, x, y);
            }
        },
        drone: function() {
            if (window.onMechDroneUsed) {
                window.onMechDroneUsed();
            }
        }
    };
    
})();
