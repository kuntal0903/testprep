# 🚀 Deploying TESTPREP to GitHub and Vercel

This guide walks you through publishing your **TESTPREP** project to **GitHub** and deploying it live on **Vercel** in under 3 minutes.

---

## 🔐 1. Admin Credentials
- **Admin Password / Key:** Configured privately via `ADMIN_SECRET_KEY` environment variable (never share publicly)
- Configured in [.env.local](file:///d:/test%20portal/.env.local) and [lib/auth.ts](file:///d:/test%20portal/lib/auth.ts)

---

## 📦 2. Push Code to GitHub

Your local project has already been initialized as a **Git repository** with an initial commit ready on branch `main`.

### Step 1: Create a New GitHub Repository
1. Go to [github.com/new](https://github.com/new).
2. Enter a repository name, e.g. `testprep` or `online-mcq-portal`.
3. Choose **Public** or **Private**.
4. **Do NOT** check "Add a README" or ".gitignore" (these are already created locally).
5. Click **Create repository**.
6. Copy the repository URL (e.g. `https://github.com/YOUR_USERNAME/testprep.git`).

---

### Step 2: Push Your Code to GitHub

You have **two easy options** to push your code:

#### Option A: Using the Built-In Script (No Git installation needed!)
Generate a [GitHub Personal Access Token (classic)](https://github.com/settings/tokens) with `repo` scope, then run:

```bash
node push-to-github.mjs https://github.com/YOUR_USERNAME/testprep.git YOUR_GITHUB_TOKEN
```

#### Option B: Using Git CLI or GitHub Desktop
If you have Git or GitHub Desktop installed on your system:

```bash
git remote add origin https://github.com/YOUR_USERNAME/testprep.git
git branch -M main
git push -u origin main
```

---

## ⚡ 3. Deploy Live on Vercel

Once your repository is on GitHub:

1. Go to [vercel.com/new](https://vercel.com/new).
2. Log in with your GitHub account.
3. Find your **testprep** repository and click **Import**.
4. In the **Configure Project** screen:
   - **Framework Preset:** Next.js (automatically detected)
   - **Root Directory:** `./`
5. Expand the **Environment Variables** section and add:
   - `ADMIN_SECRET_KEY`: `your-secure-admin-password`
   - `NEXT_PUBLIC_APP_NAME`: `TESTPREP`
   *(Optional)* If using Supabase for global cloud persistence:
   - `NEXT_PUBLIC_SUPABASE_URL`: `https://your-project.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: `your-anon-key`
   - `SUPABASE_SERVICE_ROLE_KEY`: `your-service-role-key`
6. Click **Deploy**.

Vercel will build and deploy the application in under 60 seconds, giving you a live production URL (e.g., `https://testprep-xyz.vercel.app`)!