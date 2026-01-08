-- 修复用户注册触发器，处理用户名唯一性冲突
-- 这个脚本可以安全地在现有数据库上运行

-- 1. 删除旧的触发器和函数
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. 创建改进的触发器函数，处理用户名冲突
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  username TEXT;
  base_username TEXT;
  counter INTEGER := 1;
BEGIN
  -- 从用户元数据获取用户名
  username := NEW.raw_user_meta_data->>'username';

  -- 如果没有用户名，生成一个默认用户名
  IF username IS NULL OR username = '' THEN
    username := 'user_' || substr(NEW.id::text, 1, 8);
  END IF;

  -- 检查用户名是否已存在，如果存在则添加数字后缀
  base_username := username;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = username) LOOP
    username := base_username || '_' || counter;
    counter := counter + 1;
  END LOOP;

  -- 创建用户配置文件
  INSERT INTO public.profiles (id, username)
  VALUES (
    NEW.id,
    username
  );

  -- 创建用户游戏统计记录
  INSERT INTO public.game_stats (user_id)
  VALUES (
    NEW.id
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- 记录错误但不阻止用户注册
    RAISE WARNING '创建用户资料时出错: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. 重新创建触发器
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. 确保用户名列有唯一索引
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique_idx
  ON public.profiles(username)
  WHERE username IS NOT NULL;

-- 5. 为 profiles 表的 username 列添加唯一约束（如果不存在）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_username_key'
    AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_username_key UNIQUE (username);
  END IF;
END $$;

-- 6. 创建辅助函数：检查用户名是否可用
CREATE OR REPLACE FUNCTION public.is_username_available(username_param TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE username = username_param
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. 为函数创建安全策略
GRANT EXECUTE ON FUNCTION public.is_username_available(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_username_available(TEXT) TO anon;

-- 完成
-- 运行后，用户注册时会自动处理用户名冲突
-- 如果用户名已被使用，会自动添加数字后缀（例如：user_1, user_2）
