-- ============================================================
-- SUPABASE POSTGRESQL SCHEMA WITH ROW LEVEL SECURITY (RLS)
-- Role 1: 'admin'  - Posts blogs, adds images/videos, creates polls
-- Role 2: 'client' - Watches blogs, views media, votes in polls
-- ============================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Custom User Profile Table linked to Supabase Auth
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('admin', 'client')),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create Posts / Blogs Table
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    media_urls JSONB DEFAULT '[]'::jsonb,
    media_type TEXT DEFAULT 'none' CHECK (media_type IN ('none', 'image', 'video', 'mixed')),
    is_featured BOOLEAN DEFAULT FALSE,
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create Polls Table
CREATE TABLE IF NOT EXISTS public.polls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    description TEXT,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create Poll Options Table
CREATE TABLE IF NOT EXISTS public.poll_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    poll_id UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
    text TEXT NOT NULL
);

-- 6. Create Poll Votes Table
CREATE TABLE IF NOT EXISTS public.poll_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    poll_id UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
    option_id UUID NOT NULL REFERENCES public.poll_options(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_poll_user UNIQUE (poll_id, user_id)
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- --- PROFILES POLICIES ---
-- Any authenticated user can read profiles (to see authors/commenters)
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT USING (true);

-- Users can update their own profile (name, avatar), but cannot escalate role to admin
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = id)
WITH CHECK (
    auth.uid() = id AND 
    (role = (SELECT role FROM public.profiles WHERE id = auth.uid()) OR public.is_admin())
);

-- --- POSTS POLICIES ---
-- Both Clients and Admins can view/watch blogs
CREATE POLICY "Anyone can view posts" 
ON public.posts FOR SELECT USING (true);

-- ONLY Admin can INSERT (post blogs with images/videos)
CREATE POLICY "Only admins can insert posts" 
ON public.posts FOR INSERT 
WITH CHECK (public.is_admin() AND auth.uid() = author_id);

-- ONLY Admin can UPDATE posts
CREATE POLICY "Only admins can update posts" 
ON public.posts FOR UPDATE 
USING (public.is_admin() AND auth.uid() = author_id);

-- ONLY Admin can DELETE posts
CREATE POLICY "Only admins can delete posts" 
ON public.posts FOR DELETE 
USING (public.is_admin());

-- --- POLLS & POLL OPTIONS POLICIES ---
-- Both Clients and Admins can view polls and their options
CREATE POLICY "Anyone can view polls" 
ON public.polls FOR SELECT USING (true);

CREATE POLICY "Anyone can view poll options" 
ON public.poll_options FOR SELECT USING (true);

-- ONLY Admin can create polls and options
CREATE POLICY "Only admins can create polls" 
ON public.polls FOR INSERT 
WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can create poll options" 
ON public.poll_options FOR INSERT 
WITH CHECK (public.is_admin());

-- ONLY Admin can delete polls
CREATE POLICY "Only admins can delete polls" 
ON public.polls FOR DELETE 
USING (public.is_admin());

-- --- POLL VOTES POLICIES ---
-- Anyone can see aggregated votes
CREATE POLICY "Anyone can view poll votes" 
ON public.poll_votes FOR SELECT USING (true);

-- BOTH Clients and Admins can vote (1 vote per user enforced by constraint & check)
CREATE POLICY "Clients and Admins can vote" 
ON public.poll_votes FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can change their own vote" 
ON public.poll_votes FOR UPDATE 
USING (auth.uid() = user_id);

-- ============================================================
-- AUTH TRIGGER: Automatically create profile on auth.users signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    assigned_role TEXT;
BEGIN
    -- KALAGA WEALTH STRICT RULE: Kalaga Pavan Kishore is the ONLY Admin
    IF NEW.email = 'pavan@kalagawealth.com' THEN
        assigned_role := 'admin';
    ELSE
        assigned_role := 'client';
    END IF;

    INSERT INTO public.profiles (id, email, full_name, role, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', CASE WHEN NEW.email = 'pavan@kalagawealth.com' THEN 'Kalaga Pavan Kishore' ELSE split_part(NEW.email, '@', 1) END),
        assigned_role,
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', 'https://api.dicebear.com/7.x/avataaars/svg?seed=' || NEW.email)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger definition
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================================
-- STORAGE BUCKET POLICIES (blog-media)
-- ============================================================
-- Create bucket 'blog-media'
INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-media', 'blog-media', true)
ON CONFLICT (id) DO NOTHING;

-- Anyone (Clients & Admins) can read/download media
CREATE POLICY "Public media access"
ON storage.objects FOR SELECT
USING (bucket_id = 'blog-media');

-- Only Admins can upload media
CREATE POLICY "Admins can upload blog media"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'blog-media' AND public.is_admin());

-- Only Admins can delete media
CREATE POLICY "Admins can delete blog media"
ON storage.objects FOR DELETE
USING (bucket_id = 'blog-media' AND public.is_admin());
