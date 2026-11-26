# 🎓 TESTPREP - Online MCQ Exam & Quiz Platform

> *"Do you want to test your knowledge, or are you the next topper?"*
> 
> *"THIS IS THE TOPPERS 🏆"*

A full-stack, responsive, distraction-free academic online examination platform where the **Admin** can publish and manage subject-wise multiple-choice questions, and **students/visitors** can take timed online tests without needing to create an account.

---

## ⚡ Quick Start (Instant Local Run)

The platform comes pre-seeded with **2 subjects, 10 curated MCQs with code snippets & explanations, and 6 dummy leaderboard entries**. You can test everything immediately:

```bash
# 1. Install dependencies (if needed)
npm install

# 2. Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser:
- **Public Student Portal:** [http://localhost:3000](http://localhost:3000)
- **Live Leaderboard:** [http://localhost:3000/leaderboard](http://localhost:3000/leaderboard)
- **Admin Control Center:** [http://localhost:3000/admin](http://localhost:3000/admin)
  - **Admin Secret Key:** Configured privately via environment variable `ADMIN_SECRET_KEY`

---

## 🏗️ Architecture & Tech Stack

- **Framework:** Next.js (App Router, Turbopack)
- **Language:** TypeScript
- **Styling:** Tailwind CSS (Distraction-free academic indigo/slate palette)
- **Icons:** Lucide React
- **Celebration Animations:** Canvas Confetti
- **Database Architecture (Dual Mode):**
  - **Supabase Cloud (PostgreSQL + RLS):** When configured in `.env.local`, queries run directly against Supabase with full Row-Level Security policies.
  - **Local Persistence Layer:** When Supabase keys are not yet configured, the system uses the high-performance local persistent store (`data/store.json`), allowing instant testing out of the box with zero setup hurdles.

---

## 🗄️ Database Setup & Supabase Integration

The complete PostgreSQL setup script is included in the project root at [`schema.sql`](./schema.sql).

### Step-by-Step Supabase Instructions:

1. Create a free project at [supabase.com](https://supabase.com).
2. Go to the **SQL Editor** tab in your Supabase Dashboard.
3. Open [`schema.sql`](./schema.sql), copy its contents, paste them into the SQL Editor, and click **Run**. This will:
   - Create the `subjects`, `questions`, and `attempts` tables.
   - Configure high-speed ranking indexes (`(score DESC, time_taken_seconds ASC)`).
   - Set up Row-Level Security (RLS) policies allowing public exam reading/submitting and admin moderation.
   - Insert the initial sample subjects, 5 MCQs, and 5 leaderboard entries.
4. Copy your project credentials from **Project Settings ➔ API**.
5. Update your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-secret-key
ADMIN_SECRET_KEY=your-secure-admin-password
```

6. Restart the development server with `npm run dev`.

---

## 🚀 Key Features

### 1. Public Student Portal (`/`)
- **No Login Required:** Visitors can immediately browse subjects and start exams.
- **Subject Lobby Cards:** Shows total questions, duration, passing percentage, and negative marking rules.
- **Direct Navigation:** Jump directly to any subject's exam or leaderboard.

### 2. Timed Exam Engine (`/exam/[id]`)
- **Pre-Test Registration:** Collects Candidate Full Name and optional Roll No. / Batch with an academic honesty confirmation.
- **Secure Question Delivery:** Questions delivered to the student client are **sanitized** (correct answers and explanations are never sent over the wire during the live test).
- **Automated Timekeeper:** Live countdown clock with warning colors (amber under 5 minutes, red pulse under 2 minutes). Auto-submits automatically when time hits `00:00`.
- **Question Palette Sidebar:** Color-coded navigation buttons:
  - 🟢 **Answered** (Green)
  - 🟡 **Marked for Review** (Amber)
  - 🟣 **Answered & Marked** (Indigo + Amber ring)
  - ⚪ **Not Answered** (Slate)
