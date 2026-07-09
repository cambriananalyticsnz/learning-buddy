-- Learning Buddy: Initial schema
CREATE SCHEMA IF NOT EXISTS learning_buddy;

-- Profiles (extends Supabase auth.users)
CREATE TABLE learning_buddy.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT DEFAULT 'Student',
  xp INTEGER DEFAULT 0,
  coins INTEGER DEFAULT 100,
  streak INTEGER DEFAULT 0,
  last_active_date DATE,
  title TEXT DEFAULT 'Trainee',
  icon_id TEXT DEFAULT 'samoyed-basic',
  total_coins_spent INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversations
CREATE TABLE learning_buddy.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subject TEXT NOT NULL,
  title TEXT DEFAULT 'New conversation',
  messages JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mistake log (L2 memory)
CREATE TABLE learning_buddy.mistake_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subject TEXT NOT NULL,
  topic_path TEXT[] NOT NULL,
  mistake_summary TEXT NOT NULL,
  frequency INTEGER DEFAULT 1,
  weight DECIMAL DEFAULT 1.0,
  last_occurred_at TIMESTAMPTZ DEFAULT NOW(),
  is_root_cause BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lucky Sprint history
CREATE TABLE learning_buddy.lucky_sprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  multiplier INTEGER NOT NULL,
  questions_completed INTEGER DEFAULT 0,
  coins_earned INTEGER DEFAULT 0,
  trigger_type TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shop catalog
CREATE TABLE learning_buddy.shop_items (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('title', 'icon')),
  name TEXT NOT NULL,
  description TEXT,
  price_coins INTEGER NOT NULL,
  required_title_level TEXT,
  rarity TEXT DEFAULT 'common' CHECK (rarity IN ('common', 'uncommon', 'rare', 'legendary'))
);

-- User-owned items
CREATE TABLE learning_buddy.user_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  item_id TEXT REFERENCES learning_buddy.shop_items(id) ON DELETE CASCADE,
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, item_id)
);

-- Seed shop items
INSERT INTO learning_buddy.shop_items (id, type, name, description, price_coins, required_title_level, rarity) VALUES
  ('title-trainee', 'title', 'Trainee', 'Every journey begins with a single step', 0, NULL, 'common'),
  ('title-rookie', 'title', 'Rookie', 'Finding your rhythm', 200, 'Rookie', 'common'),
  ('title-idol', 'title', 'Idol', 'Center of attention', 400, 'Idol', 'uncommon'),
  ('title-ace', 'title', 'Ace', 'Top of your game', 600, 'Ace', 'uncommon'),
  ('title-center', 'title', 'Center', 'The one they all look to', 900, 'Center', 'rare'),
  ('title-legend', 'title', 'Legend', 'A story worth telling', 1200, 'Legend', 'legendary'),
  ('icon-samoyed-basic', 'icon', 'Basic Samoyed', 'The trusty sidekick', 0, NULL, 'common'),
  ('icon-star', 'icon', 'Shining Star', 'You are a star', 200, 'Rookie', 'common'),
  ('icon-samoyed-silver', 'icon', 'Silver Samoyed', 'A shiny upgrade', 200, 'Rookie', 'common'),
  ('icon-crown', 'icon', 'Royal Crown', 'Fit for a center', 400, 'Idol', 'uncommon'),
  ('icon-samoyed-gold', 'icon', 'Golden Samoyed', 'Pure gold', 400, 'Idol', 'uncommon'),
  ('icon-diamond', 'icon', 'Diamond', 'Pressure makes diamonds', 600, 'Ace', 'uncommon'),
  ('icon-samoyed-sunglasses', 'icon', 'Cool Samoyed', 'Too cool for school', 600, 'Ace', 'uncommon'),
  ('icon-moon', 'icon', 'Golden Moon', 'Shining through the night', 900, 'Center', 'rare'),
  ('icon-samoyed-crown', 'icon', 'Royal Samoyed', 'Bow before the fluff', 900, 'Center', 'rare'),
  ('icon-sparkle', 'icon', 'Cosmic Sparkle', 'A universe of knowledge', 1200, 'Legend', 'legendary'),
  ('icon-samoyed-legend', 'icon', 'Legendary Samoyed', 'The fluffiest legend', 1200, 'Legend', 'legendary');

-- Row Level Security
ALTER TABLE learning_buddy.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_buddy.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_buddy.mistake_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_buddy.lucky_sprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_buddy.user_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_profile" ON learning_buddy.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_update_own_profile" ON learning_buddy.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "users_manage_own_conversations" ON learning_buddy.conversations FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "users_read_own_mistakes" ON learning_buddy.mistake_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_insert_own_mistakes" ON learning_buddy.mistake_log FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_manage_own_sprints" ON learning_buddy.lucky_sprints FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_manage_own_items" ON learning_buddy.user_items FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_read_shop" ON learning_buddy.shop_items FOR SELECT USING (auth.role() = 'authenticated');
