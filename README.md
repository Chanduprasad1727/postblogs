# Kalaga Wealth - Market Insights & Investor Polls Platform

A modern, role-based financial intelligence and market publishing platform.

---

## 👑 Sole Administrator: Kalaga Pavan Kishore
The platform enforces a strict single-administrator architecture:
- **Kalaga Pavan Kishore** (`pavan@kalagawealth.com`) is the **sole administrator**.
- He holds exclusive rights to publish market commentaries, upload high-resolution images & video reports, launch investor sentiment polls, and manage content.
- **No other admin accounts can ever be created**: All new user registrations in the system are strictly assigned as **Client / Investor accounts**. Attempts to register with administrative privileges are rejected (HTTP 403).

---

## 👁️ Client Accounts (Investors & Readers)
- Can watch video analysis reports.
- Read market briefs in a single continuous vertical scroll stream.
- Vote in real-time on interactive investor sentiment polls in the left sidebar or directly on article callouts.

---

## 🛠️ Tech Stack & Architecture

- **Backend**: Python 3.11 with FastAPI, SQLite / Supabase PostgreSQL, Pydantic, RFC 7519 JWT Auth, and PBKDF2-HMAC-SHA256 password hashing.
- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons.
- **Database Rules**:
  - `backend/main.py`: Enforces that only Kalaga Pavan Kishore holds `role = "admin"`. All other registrations default to `client`.
  - `supabase/schema.sql`: Contains PostgreSQL triggers ensuring only `pavan@kalagawealth.com` receives admin privileges.

---

## 🚀 Quick Start Guide

### 1. Environment Configuration
Copy the template `.env.example` files to `.env` in both backend and frontend:

```bash
# Backend configuration
cp backend/.env.example backend/.env
# Edit backend/.env with your Supabase credentials and secret key

# Frontend configuration
cp frontend/.env.example frontend/.env
# Edit frontend/.env with your Supabase URL and Anon key
```

> ⚠️ **Security Notice**: All `.env` files and secrets are strictly ignored by `.gitignore` and must never be committed to GitHub or public repositories.

### 2. Run the Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
Backend API runs at: `http://localhost:8000`

### 3. Run the Frontend
```bash
cd frontend
npm install
npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

## 👥 Pre-Configured Accounts

| Role | Name | Email | Password | Permissions |
| :--- | :--- | :--- | :--- | :--- |
| **Sole Admin** | **Kalaga Pavan Kishore** | `pavan@kalagawealth.com` | `admin123` | Publish blogs, upload photos & videos, launch polls, delete posts |
| **Client** | Client Member (Investor) | `client@kalagawealth.com` | `client123` | Watch videos, read blogs, vote in investor polls |