- **Interactive Controls:** Previous, Next, Clear Response, and Mark for Review.
- **Submission Summary Modal:** Displays breakdown of answered vs. unanswered questions before confirmation.

### 3. Instant Results & Answer Key
- **Performance Summary:** Total Score, Percentage, Accuracy %, Time Taken, and Live Rank.
- **Confetti Celebration:** Triggered upon passing.
- **Comprehensive Question-by-Question Review:**
  - Highlights student's selected answer vs. the correct answer.
  - Indicates marks awarded (`+1.0`, `-0.25`, `0.0`).
  - Displays verified Administrator Explanation for every question.
  - Filter review by All, Correct, Incorrect, or Skipped.

### 4. Live Leaderboard System (`/leaderboard`)
- **Strict Ranking Logic:** Primary sort by **Highest Score / Percentage (descending)**, using **Fastest Time Taken (ascending)** as an objective tie-breaker.
- **Top 3 Podium:** Distinct Gold (1st), Silver (2nd), and Bronze (3rd) honor cards with crowns and medals.
- **Ranks 4–25 Standings Table:** Shows rank, candidate, subject, score, percentage, time taken, status, and timestamp.
- **Subject Filtering:** Toggle between "All Subjects" or individual subject boards.
- **Post-Test Highlight:** Links directly from test submission to highlight the student's entry on the leaderboard.

### 5. Admin Dashboard (`/admin`)
- **Auth Gate:** Protected by secure secret key verification (cookie and header support).
- **Subject Management:** Create, edit, and delete subjects with custom time limits, passing scores, and negative marking penalties.
- **Question Editor:** Add, edit, and delete 4-option MCQs with markdown code block formatting and detailed explanations.
- **Bulk Import / Export:**
  - Upload `.json` or `.csv` files to import questions in bulk.
  - Download pre-formatted sample JSON and CSV templates directly from the dashboard.
  - One-click export of the entire question bank as a JSON backup.
- **Leaderboard Moderation:** View student attempts with timestamps, delete spam/test entries, or reset a subject's rankings with one click.
- **Platform Analytics:** Real-time metrics for total subjects, curated MCQs, attempts, average score, and pass rate.

---

## 📁 Project Structure

```
├── app/
│   ├── api/
│   │   ├── admin/stats/          # Admin analytics API
│   │   ├── attempts/             # Student test submission & grading API
│   │   ├── auth/                 # Admin login, logout, and verify API
│   │   ├── leaderboard/          # Public rankings & admin reset API
│   │   ├── questions/            # MCQ CRUD, import & export API
│   │   └── subjects/             # Subject management & start exam API
│   ├── admin/                    # Admin Dashboard view
│   ├── exam/[id]/                # Student Exam & Results runner
│   ├── leaderboard/              # Hall of Fame & Live Leaderboard
│   ├── globals.css               # Tailwind CSS styling & custom scrollbars
│   ├── layout.tsx                # Root layout & academic fonts
│   └── page.tsx                  # Public Student Portal Lobby
├── components/
│   ├── AdminDashboard.tsx        # Comprehensive admin panel with modals
│   ├── ExamRunner.tsx            # Live exam engine with timer & results
│   ├── Footer.tsx                # Consistent platform footer
│   ├── FormattedText.tsx         # Code snippet & markdown renderer
│   ├── LeaderboardView.tsx       # Podium & rankings table
│   └── Navbar.tsx                # Responsive academic navigation header
├── lib/
│   ├── auth.ts                   # Admin secret key & session utilities
│   ├── db.ts                     # Unified database abstraction layer
│   ├── seed.ts                   # Initial sample subjects, MCQs & attempts
│   └── supabase.ts               # Supabase PostgreSQL client setup
├── types/
│   └── index.ts                  # Core TypeScript interfaces
├── .env.example                  # Documented environment template
├── .env.local                    # Local development configuration
├── schema.sql                    # Production Supabase PostgreSQL schema script
└── README.md                     # Platform documentation
```

---

## 🛡️ License

This project is licensed under the MIT License.