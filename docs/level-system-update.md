# 等级系统更新说明

## 更新内容

### 单位变更
- **原单位**: 累计活跃小时 (hours)
- **新单位**: 累计活跃分钟 (minutes)

### 等级计算公式
保持不变: `S(n) = n² + 4n`

- **n**: 等级 (从1开始)
- **S(n)**: 升级到第n级所需的累计活跃分钟

## 更新后的等级要求表

| 等级 | 所需活跃时间(分钟) | 所需活跃时间(小时) | 距上一级(分钟) |
|------|-------------------|-------------------|----------------|
| 1级  | 0-5分钟          | 0-0.08小时        | -              |
| 2级  | 5-12分钟         | 0.08-0.2小时      | 7分钟          |
| 3级  | 12-21分钟        | 0.2-0.35小时       | 9分钟          |
| 4级  | 21-32分钟        | 0.35-0.53小时      | 11分钟         |
| 5级  | 32-45分钟        | 0.53-0.75小时      | 13分钟         |
| 6级  | 45-60分钟        | 0.75-1小时         | 15分钟         |
| 7级  | 60-77分钟        | 1-1.28小时         | 17分钟         |
| 8级  | 77-96分钟        | 1.28-1.6小时       | 19分钟         |
| 9级  | 96-117分钟       | 1.6-1.95小时       | 21分钟         |
| 10级 | 117-140分钟      | 1.95-2.33小时      | 23分钟         |
| 20级 | 480分钟          | 8小时              | -              |
| 50级 | 2700分钟         | 45小时             | -              |
| 100级| 10400分钟        | 173.33小时         | -              |

## 数据库更新

### SQL函数修改

#### 1. `calculate_level()` 函数
```sql
-- 修改前：接收小时为参数
CREATE OR REPLACE FUNCTION calculate_level(play_time_hours FLOAT)

-- 修改后：接收分钟为参数
CREATE OR REPLACE FUNCTION calculate_level(play_time_minutes FLOAT)
```

#### 2. `update_user_level()` 触发器
```sql
-- 修改前：秒转小时
NEW.level := calculate_level(NEW.play_time / 3600.0);
NEW.login_days := NEW.play_time / 3600.0;

-- 修改后：秒转分钟
NEW.level := calculate_level(NEW.play_time / 60.0);
NEW.login_days := NEW.play_time / 60.0;
```

#### 3. 辅助函数重命名
```sql
-- 修改前
get_hours_to_next_level(current_level INTEGER)
get_required_hours_for_level(target_level INTEGER)

-- 修改后
get_minutes_to_next_level(current_level INTEGER)
get_required_minutes_for_level(target_level INTEGER)
```

#### 4. 视图更新
```sql
-- 添加分钟字段
CREATE OR REPLACE VIEW user_level_info AS
SELECT
    gs.user_id,
    gs.play_time / 60.0 as total_minutes,      -- 新增：总分钟
    gs.play_time / 3600.0 as total_hours,      -- 保留：总小时
    gs.level,
    gs.login_days,
    get_required_minutes_for_level(gs.level) as current_level_minutes,
    get_required_minutes_for_level(gs.level + 1) as next_level_minutes,
    get_minutes_to_next_level(gs.level) as minutes_to_next_level,
    p.username,
    p.avatar_url
FROM public.game_stats gs
JOIN public.profiles p ON gs.user_id = p.id;
```

## 前端代码更新

### JavaScript方法修改

#### 1. `calculateLevel()` 方法
```javascript
// 修改前：接收小时参数
calculateLevel(totalHours) {
    let level = 1;
    while (level <= 100) {
        const requiredHours = level * level + 4 * level;
        if (totalHours < requiredHours) {
            return level - 1 === 0 ? 1 : level - 1;
        }
        level++;
    }
    return 100;
}

// 修改后：接收分钟参数
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
```

#### 2. 新增方法
```javascript
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
```

#### 3. 向下兼容方法
```javascript
// 保留旧方法名称，内部转换为分钟，确保向后兼容
getHoursToNextLevel(currentLevel) {
    return this.getMinutesToNextLevel(currentLevel) / 60;
}

getRequiredHoursForLevel(targetLevel) {
    return this.getRequiredMinutesForLevel(targetLevel) / 60;
}
```

#### 4. `getUserLevelInfo()` 返回值增强
```javascript
return {
    totalMinutes: totalMinutes.toFixed(2),      // 新增：总分钟
    totalHours: totalHours.toFixed(2),          // 保留：总小时
    totalSeconds: data.play_time,                // 保留：总秒数
    currentLevel: currentLevel,
    loginDays: data.login_days.toFixed(2),
    minutesToNextLevel: minutesToNext.toFixed(2),       // 新增：到下一级分钟
    hoursToNextLevel: (minutesToNext / 60).toFixed(2), // 新增：到下一级小时
    progress: ((totalMinutes - requiredForCurrent) / minutesToNext * 100).toFixed(2),
    currentLevelRequiredMinutes: requiredForCurrent,      // 新增：当前等级分钟
    nextLevelRequiredMinutes: requiredForNext,          // 新增：下一等级分钟
    // 向下兼容
    currentLevelRequired: requiredForCurrent / 60,
    nextLevelRequired: requiredForNext / 60
};
```

