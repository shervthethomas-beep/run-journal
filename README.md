# Training Timetable

A shared, no-login web app for a small team to log what they worked on each
day and see it all on a calendar. Everyone with the link sees the same
live data, on any device, powered by [Supabase](https://supabase.com).

This is a beginner-friendly guide — follow the steps in order and you'll
have a shareable link at the end.

## What you're setting up

1. A free **Supabase** project — this is the shared "database in the cloud"
   that stores every entry so everyone sees the same thing.
2. This app's code, connected to that database, published on **GitHub
   Pages** so it has a public web address (URL) you can text/email to your
   team.

You don't need to write any code — just copy/paste a few values.

---

## Step 1 — Create your Supabase project

1. Go to [supabase.com](https://supabase.com) and sign up (free tier is
   enough for this).
2. Click **New project**.
   - Give it any name, e.g. `training-timetable`.
   - Set a database password (Supabase generates one for you — just save
     it somewhere, you won't need it again for this app).
   - Pick any region close to your team.
3. Wait about a minute for the project to finish setting up.

## Step 2 — Create the table

1. In your Supabase project, click **SQL Editor** in the left sidebar.
2. Click **New query**.
3. Open the file [`supabase/schema.sql`](supabase/schema.sql) from this
   repo, copy its entire contents, and paste it into the SQL editor.
4. Click **Run**. You should see "Success. No rows returned."

This creates the `entries` table and turns on the settings that let
everyone (with no login) read and add entries, and see updates live.

## Step 3 — Get your API keys

1. In Supabase, click the **Settings** (gear icon) in the left sidebar,
   then **API**.
2. You'll see two values you need:
   - **Project URL** (looks like `https://abcdefgh.supabase.co`)
   - **anon public** key (a long string of letters/numbers)
3. Keep this page open — you'll copy these into the app next.

## Step 4 — Connect the app to your project

1. In this repository, open the file [`config.js`](config.js).
2. Replace the placeholder values:

   ```js
   const SUPABASE_URL = "https://abcdefgh.supabase.co";
   const SUPABASE_ANON_KEY = "your-long-anon-key-here";
   ```

   with your actual Project URL and anon public key from Step 3.
3. Save the file.

> This key is safe to make public — it's the "anon" (anonymous) key,
> designed to be used in the browser. The database rules you created in
> Step 2 control exactly what it's allowed to do (read entries, add
> entries — nothing else).

## Step 5 — Publish the app with GitHub Pages

This repository already includes a GitHub Actions workflow
(`.github/workflows/deploy-pages.yml`) that automatically builds and
publishes the site to GitHub Pages every time changes land on `main` —
including turning Pages on for you the first time, so there's nothing
to configure by hand.

1. Commit and push your changes (including your edited `config.js`) to
   the `main` branch of this repository on GitHub.
   - If you're working with Claude, just ask it to commit and push your
     changes.
2. On GitHub, go to your repository's **Actions** tab and wait for the
   "Deploy to GitHub Pages" run to finish (a minute or two).
3. Go to **Settings → Pages** — you'll see your live URL, something like:

   ```
   https://your-username.github.io/your-repo-name/
   ```

That's your shareable link! Send it to your team — no account or app
install needed, just a browser.

---

## Using the app

- The calendar shows the current month. Tap **‹** / **›** to change
  months, or **Today** to jump back.
- Days with entries show small colored dots (one color per department)
  and a count in the corner.
- Tap any day to see the full details of everything logged that day.
- Tap the **+** button (bottom-right) to add a new entry: pick a date,
  your name, a department, and describe what you worked on.
- New entries appear for everyone automatically — no refresh needed.

## Local development / testing before deploying

Because this is a plain static site, you can open `index.html` directly
in a browser, or run any simple local server, e.g.:

```
npx serve .
```

Then visit the URL it prints (e.g. `http://localhost:3000`).

## Project structure

```
index.html          Page structure (calendar + modals)
style.css            Styling (mobile-friendly)
app.js               App logic + Supabase calls
config.js            Your Supabase URL/key (edit this!)
supabase/schema.sql  Database table + security setup (run once in Supabase)
```
