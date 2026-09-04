# BhanuTron

[![Open in Bolt](https://bolt.new/static/open-in-bolt.svg)](https://bolt.new/~/sb1-tdcmmhhx)

## Local setup

Create the frontend environment file from `.env.example`:

```text
NEXT_PUBLIC_SUPABASE_URL=https://awxcbbvggnlumymseeaa.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<Supabase anon key>
NEXT_PUBLIC_API_URL=http://localhost:3001
```

Create `backend/.env` from `backend/.env.example`. Set the Supabase service-role
key, Supabase JWT secret, and Groq API key from their respective dashboards.
Never expose those values in frontend environment variables or commit them.

Run the SQL in `backend/supabase/schema.sql` in the Supabase SQL editor before
starting the backend. The Supabase REST URL is derived from the project URL and
does not need to be configured separately by the Supabase client.

Start the applications in separate terminals:

```bash
npm run dev
cd backend
uvicorn main:app --reload --port 3001
```