## 数据库迁移

### 需要执行的SQL
```sql
-- 1. 删除旧触发器
DROP TRIGGER IF EXISTS trigger_update_user_level ON public.game_stats;

-- 2. 删除旧函数
DROP FUNCTION IF EXISTS calculate_level(FLOAT);
DROP FUNCTION IF EXISTS get_hours_to_next_level(INTEGER);
DROP FUNCTION IF EXISTS get_required_hours_for_level(INTEGER);

-- 3. 删除旧视图
DROP VIEW IF EXISTS user_level_info;

-- 4. 执行 add_level_system.sql 中的所有新定义
-- (包含新的函数、触发器和视图)
```

## 影响分析

### 优点
1. ✅ 更精准的等级计算：分钟级别比小时级别更精细
2. ✅ 更快升级：用户更容易看到等级提升，增强游戏体验
3. ✅ 更好的反馈：频繁升级带来更强的成就感
4. ✅ 向后兼容：保留了小时相关的方法，旧代码可继续运行

### 注意事项
1. ⚠️ **现有用户等级可能变化**：
   - 原本5小时的用户 = 300分钟
   - 修改后：300分钟可能达到更高等级
   - 建议：保留原始`play_time`数据，只更新计算逻辑

2. ⚠️ **数据库触发器需要重新部署**：
   - 需要在Supabase中执行更新后的SQL

3. ⚠️ **前端显示需要适配**：
   - 考虑显示分钟数而非小时数
   - 或提供"X小时Y分钟"的格式化显示

4. ⚠️ **login_days字段含义变化**：
   - 原本：累计游戏天数（小时）
   - 现在：累计游戏分钟数
   - 建议：重命名为`play_time_minutes`更准确

## 测试建议

### 1. 数据库测试
```sql
-- 测试等级计算函数
SELECT calculate_level(0);      -- 应返回 1
SELECT calculate_level(5);      -- 应返回 1
SELECT calculate_level(6);      -- 应返回 2
SELECT calculate_level(12);     -- 应返回 2
SELECT calculate_level(13);     -- 应返回 3
SELECT calculate_level(10400);  -- 应返回 100

-- 测试升级到下一级所需分钟
SELECT get_minutes_to_next_level(1);   -- 应返回 7
SELECT get_minutes_to_next_level(10);  -- 应返回 23
SELECT get_minutes_to_next_level(100); -- 应返回 NULL (已达最高级)

-- 测试指定等级所需累计分钟
SELECT get_required_minutes_for_level(1);   -- 应返回 5
SELECT get_required_minutes_for_level(10);  -- 应返回 140
SELECT get_required_minutes_for_level(100); -- 应返回 10400
```

### 2. 前端测试
```javascript
// 测试等级计算
const manager = new UserDataManager();
console.log(manager.calculateLevel(0));      // 应返回 1
console.log(manager.calculateLevel(5));      // 应返回 1
console.log(manager.calculateLevel(6));      // 应返回 2
console.log(manager.calculateLevel(13));     // 应返回 3

// 测试下一级所需时间
console.log(manager.getMinutesToNextLevel(1));   // 应返回 7
console.log(manager.getMinutesToNextLevel(10));  // 应返回 23

// 测试等级信息获取
const levelInfo = await manager.getUserLevelInfo();
console.log(levelInfo);
// 应包含 totalMinutes, minutesToNextLevel 等新字段
```

### 3. 游戏时长追踪测试
1. 登录游戏，确保`playtime-tracker.js`正常工作
2. 等待30秒后，检查数据库`play_time`字段是否增加30秒
3. 检查`level`字段是否根据新的分钟逻辑计算
4. 刷新页面后，检查等级信息是否正确显示

## 显示建议

### 等级进度显示
```
当前等级: Lv.10
总活跃时间: 130分钟 (2小时10分钟)
距离下一级还需: 10分钟
进度: ██████████░░░░░░░░ 57%
```

### 时间格式化函数
```javascript
function formatPlaytime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);

    if (hours > 0) {
        return `${hours}小时${mins}分钟`;
    } else {
        return `${mins}分钟`;
    }
}

// 使用示例
formatPlaytime(130);  // "2小时10分钟"
formatPlaytime(45);   // "45分钟"
formatPlaytime(5);    // "5分钟"
```

## 后续优化建议

1. **数据迁移脚本**：为现有用户重新计算等级，确保平滑过渡
2. **显示优化**：增加"累计游戏时长"的详细统计（今日、本周、本月）
3. **成就系统**：基于分钟累计时长设置成就里程碑
4. **经验条动画**：在升级时播放庆祝动画
5. **排行榜优化**：按活跃时长排序，而不仅仅是等级
