-- 像素森系工作台 - Supabase 数据库迁移
-- 所有表含 user_id 字段，启用 RLS 行级安全

-- ===== 建表 =====
CREATE TABLE IF NOT EXISTS todos (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  content TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT DEFAULT '09:00',
  done BOOLEAN DEFAULT FALSE,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  company TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  status TEXT DEFAULT 'potential',
  last_contact TEXT,
  notes TEXT DEFAULT '',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS reminders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT DEFAULT '09:00',
  calendar TEXT DEFAULT 'solar',
  advance_days INT DEFAULT 0,
  repeat TEXT DEFAULT 'none',
  notes TEXT DEFAULT '',
  status TEXT DEFAULT 'pending',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS inspirations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  source TEXT DEFAULT '',
  source_url TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  tags JSONB DEFAULT '[]',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS excerpts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  text TEXT NOT NULL,
  author TEXT DEFAULT '',
  category TEXT DEFAULT 'life',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS daily_notes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  content TEXT NOT NULL,
  mood TEXT DEFAULT 'good',
  photos JSONB DEFAULT '[]',
  date TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS words (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  word TEXT NOT NULL,
  phonetic TEXT DEFAULT '',
  translation TEXT DEFAULT '',
  examples JSONB DEFAULT '[]',
  learned_date TEXT NOT NULL,
  reviewed BOOLEAN DEFAULT FALSE,
  mastered BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS couple_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  content TEXT NOT NULL,
  photos JSONB DEFAULT '[]',
  mood TEXT DEFAULT 'love',
  date TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS growth_metrics (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  date TEXT NOT NULL,
  height REAL DEFAULT 0,
  weight REAL DEFAULT 0,
  note TEXT DEFAULT '',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS milestones (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT DEFAULT '',
  date TEXT NOT NULL,
  description TEXT DEFAULT '',
  icon TEXT DEFAULT 'other',
  photos JSONB DEFAULT '[]',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS growth_diaries (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  content TEXT NOT NULL,
  photos JSONB DEFAULT '[]',
  mood TEXT DEFAULT 'happy',
  date TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS memos (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT DEFAULT '',
  content TEXT DEFAULT '',
  category TEXT DEFAULT 'other',
  photos JSONB DEFAULT '[]',
  tags JSONB DEFAULT '[]',
  pinned BOOLEAN DEFAULT FALSE,
  remind_at TEXT DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  amount REAL NOT NULL,
  category TEXT DEFAULT '',
  date TEXT NOT NULL,
  note TEXT DEFAULT '',
  photo TEXT DEFAULT '',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS fixed_expense (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  amount REAL NOT NULL,
  deduct_date INT NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS shopping_items (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  price REAL DEFAULT 0,
  quantity INT DEFAULT 1,
  date TEXT NOT NULL,
  purchased BOOLEAN DEFAULT FALSE,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS wish_items (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  coins INT NOT NULL,
  redeemed BOOLEAN DEFAULT FALSE,
  date TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- ===== 推送订阅表 =====
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  keys JSONB NOT NULL,
  created_at TEXT NOT NULL
);

-- ===== 启用 RLS =====
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspirations ENABLE ROW LEVEL SECURITY;
ALTER TABLE excerpts ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE words ENABLE ROW LEVEL SECURITY;
ALTER TABLE couple_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE growth_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE growth_diaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE memos ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixed_expense ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE wish_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- ===== RLS 策略 =====
-- 用户只能读写自己的数据 (支持 auth.uid 和本地匿名用户)
CREATE POLICY "todos_select" ON todos FOR SELECT USING (user_id = auth.uid()::text OR user_id LIKE 'local_%');
CREATE POLICY "todos_insert" ON todos FOR INSERT WITH CHECK (user_id = auth.uid()::text OR user_id LIKE 'local_%');
CREATE POLICY "todos_update" ON todos FOR UPDATE USING (user_id = auth.uid()::text OR user_id LIKE 'local_%');
CREATE POLICY "todos_delete" ON todos FOR DELETE USING (user_id = auth.uid()::text OR user_id LIKE 'local_%');

CREATE POLICY "customers_all" ON customers FOR ALL USING (user_id = auth.uid()::text OR user_id LIKE 'local_%');
CREATE POLICY "reminders_all" ON reminders FOR ALL USING (user_id = auth.uid()::text OR user_id LIKE 'local_%');
CREATE POLICY "inspirations_all" ON inspirations FOR ALL USING (user_id = auth.uid()::text OR user_id LIKE 'local_%');
CREATE POLICY "excerpts_all" ON excerpts FOR ALL USING (user_id = auth.uid()::text OR user_id LIKE 'local_%');
CREATE POLICY "daily_notes_all" ON daily_notes FOR ALL USING (user_id = auth.uid()::text OR user_id LIKE 'local_%');
CREATE POLICY "words_all" ON words FOR ALL USING (user_id = auth.uid()::text OR user_id LIKE 'local_%');
CREATE POLICY "couple_logs_all" ON couple_logs FOR ALL USING (user_id = auth.uid()::text OR user_id LIKE 'local_%');
CREATE POLICY "growth_metrics_all" ON growth_metrics FOR ALL USING (user_id = auth.uid()::text OR user_id LIKE 'local_%');
CREATE POLICY "milestones_all" ON milestones FOR ALL USING (user_id = auth.uid()::text OR user_id LIKE 'local_%');
CREATE POLICY "growth_diaries_all" ON growth_diaries FOR ALL USING (user_id = auth.uid()::text OR user_id LIKE 'local_%');
CREATE POLICY "memos_all" ON memos FOR ALL USING (user_id = auth.uid()::text OR user_id LIKE 'local_%');
CREATE POLICY "expenses_all" ON expenses FOR ALL USING (user_id = auth.uid()::text OR user_id LIKE 'local_%');
CREATE POLICY "fixed_expense_all" ON fixed_expense FOR ALL USING (user_id = auth.uid()::text OR user_id LIKE 'local_%');
CREATE POLICY "shopping_items_all" ON shopping_items FOR ALL USING (user_id = auth.uid()::text OR user_id LIKE 'local_%');
CREATE POLICY "wish_items_all" ON wish_items FOR ALL USING (user_id = auth.uid()::text OR user_id LIKE 'local_%');
CREATE POLICY "push_subscriptions_all" ON push_subscriptions FOR ALL USING (user_id = auth.uid()::text OR user_id LIKE 'local_%');

-- ===== Storage Bucket =====
-- 在 Supabase Dashboard 中创建名为 'photos' 的公开 Storage Bucket
-- 或执行:
INSERT INTO storage.buckets (id, name, public) VALUES ('photos', 'photos', true) ON CONFLICT DO NOTHING;

-- Storage 策略
CREATE POLICY "photos_upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'photos');
CREATE POLICY "photos_read" ON storage.objects FOR SELECT USING (bucket_id = 'photos');
CREATE POLICY "photos_delete" ON storage.objects FOR DELETE USING (bucket_id = 'photos');
