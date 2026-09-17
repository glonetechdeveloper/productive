# ⚡ LUMEN | Hierarchical Productivity Operating System & Micro-Scheduler

A production-ready full-stack productivity web application built with **Vanilla HTML5, CSS3, and JavaScript**, backed by **Vercel Serverless Functions (Node.js)**, **Stateless JWT Authentication**, and direct **PostgreSQL (Neon / Supabase / PgPool)** database persistence.

---

## 🌟 Key Features

1. **🎨 Luminous Black Design & Theme System**
   - Default Obsidian Dark Mode (`#0d0f12`) with glassmorphism, glowing micro-interactions, and neon status rings.
   - Smooth Light Mode toggle with crisp slate contrast.
   - Zero Tailwind dependency — 100% handcrafted high-performance Vanilla CSS.

2. **🏗️ Top-Down Goal Hierarchy (5 Levels)**:
   - **Level 01 &bull; Yearly Vision & Annual Goals**: High-level pillars (Career, Health, Wealth, Mastery), metric milestones, and cumulative annual progress bar.
   - **Level 02 &bull; 4-Month Horizon (Quarterly/Trimester Sprints)**: Month 1–4 milestone targets and strategic focus areas.
   - **Level 03 &bull; Weekly Planning & Pre-Week Strategy**: Intentional strategy notepad, bottleneck forecasting, and weekly big rocks.
   - **Level 04 &bull; Daily Breakdown (Sun – Sat)**: 7-Day clickable calendar cards with completion velocity, plus an active week review log.
   - **Level 05 &bull; Hourly Micro-Schedule (The Daily Log)**: 18 precision time blocks (06:00 AM – 11:00 PM), category tags, quick filters, routine pre-fill, and instant completion toggles.

3. **📊 Real-Time Productivity Dashboard**:
   - 4 Dynamic SVG Circular Progress Rings (Daily Focus %, Weekly Pace %, 4-Month Horizon %, Yearly Vision %).
   - Dynamic status pills ("🔥 Peak Momentum", "⚡ High Focus", "⚠️ Needs Attention").

4. **🔐 Serverless Backend & Database Infrastructure**:
   - Auto-executing table creation in PostgreSQL (`users` and `user_goals` tables).
   - Bcrypt-hashed credentials & signed stateless JSON Web Tokens.
   - Real-time debounced auto-sync (`GET` / `POST` `/api/goals/sync`) with offline LocalStorage fallback.

---

## 📂 Project Structure

```
productivity-app/
├── package.json          # Node dependencies (@neondatabase/serverless, pg, bcryptjs, jsonwebtoken)
├── vercel.json           # Static routing & serverless API configuration
├── .env.example          # Environment variable template
├── .gitignore            # Git ignore configuration
├── api/
│   ├── lib/
│   │   ├── db.js         # PostgreSQL connection pool & auto-table schema initialization
│   │   └── auth.js       # JWT signing/verification & bcrypt password hashing
│   ├── auth/
│   │   ├── register.js   # User registration endpoint
│   │   └── login.js      # User login & JWT issuance endpoint
│   └── goals/
│       └── sync.js       # Protected GET & POST goal sync endpoint
└── public/
    ├── index.html        # Semantic HTML5 frontend & Auth Modal
    ├── styles.css        # Vanilla CSS design system & dark/light theme tokens
    └── script.js         # Client-side state manager, rings, timer & sync engine
```

---

## 🗄️ Database Schema (`api/lib/db.js`)

The database connection automatically runs the following DDL migrations on cold start if the tables do not exist:

```sql
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_goals (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  year_data JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_user_goal UNIQUE (user_id)
);
```

---

## 🚀 Step-by-Step Setup & Deployment Guide

### 1. Clone or Initialize Repository
```bash
git init
git add .
git commit -m "feat: initial production-ready productivity app"
git branch -M main
```

### 2. Set Up a Free PostgreSQL Database (Neon.tech)
1. Go to [https://neon.tech](https://neon.tech) and create a free PostgreSQL project.
2. Copy your Connection String (`DATABASE_URL`). Example:
   ```
   postgresql://username:password@ep-sample-12345.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

### 3. Local Development with Vercel CLI
```bash
# 1. Install dependencies
npm install

# 2. Create your local environment file
cp .env.example .env.local

# Add your credentials in .env.local:
# DATABASE_URL=your_postgres_connection_string
# JWT_SECRET=your_super_secret_jwt_key

# 3. Run the local development server
npx vercel dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

### 4. Deploy to GitHub & Vercel (Production)

#### Push to GitHub:
```bash
# Create a new repository on GitHub, then link and push:
git remote add origin https://github.com/YOUR_USERNAME/productivity-app.git
git push -u origin main
```

#### Deploy on Vercel:
1. Go to [https://vercel.com/new](https://vercel.com/new) and import your GitHub repository.
2. In the **Environment Variables** section, add:
   - `DATABASE_URL` = `postgresql://...` (your Neon/Supabase connection string)
   - `JWT_SECRET` = `your_secure_random_production_secret_key`
3. Click **Deploy**.

Alternatively, deploy directly using the Vercel CLI:
```bash
npx vercel --prod
```
When prompted, link your project and add the environment variables in the Vercel Project Dashboard under **Settings -> Environment Variables**.

---

## 🔐 API Reference

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register a new user (`{ email, password }`) | No |
| `POST` | `/api/auth/login` | Log in and receive JWT token | No |
| `GET` | `/api/goals/sync` | Fetch user's saved productivity log | Yes (`Bearer <token>`) |
| `POST` | `/api/goals/sync` | Save/update user's hierarchical log data | Yes (`Bearer <token>`) |

---

## 🛡️ Offline / Guest Mode
If you run the app locally without database credentials configured, the application automatically runs in **Offline Mode (Local Storage)**, allowing immediate testing of all hierarchical planning levels, hourly micro-scheduling, and circular progress analytics. When you're ready to sync, simply create an account via the modal to link your data to PostgreSQL.
