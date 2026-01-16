# Team Setup Guide - Tender Management System

This guide will help your team members set up and run the project on their local machines with shared Supabase database access.

## Prerequisites

- Node.js 18+ installed
- Git installed
- Code editor (VS Code recommended)

## Step 1: Clone the Repository

```bash
git clone <your-repo-url>
cd Tender-Management-System
```

## Step 2: Install Dependencies

### Install Server Dependencies
```bash
cd server
npm install
```

### Install Client Dependencies
```bash
cd ../client
npm install
```

## Step 3: Configure Environment Variables

### Server Configuration

1. Navigate to the `server` folder
2. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
3. **Contact the team lead** to get the actual values for:
   - `DATABASE_URL` - Shared Supabase database connection string
   - `JWT_SECRET` - Authentication secret (same for all team members)
   - `OPENAI_API_KEY` - AI service API key

### Client Configuration (if needed)

The client connects to the server at `http://localhost:5175` by default.

## Step 4: Database Setup (First Time Only - Team Lead)

The team lead needs to run database migrations once:

```bash
cd server
npm run migrate
```

**Note:** Other team members do NOT need to run migrations - they will connect to the already-set-up Supabase database.

## Step 5: Start the Application

### Start Server (Terminal 1)
```bash
cd server
npm run dev
```
Server will start on: `http://localhost:5175`

### Start Client (Terminal 2)
```bash
cd client
npm run dev
```
Client will start on: `http://localhost:5174`

## Step 6: Verify Setup

1. Open browser to `http://localhost:5174`
2. You should see the Tender Management System homepage
3. Try logging in or creating an account

## Common Issues & Solutions

### Issue: Port Already in Use

**Error:** `EADDRINUSE: address already in use :::5175`

**Solution:**
```bash
# Windows
netstat -ano | findstr :5175
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5175 | xargs kill -9
```

### Issue: Database Connection Failed

**Error:** `Connection refused` or `SASL error`

**Solutions:**
1. Check your `.env` file has the correct `DATABASE_URL`
2. Ensure you copied the connection string exactly (including password encoding)
3. Verify your internet connection (Supabase requires internet)
4. Contact team lead to verify Supabase project is active

### Issue: Missing Environment Variables

**Error:** `Missing required environment variables`

**Solution:**
Ensure your `.env` file has all required variables:
- `DATABASE_URL`
- `JWT_SECRET`
- `OPENAI_API_KEY`

## Supabase Database Access

### Shared Database

All team members connect to the **same Supabase database** using the `DATABASE_URL` in the `.env` file. This means:

✅ **Shared data:** All team members see the same tenders, proposals, users
✅ **Real-time collaboration:** Changes made by one developer are visible to others
✅ **No local database setup:** No need to install PostgreSQL locally
✅ **Accessible anywhere:** Works from any network/location with internet

### Direct Database Access

Team members can access the database directly via Supabase Dashboard:

1. Go to [supabase.com](https://supabase.com)
2. Use shared team credentials to log in
3. Navigate to your project
4. Use **Table Editor** to view/edit data
5. Use **SQL Editor** to run queries

## Environment Files

### DO NOT Commit `.env` File

The `.env` file contains sensitive credentials and should **NEVER** be committed to Git.

**It's already in `.gitignore`** - but double-check!

### Share Credentials Securely

Use secure methods to share the `.env` values:
- Encrypted messaging (Signal, WhatsApp)
- Password managers (1Password, Bitwarden)
- Secure file sharing (Google Drive with restricted access)
- **DO NOT** send via email or public channels

## Development Workflow

1. **Pull latest code:** `git pull` before starting work
2. **Start both servers:** Run server and client in separate terminals
3. **Make changes:** Work on your assigned features
4. **Test locally:** Verify everything works on `localhost:5174`
5. **Commit & Push:** Commit your changes and push to the repository
6. **Team sync:** Communicate with team about database schema changes

## Need Help?

Contact the team lead if you encounter:
- Environment setup issues
- Database connection problems
- Missing credentials
- Any errors during installation

---

**Last Updated:** January 16, 2026
