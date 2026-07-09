-- Study plans for Learning Buddy
CREATE TABLE IF NOT EXISTS learning_buddy.study_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subject TEXT NOT NULL,
  title TEXT NOT NULL,
  plan_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  progress JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE learning_buddy.study_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_manage_own_plans" ON learning_buddy.study_plans
  FOR ALL USING (auth.uid() = user_id);
