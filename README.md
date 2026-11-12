# School of Discipleship

A comprehensive web application for a School of Discipleship that supports student applications, enrollment, course delivery, assessments, progress tracking, payments, and certificates.

## 🎯 Project Overview

- **Frontend:** Next.js 15 + React 19 + TypeScript + Tailwind CSS
- **Backend:** Python + FastAPI
- **Database:** Supabase PostgreSQL with RLS
- **Auth:** Supabase Auth (email/password + Google OAuth)
- **Storage:** Supabase Storage (certificates, resources)
- **Payment:** Paystack integration
- **Deployment:** Render or Railway

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- Python 3.10+
- Supabase account
- Paystack account (optional)

### Environment Variables

Copy `.env.example` and configure:
- Supabase URL and keys
- Backend SECRET_KEY
- Paystack keys (or use placeholders)

See `.env.example` for complete list.

## 📦 Deployment

### Option 1: Deploy to Render

1. Fork/clone this repository
2. Connect to Render using `render.yaml`
3. Configure environment variables in Render dashboard
4. Deploy!

Render will automatically:
- Deploy backend from `/backend`
- Deploy frontend from `/frontend`
- Use build commands from `render.yaml`

### Option 2: Deploy to Railway

1. Fork/clone this repository
2. Create new Railway project
3. Add two services:
   - **Backend:** Root directory = `backend`, uses `backend/nixpacks.toml`
   - **Frontend:** Root directory = `frontend`, uses `frontend/nixpacks.toml`
4. Configure environment variables
5. Deploy!

### Post-Deployment Configuration

1. **Update CORS:**
   - Set `BACKEND_CORS_ORIGINS` to `["https://your-frontend-url"]`

2. **Update API URL:**
   - Set `NEXT_PUBLIC_API_URL` to `https://your-backend-url`

3. **Configure Supabase Auth:**
   - Go to Supabase Dashboard → Authentication → URL Configuration
   - Add redirect URL: `https://your-frontend-url/auth/callback`
   - Add site URL: `https://your-frontend-url`

4. **Custom Domain (Optional):**
   - Add custom domain in Render/Railway settings
   - Update DNS records in your domain provider (Hostinger)
   - Point to provided CNAME or A record

## 🗄️ Database Setup

Database migrations are in `/supabase/migrations/`. The Supabase project already has:
- 19 tables with RLS policies
- 79 RLS policies (76 table + 3 storage)
- Initial curriculum seed data (3 modules, 9 lessons)

No manual migration needed if using existing Supabase project.

## 🔐 Security Features

- ✅ JWT verification with Supabase Auth
- ✅ Row Level Security (RLS) on all tables
- ✅ Role-based authorization (student/admin)
- ✅ Quiz grading on backend only
- ✅ Payment webhook HMAC SHA512 verification
- ✅ Certificate eligibility backend-verified
- ✅ Answer keys protected (never exposed to frontend)
- ✅ Frontend route protection with middleware

## 👥 User Roles

**Two roles only:**
1. **student** - Apply, enroll, learn, take quizzes, get certificates
2. **admin** - Manage applications, content, students, payments, certificates

Admin includes facilitator and trainer responsibilities.

## 📚 Documentation

- `docs/PRD.md` - Product Requirements Document
- `docs/DATABASE_SCHEMA.md` - Complete database schema
- `docs/TASKLIST.md` - Development roadmap and progress
- `.env.example` - Environment variables reference

## 🛠️ Development

### Backend (FastAPI)

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

API runs at `http://localhost:8000`
Docs at `http://localhost:8000/docs`

### Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:3000`

## 🧪 Testing

Phase 10 testing complete:
- ✅ 15 automated structural tests (RLS, constraints, integrity)
- ✅ 7 code security reviews (auth, payment, grading, certificates)
- All tests passed

Manual E2E testing requires deployed environment.

## 📝 License

Proprietary - Inter Prayer League

## 🤝 Contributing

This is a private project. Contact the repository owner for contribution guidelines.

---

**Built with ❤️ for discipleship training**
