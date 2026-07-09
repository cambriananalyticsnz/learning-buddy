-- Add INSERT policy for profiles (needed for sign-up)
CREATE POLICY "users_insert_own_profile" ON learning_buddy.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
