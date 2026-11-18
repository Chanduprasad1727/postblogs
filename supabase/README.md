# Supabase Setup Guide for PostBlogs

This directory contains the complete PostgreSQL database schema, triggers, and Row Level Security (RLS) policies for the two user roles:
1. **Admin**: Can post blogs, upload media (images/videos), create polls, and delete content.
2. **Client**: Can read/watch blogs, view media, and cast votes in community polls.

---

## Step 1: Create a Supabase Project
1. Log in to [https://supabase.com](https://supabase.com).
2. Click **New Project**, choose a name (e.g. `postblogs`), and set a database password.

---

## Step 2: Run the Database Migration
1. In your Supabase Dashboard, navigate to the **SQL Editor** in the left sidebar.
2. Open `schema.sql` from this folder, copy its contents, and paste it into the SQL Editor.
3. Click **Run**.
   - This creates the `profiles`, `posts`, `polls`, `poll_options`, and `poll_votes` tables.
   - It sets up automatic user profile creation upon signup.
   - It configures Row Level Security (RLS) policies enforcing admin vs client permissions.
   - It creates the `blog-media` storage bucket with upload restrictions for admins only.

---

## Step 3: Get your API Keys
1. In the Supabase Dashboard, go to **Project Settings** > **API**.
2. Copy:
   - **Project URL**
   - **anon / public key**
   - **service_role key** (keep secret)

---

## Step 4: Configure Environment Files
In your project:
1. In `frontend/.env`:
   ```env
   VITE_SUPABASE_URL=https://your-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
2. In `backend/.env`:
   ```env
   SUPABASE_URL=https://your-id.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```
