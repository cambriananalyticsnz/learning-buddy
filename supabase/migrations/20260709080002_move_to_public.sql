-- Move all tables from learning_buddy schema to public schema
-- This is simpler for single-user app — avoids PostgREST schema config

-- Step 1: Drop policies tied to learning_buddy schema BEFORE moving tables
-- (policies reference the schema-qualified table in their internal representation)
DROP POLICY IF EXISTS "users_read_own_profile" ON learning_buddy.profiles;
DROP POLICY IF EXISTS "users_update_own_profile" ON learning_buddy.profiles;
DROP POLICY IF EXISTS "users_insert_own_profile" ON learning_buddy.profiles;
DROP POLICY IF EXISTS "users_manage_own_conversations" ON learning_buddy.conversations;
DROP POLICY IF EXISTS "users_read_own_mistakes" ON learning_buddy.mistake_log;
DROP POLICY IF EXISTS "users_insert_own_mistakes" ON learning_buddy.mistake_log;
DROP POLICY IF EXISTS "users_manage_own_sprints" ON learning_buddy.lucky_sprints;
DROP POLICY IF EXISTS "users_manage_own_items" ON learning_buddy.user_items;
DROP POLICY IF EXISTS "users_read_shop" ON learning_buddy.shop_items;
DROP POLICY IF EXISTS "users_manage_own_plans" ON learning_buddy.study_plans;

-- Step 2: Move tables to public schema
ALTER TABLE learning_buddy.profiles SET SCHEMA public;
ALTER TABLE learning_buddy.conversations SET SCHEMA public;
ALTER TABLE learning_buddy.mistake_log SET SCHEMA public;
ALTER TABLE learning_buddy.lucky_sprints SET SCHEMA public;
ALTER TABLE learning_buddy.shop_items SET SCHEMA public;
ALTER TABLE learning_buddy.user_items SET SCHEMA public;
ALTER TABLE learning_buddy.study_plans SET SCHEMA public;

-- Step 3: Drop the now-empty schema
DROP SCHEMA IF EXISTS learning_buddy CASCADE;

-- Step 4: Recreate RLS policies (now in public schema)
CREATE POLICY "users_read_own_profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_update_own_profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "users_insert_own_profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "users_manage_own_conversations" ON conversations FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "users_read_own_mistakes" ON mistake_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_insert_own_mistakes" ON mistake_log FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_manage_own_sprints" ON lucky_sprints FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "users_manage_own_items" ON user_items FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_read_shop" ON shop_items FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "users_manage_own_plans" ON study_plans FOR ALL USING (auth.uid() = user_id);

-- Step 5: Grant permissions on public schema tables
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
