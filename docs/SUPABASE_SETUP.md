# Supabase数据库集成指南

## 简介
本项目已成功集成Supabase数据库，用于存储用户数据、游戏分数和统计信息。用户可以注册账户、登录游戏，并保存游戏进度和成就。

## 数据库设置步骤

### 1. 创建Supabase项目
1. 访问 [Supabase官网](https://supabase.com) 并注册账户
2. 创建新项目
3. 等待项目创建完成（通常需要2-3分钟）

### 2. 获取API密钥
1. 在Supabase项目中，导航到 **Settings** > **API**
2. 复制 **Project URL** 和 **anon public** key
3. 在 `supabase.js` 和 `login.html` 文件中更新以下常量：
   ```javascript
   const SUPABASE_URL = 'https://your-project-id.supabase.co';
   const SUPABASE_ANON_KEY = 'your-anon-key';
   ```

### 3. 初始化数据库表
1. 在Supabase项目中，导航到 **SQL Editor**
2. 复制 `database_init.sql` 文件中的全部内容
3. 粘贴到SQL编辑器中并点击 **Run** 执行
4. 这将创建以下表：
   - `profiles`: 用户配置文件
   - `game_data`: 游戏数据
   - `game_scores`: 游戏分数
   - `game_stats`: 游戏统计

## 功能说明

### 用户系统
- **注册**: 用户可以创建账户
- **登录**: 使用邮箱和密码登录
- **游客模式**: 无需注册即可游戏，但数据不会保存

### 游戏数据存储
- **游戏进度**: 自动保存游戏进度
- **分数记录**: 记录每局游戏的分数
- **统计信息**: 跟踪总游戏次数、胜负比等
- **成就系统**: 解锁新关卡和角色成就

## 文件说明

### 核心文件
- `login.html`: 登录/注册界面
- `supabase.js`: Supabase客户端配置和基础功能
- `game-data-manager.js`: 游戏数据管理器
- `game-integration.js`: 游戏逻辑与数据库集成
- `database_init.sql`: 数据库初始化脚本

### 游戏集成
- `index.html`: 主游戏页面
- `control.js`: 游戏逻辑控制

## 使用说明

### 开始游戏
1. 访问 `login.html` 页面
2. 注册新账户或使用现有账户登录
3. 或选择"游客模式"直接开始游戏

### 游戏过程中
- 游戏数据会自动保存
- 每局游戏结束后，分数和统计信息会同步到数据库
- 可以在游戏中查看排行榜和统计信息

### 关卡系统
- 初始只有第一关"城镇广场"解锁
- 获胜后可解锁新关卡
- 通过主菜单可以访问已解锁的关卡

## 故障排除

### 常见问题
1. **无法连接到数据库**
   - 检查SUPABASE_URL和SUPABASE_ANON_KEY是否正确
   - 确认Supabase项目处于活动状态

2. **数据保存失败**
   - 检查网络连接
   - 确认数据库表已正确创建
   - 查看浏览器控制台错误信息

3. **登录/注册失败**
   - 确认邮箱格式正确
   - 检查密码是否符合要求（至少6个字符）
   - 查看控制台错误信息

### 调试模式
在浏览器控制台中查看详细日志：
```javascript
// 查看当前用户信息
console.log(window.userDataManager.currentUser);

// 查看用户数据
console.log(window.gameDataManager.userData);

// 查看当前游戏会话
console.log(window.gameDataManager.gameSession);
```

## 安全注意事项
- 本项目使用Supabase的行级安全策略（RLS）
- 用户只能访问自己的数据
- 分数表设置为可读，但只有自己可以写入
- 敏感操作需要通过API密钥验证

## 未来扩展
1. 添加好友系统
2. 实现实时排行榜
3. 添加游戏录像和回放功能
4. 实现跨平台数据同步