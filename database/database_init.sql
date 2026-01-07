-- 创建用户配置文件表
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  updated_at TIMESTAMP WITH TIME ZONE,
  username TEXT UNIQUE,
  avatar_url TEXT,
  website TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT (now() AT TIME ZONE 'utc') NOT NULL
);

-- 创建游戏数据表
CREATE TABLE IF NOT EXISTS public.game_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT (now() AT TIME ZONE 'utc') NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT (now() AT TIME ZONE 'utc') NOT NULL
);

-- 创建游戏分数表
CREATE TABLE IF NOT EXISTS public.game_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles NOT NULL,
  score INTEGER NOT NULL,
  level INTEGER NOT NULL,
  character TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT (now() AT TIME ZONE 'utc') NOT NULL
);

-- 创建游戏统计表
CREATE TABLE IF NOT EXISTS public.game_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles NOT NULL,
  total_games INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  play_time INTEGER DEFAULT 0, -- 游戏总时长（秒）
  highest_score INTEGER DEFAULT 0,
  character_played JSONB DEFAULT '{}', -- 每个角色游戏次数 {"mage": 10, "mech": 5}
  level_reached JSONB DEFAULT '{}', -- 每个关卡最高分 {"level1": 100, "level2": 150}
  created_at TIMESTAMP WITH TIME ZONE DEFAULT (now() AT TIME ZONE 'utc') NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT (now() AT TIME ZONE 'utc') NOT NULL
);

-- 创建联机游戏房间表
CREATE TABLE IF NOT EXISTS public.game_rooms (
  id TEXT PRIMARY KEY, -- 房间ID，6位随机字符串
  host_id UUID REFERENCES auth.users NOT NULL, -- 房主ID
  host_email TEXT, -- 房主邮箱
  guest_id UUID REFERENCES auth.users, -- 加入的玩家ID，可为空
  status TEXT DEFAULT 'waiting' NOT NULL, -- 房间状态: waiting(等待), ready(已准备), playing(游戏中), cancelled(已取消), left(已离开)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT (now() AT TIME ZONE 'utc') NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE, -- 游戏开始时间
  ended_at TIMESTAMP WITH TIME ZONE -- 游戏结束时间
);

-- 为房间表创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS game_rooms_status_idx ON public.game_rooms(status);
CREATE INDEX IF NOT EXISTS game_rooms_created_at_idx ON public.game_rooms(created_at DESC);

-- 设置行级安全策略
-- 1. 用户只能访问自己的配置文件
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. 用户只能访问自己的游戏数据
ALTER TABLE public.game_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own game data" ON public.game_data FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own game data" ON public.game_data FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own game data" ON public.game_data FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. 游戏分数表：用户可以查看所有分数，但只能插入自己的分数
ALTER TABLE public.game_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all scores" ON public.game_scores FOR SELECT USING (true);
CREATE POLICY "Users can insert own score" ON public.game_scores FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. 游戏统计表：用户只能访问自己的统计数据
ALTER TABLE public.game_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own stats" ON public.game_stats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own stats" ON public.game_stats FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own stats" ON public.game_stats FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. 联机游戏房间表：允许所有用户查看房间，房主可管理自己的房间
ALTER TABLE public.game_rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all rooms" ON public.game_rooms FOR SELECT USING (true);
CREATE POLICY "Users can create rooms" ON public.game_rooms FOR INSERT WITH CHECK (auth.uid() = host_id);
CREATE POLICY "Hosts can update own rooms" ON public.game_rooms FOR UPDATE USING (auth.uid() = host_id);
CREATE POLICY "Users can join rooms" ON public.game_rooms FOR UPDATE USING (
  auth.uid() = guest_id OR
  (auth.uid() = host_id AND status = 'waiting')
);
CREATE POLICY "Hosts can delete own rooms" ON public.game_rooms FOR DELETE USING (auth.uid() = host_id);

-- 创建新用户注册时的触发器，自动创建profile和stats记录
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- 创建用户配置文件
  INSERT INTO public.profiles (id, username)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username'
  );
  
  -- 创建用户游戏统计记录
  INSERT INTO public.game_stats (user_id)
  VALUES (
    NEW.id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建触发器
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 创建用于自动更新 updated_at 字段的函数
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = (now() AT TIME ZONE 'utc');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为需要的表创建 updated_at 触发器
CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_game_data_updated_at BEFORE UPDATE ON public.game_data
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_game_stats_updated_at BEFORE UPDATE ON public.game_stats
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 创建索引以提高查询性能
CREATE INDEX game_data_user_id_idx ON public.game_data(user_id);
CREATE INDEX game_scores_user_id_idx ON public.game_scores(user_id);
CREATE INDEX game_scores_score_idx ON public.game_scores(score DESC);
CREATE INDEX game_stats_user_id_idx ON public.game_stats(user_id);
