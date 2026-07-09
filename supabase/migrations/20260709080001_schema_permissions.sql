-- Grant schema permissions for learning_buddy to anon and authenticated roles
GRANT USAGE ON SCHEMA learning_buddy TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA learning_buddy TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA learning_buddy TO anon, authenticated;

-- Default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA learning_buddy GRANT ALL ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA learning_buddy GRANT ALL ON SEQUENCES TO anon, authenticated;
