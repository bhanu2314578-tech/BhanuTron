# BhanuTron

[![Open in Bolt](https://bolt.new/static/open-in-bolt.svg)](https://bolt.new/~/sb1-tdcmmhhx)

## Project structure

The Next.js application lives in `frontend/`. The backend remains in `backend/`
and is maintained and deployed separately.

## Frontend setup

Create `frontend/.env.local` from `frontend/.env.example` and set:

```text
NEXT_PUBLIC_SUPABASE_URL=https://awxcbbvggnlumymseeaa.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<Supabase anon key>
NEXT_PUBLIC_API_URL=<backend URL>
```

Run the frontend from its directory:

```powershell
cd frontend
npm install
npm run dev
```

Set `NEXT_PUBLIC_API_URL` to the deployed backend address for production. Keep
backend secrets in the backend's own environment configuration; never put them
in frontend environment variables or commit them.

## Backend setup

From PowerShell:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
python -m uvicorn main:app --reload --port 3001
```

Fill in `backend/.env` with the Supabase project URL, Supabase anon key,
Supabase service-role key, Groq API key, and the production frontend origin in
`CORS_ORIGINS`. Keep the service-role key and Groq key only on the backend.
The health endpoint is `/health`; interactive API docs are at `/docs`.

## Render deployment

Create a Render Web Service with **Root Directory** `backend`, **Build Command**
`pip install -r requirements.txt`, and **Start Command**
`uvicorn main:app --host 0.0.0.0 --port $PORT`. Set the backend environment
variables from `backend/.env.example` in Render. Set `CORS_ORIGINS` to the exact
frontend origin(s), comma-separated.

Before deployment, run `backend/supabase/schema.sql` in the Supabase SQL editor.
It is designed to be re-run: it creates missing tables/indexes, adds `job_title`
for profile display values, secures the vector search function, and keeps
user-scoped RLS policies. Set the frontend's production
`NEXT_PUBLIC_API_URL` to the deployed Render service URL.
