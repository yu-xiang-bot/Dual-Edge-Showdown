-- 为game_stats表添加等级相关字段
ALTER TABLE public.game_stats
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS login_days FLOAT DEFAULT 0;

-- 删除旧的视图（必须在删除函数之前执行）
DROP VIEW IF EXISTS user_level_info;

-- 删除旧的触发器（必须在删除触发器函数之前执行）
DROP TRIGGER IF EXISTS trigger_update_user_level ON public.game_stats;

-- 删除旧的函数（如果存在）
DROP FUNCTION IF EXISTS calculate_level(FLOAT);
DROP FUNCTION IF EXISTS calculate_level(DOUBLE PRECISION);
DROP FUNCTION IF EXISTS calculate_level(NUMERIC);

-- 删除旧的辅助函数（如果存在）
DROP FUNCTION IF EXISTS get_hours_to_next_level(INTEGER);
DROP FUNCTION IF EXISTS get_required_hours_for_level(INTEGER);
DROP FUNCTION IF EXISTS get_minutes_to_next_level(INTEGER);
DROP FUNCTION IF EXISTS get_required_minutes_for_level(INTEGER);

-- 删除旧的触发器函数（如果存在）
DROP FUNCTION IF EXISTS update_user_level();

-- 创建等级计算函数：根据游戏总时长(分钟)计算等级
-- 等级公式：S(n) = n² + 4n
-- 其中 n 为等级，S(n) 为升级到该等级所需的累计游戏时长(分钟)
CREATE OR REPLACE FUNCTION calculate_level(play_time_minutes FLOAT)
RETURNS INTEGER AS $$
DECLARE
    current_level INTEGER := 1;
    required_minutes FLOAT;
BEGIN
    -- 计算当前等级
    -- S(n) = n² + 4n
    -- 求解 n: n² + 4n - play_time = 0
    -- 使用二分查找确定等级
    LOOP
        required_minutes := current_level * current_level + 4 * current_level;
        EXIT WHEN play_time_minutes < required_minutes;
        current_level := current_level + 1;
        -- 限制最大等级为100
        EXIT WHEN current_level > 100;
    END LOOP;

    -- 如果游戏时长不足1级要求，返回1级
    IF current_level > 1 THEN
        current_level := current_level - 1;
    END IF;

    RETURN current_level;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器函数：自动更新用户等级
CREATE OR REPLACE FUNCTION update_user_level()
RETURNS TRIGGER AS $$
BEGIN
    -- 计算等级：将游戏总时长从秒转换为分钟
    NEW.level := calculate_level(NEW.play_time / 60.0);

    -- 计算累计登录天数(基于游戏总时长，以分钟为单位)
    NEW.login_days := NEW.play_time / 60.0;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为game_stats表创建触发器
DROP TRIGGER IF EXISTS trigger_update_user_level ON public.game_stats;
CREATE TRIGGER trigger_update_user_level
    BEFORE INSERT OR UPDATE OF play_time ON public.game_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_user_level();

-- 创建辅助函数：获取升级到下一级所需的时长(分钟)
CREATE OR REPLACE FUNCTION get_minutes_to_next_level(current_level INTEGER)
RETURNS FLOAT AS $$
DECLARE
    next_level INTEGER;
    current_required FLOAT;
    next_required FLOAT;
BEGIN
    next_level := current_level + 1;
    current_required := current_level * current_level + 4 * current_level;
    next_required := next_level * next_level + 4 * next_level;

    RETURN next_required - current_required;
END;
$$ LANGUAGE plpgsql;

-- 创建辅助函数：获取升级到指定等级所需的累计时长(分钟)
CREATE OR REPLACE FUNCTION get_required_minutes_for_level(target_level INTEGER)
RETURNS FLOAT AS $$
BEGIN
    RETURN target_level * target_level + 4 * target_level;
END;
$$ LANGUAGE plpgsql;

-- 创建视图：显示用户等级信息
CREATE OR REPLACE VIEW user_level_info AS
SELECT
    gs.user_id,
    gs.play_time / 60.0 as total_minutes,
    gs.play_time / 3600.0 as total_hours,
    gs.level,
    gs.login_days,
    get_required_minutes_for_level(gs.level) as current_level_minutes,
    get_required_minutes_for_level(gs.level + 1) as next_level_minutes,
    get_minutes_to_next_level(gs.level) as minutes_to_next_level,
    p.username,
    p.avatar_url
FROM public.game_stats gs
JOIN public.profiles p ON gs.user_id = p.id;
