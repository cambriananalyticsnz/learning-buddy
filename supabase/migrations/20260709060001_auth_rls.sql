-- Auth-related RLS policies for Learning Buddy

-- Allow profile creation on sign-up
CREATE POLICY "users_insert_own_profile" ON learning_buddy.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow conversations to be created from client
-- (ALL policy already exists from init migration covering INSERT/UPDATE/SELECT)

-- Allow user_items to be created from client (on sign-up + purchases)
-- (ALL policy already exists from init migration covering INSERT/SELECT)

-- Note: Existing init migration already has these policies:
-- - conversations: users_manage_own_conversations (ALL)
-- - user_items: users_manage_own_items (ALL)
-- - lucky_sprints: users_manage_own_sprints (ALL)
-- - profiles: users_read_own_profile (SELECT), users_update_own_profile (UPDATE)
