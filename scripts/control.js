/*global $*/
/*jshint browser:true, esnext:true*/

// 全局音频对象
let mainMenuBGM;
let mapClickSound;

// 背景音乐淡出效果函数
function fadeOutBGM() {
    if (!mainMenuBGM) return;
    
    const fadeDuration = 2000; // 淡出持续时间（毫秒）
    const fadeStep = 50; // 每次调整音量的间隔时间（毫秒）
    const totalSteps = fadeDuration / fadeStep;
    const volumeStep = mainMenuBGM.volume / totalSteps;
    
    let currentStep = 0;
    const fadeInterval = setInterval(() => {
        if (currentStep >= totalSteps) {
            // 淡出完成，停止音乐
            clearInterval(fadeInterval);
            mainMenuBGM.pause();
            mainMenuBGM.currentTime = 0;
            return;
        }
        
        // 降低音量
        mainMenuBGM.volume -= volumeStep;
        currentStep++;
    }, fadeStep);
}

// 加载页面控制函数
function showLoadingPage() {
    const loadingPage = document.getElementById('loadingPage');
    const loadingBar = document.getElementById('loadingBar');
    const loadingPercentage = document.getElementById('loadingPercentage');
    
    if (loadingPage) {
        loadingPage.style.display = 'flex';
    }
    
    // 模拟加载进度
    let progress = 0;
    const loadingSpeed = 20; // 加载动画速度（毫秒）
    const loadingInterval = setInterval(() => {
        progress += Math.floor(Math.random() * 5) + 1;
        
        if (progress >= 100) {
            progress = 100;
            clearInterval(loadingInterval);
            
            // 加载完成后隐藏加载页面
            setTimeout(() => {
                hideLoadingPage();
            }, 500);
        }
        
        // 更新加载条和百分比
        if (loadingBar) {
            loadingBar.style.width = progress + '%';
        }
        
        if (loadingPercentage) {
            loadingPercentage.textContent = progress + '%';
        }
    }, loadingSpeed);
}

// 隐藏加载页面函数
function hideLoadingPage() {
    const loadingPage = document.getElementById('loadingPage');
    
    if (loadingPage) {
        loadingPage.style.display = 'none';
    }
}

// 主页面背景音乐控制
console.log('jQuery ready function started');
$(document).ready(function() {
    console.log('jQuery ready function executed');
    // 获取主页面背景音频元素
    mainMenuBGM = document.getElementById('mainMenuBGM');

    // 退出按钮功能已移除

    // 创建地图点击音效的Audio对象
    mapClickSound = new Audio('../assets/sounds/effects/click.mp3');
    mapClickSound.volume = 0.7;
    mapClickSound.preload = 'auto';

    if (mainMenuBGM) {
        // 播放背景音频
        mainMenuBGM.volume = 0.5; // 设置音量为50%，避免过于突出
        mainMenuBGM.play().catch(e => console.log("背景音乐自动播放被阻止，需要用户交互"));
        
        // 主页面和地图选择界面的背景音乐控制
        function playMainMenuBGM() {
            // 检查是否在主页面或地图选择界面
            const isMainMenuVisible = document.getElementById('gameMainMenu').style.display !== 'none';
            const isMapSelectionVisible = document.getElementById('mapSelection').style.display !== 'none';
            
            if (isMainMenuVisible || isMapSelectionVisible) {
                mainMenuBGM.play().catch(e => console.log("背景音乐播放失败"));
            } else {
                // 不在主页面或地图选择界面时，停止背景音乐
                mainMenuBGM.pause();
                mainMenuBGM.currentTime = 0; // 重置到开始位置
            }
        }
        
        // 监听主菜单和地图选择界面显示状态变化
        const mainMenuObserver = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                    playMainMenuBGM();
                }
            });
        });
        
        // 观察主菜单和地图选择界面的样式变化
        if (document.getElementById('gameMainMenu')) {
            mainMenuObserver.observe(document.getElementById('gameMainMenu'), { attributes: true });
        }
        
        if (document.getElementById('mapSelection')) {
            mainMenuObserver.observe(document.getElementById('mapSelection'), { attributes: true });
        }
        
        // 用户交互时播放背景音乐（解决浏览器自动播放限制）
        document.addEventListener('click', function() {
            if (mainMenuBGM.paused) {
                const isMainMenuVisible = document.getElementById('gameMainMenu').style.display !== 'none';
                const isMapSelectionVisible = document.getElementById('mapSelection').style.display !== 'none';
                
                if (isMainMenuVisible || isMapSelectionVisible) {
                    mainMenuBGM.play();
                }
            }
        }, { once: true });
    }
});

//AI mode
var beforeColi = [];
function collisionCheak(obj1, obj2, coliNumber) {
        
        //up || down coli
        //obj1 is the 'center' of collision
        var obj1_wid = obj1.width(),
            obj1_hei = obj1.height(),
            obj2_wid = obj2.width(),
            obj2_hei = obj2.height(),
            xDis = parseInt(obj2.css("left"), 10) - parseInt(obj1.css("left"), 10),
            yDis = parseInt(obj2.css("top"), 10) - parseInt(obj1.css("top"), 10),
            result = "";
        
        // 确保beforeColi是一个对象，而不是数组
        if(typeof beforeColi !== 'object') {
            beforeColi = {};
        }
        
        if (xDis >= -obj2_wid && xDis <= obj1_wid) {
            if (yDis >= -obj2_hei && yDis <= obj1_hei) {
                let store = beforeColi[coliNumber] || "";
                beforeColi[coliNumber] = "";
                return store + "coli";
            } else if (yDis <= -obj2_hei) {
                result = "w";
            } else if (yDis >= obj1_hei) {
                result = "s";
            }
        }
        if (yDis >= -obj2_hei && yDis <= obj1_hei) {
            if (xDis <= -obj2_wid) {
                result = "a";
            }
            if (xDis >= obj1_wid) {
                result = "d";
            }
        }
        beforeColi[coliNumber] = result;
}

function randomNumberAtoB(a) {
    var result;
    a += 1;
    result = Math.floor(Math.random() * a);
    return result;
}
//AI mode

