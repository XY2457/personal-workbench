# 森系工作台 - 个人工作台 PWA

> 天地通，年月通，日事通，万事皆成!

像素森系风格的个人工作台 PWA 应用，支持添加到苹果手机主屏幕，全屏运行。

## 功能板块

1. **今日中枢** - 待办列表、五账户速览、今日开销、客户一览
2. **客户跟踪** - 客户管理（潜在/跟进中/已签约/已流失）
3. **智能提醒中心** - 生日提醒、定期联系、自定义提醒、日历视图、系统推送
4. **灵感补给** - 好书推荐、经典名句、电影推荐、知识解读、理财串珠、好词好句摘抄
5. **每日随手记&反思** - 心情记录、照片上传、每日感悟
6. **单词学习** - 每日5新词+5复习词、发音、跟读、例句
7. **时光胶囊** - 小孩成长记录（身高体重趋势、里程碑、成长日记）、育儿备忘录（5分类、置顶、标签）、手绘画板
8. **财富工坊** - 记账（可变/固定/收入）、花销分析、固定支出管理、购买清单、心愿兑换、实时金价

## 技术栈

- **前端**: Vite + React 18 + TypeScript
- **PWA**: manifest.json + Service Worker + Push API
- **数据**: Supabase PostgreSQL (可选，未配置时自动回退到 localStorage)
- **存储**: Supabase Storage (图片上传)
- **构建**: gzip 总计 ~76KB (远低于 500KB 限制)

## 本地开发

```bash
npm install
npm run dev      # 开发模式
npm run build    # 生产构建
npm run preview  # 预览构建
```

## 部署指南

### 1. GitHub 仓库

```bash
git init
git add .
git commit -m "Initial commit: 像素森系工作台 PWA"
git remote add origin https://github.com/你的用户名/personal-workbench.git
git push -u origin main
```

### 2. Vercel 部署

