-- Database initialization script for Couple Compass
-- This script sets up the basic database structure

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable PGVector extension for AI features
CREATE EXTENSION IF NOT EXISTS vector;

-- Create enum types
CREATE TYPE user_auth_provider AS ENUM ('email', 'google', 'apple');
CREATE TYPE couple_status AS ENUM ('active', 'paused', 'ended');
CREATE TYPE couple_member_role AS ENUM ('partner', 'admin');
CREATE TYPE quiz_type AS ENUM ('love_language', 'communication_style', 'conflict_resolution');
CREATE TYPE quiz_item_kind AS ENUM ('multiple_choice', 'scale', 'text');
CREATE TYPE journal_visibility AS ENUM ('private', 'shared');
CREATE TYPE tip_status AS ENUM ('suggested', 'viewed', 'dismissed', 'helpful');
CREATE TYPE activity_type AS ENUM ('mood_checkin', 'journal_entry', 'quiz_completed', 'tip_viewed', 'milestone_reached');

-- Create indexes for better performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mood_checkins_user_created ON mood_checkins(user_id, created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_journals_user_created ON journals(user_id, created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quiz_results_user ON quiz_results(user_id);

-- Insert default quiz data
INSERT INTO quizzes (id, slug, title, description, type, is_active, order_index) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'love-language', 'Love Language Assessment', 'Discover your primary love language to better understand how you give and receive love', 'love_language', true, 1),
('550e8400-e29b-41d4-a716-446655440002', 'communication-style', 'Communication Style Quiz', 'Understand your communication patterns and preferences in relationships', 'communication_style', true, 2);

-- Insert sample quiz items for love language quiz
INSERT INTO quiz_items (id, quiz_id, prompt, kind, options_json, order_index) VALUES
('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'What makes you feel most loved?', 'multiple_choice', '["Hearing \"I love you\" and other affirming words", "Receiving unexpected gifts", "Spending quality time together", "Physical touch and affection", "Having your partner help with tasks"]', 1),
('550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001', 'When you want to show love, you tend to:', 'multiple_choice', '["Say encouraging and supportive things", "Give thoughtful gifts or surprises", "Plan special activities together", "Show physical affection", "Do helpful things without being asked"]', 2);

-- Insert sample tips
INSERT INTO tips (id, title, content, category, tags, priority_score) VALUES
('550e8400-e29b-41d4-a716-446655440010', 'Daily Check-ins', 'Take 10 minutes each evening to share how your day went. This simple practice builds intimacy and keeps you connected.', 'communication', '["daily_habits", "communication", "connection"]', 85),
('550e8400-e29b-41d4-a716-446655440011', 'Express Gratitude', 'Tell your partner one thing you appreciate about them every day. Gratitude strengthens your bond and creates positivity.', 'appreciation', '["gratitude", "positivity", "appreciation"]', 90),
('550e8400-e29b-41d4-a716-446655440012', 'Listen Actively', 'When your partner speaks, put down your phone and give them your full attention. Active listening shows you value their thoughts.', 'communication', '["listening", "attention", "respect"]', 88);

-- Create function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updating updated_at columns (will be applied when tables are created)
-- These triggers will be created after the tables are created by SQLAlchemy