function game(){
    var trun = 1,st = false;
    // 添加关卡系统
    var levels = ["城镇广场", "峭壁之战", "地下矿井", "天空之城", "火山熔岩", "冰雪要塞"];
    var currentLevel = 0; // 当前关卡索引（0-5）
    var selectedMap = -1; // 选中的地图，初始值为-1表示未选择
    var gameStarted = false; // 游戏是否已开始
    var maxRounds = 3; // 最大回合数（2K-1，K=2时为3）
    var winsRequired = 2; // 获胜所需的回合数，修改为2，实现真正的三局两胜制
    
    // 设置全局变量，供game-integration.js使用
    window.trun = trun;
    window.currentLevel = currentLevel;
    window.st = st;
    window.selectedMap = selectedMap;
    function Control1() {
        this.x = 300;
        this.y = 100;
        this.health = 3800;
        this.healthMax = 3800;
        this.dir = "right";
        this.xspeed = 0;
        this.yspeed = 0;
        this.xacce = 0;
        this.yacce = 0;
        this.press = [false, false];//right left
        this.timer = [];
        this.walkSpeed = 4;
        this.jumpSpeed = 19;
        this.fallSpeed = 0;
        this.jumpChance = 2;
        this.fallTrue = false;
        this.cD = [true,true,true,true,true,true];//H J K L move
        this.damage = 183;
        this.shield = 0;
        this.fireDamage = 25;
        this.drone = 0;//how many drones you distroy by fire
        this.fireSize = 1;
        this.energy = 100;
        this.final = false;
        this.servant = false;
        this.name = "mage";
        this.prisoner = false;
        this.win = 0;
        this.man = $(".one");
        this.line = $(".oo");
        this.meteor = $(".meteor");
        this.shielding = $(".shielding");
        this.health0 = $(".h10");
        this.health1 = $(".h11");
        this.shield0 = $(".shield");
        // 更新技能CD引用：指向新的技能容器中的countdown-text元素
        this.cD1 = $(".mage-skills .skill-cooldown[data-skill='mana'] .countdown-text");  // X - 法力凝聚
        this.cD2 = $(".mage-skills .skill-cooldown[data-skill='shield'] .countdown-text");  // C - 魔障
        this.cD3 = $(".mage-skills .skill-cooldown[data-skill='meteor'] .countdown-text");  // V - 炎爆术
        this.cD4 = $(".mage-skills .skill-cooldown[data-skill='servant'] .countdown-text");  // Q - 替身(大招)
        this.cD5 = $(".mage-skills .skill-cooldown[data-skill='fire'] .countdown-text");  // B - 魔焰射线
        this.enLine = $(".En1");
        var self = this;

        function control() {
        $(document).keydown(function (e) {
             //a,w,d,s      65,87,68,83
             //q,c,v,e,r      81,67,68,69,82
            //console.log(e.keyCode);
        if(self.cD[5] && st){
            if (e.keyCode === 65) {//move left
                if(!self.press[0]){
                    self.dir = "left";
                    self.press[0] = true;
                    clearInterval(self.timer[1]);
                    self.timer[0] = setInterval(function(){self.x -= self.walkSpeed;},20);
                }
            } else if(e.keyCode === 87){//jump
                jumping(mage);
            } else if(e.keyCode === 68){//move right
                if(!self.press[1]){
                    self.dir = "right";
                    self.press[1] = true;
                    clearInterval(self.timer[0]);
                    self.timer[1] = setInterval(function(){self.x += self.walkSpeed;},20);
                }
            } else if(e.keyCode === 66){//attack B - 魔焰射线
                if(self.cD[1] && !e.repeat){
                    self.cD[1] = false;
                    self.man.css("background-image","url(../assets/images/characters/mageAttack.png)");
                    self.shoot();
                    new Cd(0.85,self.cD5,"B");
                    setTimeout(function(){self.cD[1] = true;},850);
                }
            } else             if(e.keyCode === 67){//shield V
                if(self.cD[2] && !e.repeat){
                    self.cD[2] = false;
                    self.shield += 400;
                    // 发送护盾技能到联机
                    if (window.sendPlayerAction) {
                        window.sendPlayerAction('skill', { skillType: 'shield' });
                    }
                    new Cd(8.00,self.cD2,"C");
                    setTimeout(function(){self.cD[2] = true;},8000);
                }
            } else if(e.keyCode === 88){//prisoner X
                if(self.cD[0] && !e.repeat){
                    self.cD[0] = false;
                    self.man.css("background-image","url(../assets/images/characters/magePrisoner.gif)");
                    playAudio(MageAudio[11]);
                    self.prisoner = true;
                    new Cd(8,self.cD1,"X");
                    // 发送法力凝聚技能到联机
                    if (window.sendPlayerAction) {
                        window.sendPlayerAction('skill', {
                            skillType: 'prisoner',
                            character: 'mage',
                            target: 'mech'
                        });
                    }
                    setTimeout(function(){
                        self.prisoner = false;
                        mechanician.cD[5] = true;
                    },1200);
                    setTimeout(function(){self.cD[0] = true;},8000);
                    setTimeout(function(){
                        self.man.css("background-image","url(../assets/images/characters/mage.png)");
                    },500);
                }
            } else if(e.keyCode === 86){//Meteor b
                if(self.cD[3] && !e.repeat){
                    self.cD[3] = false;
                    self.cD[0] = false;
                    self.walkSpeed /= 2;
                    self.jumpChance = 0;
                    self.timer[3] = setInterval(function(){
                        if(self.fireDamage < 1750){
                            self.fireDamage += 75;
                            self.fireSize += 0.05;
                        } else {
                            self.fireDamage = 1775;
                        }
                        console.log(self.fireDamage);
                    },200);
                    // 发送流星术技能开始到联机
                    if (window.sendPlayerAction) {
                        window.sendPlayerAction('skill', { skillType: 'meteorStart', character: 'mage', target: 'mech' });
                    }
                }
            }             else             if(e.keyCode === 81 && self.final && !e.repeat){//Servant
                playAudio(MageAudio[8]);
                setTimeout(function(){
                    playAudio(MageAudio[9]);
                },1700);
                self.final = false;
                self.servant = true;
                self.energy = 0;
                // 立即移除Q技能的ready状态
                self.cD4.closest(".skill-cooldown").removeClass("ready");
                en = new Enemy();
                en.createEle();
                // 发送仆从技能到联机
                if (window.sendPlayerAction) {
                    window.sendPlayerAction('skill', { skillType: 'servant' });
                }
                enymyMonster();
            }
        }
        });
        $(document).keyup(function(e){
            if(self.cD[5] && st){
                if(e.keyCode === 65){
                    self.press[0] = false;
                    clearInterval(self.timer[0]);
                } else if(e.keyCode === 68){
                   self.press[1] = false;
                    clearInterval(self.timer[1]);
                } else if(e.keyCode === 86){
                    if(self.cD[4]){
                        self.cD[4] = false;
                        self.cD[0] = true;
                        self.walkSpeed *= 2;
                        self.jumpChance = 2;
                        playAudio(MageAudio[0]);
                        meteor(self.dir,self.fireDamage,self.fireSize);
                        // 发送流星术技能释放到联机
                        if (window.sendPlayerAction) {
                            window.sendPlayerAction('skill', {
                                skillType: 'meteor',
                                damage: self.fireDamage,
                                size: self.fireSize,
                                character: 'mage',
                                target: 'mech',
                                direction: self.dir
                            });
                        }
                        clearInterval(self.timer[3]);
                        new Cd(7,self.cD3,"V");
                        setTimeout(function(){
                            self.cD[3] = true;
                            self.cD[4] = true;
                        },7000);
                        self.man.css("background-image","url(../assets/images/characters/mage.png)");
                    }
                } else if(e.keyCode === 66){
                    self.man.css("background-image","url(../assets/images/characters/mage.png)");

                }
            }
        });
    }
    
    this.play = function(){
        if(self.dir === "left"){
            self.man.css("transform","scaleX(-1)");
        } else {
            self.man.css("transform","");
        }
        
        if(!self.cD[3] && self.cD[4]){
             self.man.css("background-image","url(../assets/images/characters/mageFire.gif)");
        }
        
        if(self.fallTrue){
            gravity(mage);
        }
        
        if(self.shield > 0){
            self.shielding.css("left", self.x + "px");
            self.shielding.css("bottom", self.y + "px");
        } else {
            self.shielding.css("bottom", "-500px");
        }
        

        if(self.energy >= 100){
            self.final = true;
            self.cD4.html("就绪");
            self.cD4.css("background-color", "");
            // Q技能就绪，添加ready类
            self.cD4.closest(".skill-cooldown").addClass("ready");
        } else {
            self.cD4.html("");
            self.cD4.css("background-color", "");
            // Q技能未就绪，移除ready类
            self.cD4.closest(".skill-cooldown").removeClass("ready");
        }

        self.man.css("left", self.x + "px");
        self.man.css("bottom", self.y + "px");
        self.health0.css("width",(self.health /10) + "px");
        self.health1.css("width",(self.health /10) - (self.shield /10) + "px");
        self.shield0.css("width",(self.health /10)+ "px");
        
        // 添加血条危险状态效果
        if (self.health < self.healthMax * 0.3) {
            self.health0.parent().addClass("danger");
        } else {
            self.health0.parent().removeClass("danger");
        }
        
        self.enLine.css("width",self.energy * 4  + "px");
        
        // 添加能量条满状态效果
        if (self.energy >= 100) {
            self.enLine.parent().addClass("full");
        } else {
            self.enLine.parent().removeClass("full");
        }
        
        mapChecker(mage);
    };
        
    this.shoot = function() {
        // 播放法师攻击音效
        playAudio(MageAudio[0]);  // fireAtk.mp3
        
        $("#bulletBox").append("<div id='mageBullet'></div>");
        let bullet = $("#mageBullet"),
            loopTime = 0,
            dir = 1,
            speed = 20;
        if (self.dir === "left") {
            speed *= -1;
            dir = -1;
        }
        bullet.css("bottom", self.y + 40 + "px");
        function draw() {
            bullet.css("left", self.x + 25 + loopTime * speed);
            if (collisionCheak(mechanician.man, bullet, 202) === "coli") {//202 is the collision check number. the next shoot function can use 203
                bullet.remove();
                mechanician.health -= self.damage;
                self.energy += 4;
                // 发送攻击动作到联机
                if (window.sendPlayerAction) {
                    window.sendPlayerAction('attack', { damage: self.damage });
                }
                let x = randomNumberAtoB(3);
                if(x === 1){
                    playAudio(MechAudio[7]);
                } else if(x === 2){
                    playAudio(MechAudio[8]);
                } else {
                    playAudio(MechAudio[9]);
                }
                if(mage.dir === mechanician.dir){
                    blood(mechanician, 1, 4, 5, -4);
                } else {
                    blood(mechanician, 1, 4, 5, 4);
                }
                return;
            }

            loopTime += 1;
            
            if (loopTime >= 30) {
                bullet.remove();
                return;
            }
            setTimeout(function() {
                draw();
            }, 10);//we can change this number as 1, to make it fastest. after that we can change the element color to be 透明 so that it will not effect. add another element if you want effect;
        }
        draw();
    };
    
    function meteor(dir,damage,size){
        var fire = this;
        this.drone = 0;
        this.y = self.y;
        if(dir === "left"){
            this.x = self.x - 100;
            self.meteor.css("transform","scaleX(-1)");
            setTimeout(function(){self.meteor.css("transform","");},3000);
        } else{
            this.x = self.x + 40;
        }
        this.loop = function(){
            if(dir === "left"){
                fire.x -= 6;
            } else {
                fire.x += 6;
            }
            console.log(fire.x,fire.y);
            if(collisionCheak(mechanician.man,self.meteor,203) === "coli"){
                mechanician.health -= Math.floor(damage + 25);
                clearInterval(self.timer[2]);
                self.energy += Math.ceil(damage / 50);
                // 发送流星技能到联机
                if (window.sendPlayerAction) {
                    window.sendPlayerAction('skill', { skillType: 'meteor', damage: Math.floor(damage + 25) });
                }
                if(mage.dir === mechanician.dir){
                    blood(mechanician, 1, Math.ceil(damage / 40), Math.ceil(damage / 200), -Math.ceil(damage / 200));
                } else {
                    blood(mechanician, 1, Math.ceil(damage / 40), Math.ceil(damage / 200), Math.ceil(damage / 200));
                }
                let x = randomNumberAtoB(3);
                if(x === 1){
                    playAudio(MechAudio[7]);
                } else if(x === 2){
                    playAudio(MechAudio[8]);
                } else {
                    playAudio(MechAudio[9]);
                }
                playAudio(MageAudio[1]);
                setTimeout(function(){
                self.meteor.css("bottom",-1000 + "px");
                self.meteor.css("bottom",-1000 + "px");},100);
            }
            
            if(self.drone === 2){
                clearInterval(self.timer[2]);
                setTimeout(function(){
                self.meteor.css("bottom",-1000 + "px");
                self.meteor.css("bottom",-1000 + "px");},100);
                self.drone = 0;
            }
            
            self.meteor.css("left",fire.x + "px");
            if((-200 - 135 * size) >= fire.x || (1700 + 135 * size)<= fire.x){
                clearInterval(self.timer[2]);
                self.meteor.css("bottom",-1000 + "px");
            }
        };
        self.timer[2] = setInterval(fire.loop,3);
        self.fireDamage = 25;
        self.meteor.css("bottom",fire.y + 67.5 - 67.5 * size + "px");
        self.meteor.css("width",(135 * size) + "px");
        self.meteor.css("height",(110 * size) + "px");
        self.fireSize = 1;
    }
    control();
    }

    function Control2() {
        this.x = 1200;
        this.y = 100;
        this.health = 4000;
        this.healthMax = 4000;
        this.dir = "left";
        this.xspeed = 0;
        this.yspeed = 0;
        this.xacce = 0;
        this.yacce = 0;
        this.press = [false, false];
        this.timer = [];
        this.walkSpeed = 5;
        this.jumpSpeed = 20;
        this.fallSpeed = 0;
        this.jumpChance = 2;
        this.fallTrue = false;
        this.cD = [true,true,true,true,true,true];//crazy attack flash grenade1 grenade2 move
        this.damage = 200;
        this.grenadeSpeed = 0;
        this.aS = 450;
        this.crazy = false;
        this.energy = 100;
        this.final = false;
        this.win = 0;
        this.name = "mechanician";
        this.man = $(".two");
        this.line = $(".tt");
        this.health0 = $(".h20");
        this.health1 = $(".h21");
        // 更新技能CD引用：指向新的技能容器中的countdown-text元素
        this.cD1 = $(".mech-skills .skill-cooldown[data-skill='blood'] .countdown-text");  // M - 血祭
        this.cD2 = $(".mech-skills .skill-cooldown[data-skill='dash'] .countdown-text");  // , - 突进
        this.cD3 = $(".mech-skills .skill-cooldown[data-skill='nuke'] .countdown-text");  // . - 微型核弹
        this.cD4 = $(".mech-skills .skill-cooldown[data-skill='machine'] .countdown-text");  // L - 恐怖机器人(大招)
        this.cD5 = $(".mech-skills .skill-cooldown[data-skill='shoot'] .countdown-text");  // / - 射击
        this.enLine = $(".En2");
        var you = this;

        function control() {
        $(document).keydown(function (e) {
             //left up right down   37,38,39,40
            //u,i,o,p,l   85,73,79,80,76
        if(you.cD[5] && st){
            if (e.keyCode === 37) {//move left
                if(!you.press[0]) {
                    you.dir = "left";
                    you.press[0] = true;
                    clearInterval(you.timer[1]);
                    you.timer[0] = setInterval(function(){you.x -= you.walkSpeed;},20);
                }
            } else if(e.keyCode === 38){//jump
                jumping(mechanician);
            } else if(e.keyCode === 39){//move right
                if(!you.press[1]){
                    you.dir = "right";
                    you.press[1] = true;
                    clearInterval(you.timer[0]);
                    you.timer[1] = setInterval(function(){you.x += you.walkSpeed;},20);
                }
            } else if(e.keyCode === 191){//attack / - 射击
                if(you.cD[1] && !e.repeat){
                    you.cD[1] = false;
                    you.line.css("bottom",you.y + 15 + "px");  
                    if(you.dir === "right"){
                        you.line.css("left",you.x + 60 +"px");    
                        you.line.css("transform","scaleX(-1)");
                    }  else {
                        you.line.css("left",(you.x - 200) +"px");   
                        you.line.css("transform","scaleX(1)");
                    }
                    if(you.crazy){
                        playAudio(MechAudio[12]);
                    } else {
                        playAudio(MechAudio[11]);
                    }
                    setTimeout(function(){you.line.css("bottom", "0px");},10);
                    hit();
                    var shootCD = you.aS / 1000; // 转换为秒
                    new Cd(shootCD, you.cD5, "/");
                    setTimeout(function(){you.cD[1] = true;},you.aS);
                }
            } else if(e.keyCode === 188){//flash .
                if(you.cD[2] && !e.repeat){
                    playAudio(MechAudio[4]);
                    you.cD[2] = false;
                    // 发送闪现技能到联机
                    if (window.sendPlayerAction) {
                        window.sendPlayerAction('skill', { skillType: 'flash' });
                    }
                    flash();
                    new Cd(1.2,you.cD2,",");
                    setTimeout(function(){you.cD[2] = true;},1200);
                }
            } else if(e.keyCode === 77){//crazy - M
                if(you.cD[0] && !e.repeat){
                    you.cD[0] = false;
                    playAudio(MechAudio[1]);
                    crazy();
                    // 发送血祭技能到联机
                    if (window.sendPlayerAction) {
                        window.sendPlayerAction('skill', {
                            skillType: 'bloodSacrifice',
                            character: 'mech',
                            target: 'mage'
                        });
                    }
                    new Cd(6,you.cD1,"M");
                    setTimeout(function(){you.cD[0] = true;},6000);
                }
            } else if(e.keyCode === 76 && you.final && !e.repeat) {//machineKiller
                playAudio(MechAudio[2]);
                you.final = false;
                you.energy = 0;
                // 立即移除L技能的ready状态
                you.cD4.closest(".skill-cooldown").removeClass("ready");
                // 发送无人机技能到联机
                if (window.sendPlayerAction) {
                    window.sendPlayerAction('skill', { skillType: 'drone' });
                }
                killerMachineArr[killerMachineArr[killerMachineArr.length]] = new KillerMachine(you.x, 500 - you.y);
                setTimeout(function() {
                    killerMachineArr[killerMachineArr[killerMachineArr.length]] = new KillerMachine(you.x, 500 - you.y);
                }, 500);setTimeout(function() {
                    killerMachineArr[killerMachineArr[killerMachineArr.length]] = new KillerMachine(you.x, 500 - you.y);
                }, 1000);setTimeout(function() {
                    killerMachineArr[killerMachineArr[killerMachineArr.length]] = new KillerMachine(you.x, 500 - you.y);
                }, 1500);
                setTimeout(function() {
                    killerMachineArr[killerMachineArr[killerMachineArr.length]] = new KillerMachine(you.x, 500 - you.y);
                }, 2000);
            } else if(e.keyCode === 190){//Grenade
                if(you.cD[3] && !e.repeat){
                    you.cD[3] = false;
                    you.timer[2] = setInterval(function(){
                        let x = you.grenadeSpeed;
                        if(you.dir === "left" && x > 0){
                            x *= -1;
                        }
                        x *= 9;
                        x += you.man.offset().left -70;
                        you.grenadeSpeed += 1;
                        if (you.grenadeSpeed >= 120) {
                            you.grenadeSpeed = 120;
                        }//finalchange
                        $("#speedTip").css("left", x);
                    },20);
                }
            }
        }
        });
        $(document).keyup(function(e){
            if(you.cD[5] && st){
                if(e.keyCode === 37){
                    you.press[0] = false;
                    clearInterval(you.timer[0]);
                } else if(e.keyCode === 39){
                    you.press[1] = false;
                    clearInterval(you.timer[1]);
                } else if(e.keyCode === 190){
                    if(you.cD[4]){
                        playAudio(MechAudio[5]);
                        you.cD[4] = false;
                        comboShoot = new ComboShoot(you.grenadeSpeed);
                        // 发送炸弹技能到联机（添加伤害信息）
                        if (window.sendPlayerAction) {
                            window.sendPlayerAction('skill', {
                                skillType: 'grenade',
                                character: 'mech',
                                target: 'mage',
                                damage: you.grenadeSpeed * 15, // 伤害计算公式
                                x: you.x,
                                y: you.y,
                                direction: you.dir
                            });
                        }
                        you.grenadeSpeed = 0;
                        new Cd(8,you.cD3,".");
                        clearInterval(you.timer[2]);
                        setTimeout(function(){
                            $("#speedTip").css("left", "-500px");
                        },200);
                        setTimeout(function(){
                            you.cD[4] = true;
                            you.cD[3] = true;
                        },8000);
                    }
                }
            }
        });
    }
         
    function hit(){
        var dam = you.damage;
        if(collisionCheak(mage.man,you.line,400) === "coli"){
            if(you.dir === "left"){
                dam -= Math.ceil(you.x - mage.x);
            } else {
                dam -= Math.ceil(mage.x - you.x - 50);
            }

            you.energy += Math.ceil(dam / 20);
            // 发送攻击动作到联机
            if (window.sendPlayerAction) {
                window.sendPlayerAction('attack', { damage: dam });
            }
            if(mage.dir === mechanician.dir){
                blood(mage, 1, Math.ceil(dam / 40), Math.ceil(dam / 35), -Math.ceil(dam / 35));
            } else {
                blood(mage, 1, Math.ceil(dam / 40), Math.ceil(dam / 35), Math.ceil(dam / 35));
            }
            if(dam > 150){
                let x = randomNumberAtoB(3);
                if(x === 1){
                    playAudio(MageAudio[2]);
                } else if(x === 2){
                    playAudio(MageAudio[3]);
                } else {
                    playAudio(MageAudio[4]);
                }
            }
            mage.shield -= dam;
            if(mage.shield < 0){
                console.log(dam);
                mage.health += mage.shield;
                mage.shield = 0;
                // 添加护盾破裂特效
                mage.shield0.addClass("break");
                setTimeout(function() {
                    mage.shield0.removeClass("break");
                }, 500);
            }
        }
        if(mage.servant && collisionCheak(en.man,you.line,401) === "coli"){
            en.beDamaged(you.damage - Math.ceil(you.x - en.x));
            blood(en, 1, 5, 5, 5);
        }
    }
        
        this.play = function(){
            if(you.dir === "right"){
                you.man.css("transform","scaleX(-1)");
            } else {
                you.man.css("transform","");
            }
            
            if((you.press[0] || you.press[1]) && !you.fallTrue && !you.crazy){
                you.man.css("background-image","url(../assets/images/characters/mechanicianMove.gif)");
            } else if(you.fallTrue && !you.crazy){
                you.man.css("background-image","url(../assets/images/characters/mechanicianJump.gif)");
            } else if(!you.press[0] && !you.press[1] && !you.fallTrue && !you.crazy){
                you.man.css("background-image","url(../assets/images/characters/mechanician.png)");
            }else if((you.press[0] || you.press[1]) && !you.fallTrue && you.crazy){
                you.man.css("background-image","url(../assets/images/characters/crazy/mechanicianMove.gif)");
            } else if(you.fallTrue && you.crazy){
                you.man.css("background-image","url(../assets/images/characters/crazy/mechanicianJump.gif)");
            } else if(!you.press[0] && !you.press[1] && !you.fallTrue && you.crazy){
                you.man.css("background-image","url(../assets/images/characters/crazy/mechanician.png)");
            }
            
            if(mage.prisoner && !you.crazy){
                you.man.css("background-image","url(../assets/images/characters/mechanicianPrisoner.png)");
                you.cD[5] = false;
                clearInterval(you.timer[0]);
                clearInterval(you.timer[1]);
            } else if(mage.prisoner && you.crazy){
                you.man.css("background-image","url(../assets/images/characters/crazy/mechanicianPrisoner.png)");
                you.cD[5] = false;
                clearInterval(you.timer[0]);
                clearInterval(you.timer[1]);
            }
            
            if(you.fallTrue){
                gravity(mechanician);
            }

            if(you.energy >= 100){
                you.final = true;
                you.cD4.html("就绪");
                you.cD4.css("background-color", "");
                // L技能就绪，添加ready类
                you.cD4.closest(".skill-cooldown").addClass("ready");
            } else {
                you.cD4.html("");
                you.cD4.css("background-color", "");
                // L技能未就绪，移除ready类
                you.cD4.closest(".skill-cooldown").removeClass("ready");
            }

            you.man.css("left",you.x + "px");
            you.man.css("bottom",you.y + "px");
            you.health0.css("width",you.health /10 + "px");
            you.health1.css("width",you.health /10 + "px");
            
            // 添加血条危险状态效果
            if (you.health < you.healthMax * 0.3) {
                you.health0.parent().addClass("danger");
            } else {
                you.health0.parent().removeClass("danger");
            }
            
            you.enLine.css("width",you.energy * 4  + "px");
            
            // 添加能量条满状态效果
            if (you.energy >= 100) {
                you.enLine.parent().addClass("full");
            } else {
                you.enLine.parent().removeClass("full");
            }
            
            mapChecker(mechanician);
        };
        
        function flash(){
            if(you.dir === "right"){
                you.x += 180;
            } else {
                you.x -= 180;
            }
        }
    
    function crazy(){
        blood(mechanician, 2, 7, 6, 6);
        you.crazy = true;
        you.damage *= 1.5;
        you.jumpSpeed *= 1.5;
        you.walkSpeed *= 1.5;
        you.aS /= 2;
        you.health -= you.health * 0.2;
        setTimeout(function(){
            you.crazy = false;
            you.damage = 200;
            you.jumpSpeed = 20;
            you.walkSpeed = 10;
            you.aS =300;
        },3000);
    }
        control();
    }

    function Cd(time,target,press){
        var timer;
        // 移除旧的背景色设置，使用CSS类控制
        target.css("background-color","");
        target.html(time);

        // 获取技能容器元素
        var skillContainer = target.closest('.skill-cooldown');
        var cooldownRing = skillContainer ? skillContainer.find('.cooldown-ring') : null;
        var countdownText = skillContainer ? skillContainer.find('.countdown-text') : null;

        // 计算总冷却时间
        var totalTime = time;

        // 添加冷却状态
        if(skillContainer) {
            skillContainer.removeClass('ready pulsing');
            skillContainer.addClass('cooling');
        }

        if(time > 10){
            timer = setInterval(function(){
            if(time > 10){
                time -= 1;
                target.html(time);
                // 更新环形进度条：从满环(360度)到消失(0度)
                if(cooldownRing) {
                    var progress = (time / totalTime) * 360;
                    skillContainer[0].style.setProperty('--progress', `${progress}deg`);
                    countdownText && countdownText.text(time.toFixed(0) + 's');
                }
            } else {
                clearInterval(timer);
                clock();
            }},1000);
        } else {
            clock();
        }
        function clock(){
            timer = setInterval(function(){
                if(time != 0.1){
                    time = (time -= 0.1).toFixed(1);
                    target.html(time);
                    // 更新环形进度条：从满环(360度)到消失(0度)
                    if(cooldownRing) {
                        var progress = (parseFloat(time) / totalTime) * 360;
                        skillContainer[0].style.setProperty('--progress', `${progress}deg`);
                        countdownText && countdownText.text(time + 's');
                    }
                } else {
                    // CD结束时显示"就绪"
                    target.html("就绪");
                    target.css("background-color","");
                    clearInterval(timer);

                    // 移除冷却状态，添加就绪状态
                    if(skillContainer) {
                        skillContainer.removeClass('cooling');
                        skillContainer.addClass('ready pulsing');
                        countdownText && countdownText.text('');

                        // 不播放技能就绪提示音（yes.my.mp3只用于法师仆从技能）

                        // 2秒后移除脉冲动画
                        setTimeout(function() {
                            if(skillContainer) {
                                skillContainer.removeClass('pulsing');
                            }
                        }, 2000);
                    }
                }
            },100);
        }
    }

    function jumping(check){
        if(check.jumpChance === 2){
            check.jumpChance -= 1;
            check.fallTrue = true;
            check.fallSpeed = check.jumpSpeed;
        } else if(check.jumpChance === 1){
            check.jumpChance -= 1;
            check.fallSpeed = check.jumpSpeed;
        }
    }

    function mapChecker(check){
        if(check.y == 350 && check.x >= 360 && check.fallSpeed === 0){
            check.fallTrue = true;
            check.jumpChance = 1;
        } else if(check.y == 450 && check.x <= 1020 && check.fallSpeed === 0 ){
            check.fallTrue = true;
            check.jumpChance = 1;
        } else if(check.y == 450 && check.x >= 1430 && check.fallSpeed === 0 ){
            check.fallTrue = true;
            check.jumpChance = 1;
        } else if(check.y == 240 && (check.x < 1050 || check.x > 1450)){
            // 如果玩家在挡板高度但x坐标超出挡板范围，则开始掉落
            check.fallTrue = true;
            check.jumpChance = 1;
        } else if(check.x <= -25){
            check.x = -25;
        } else if(check.x >= 1450){
            check.x = 1450;
        } else if(check.y >= 680){
            check.fallSpeed = -1;
        } else {
            // 使用碰撞检测函数检测医疗包
            // 获取地图高度以计算bottom到top的转换
            const mapHeight = $(".map").height();
            
            if(healing[0]) {
                // 设置bottle的top位置以便正确计算碰撞
                const bottleBottom = parseInt($bottle.css("bottom"), 10);
                $bottle.css("top", (mapHeight - bottleBottom - $bottle.height()) + "px");
                
                let bottleCollision = collisionCheak(check.man, $bottle, "bottle");
                if(bottleCollision && bottleCollision.includes("coli")) {
                    medical(check,1);
                }
            }
            
            if(healing[1]) {
                // 设置kit的top位置以便正确计算碰撞
                const kitBottom = parseInt($kit.css("bottom"), 10);
                $kit.css("top", (mapHeight - kitBottom - $kit.height()) + "px");
                
                let kitCollision = collisionCheak(check.man, $kit, "kit");
                if(kitCollision && kitCollision.includes("coli")) {
                    medical(check,2);
                }
            }
        }
    }

    function gravity(jump){
            jump.fallSpeed -= 1;
            jump.y += jump.fallSpeed;
            
            if(jump.fallSpeed < 0){
                if(jump.y <= 100){
                    jump.fallTrue = false;
                    jump.jumpChance = 2;
                    jump.fallSpeed = 0;
                    jump.y = 100;
                } else if(jump.y >= 320 && jump.y <= 350 && jump.x <= 360){
                    jump.fallTrue = false;
                    jump.jumpChance = 2;
                    jump.fallSpeed = 0;
                    jump.y = 350;
                } else if(jump.y >= 420 && jump.y <= 450 && jump.x > 1020 && jump.x < 1430){
                    jump.fallTrue = false;
                    jump.jumpChance = 2;
                    jump.fallSpeed = 0;
                    jump.y = 450;
                } else if(jump.y >= 240 && jump.y <= 270 && jump.x >= 1050 && jump.x <= 1450){
                    // 右侧挡板碰撞检测 - 修正后的范围
                    jump.fallTrue = false;
                    jump.jumpChance = 2;
                    jump.fallSpeed = 0;
                    jump.y = 240;
                }
            }
    }
    
    function energy(){
        if(!mage.final && mage.energy !== 100 && !mage.servant && st){
            mage.energy += 1;
        }
        
        if(!mechanician.final && mechanician.energy !== 100 && st){
            mechanician.energy += 1;
        }
        setTimeout(function(){energy();},1500);
    }
    
    function medical(check,num){
        if(check.health !== check.healthMax){
            if(num === 1 && healing[0]){
                playAudio(healAudio[0]);
                healing[0] = false;
                $bottle.css("opacity","0");
                if(check.health + 400 > check.healthMax){
                    check.health = check.healthMax;
                } else {
                    check.health += 400;
                }
                setTimeout(function(){
                    healing[0] = true;
                    $bottle.css("opacity","1");
                },6000);
            } else if(num === 2 && healing[1]){
                playAudio(healAudio[0]);
                healing[1] = false;
                $kit.css("opacity","0");
                if(check.health + 800 > check.healthMax){
                    check.health = check.healthMax;
                } else {
                    check.health += 800;
                }
                setTimeout(function(){
                    healing[1] = true;
                    $kit.css("opacity","1");
                },15000);
            }
        }
    }

    function draw(){
        mage.play();
        mechanician.play();
        if(mage.servant){
            enymyMonster();
        }
        if(mage.health <= 0){
            setTimeout(function(){
            playAudio(MageAudio[5]);},2500);
            playAudio(MechAudio[10]);
            death(mechanician);
        } else if(mechanician.health <= 0){
            playAudio(MageAudio[6]);
            setTimeout(function(){
            playAudio(MechAudio[6]);},2500);
            death(mage);
        }
    }

    function death(who){
        // 检查游戏是否已结束，防止重复处理
        if(mage.win >= winsRequired || mechanician.win >= winsRequired){
            return;
        }
        
        // 更新全局变量
        window.trun = trun;
        window.currentLevel = currentLevel;
        window.st = st;
        window.selectedMap = selectedMap;
        
        // 停止当前播放的背景音乐
        if (isSoundEnabled) {
            bgm.each(function() {
                this.pause();
                this.currentTime = 0;
            });
        }
        st = false;
        // 注意：不再循环使用关卡，保持当前选中的地图
        // currentLevel = (trun - 1) % 6; // 注释掉这行，不再循环使用6个关卡
        who.win += 1;
        trun += 1;
        mage.energy = 0;
        mechanician.energy = 0;
        if(who.name === "mage"){
            $(".Ma").css("display","inline-block");
        } else {
            $(".Me").css("display","inline-block");
        }
        clearInterval(world);
        if(mage.servant){
            en.alive = false;
        }
        $winner.html("<p>"+ who.name + " 赢得此回合!</p>");
        $gg.show();
        
        // 检查是否有玩家达到获胜所需局数（三局两胜制）
        if(who.win >= winsRequired){
            $winner.html("<p>"+ who.name + " 以 " + who.win + "/" + trun + " 获得最终胜利!</p>");
            $winner.css("color","red");
            $replay.show();
            
            // 根据获胜者显示对应的胜利视频
            if(who.name === "mage"){
                $mageWinVideo.show();
                $mechanicianWinVideo.hide();
            } else {
                $mechanicianWinVideo.show();
                $mageWinVideo.hide();
            }
            
            // 游戏结束后重置地图选择
            selectedMap = -1;
            gameStarted = false;
            window.selectedMap = selectedMap;
        } else if(trun <= maxRounds){
            // 未达到获胜局数且未达到最大回合数，继续下一局
            $winner.html("<p>"+ who.name + " 赢得此回合! (" + who.win + "/" + winsRequired + ")</p>");
             setTimeout(function(){
                $gg.hide();
                round();
            },5500);
        } else {
            // 达到最大回合数但无人达到获胜局数（理论上不可能）
            // 此时判定总分最高者获胜
            var finalWinner = mage.win > mechanician.win ? mage : mechanician;
            $winner.html("<p>"+ finalWinner.name + " 以 " + finalWinner.win + "/" + maxRounds + " 获得最终胜利!</p>");
            $winner.css("color","red");
            $replay.show();
            
            // 根据获胜者显示对应的胜利视频
            if(finalWinner.name === "mage"){
                $mageWinVideo.show();
                $mechanicianWinVideo.hide();
            } else {
                $mechanicianWinVideo.show();
                $mageWinVideo.hide();
            }
            
            // 游戏结束后重置地图选择
            selectedMap = -1;
            gameStarted = false;
            window.selectedMap = selectedMap;
        }
    }
    
    // 设置全局游戏结束函数，以供game-integration.js使用
    window.death = death;
     
    function round(){
        // 更新全局变量
        window.trun = trun;
        window.currentLevel = currentLevel;
        window.st = st;
        window.selectedMap = selectedMap;
        
        // 如果还未选择地图，则显示主界面
        if (selectedMap === -1) {
            $('#gameMainMenu').css('display', 'block');
            $('#mapSelection').css('display', 'none');
            return;
        }
        
        // 如果是第一回合，确保重置玩家的胜利计数
        if(trun === 1){
            mage.win = 0;
            mechanician.win = 0;
        }
        
        // 如果是第一回合，表示游戏刚开始，设置当前关卡为选中的地图
        if (trun === 1) {
            currentLevel = selectedMap;
            gameStarted = true;
        }
        
        // 停止所有BGM，确保只有当前关卡的BGM在播放
        bgm.each(function() {
            this.pause();
            this.currentTime = 0;
        });
        
        comboShoot = new ComboShoot(0);
        comboShoot.boom();
        $start.show();
        
        // 更新回合显示
        $('.round-number').text(`第 ${trun}/${maxRounds} 回合`);
        $('.map-name').text(levels[currentLevel]);
        
        // 停止所有BGM，确保只有当前关卡的BGM在播放
        bgm.each(function() {
            this.pause();
            this.currentTime = 0;
        });
        
        // 播放回合开始音效
        var roundAudioIndex = trun - 1; // 回合音效索引 (0: round1, 1: round2, 2: round3)
        
        // 如果大于2，循环使用已有的音效
        if (roundAudioIndex > 2) {
            roundAudioIndex = roundAudioIndex % 3;
        }
        
        var currentRoundAudio = roundAudio[roundAudioIndex];
        playAudio(currentRoundAudio);
        
        // 设置回调函数，在回合音效播放结束后播放对应地图的BGM
        currentRoundAudio.addEventListener('ended', function() {
            // 播放对应地图的背景音乐
            var mapBGM;
            if(selectedMap === 0) {
                mapBGM = bgm[0]; // 城镇广场使用BGM1.mp3
            } else if(selectedMap === 1) {
                mapBGM = bgm[2]; // 峭壁之战使用BGM2.mp3
            } else if(selectedMap === 2) {
                mapBGM = bgm[3]; // 地下矿井使用BGM3.mp3
            } else if(selectedMap === 3) {
                mapBGM = bgm[4]; // 天空之城使用BGM4.mp3
            } else if(selectedMap === 4) {
                mapBGM = bgm[5]; // 火山熔岩使用BGM5.mp3
            } else if(selectedMap === 5) {
                mapBGM = bgm[1]; // 冰雪要塞使用BGM6.mp3
            } else {
                // 默认使用BGM1
                mapBGM = bgm[0];
            }
            playAudio(mapBGM);
        }, { once: true }); // 确保事件监听器只触发一次
        

        // 显示地图名称
        $start.html("<p>" + levels[currentLevel] + "</p>");
        
        // 根据当前关卡设置背景图，确保自适应大小
        if(currentLevel === 0) { // 第一关卡（索引为0）
            $("#back").css("background-image", "url(../assets/images/backgrounds/background1.png)");
            $("#back").css("background-size", "100% 100%");
            $("#leftHouse").css("background-image", "url(../assets/images/backgrounds/leftHouse1.png)");
            $("#rightHouse").css("background-image", "url(../assets/images/backgrounds/rightHouse1.png)");
        } else if(currentLevel === 1) { // 第二关卡（索引为1）
            $("#back").css("background-image", "url(../assets/images/backgrounds/background2.png)");
            $("#back").css("background-size", "100% 100%");
            $("#leftHouse").css("background-image", "url(../assets/images/backgrounds/leftHouse2.png)");
            $("#rightHouse").css("background-image", "url(../assets/images/backgrounds/rightHouse2.png)");
        } else if(currentLevel === 2) { // 第三关卡（索引为2）
            $("#back").css("background-image", "url(../assets/images/backgrounds/background3.png)");
            $("#back").css("background-size", "100% 100%");
            $("#leftHouse").css("background-image", "url(../assets/images/backgrounds/leftHouse3.png)");
            $("#rightHouse").css("background-image", "url(../assets/images/backgrounds/rightHouse3.png)");
        } else if(currentLevel === 3) { // 第四关卡（索引为3）
            $("#back").css("background-image", "url(../assets/images/backgrounds/background4.png)");
            $("#back").css("background-size", "100% 100%");
            $("#leftHouse").css("background-image", "url(../assets/images/backgrounds/leftHouse4.png)");
            $("#rightHouse").css("background-image", "url(../assets/images/backgrounds/rightHouse4.png)");
        } else if(currentLevel === 4) { // 第五关卡（索引为4，火山熔岩主题）
            $("#back").css("background-image", "url(../assets/images/backgrounds/background5.png)");
            $("#back").css("background-size", "100% 100%");
            $("#leftHouse").css("background-image", "url(../assets/images/backgrounds/leftHouse5.png)");
            $("#rightHouse").css("background-image", "url(../assets/images/backgrounds/rightHouse5.png)");
        } else if(currentLevel === 5) { // 第六关卡（索引为5，冰雪城堡主题）
            $("#back").css("background-image", "url(../assets/images/backgrounds/background6.png)");
            $("#back").css("background-size", "100% 100%");
            $("#back").css("background-position", "center center");
            $("#leftHouse").css("background-image", "url(../assets/images/backgrounds/leftHouse6.png)");
            $("#rightHouse").css("background-image", "url(../assets/images/backgrounds/rightHouse6.png)");
        } else { // 其他关卡使用默认背景
            $("#back").css("background-image", "url(../assets/images/backgrounds/background1.png)");
            $("#back").css("background-size", "100% 100%");
            $("#leftHouse").css("background-image", "url(../assets/images/backgrounds/leftHouse1.png)");
        }
        
        // 为所有关卡设置统一的rightHouse大小，确保与第一关卡显示效果一致
        $("#rightHouse").css({
            "width": "43%",
            "height": "100%",
            "bottom": "-10%",
            "background-size": "100% 100%"
        });
        
        // 动态切换地面样式类
        $ ("body").removeClass("map-0 map-1 map-2 map-3 map-4 map-5");
        $ ("body").addClass("map-" + currentLevel);
        
        // 根据当前地图添加对应的样式类
        $start.removeClass("map-0 map-1 map-2 map-3 map-4 map-5");
        $start.addClass("map-" + currentLevel);
        
        setTimeout(function(){
            // 2秒后播放"战斗"音效，然后继续播放对应地图的BGM
            playAudio(roundAudio[3]);
            $start.html("<p>Fight!</p>");
            $start.addClass("fight");
            
            // 确保在"战斗"音效播放结束后继续播放对应地图的BGM
            roundAudio[3].addEventListener('ended', function() {
                // 重新播放对应地图的背景音乐
                var mapBGM;
                if(selectedMap === 0) {
                    mapBGM = bgm[0]; // 城镇广场使用BGM1.mp3
                } else if(selectedMap === 1) {
                    mapBGM = bgm[2]; // 峭壁之战使用BGM2.mp3
                } else if(selectedMap === 2) {
                    mapBGM = bgm[3]; // 地下矿井使用BGM3.mp3
                } else if(selectedMap === 3) {
                    mapBGM = bgm[4]; // 天空之城使用BGM4.mp3
                } else if(selectedMap === 4) {
                    mapBGM = bgm[5]; // 火山熔岩使用BGM5.mp3
                } else if(selectedMap === 5) {
                    mapBGM = bgm[1]; // 冰雪要塞使用BGM6.mp3
                } else {
                    // 默认使用BGM1
                    mapBGM = bgm[0];
                }
                playAudio(mapBGM);
            }, { once: true });
        },2000);
        setTimeout(function(){
            $start.hide();
            $start.removeClass("fight");
            mage.energy = 0;
            mechanician.energy = 0;
            st = true;
            world = setInterval(draw,15);
        },3000);
        // 根据回合数决定角色位置，奇数回合法师在左，偶数回合法师在右
        if(trun % 2 === 1){
            mage.x = 300;
            mage.dir = "right";
            mechanician.x = 1200;
            mechanician.dir = "left";
        } else {
            mage.x = 1200;
            mage.dir = "left";
            mechanician.x = 300;
            mechanician.dir = "right";
        }
        mage.health = mage.healthMax;
        mechanician.health = mechanician.healthMax;
        mage.shield = 0;
        mage.final = false;
        mechanician.final = false;
        mechanician.y = 100;
        mechanician.walkSpeed = 5;
        mage.y = 100;
    }
    
    var mage = new Control1(),
        mechanician = new Control2(),
        $gg = $(".gg"),
        $start = $(".start"),
        $replay = $(".replay"),
        $kit = $(".kit"),
        $bottle = $(".bottle"),
        $winner = $(".winner"),
        $mageWinVideo = $("#mageWinVideo"),
        $mechanicianWinVideo = $("#mechanicianWinVideo"),
        $volumeControl = $("#volumeControl"),
        $volumeIcon = $("#volumeIcon"),
        $volumeSlider = $("#volumeSlider"),
        $volumeValue = $("#volumeValue"),
        $volumePresets = $(".volume-preset-btn"),

        healing = [true,true],
        healAudio = $(".healAudio"),
        MageAudio = $(".MageAudio"),
        MechAudio = $(".MechAudio"),
        bgm = $(".BGM"),
        roundAudio = $(".roundAudio"),
        isSoundEnabled = true; // 添加声音开关状态变量
        currentVolume = 70; // 当前音量，初始值为70%
        savedVolume = 70; // 保存的音量，用于静音后恢复
   
    // 自适应缩放功能
    function resizeGame() {
        var gameContainer = $('.game-container');
        var map = $('.map');
        
        // 获取游戏容器和地图的尺寸
        var containerWidth = gameContainer.width();
        var containerHeight = gameContainer.height();
        var mapWidth = map.width();
        var mapHeight = map.height();
        
        // 计算缩放比例
        var scaleX = containerWidth / mapWidth;
        var scaleY = containerHeight / mapHeight;
        var scale = Math.min(scaleX, scaleY);
        
        // 应用缩放
        map.css('transform', 'scale(' + scale + ')');
    }
    
    // 初始化缩放
    $(window).on('load resize', resizeGame);
    
    energy();
    $gg.hide();
    $start.hide();
    $replay.hide();
    $replay.click(function(){
        // 重置游戏状态
        selectedMap = -1;
        gameStarted = false;
        trun = 1;
        mage.win = 0;
        mechanician.win = 0;
        window.selectedMap = selectedMap;
        window.trun = trun;
        
        // 重置角色状态
        mage.health = mage.healthMax;
        mechanician.health = mechanician.healthMax;
        mage.shield = 0;
        mechanician.shield = 0;
        mage.energy = 0;
        mechanician.energy = 0;
        mage.final = false;
        mechanician.final = false;
        
        // 显示主界面
        $('#gameMainMenu').css('display', 'block');
        $('#mapSelection').css('display', 'none');
        $('.map-item').removeClass('selected');
        $gg.hide();
        $replay.hide();
        // 隐藏胜利视频
        $mageWinVideo.hide();
        $mechanicianWinVideo.hide();
    });
    
    // 音量控制功能
    $volumeIcon.click(function() {
        // 点击图标切换静音状态
        if (currentVolume > 0) {
            // 保存当前音量并静音
            savedVolume = currentVolume;
            currentVolume = 0;
            $volumeSlider.val(0);
            $volumeValue.text("0%");
            updateVolumeIcon("🔇");
            $volumeControl.addClass("muted");
        } else {
            // 恢复之前的音量
            currentVolume = savedVolume || 70;
            $volumeSlider.val(currentVolume);
            $volumeValue.text(currentVolume + "%");
            updateVolumeIcon();
            $volumeControl.removeClass("muted");
        }
        updateAllAudioVolume();
    });
    
    // 音量滑块变化事件
    $volumeSlider.on('input', function() {
        currentVolume = $(this).val();
        $volumeValue.text(currentVolume + "%");
        updateVolumeIcon();
        updateAllAudioVolume();
        
        // 如果用户从静音状态调整音量，自动取消静音
        if (currentVolume > 0 && $volumeControl.hasClass("muted")) {
            $volumeControl.removeClass("muted");
        }
    });
    
    // 音量预设按钮点击事件
    $volumePresets.click(function() {
        const presetVolume = parseInt($(this).data("volume"));
        currentVolume = presetVolume;
        $volumeSlider.val(currentVolume);
        $volumeValue.text(currentVolume + "%");
        updateVolumeIcon();
        updateAllAudioVolume();
        
        // 如果设置了音量，取消静音状态
        if (currentVolume > 0 && $volumeControl.hasClass("muted")) {
            $volumeControl.removeClass("muted");
        }
        
        // 添加点击反馈动画
        $(this).addClass("active");
        setTimeout(() => {
            $(this).removeClass("active");
        }, 200);
    });
    
    // 更新音量图标
    function updateVolumeIcon(customIcon) {
        if (customIcon) {
            $volumeIcon.text(customIcon);
            return;
        }

        if (currentVolume == 0) {
            $volumeIcon.text("🔇");
        } else if (currentVolume < 30) {
            $volumeIcon.text("🔈");
        } else if (currentVolume < 70) {
            $volumeIcon.text("🔉");
        } else {
            $volumeIcon.text("🔊");
        }

        // 更新滑块的背景渐变，反映当前音量位置
        updateSliderBackground();

        // 触发自定义事件，通知其他组件音量已更改
        const volumeChangeEvent = new CustomEvent('volumeChanged', {
            detail: { volume: currentVolume, enabled: isSoundEnabled }
        });
        window.dispatchEvent(volumeChangeEvent);
    }
    
    // 更新滑块背景渐变
    function updateSliderBackground() {
        const percentage = currentVolume;
        const color1 = percentage < 30 ? '#ff5252' : percentage < 70 ? '#ffeb3b' : '#4caf50';
        const color2 = percentage < 30 ? '#ffeb3b' : percentage < 70 ? '#4caf50' : '#2e7d32';
        $volumeSlider.css('background', `linear-gradient(to right, ${color1} 0%, ${color1} ${percentage}%, rgba(255,255,255,0.2) ${percentage}%, rgba(255,255,255,0.2) 100%)`);
    }
    
    // 更新所有音频元素的音量，添加平滑过渡效果
    function updateAllAudioVolume() {
        const volume = currentVolume / 100; // 转换为0-1的范围
        
        // 创建平滑过渡效果
        const fadeDuration = 200; // 毫秒
        const steps = 20;
        const stepTime = fadeDuration / steps;
        
        // 获取当前所有音频的当前音量
        const currentVolumes = {
            mainMenuBGM: mainMenuBGM ? mainMenuBGM.volume : 0,
            bgm: bgm.map(function() { return this.volume; }).get(),
            MageAudio: MageAudio.map(function() { return this.volume; }).get(),
            MechAudio: MechAudio.map(function() { return this.volume; }).get(),
            healAudio: healAudio.map(function() { return this.volume; }).get(),
            roundAudio: roundAudio.map(function() { return this.volume; }).get(),
            mapClickSound: mapClickSound ? mapClickSound.volume : 0
        };
        
        // 计算每一步的音量变化
        const volumeSteps = {
            mainMenuBGM: (volume * 0.5 - currentVolumes.mainMenuBGM) / steps,
            bgm: currentVolumes.bgm.map(v => (volume - v) / steps),
            MageAudio: currentVolumes.MageAudio.map(v => (volume - v) / steps),
            MechAudio: currentVolumes.MechAudio.map(v => (volume - v) / steps),
            healAudio: currentVolumes.healAudio.map(v => (volume - v) / steps),
            roundAudio: currentVolumes.roundAudio.map(v => (volume - v) / steps),
            mapClickSound: (volume * 0.7 - currentVolumes.mapClickSound) / steps
        };
        
        let currentStep = 0;
        const fadeInterval = setInterval(() => {
            currentStep++;
            
            // 更新主菜单背景音乐
            if (mainMenuBGM) {
                mainMenuBGM.volume = currentVolumes.mainMenuBGM + volumeSteps.mainMenuBGM * currentStep;
            }
            
            // 更新BGM
            bgm.each(function(index) {
                this.volume = currentVolumes.bgm[index] + volumeSteps.bgm[index] * currentStep;
            });
            
            // 更新其他音频元素
            MageAudio.each(function(index) {
                this.volume = currentVolumes.MageAudio[index] + volumeSteps.MageAudio[index] * currentStep;
            });
            
            MechAudio.each(function(index) {
                this.volume = currentVolumes.MechAudio[index] + volumeSteps.MechAudio[index] * currentStep;
            });
            
            healAudio.each(function(index) {
                this.volume = currentVolumes.healAudio[index] + volumeSteps.healAudio[index] * currentStep;
            });
            
            roundAudio.each(function(index) {
                this.volume = currentVolumes.roundAudio[index] + volumeSteps.roundAudio[index] * currentStep;
            });
            
            if (mapClickSound) {
                mapClickSound.volume = currentVolumes.mapClickSound + volumeSteps.mapClickSound * currentStep;
            }
            
            // 完成过渡
            if (currentStep >= steps) {
                clearInterval(fadeInterval);
            }
        }, stepTime);
    }
    
    // 初始化滑块背景
    updateSliderBackground();
    
    // 创建一个辅助函数来播放音频，仅在声音开启时播放
    function playAudio(audioElement) {
        if (audioElement && isSoundEnabled && currentVolume > 0) {
            // 重置音频到开始位置
            audioElement.currentTime = 0;
            // 设置音量
            audioElement.volume = currentVolume / 100;
            // 播放音频
            audioElement.play().catch(e => {
                console.error('音频播放失败:', e);
                // 尝试重新加载音频并再次播放
                setTimeout(() => {
                    audioElement.load();
                    audioElement.currentTime = 0;
                    audioElement.volume = currentVolume / 100;
                    audioElement.play().catch(err => {
                        console.error('音频重试播放失败:', err);
                    });
                }, 100);
            });
        }
    }
    
    // 重写所有音频元素的play方法，使其检查音量开关和音量大小
    function initAudioElements() {
        MageAudio.each(function() {
            const originalPlay = this.play;
            this.play = function() {
                if (isSoundEnabled && currentVolume > 0) {
                    this.currentTime = 0;
                    this.volume = currentVolume / 100;
                    return originalPlay.call(this).catch(e => {
                        console.error('音频播放失败:', e);
                    });
                }
            };
        });

        MechAudio.each(function() {
            const originalPlay = this.play;
            this.play = function() {
                if (isSoundEnabled && currentVolume > 0) {
                    this.currentTime = 0;
                    this.volume = currentVolume / 100;
                    return originalPlay.call(this).catch(e => {
                        console.error('音频播放失败:', e);
                    });
                }
            };
        });

        healAudio.each(function() {
            const originalPlay = this.play;
            this.play = function() {
                if (isSoundEnabled && currentVolume > 0) {
                    this.currentTime = 0;
                    this.volume = currentVolume / 100;
                    return originalPlay.call(this).catch(e => {
                        console.error('音频播放失败:', e);
                    });
                }
            };
        });

        roundAudio.each(function() {
            const originalPlay = this.play;
            this.play = function() {
                if (isSoundEnabled && currentVolume > 0) {
                    this.currentTime = 0;
                    this.volume = currentVolume / 100;
                    return originalPlay.call(this).catch(e => {
                        console.error('音频播放失败:', e);
                    });
                }
            };
        });

        bgm.each(function() {
            const originalPlay = this.play;
            this.play = function() {
                if (isSoundEnabled && currentVolume > 0) {
                    this.volume = currentVolume / 100;
                    return originalPlay.call(this).catch(e => {
                        console.error('音频播放失败:', e);
                    });
                }
            };
        });
    }
    
    // 初始化音频元素
    initAudioElements();

    // 初始化音量
    $volumeSlider.val(currentVolume);
    $volumeValue.text(currentVolume + "%");
    updateVolumeIcon();

    // 延迟执行音量更新，确保所有音频元素已加载
    setTimeout(function() {
        updateAllAudioVolume();
        console.log('音效系统初始化完成，当前音量:', currentVolume + '%');
    }, 100);
    

    
    // 返回地图选择按钮事件处理
    $(document).on('click', '#logoutBtn', function(e) {
        e.preventDefault(); // 阻止默认行为
        
        // 添加点击动画效果
        $(this).addClass('clicked rotating');
        setTimeout(() => {
            $(this).removeClass('clicked rotating');
        }, 800);
        
        // 显示确认对话框
        if (confirm('您确定要返回地图选择界面吗？当前游戏进度将会丢失。')) {
            console.log('用户确认返回地图选择'); // 调试日志
            
            // 停止所有音频
            if (typeof bgm !== 'undefined') {
                bgm.each(function() {
                    this.pause();
                    this.currentTime = 0;
                });
            }
            
            if (mainMenuBGM) {
                mainMenuBGM.pause();
                mainMenuBGM.currentTime = 0;
            }
            
            // 重置游戏状态
            if (typeof mage !== 'undefined') {
                mage.win = 0;
                mage.health = mage.healthMax;
                mage.shield = 0;
                mage.energy = 0;
            }
            
            if (typeof mechanician !== 'undefined') {
                mechanician.win = 0;
                mechanician.health = mechanician.healthMax;
                mechanician.shield = 0;
                mechanician.energy = 0;
            }
            
            // 重置回合数
            if (typeof window.trun !== 'undefined') {
                window.trun = 1;
            }
            
            // 显示地图选择界面
            $('#gameMainMenu').css('display', 'block');
            $('#mapSelection').css('display', 'none');
            $('.gg').css('display', 'none');
            $('.replay').css('display', 'none');
            $start.css('display', 'none');
            
            // 清除游戏循环
            if (typeof world !== 'undefined') {
                clearInterval(world);
            }
            
            // 播放主菜单背景音乐
            if (mainMenuBGM && isSoundEnabled) {
                mainMenuBGM.volume = 0.5 * (currentVolume / 100);
                mainMenuBGM.play().catch(e => console.log("背景音乐播放失败"));
            }
            
            // 重置地图选择
            if (typeof selectedMap !== 'undefined') {
                selectedMap = -1;
                window.selectedMap = selectedMap;
            }
            
            // 清除地图选中状态
            $('.map-item').removeClass('selected');
        }
    });
    

    

    
    // 主界面按钮事件处理
    $('#mapSelectionBtn').click(function() {
        $('#gameMainMenu').css('display', 'none');
        $('#mapSelection').css('display', 'block');
    });
    
    
    
    $('#backToLoginBtn').click(function() {
        // 播放点击音效
        if (mapClickSound && isSoundEnabled && currentVolume > 0) {
            mapClickSound.currentTime = 0;
            mapClickSound.volume = (currentVolume / 100) * 0.7;
            mapClickSound.play().catch(e => console.log('点击音效播放失败:', e));
        }

        // 停止游戏时长追踪
        if (window.playtimeTracker) {
            window.playtimeTracker.stopTracking().then(() => {
                console.log('游戏时长追踪已停止');
                // 触发登出事件
                window.dispatchEvent(new CustomEvent('userLoggedOut'));
                // 跳转到登录页面
                window.location.href = '../index.html';
            }).catch(error => {
                console.error('停止游戏时长追踪失败:', error);
                window.location.href = '../index.html';
            });
        } else {
            window.location.href = '../index.html';
        }
    });
    
    // 排行榜按钮事件处理
    $('#leaderboardBtn').click(function() {
        console.log('排行榜按钮被点击');
        // 跳转到排行榜页面
        window.location.href = './leaderboard.html';
    });
    
    // 个人信息按钮事件处理
    $('#userInfoBtn').click(function() {
        // 播放点击音效
        if (mapClickSound && isSoundEnabled && currentVolume > 0) {
            mapClickSound.currentTime = 0;
            mapClickSound.volume = (currentVolume / 100) * 0.7;
            mapClickSound.play().catch(e => console.log('点击音效播放失败:', e));
        }
        // 跳转到个人信息页面
        window.location.href = './userinfo.html';
    });

    // 游戏帮助按钮事件处理
    $('#helpBtnFromMain').click(function() {
        // 播放点击音效
        if (mapClickSound && isSoundEnabled && currentVolume > 0) {
            mapClickSound.currentTime = 0;
            mapClickSound.volume = (currentVolume / 100) * 0.7;
            mapClickSound.play().catch(e => console.log('点击音效播放失败:', e));
        }
        // 跳转到游戏帮助页面
        window.location.href = './help.html';
    });
    
    // 地图选择界面返回主菜单按钮
    $('#backFromMapSelectionBtn').click(function() {
        // 添加点击动画
        $(this).addClass('clicked');
        setTimeout(() => {
            $(this).removeClass('clicked');
        }, 400);

        // 返回主菜单
        $('#mapSelection').css('display', 'none');
        $('#gameMainMenu').css('display', 'block');

        // 播放点击音效
        if (mapClickSound && isSoundEnabled && currentVolume > 0) {
            mapClickSound.currentTime = 0;
            mapClickSound.volume = (currentVolume / 100) * 0.7;
            mapClickSound.play().catch(e => console.log('返回按钮音效播放失败:', e));
        }
    });
    
    // 地图选择事件处理
    $('.map-item').click(function() {
        var selectedMapIndex = parseInt($(this).data('map'));
        selectedMap = selectedMapIndex;
        currentLevel = selectedMap;
        window.selectedMap = selectedMap;
        window.currentLevel = currentLevel;

        // 添加选中效果
        $('.map-item').removeClass('selected');
        $(this).addClass('selected');

        // 播放地图点击音效
        if (mapClickSound && isSoundEnabled && currentVolume > 0) {
            mapClickSound.currentTime = 0; // 重置音效播放位置
            mapClickSound.volume = (currentVolume / 100) * 0.7; // 应用全局音量和点击音效系数
            mapClickSound.play().catch(e => console.log('地图点击音效播放失败:', e));
        }
        
        // 开始背景音乐淡出效果
        fadeOutBGM();
        
        // 显示加载页面
        showLoadingPage();
        
        // 延迟关闭地图选择界面并开始游戏（延长至2秒以匹配加载效果）
        setTimeout(function() {
            $('#mapSelection').css('display', 'none');
            round();
        }, 2000);
    });
    
    // 游戏开始时，先不调用round()，等待用户从主界面选择地图
    // round();
    
    $("#aiBox").append("<div id='iceShoot'></div>");
    $("#aiBox").append("<div id='boomShoot'></div>");
    var comboShoot;
    function ComboShoot(getSpeed) {//back3
        this.have = $("#iceShoot");
        this.x = mechanician.man.offset().left - 90;
        this.y = mechanician.man.offset().top + 30;
        this.coliCheakNumber = 300;//use 300 to check ice, use 301 to check boom
        this.xspeed = getSpeed * 0.2;
        this.yspeed = -20;
        this.xacce = 0;
        this.yacce = 1;
        this.effectNumber = randomNumberAtoB(3);//effectNumber is a random number from 0 to 3;

        this.alive = true;
        this.degree = 0;
        var self = this;
        self.have.show();
        if (mechanician.dir === "left") {
            self.xspeed *= -1;
        }
        self.have.css("background-image", "url(../assets/images/effects/grenade" + self.effectNumber + ".png)");

        this.attack0 = function() {//bleeding 300 dmg
            blood(mage, 12, 5, 5, 5);
            let n = 0;
            let timer = setInterval(function() {
                //changed
                if (mage.shield > 0) {
                    mage.shield -= 2;
                } else {
                    mage.health -= 2;
                }
                //!
                n += 1;
                if (n === 300) {
                    clearInterval(timer);
                }
            }, 20);

        };

        this.boom = function() {
            if(st){
                playAudio(MechAudio[0]);
            }
            self.have.css("transition", "0.1s");
            self.have.css("filter", "opacity(0.5)");
            self.have.css("width", "200px");
            self.have.css("height", "200px");
            self.xspeed = 0;
            self.xacce = 0;
            self.x -= 100;
            self.y -= 100;
            self.have.css("left", self.x + "px");
            self.have.css("top", self.y + "px");
            setTimeout(function() {
                self.alive = false;
                self.x = 0;
                self.y = 0;
                self.have.hide();
                self.have.css("transition", "none");
                self.have.css("filter", "opacity(1)");
                //changed: 30px to 60px, 60 to 30, 30 to 45
                self.have.css("width", "45px");
                self.have.css("height", "45px");
            }, 100);
        };
        this.attack1 = function() {//ban jump 100 dmg
            blood(mage, 3, 10, 3, 3);
            if (mage.shield > 0) {
                mage.shield -= 500;
            } else {
                mage.health -= 500;
            }
            if (mage.shield < 0) {
                mage.health += mage.shield;
                mage.shield = 0;
                // 添加护盾破裂特效
                mage.shield0.addClass("break");
                setTimeout(function() {
                    mage.shield0.removeClass("break");
                }, 500);
            }
            let no = mage.walkSpeed,
                yes = mechanician.walkSpeed;
            mage.walkSpeed *= 0.5;
            mechanician.walkSpeed *= 1.8;
            mage.jumpChance = 0;
            setTimeout(function() {
                mage.walkSpeed = no;
                mechanician.walkSpeed = yes;
                mage.jumpChance = 2;
            }, 3000);
        };

        this.attack2 = function() {//-700 + 500
            blood(mage, 3, 10, 3, 3);
            if (mage.shield > 0) {
                mage.shield -= 1400;
            } else {
                mage.health -= 1400;
            }
            if (mage.shield < 0) {
                mage.health += mage.shield;
                mage.shield = 0;
                // 添加护盾破裂特效
                mage.shield0.addClass("break");
                setTimeout(function() {
                    mage.shield0.removeClass("break");
                }, 500);
            }

            setTimeout(function() {
                mage.health += 500;
                if (mage.health >= 3800) {
                    mage.health = 3800;
                }
            }, 6000);

        };

        this.attack3 = function() {//give out healing
            var atk3loopTime = 0;
            blood(mage, 5, 5, 5, 3);
            function atk3loop() {

                if (mage.shield > 0) {
                    mage.shield -= 60;
                } else {
                    mage.health -= 60;
                }
                if (mage.shield < 0) {
                    mage.health += mage.shield;
                    mage.shield = 0;
                    // 添加护盾破裂特效
                    mage.shield0.addClass("break");
                    setTimeout(function() {
                        mage.shield0.removeClass("break");
                    }, 500);
                }
                for (let n = 0; n <= randomNumberAtoB(3); n +=1) {
                    fireContainer[fireContainer.length] = new TinyFire(mage.x, 600 - mage.y, fireContainer.length, "B");
                }
                atk3loopTime += 1;
                if (atk3loopTime >= 10) {
                    return;
                }
                setTimeout(function() {
                    atk3loop();
                }, 100);
            }
            atk3loop();
        };
        
        this.hit = function(situation) {
            if (situation === "ground" && st) {
                for (let n = 0; n <= randomNumberAtoB(50); n +=1) {
                    fireContainer[fireContainer.length] = new TinyFire(self.x + 100, self.y + 70, fireContainer.length, "B");
                }
            }
            if (situation === "mage" && st) {
                if (self.effectNumber === 0) {
                    self.attack0();
                } else if (self.effectNumber === 1) {
                    self.attack1();
                } else if (self.effectNumber === 2) {
                    self.attack2();
                } else {
                    self.attack3();
                }
                if (st) {
                    playAudio(MechAudio[0]);
                }
                mechanician.energy += 23;
                self.x = 0;
                self.y = 0;
                self.have.hide();
                self.alive = false;
            }
            if (situation === "servant" && st) {
                mechanician.energy += 15;
                en.beDamaged(500);
                blood(en, 1, 10, 10, 9);
                self.x = 0;
                self.y = 0;
                self.have.hide();
                self.alive = false;
            }
            
        };
        
        this.draw = function() {
            if (self.xspeed > 0) {
                self.degree += 5;
            } else {
                self.degree -= 5;
            }
            
            self.have.css("transform", "rotate(" + self.degree + "deg)");
            if (collisionCheak(mage.man, self.have, 303) === "coli") {
                self.hit("mage");
            }
            if (collisionCheak($(".ground"), self.have, 304) === "wcoli") {
                self.xspeed *= 0.6;
                if (self.yspeed <= 5) {
                    self.yspeed = 0;
                    self.yacce = 0;
                    setTimeout(function() {
                        self.xacce = 0;
                        self.xspeed = 0;
                    }, 700);
                } else {
                    self.yspeed *= - 0.6;
                }
            }
            if (en !== undefined) {
                if (en.alive) {
                    if (collisionCheak(en.man, self.have, 305) === "coli") {
                        self.hit("servant");
                    }   
                }
            }
            self.x += self.xspeed;
            self.xspeed += self.xacce;
            self.y += self.yspeed;
            self.yspeed += self.yacce;
            self.have.css("left", self.x + "px");
            self.have.css("top", self.y + "px");
            
            if (self.x <= 10 || self.x >= 1450) {
                
                self.xspeed *= -1;
            }
        };
        function loop() {
            
            if (!self.alive) {
                return;
            }
            self.draw();
            setTimeout(function() {
                loop();
            }, 15);
        }
        loop();
        setTimeout(function() {
            if (!self.alive) {
                return;
            }
            self.boom();
            self.hit("ground");
        }, 2000);
    }
    
    //Mechanician L skill///////////////////////////////////////////////////////////////////////////
    var machinePopulation = 0;
    function KillerMachine(setx, sety) {
        var self = this;
        this.x = setx;
        this.y = sety;
        this.xspeed = 0;
        this.yspeed = 0;
        this.xacce = 0;
        this.yacce = 1;
        this.xMaxSpeed = 10;
        this.tarPlayer = mage;
        this.number = machinePopulation + 10000;
        this.air = true;
        this.jumpChance = 0;
        this.isStop = false;
        this.alive = true;
        this.health = 360;
        
        
        setTimeout(function() {
            self.disapare();
        }, 8000);
        
        this.createEle = function() {
            $("#aiBox").append("<div class = 'killerM killerM" + machinePopulation + "'></div>");//the class 'killerM' is used to mark every machines.
            $("#aiBox").append("<div class = 'machineHealth' id='machineHealth" +  machinePopulation + "'></div>");
            $("#aiBox").append("<div class = 'machHealContainer' id = 'machHealContainer" + machinePopulation + "'></div>");
            self.man = $($(".killerM" + machinePopulation));
            self.healthEle = $("#machineHealth" + machinePopulation);
            self.healthContainEle = $("#machHealContainer" + machinePopulation);
            machinePopulation += 1;
        };
        this.createEle();
        
        this.damage = function() {
            if (collisionCheak(self.tarPlayer.man, self.man, 50000 + self.number) === "coli") {
                mage.shield -= 800;
                if(mage.shield < 0){
                    self.tarPlayer.health += mage.shield;
                    mage.shield = 0;
                    // 添加护盾破裂特效
                    mage.shield0.addClass("break");
                    setTimeout(function() {
                        mage.shield0.removeClass("break");
                    }, 500);
                }
                self.disapare();
            }
        };
        
        this.beDamaged = function(getDamage) {
            self.health -= getDamage;
            self.healthEle.css("width", self.health / 3.6 + "px");
            if (self.health <= 0) {
                self.disapare();
            }
        };
        
        
        this.jump = function() {
            if (self.jumpChance === 0) {
                return "";
            }
            if (mage.y > 300) {
                self.yspeed = -35;
            } else {
                self.yspeed = -30;    
            }
            if (mage.y > 400) {
                self.yspeed = -40;
            }
            self.yacce = 2;
            self.jumpChance = 0;
        };
        
        this.disapare = function() {
            if(st){
                let x = randomNumberAtoB(3);
                if(x === 1){
                    playAudio(MageAudio[2]);
                } else if(x === 2){
                    playAudio(MageAudio[3]);
                } else {
                    playAudio(MageAudio[4]);
                }
                playAudio(MechAudio[3]);
                MechAudio[13].pause();
            }
            self.healthEle.remove();
            self.man.remove();  
            self.healthContainEle.remove();
            self.alive = false;
        };
        
        this.stop = function() {
            if (self.jumpChance === 0) {
                return "";
            }
            self.jumpChance = 0;
            self.xMaxSpeed = 0;
            self.man.css("width", "40px");
            self.man.css("border-radius", "100px");
            self.man.css("transition", "0.5s");
            self.isStop = true;
            setTimeout(function() {
                self.jumpChance = 1;
                self.xMaxSpeed = 10;
                self.man.css("width", "80px");
                self.man.css("border-radius", "0px");
                self.man.css("transition", "none");
                self.isStop = true;
            }, 800);
        };
        
        
        this.fall = function() {
            if (collisionCheak($($(".ground")[0]), self.man, 201) === "wcoli") {
                self.yspeed = 0;
                self.yacce = 0;
                self.jumpChance = 1;
                self.y = parseInt($($(".ground")[0]).css("top"), 10) - self.man.height() - 1;
            }  
        };
        
        this.draw = function() {
            self.damage();
            self.fall();
            self.chase();
            self.x += self.xspeed;
            self.xspeed += self.xacce;
            self.y += self.yspeed;
            self.yspeed += self.yacce;
            if (self.x <= 10 || self.x >= 1450) {
                self.xspeed *= -1;
            }
            self.man.css("left", self.x + "px");
            self.man.css("top", self.y + "px");
            self.healthEle.css("left", self.x - 10 + "px");
            self.healthEle.css("top", self.y - 15 + "px");
            self.healthContainEle.css("left", self.x - 11 + "px");
            self.healthContainEle.css("top", self.y - 16 + "px");
        };
        this.chase = function() {
            if (self.x < self.tarPlayer.x) {
                self.xacce = 0.2;
            } else {
                self.xacce = -0.2;
            }
            if (self.xspeed > self.xMaxSpeed) {
                self.xspeed = self.xMaxSpeed;
            } else if (self.xspeed < -self.xMaxSpeed) {
                self.xspeed = -self.xMaxSpeed;
            }
        };
        
        this.beHitten = function() {
            if (collisionCheak(self.man, $("#mageBullet"), self.number + 10000)) {
                $("#mageBullet").remove();
                self.beDamaged(mage.damage);
            } else if(collisionCheak(self.man, mage.meteor, self.number + 700)){
                self.disapare();
                mage.drone += 1;
            }
        };
        
        function loop() {
            playAudio(MechAudio[13]);
            if (!self.alive) {
                return;
            }
            self.beHitten();
            if (randomNumberAtoB(50) === 1) {
                self.jump();
            }
            if (randomNumberAtoB(100) === 1) {
                self.stop();
            }
            
            self.draw();
            setTimeout(function() {
                loop();
            }, 15);
        }
        loop();
    }
    var killerMachineArr = [];
    
    //killerLoop();    
    
    //Mechanician L skill///////////////////////////////////////////////////////////////////////////
    
    
    
    
    //Mage R skill//////////////////////////////////////////////////////////////////////////////////
    var enymyPopulation = 0;//this variable is used to count the number of enymies
    var fireContainer = [];
    function TinyFire(getx, gety, fireNum, type) {
        if (type === "B") {
            this.x = getx;
            this.y = gety;
        } else {
            this.x = getx + en.man.width()/2;
            this.y = gety + en.man.height()/2;
        }
        
        this.tarx = mechanician.x;
        this.tary = mechanician.y;
        this.xdis = this.tarx - this.x;
        this.ydis = this.tary - this.y;
        this.xspeed = this.xdis/40;
        this.yspeed = -randomNumberAtoB(40);
        this.yacce = 1;
        this.damage = 200;
        var self = this,
            number = fireNum;
        
        $("#fireBox").append("<div class='fireBlock fire" + number + "'></div>");
        this.man = $($(".fire" + fireNum)[0]); 
        
        
        if (type === "B") {
            self.damage = -100;
            self.man.css("background-color", "green");
        }
        
        
        this.draw = function() {
            if (self.x <= 10 || self.x >= 1450) {
                self.man.css("transform","scaleX(-1)");
                self.man.css("transform","rotate(110deg)");
                self.xspeed *= -1;
            }
            self.yspeed += self.yacce;
            self.x += self.xspeed;
            self.y += self.yspeed;
            self.man.css("left", self.x + "px");
            self.man.css("top", self.y + "px");
        };
        
        this.boom = function() {
            playAudio(MageAudio[10]);
            self.man.css("transition", "0.3s");
            self.man.css("filter", "opacity(0.5)");
            self.man.css("background-image","none");
            self.man.css("background-color", "rgb(109, 103, 136)");
            self.man.css("width", "200px");
            self.man.css("height", "200px");
            self.x -= 100;
            self.y -= 100;
            self.draw();
            setTimeout(function() {
                self.man.remove();
            }, 300);
        };
        
        this.loop = function() {
            self.draw();
            if (collisionCheak(mechanician.man, self.man, 300000 + number) === "coli") {
                mechanician.health -= self.damage;
                if (mechanician.health >= 4000) {
                    mechanician.health = 4000;
                }
                self.boom();
                return;
                
            }
            if (self.y > 570) {
                self.boom();
                    return;
                }
            setTimeout(function() {self.loop();}, 15);
        };
        this.loop();
        
    }
    //Mage R skill//////////////////////////////////////////////////////////////////////////////////
    function Enemy() {
        var self = this;
        this.trun = trun;
        this.x = mage.man.offset().left - 100;
        this.y = mage.man.offset().top - 50;
        this.xspeed = 0;
        this.yspeed = 0;
        this.xacce = 0;
        this.yacce = 0;
        this.xMaxSpeed = 1;
        this.master = mage;
        this.chasePoint = self.master.x - 100;
        this.tarPlayer = mechanician;
        this.shootTime = 10;
        this.reloadTime = 150;
        this.loopCount = 0;
        this.health = 1000;
        this.alive = true;
        this.dir = "left";
        
        mage.shield += 1000;
        $("#aiBox").append("<div id='servantHealth' class='servantData'></div>");
        $("#aiBox").append("<div id='servantHealthBox' class='servantData'></div>");
        this.containEle = $("#servantHealthBox");
        this.healthEle = $("#servantHealth");
        
        function heal() {
            if (!self.alive) {
                return;
            }
            mage.health += 180;
            if (mage.health > 3800) {
                mage.health = 3800;
            }
            setTimeout(function() {
                heal();
            }, 2000);
        }
        heal();
        
        this.beDamaged = function(getDamage) {
            self.health -= getDamage;
            self.healthEle.css("width", self.health / 10 + "px");
            if (self.health <= 0) {
                self.alive = false;
            }
        };
        
        this.chase = function() {
            if(self.master.dir === "left"){
                self.chasePoint = self.master.x + 150;
            } else {
                self.chasePoint = self.master.x - 100;
            }
            
            if(self.x <= self.chasePoint + 1 && self.x >= self.chasePoint - 1){
                self.xspeed = 0;
                if(self.x < self.tarPlayer.x){
                    self.man.css("transform","scaleX(1)");
                } else {
                    self.man.css("transform","scaleX(-1)");
                }
            } else if(self.x < self.chasePoint - 1){
                self.xspeed = 1;
                self.man.css("transform","scaleX(1)");
            } else if(self.x > self.chasePoint + 1){
                self.xspeed = -1;
                self.man.css("transform","scaleX(-1)");
            }
            if (self.xspeed > 0) {
                self.dir = "right";
            } else {
                self.dir = "left";
            }
        };
        
        
        
        this.damage = function() {
            if (collisionCheak(self.tarPlayer.man, self.man, 100) === "coli") {
                self.tarPlayer.health -= 5;
            }
        };
        
        this.fall = function() {
            if (collisionCheak($($(".ground")[0]), self.man, 200) === "wcoli") {
                self.yspeed = 0;
                self.yacce = 0;
                self.y = parseInt($($(".ground")[0]).css("top"), 10) - self.man.height() - 1;
            }
        };
        
        this.jump = function() {
            this.yspeed = -15;
            this.yacce = 1;
        };
        
        
        this.createEle = function() {
            $("#aiBox").append("<div class = 'enemy ene" + enymyPopulation + "'></div>");//the class 'ene' is used to mark every enymies.
            self.man = $($(".ene" + enymyPopulation));
        };
        this.draw = function() {
            self.healthEle.css("left", self.x - 10 + "px");
            self.healthEle.css("top", self.y - 30 + "px");
            self.containEle.css("left", self.x - 10 + "px");
            self.containEle.css("top", self.y - 30 + "px");
            self.damage();
            self.chase();
            self.x += self.xspeed;
            self.y += self.yspeed;
            self.yspeed += self.yacce;
            self.man.css("left", self.x + "px");
            self.man.css("top", self.y + "px");
        };
        
        this.larch = function() {
            self.loopCount += 1;
            if (self.loopCount < self.shootTime) {
                fireContainer[fireContainer.length] = new TinyFire(self.x, self.y, fireContainer.length);    
            }
            if (self.loopCount === self.reloadTime) {
                this.loopCount = 0;
            }
        };
        this.jump();
    }
    //Mage R skill//////////////////////////////////////////////////////////////////////////////////
    
    var en;
    function enymyMonster() {
        if (!en.alive) {
            if(en.trun === trun){
                playAudio(MageAudio[7]);
            }
            en.man.remove();
            en.healthEle.remove();
            en.containEle.remove();
            mage.servant = false;
            return;
        }
        if (randomNumberAtoB(80) === 1) {
            en.jump();
        }
        
        
        en.larch();
        en.fall();
        en.draw();
    }
    //mage R skill//////////////////////////////////////////////////////////////////////////////////
    
    var bloodArr = [],
        bloodNumber = 0;
    function Blood(getx, gety, getheight, getdistance) {
        this.x = getx;
        this.y = gety;
        this.xacce = 0;
        this.yacce = -1;
        this.xspeed = getdistance + randomNumberAtoB(getdistance);
        this.yspeed = getheight + randomNumberAtoB(getheight);
        this.number = bloodNumber;
        bloodNumber += 1;
        var self = this;
        $("#bloodBox").append("<div class='blood" + self.number + "'></div>");
        this.man = $(".blood" + self.number);
        
        this.draw = function() {
            self.x += self.xspeed;
            self.y += self.yspeed;
            self.yspeed += self.yacce;
            self.xspeed += self.xacce;
            self.man.css("left", self.x);
            self.man.css("bottom", self.y);
        };
        
        function loop() {
            self.draw();
            if (self.y <= 50) {
                setTimeout(function() {
                    self.man.remove();
                }, 8000 + randomNumberAtoB(2000));
                return;
            }
            setTimeout(function() {
                loop();
            }, 15);
        }
        loop();
    }
    function blood(chara, time, value, ygo, xgo) {
        // 触发受击动画
        if (chara.health0) {
            chara.health0.parent().addClass("hit");
            setTimeout(function() {
                chara.health0.parent().removeClass("hit");
            }, 300);
        }
        
        var count = 0;
        function loop() {
            for (let n = 0; n < value; n += 1) {
                let inputx = -xgo;
                if (chara.dir === "left") {
                    inputx *= -1;
                }
                let yn = chara.y;
                if (chara === en) {
                    console.log("enemy");
                    yn = 600 - yn;
                }
                bloodArr[bloodArr.length] = new Blood(chara.x + 25, yn, ygo, inputx);
            }
            
            count += 1;
            if (count >= time) {
                
                return;
            }
            setTimeout(function() {
                loop();
            }, 500);
        }
        loop();
    }
    comboShoot = new ComboShoot(0);
    comboShoot.boom();
    comboShoot.boom();
    
    // 设置全局函数，以便game-integration.js可以访问
    window.round = round;
    // death函数已经在前面设置为全局函数
    window.mage = mage;
    window.mechanician = mechanician;
}
$(window).ready(game());
