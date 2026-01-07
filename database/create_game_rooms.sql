-- 快速创建联机游戏房间表（用于测试联机功能）
-- 在 Supabase SQL 编辑器中运行此脚本

-- 1. 创建联机游戏房间表
CREATE TABLE IF NOT EXISTS public.game_rooms (
  id TEXT PRIMARY KEY,
  host_id UUID REFERENCES auth.users NOT NULL,
  host_email TEXT,
  guest_id UUID REFERENCES auth.users,
  status TEXT DEFAULT 'waiting' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT (now() AT TIME ZONE 'utc') NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE
);

-- 2. 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS game_rooms_status_idx ON public.game_rooms(status);
CREATE INDEX IF NOT EXISTS game_rooms_created_at_idx ON public.game_rooms(created_at DESC);

-- 3. 启用行级安全策略
ALTER TABLE public.game_rooms ENABLE ROW LEVEL SECURITY;

-- 4. 创建访问策略
-- 所有用户可以查看所有房间
CREATE POLICY "Users can view all rooms" ON public.game_rooms 
FOR SELECT USING (true);

-- 用户可以创建房间（作为房主）
CREATE POLICY "Users can create rooms" ON public.game_rooms 
FOR INSERT WITH CHECK (auth.uid() = host_id);

-- 房主可以更新自己创建的房间
CREATE POLICY "Hosts can update own rooms" ON public.game_rooms 
FOR UPDATE USING (auth.uid() = host_id);

-- 访客可以加入房间
CREATE POLICY "Users can join rooms" ON public.game_rooms 
FOR UPDATE USING (
  auth.uid() = guest_id OR
  (auth.uid() = host_id AND status = 'waiting')
);

-- 房主可以删除自己的房间
CREATE POLICY "Hosts can delete own rooms" ON public.game_rooms 
FOR DELETE USING (auth.uid() = host_id);

-- 完成提示
-- 如果执行成功，您应该看到 "Success. No rows returned"
-- 现在刷新游戏页面，联机功能应该可以正常工作
