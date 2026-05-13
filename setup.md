# Le Mem - Setup Guide

This guide will walk you through setting up the Le Mem personal memory operating system step by step.

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Git
- A code editor (VS Code recommended)

## Step 1: Install Dependencies

Run this command in the project root directory:

```bash
npm install
```

**File location**: Run this at the root level (d:\Code\le-mem\)

---

## Step 2: Set Up Environment Variables

You need to create a `.env.local` file in the root directory with all your API keys and configuration.

**File to create**: `d:\Code\le-mem\.env.local`

Copy the template from `d:\Code\le-mem\.env.local.example` and fill in your keys as you gather them in the following steps.

---

## Step 3: Set Up PostgreSQL Database (via Supabase)

Supabase provides a managed PostgreSQL database with authentication and real-time capabilities.

### 3.1 Create a Supabase Account

1. Go to [supabase.com](https://supabase.com)
2. Click "Sign Up" and create an account (you can use Google, GitHub, or email)
3. Create a new organization if prompted

### 3.2 Create a New Project

1. Click "New Project"
2. Fill in:
   - **Project name**: `le-mem`
   - **Database password**: Create a strong password (save this!)
   - **Region**: Choose closest to your location
3. Wait for the project to initialize (2-3 minutes)

### 3.3 Get Your Database Credentials

1. Go to **Settings** → **Database** (in the sidebar)
2. Find the connection string section and copy:
   - **Connection string** (PostgreSQL URI)
   - **Direct connection string** (direct connection)

### 3.4 Add to `.env.local`

In your `.env.local` file, update:

```
DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres?schema=public"
DIRECT_URL="postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres?schema=public"
```

Replace `[PASSWORD]`, `[HOST]`, and `[PORT]` with values from Supabase connection string.

### 3.5 Get Supabase API Keys

1. In Supabase dashboard, go to **Settings** → **API**
2. Under "Project API keys", find:
   - **anon public** - Copy this
   - **service_role secret** - Copy this

### 3.6 Add to `.env.local`

```
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[PASTE anon public KEY HERE]"
SUPABASE_SERVICE_ROLE_KEY="[PASTE service_role secret KEY HERE]"
```

---

## Step 4: Set Up OpenAI API (for AI Chat & Embeddings)

### 4.1 Create OpenAI Account

1. Go to [platform.openai.com](https://platform.openai.com)
2. Sign up or log in to your account
3. Go to **Billing** and add a payment method

### 4.2 Create API Key

1. Click **API keys** in the left sidebar
2. Click **Create new secret key**
3. Copy the key immediately (you won't see it again)

### 4.3 Add to `.env.local`

```
OPENAI_API_KEY="sk-[PASTE YOUR KEY HERE]"
```

The app uses:
- `gpt-4o` model for chat responses
- `text-embedding-3-small` model for embedding memories

---

## Step 5: Set Up Google OAuth (for Authentication)

This allows users to sign in with their Google account.

### 5.1 Create Google Cloud Project

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Click **Create Project**
3. Name it `le-mem` and click **Create**
4. Wait for it to initialize

### 5.2 Enable OAuth Consent Screen

1. In the left sidebar, go to **APIs & Services** → **OAuth consent screen**
2. Select **External** and click **Create**
3. Fill in:
   - **App name**: `Le Mem`
   - **User support email**: Your email
   - **Developer contact email**: Your email
4. Click **Save and Continue**
5. Skip optional scopes and click **Save and Continue**
6. Click **Back to Dashboard**

### 5.3 Create OAuth Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Select **Web application**
4. Under **Authorized JavaScript origins**, add:
   - `http://localhost:3000`
   - `http://127.0.0.1:3000`
5. Under **Authorized redirect URIs**, add:
   - `http://localhost:3000/api/auth/callback/google`
6. Click **Create**
7. Copy the **Client ID** and **Client Secret**

### 5.4 Add to `.env.local`

```
GOOGLE_CLIENT_ID="[PASTE CLIENT ID HERE]"
GOOGLE_CLIENT_SECRET="[PASTE CLIENT SECRET HERE]"
```

---

## Step 6: Set Up NextAuth Secrets

### 6.1 Generate Random Secrets

These are used to encrypt session data. Generate two random strings using:

```bash
openssl rand -base64 32
```

Or use an online generator like [1Password Generator](https://1password.com/password-generator/)

### 6.2 Add to `.env.local`

```
NEXTAUTH_SECRET="[PASTE RANDOM STRING 1 HERE]"
AUTH_SECRET="[PASTE RANDOM STRING 2 HERE]"
NEXTAUTH_URL="http://localhost:3000"
```

---

## Step 7: Set Up Uploadthing (for File Uploads)

Uploadthing handles file uploads to cloud storage.

### 7.1 Create Uploadthing Account

1. Go to [uploadthing.com](https://uploadthing.com)
2. Click **Sign Up**
3. Use your GitHub account or email to sign up

### 7.2 Create App

1. Click **Create New App**
2. Name it `le-mem`
3. Click **Create**

### 7.3 Get API Keys

1. In your app dashboard, go to **Settings** (gear icon)
2. Copy:
   - **API Key** → This is your `UPLOADTHING_SECRET`
   - **App ID** → This is your `UPLOADTHING_APP_ID`

### 7.4 Add to `.env.local`

```
UPLOADTHING_SECRET="[PASTE API KEY HERE]"
UPLOADTHING_APP_ID="[PASTE APP ID HERE]"
```

---

## Step 8: Initialize Database Schema

Now that you have database credentials, set up the database tables with Prisma.

### 8.1 Run Prisma Migrations

```bash
npx prisma migrate dev --name init
```

This will:
- Create all tables defined in `d:\Code\le-mem\prisma\schema.prisma`
- Set up User, Memory, and Entity tables
- Create necessary indexes

**File affected**: `d:\Code\le-mem\prisma\schema.prisma`

### 8.2 Verify Setup

Check your Supabase dashboard under **Table Editor** - you should see:
- `User` table
- `Memory` table
- `Entity` table
- `MemoryEntity` table

---

## Step 9: Verify Your `.env.local` File

Your final `.env.local` file should look like this:

```
# Database (from Supabase)
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@your-project.supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:YOUR_PASSWORD@your-project.supabase.co:5432/postgres"

# Supabase (from API settings)
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbG..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbG..."

# OpenAI (from API keys)
OPENAI_API_KEY="sk-proj-..."

# NextAuth (secrets you generated)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="random-string-1"
AUTH_SECRET="random-string-2"

# Google OAuth (from Google Cloud Console)
GOOGLE_CLIENT_ID="123456..."
GOOGLE_CLIENT_SECRET="GOCSPX-..."

# Uploadthing (from uploadthing dashboard)
UPLOADTHING_SECRET="sk_live_..."
UPLOADTHING_APP_ID="your-app-id"
```

⚠️ **IMPORTANT**: Never commit `.env.local` to Git! It's in `.gitignore` by default.

---

## Step 10: Run the Development Server

Everything should now be configured!

```bash
npm run dev
```

This starts the development server on `http://localhost:3000`

**File locations affected**:
- Server logs appear in your terminal
- Hot reload watches: `d:\Code\le-mem\src\` and `d:\Code\le-mem\prisma\`

---

## Step 11: Test the Setup

1. Open `http://localhost:3000` in your browser
2. You should see the login page
3. Click "Login with Google"
4. Use your Google account to sign in
5. You should be redirected to the main dashboard

---

## Next Steps

Once everything is working:

1. **Build for Production**: `npm run build`
2. **Deploy**: Use Vercel, Railway, or your hosting service
3. **Update Google OAuth**: Add production URLs to Google Cloud Console
4. **Update `.env` in Production**: Add production database and API keys

---

## Troubleshooting

### Database Connection Error

- Verify `DATABASE_URL` format matches Supabase exactly
- Check if Supabase project is active
- Confirm network allows PostgreSQL connections

### OpenAI Error "Could not parse OpenAI response"

- Verify `OPENAI_API_KEY` is correct
- Check OpenAI account has credits
- Ensure key has access to `gpt-4o` model

### Google Login Not Working

- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct
- Check redirect URI matches exactly: `http://localhost:3000/api/auth/callback/google`
- Clear browser cookies and try again

### Prisma Migration Errors

- Run `npx prisma db push` to sync schema with database
- Check database URL connects successfully
- Drop and recreate the database if necessary

---

## File Reference Summary

| What | File | What to do |
|------|------|-----------|
| Environment Variables | `.env.local` | Fill with all API keys |
| Database Schema | `prisma/schema.prisma` | Already configured, run `npx prisma migrate dev` |
| NextAuth Config | `src/auth.ts` | Already configured with Google provider |
| Chat API | `src/app/api/chat/route.ts` | Uses OpenAI API key |
| Embeddings | `src/lib/ai/embed.ts` | Uses OpenAI API key |
| Build Config | `next.config.ts` | Already configured |
| Dependencies | `package.json` | Run `npm install` |

---

## Support

If you encounter issues:
1. Check all environment variables are set correctly
2. Verify API keys have necessary permissions
3. Check browser console for client-side errors
4. Check terminal for server-side errors
5. Ensure Node.js version is 18+