1. 访问 [vercel.com](https://vercel.com)，用 GitHub 账号登录
2. 点击 "New Project" → 选择 `personal-workbench` 仓库
3. Framework Preset 选择 "Vite"
4. 在 Environment Variables 中添加：
   - `VITE_SUPABASE_URL` = 你的 Supabase 项目 URL
   - `VITE_SUPABASE_ANON_KEY` = 你的 Supabase Anon Key
   - `VITE_VAPID_PUBLIC_KEY` = 你的 VAPID 公钥
5. 点击 Deploy，获得永久链接 `https://personal-workbench.vercel.app`

### 3. Supabase 配置

1. 访问 [supabase.com](https://supabase.com) 创建项目
2. 在 SQL Editor 中执行以下建表语句：

```sql
-- 所有表均含 user_id 字段，启用 RLS 行级安全
CREATE TABLE todos (id TEXT PRIMARY KEY, user_id TEXT, content TEXT, date TEXT, time TEXT, done BOOLEAN, created_at TEXT);
CREATE TABLE customers (id TEXT PRIMARY KEY, user_id TEXT, name TEXT, company TEXT, phone TEXT, status TEXT, last_contact TEXT, notes TEXT, created_at TEXT);
CREATE TABLE reminders (id TEXT PRIMARY KEY, user_id TEXT, type TEXT, title TEXT, date TEXT, time TEXT, calendar TEXT, advance_days INT, repeat TEXT, notes TEXT, status TEXT, created_at TEXT);
CREATE TABLE inspirations (id TEXT PRIMARY KEY, user_id TEXT, category TEXT, title TEXT, content TEXT, source TEXT, source_url TEXT, image_url TEXT, tags JSONB, created_at TEXT);
CREATE TABLE excerpts (id TEXT PRIMARY KEY, user_id TEXT, text TEXT, author TEXT, category TEXT, created_at TEXT);
CREATE TABLE daily_notes (id TEXT PRIMARY KEY, user_id TEXT, content TEXT, mood TEXT, photos JSONB, date TEXT, created_at TEXT);
CREATE TABLE words (id TEXT PRIMARY KEY, user_id TEXT, word TEXT, phonetic TEXT, translation TEXT, examples JSONB, learned_date TEXT, reviewed BOOLEAN, mastered BOOLEAN);
CREATE TABLE couple_logs (id TEXT PRIMARY KEY, user_id TEXT, content TEXT, photos JSONB, mood TEXT, date TEXT, created_at TEXT);
CREATE TABLE memos (id TEXT PRIMARY KEY, user_id TEXT, title TEXT, content TEXT, category TEXT, photos JSONB, tags JSONB, pinned BOOLEAN, remind_at TEXT, created_at TEXT, updated_at TEXT);
CREATE TABLE expenses (id TEXT PRIMARY KEY, user_id TEXT, type TEXT, amount REAL, category TEXT, date TEXT, note TEXT, photo TEXT, created_at TEXT);
CREATE TABLE fixed_expenses (id TEXT PRIMARY KEY, user_id TEXT, name TEXT, amount REAL, deduct_date INT, active BOOLEAN, created_at TEXT);
CREATE TABLE shopping_items (id TEXT PRIMARY KEY, user_id TEXT, name TEXT, price REAL, quantity INT, date TEXT, purchased BOOLEAN, created_at TEXT);
CREATE TABLE wish_items (id TEXT PRIMARY KEY, user_id TEXT, name TEXT, coins INT, redeemed BOOLEAN, date TEXT, created_at TEXT);

-- 启用 RLS
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspirations ENABLE ROW LEVEL SECURITY;
ALTER TABLE excerpts ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE words ENABLE ROW LEVEL SECURITY;
ALTER TABLE couple_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE memos ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixed_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE wish_items ENABLE ROW LEVEL SECURITY;

-- RLS 策略 (用户只能读写自己的数据)
CREATE POLICY "用户管理自己的数据" ON todos FOR ALL USING (auth.uid()::text = user_id OR user_id LIKE 'local_%');
-- 对每张表重复以上策略...
```

3. 创建 Storage Bucket: `photos` (公开访问)
4. 获取 Project URL 和 Anon Key，填入 Vercel 环境变量

### 4. VAPID 推送密钥

```bash
# 安装 web-push
npm install -g web-push

# 生成 VAPID 密钥对
web-push generate-vapid-keys

# 输出示例:
# Public Key:  BNbx...
# Private Key:  xxx...
```

将 Public Key 填入 `VITE_VAPID_PUBLIC_KEY` 环境变量。

### 5. 苹果手机添加到主屏幕

1. 用 Safari 打开 Vercel 部署链接
2. 点击底部分享按钮 → "添加到主屏幕"
3. 桌面会出现森系工作台图标，点击全屏运行

## 五账户体系

| 账户 | 用途 | 规则 |
|------|------|------|
| 日常账户 | 可变支出(餐饮/交通/日用品/娱乐) | 月额度=当月天数×50元，月初重置 |
| 固定支出账户 | 预设项目自动扣减 | 不占日常额度 |
| 收入账户 | 记录所有收入 | 月收入趋势+结构分析 |
| 心愿账户 | 金币兑换心愿 | 1:1兑换，10/20/50/100四档 |
| 金币账户 | 学习/完成任务获得 | 用于心愿兑换 |

## 项目结构

```
personal-workbench/
├── public/
│   ├── icons/          # PWA 图标
│   ├── manifest.json   # PWA 配置
│   └── sw.js           # Service Worker
├── src/
│   ├── components/     # 通用组件
│   │   ├── Sidebar.tsx
│   │   ├── PixelIcon.tsx
│   │   ├── PhotoUpload.tsx
│   │   ├── DrawingBoard.tsx
│   │   ├── Charts.tsx
│   │   ├── Modal.tsx
│   │   └── LoadingScreen.tsx
│   ├── pages/          # 八大功能板块
│   │   ├── TodayHub.tsx
│   │   ├── CustomerTracking.tsx
│   │   ├── ReminderCenter.tsx
│   │   ├── Inspiration.tsx
│   │   ├── DailyNotes.tsx
│   │   ├── WordLearning.tsx
│   │   ├── TimeCapsule.tsx
│   │   └── WealthWorkshop.tsx
│   ├── lib/            # 工具库
│   │   ├── db.ts
│   │   ├── supabase.ts
│   │   ├── push.ts
│   │   ├── imageCompress.ts
│   │   ├── export.ts
│   │   └── goldPrice.ts
│   ├── styles/         # 样式
│   │   ├── variables.css
│   │   └── global.css
│   ├── types/          # 类型定义
│   └── App.tsx
├── package.json
├── vite.config.ts
├── tsconfig.json
└── vercel.json
```
