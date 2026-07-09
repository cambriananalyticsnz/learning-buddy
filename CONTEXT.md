# Learning Buddy — Project Context

## ⚠️ CRITICAL: Account Isolation

This project uses a **separate account** from all other projects. Every platform operation (repos, issues, PRs, deployments, database) must target this account:

| Platform | This Project | Other Projects (DO NOT USE) |
|----------|-------------|---------------------------|
| **GitHub** | `cambriananalyticsnz` | `vivaming` |
| **Supabase** | `cambriananalyticsnz` (`cambrian.analytics.nz@gmail.com`) | `ebikesfinder@gmail.com` |
| **Vercel** | `team_lPr5cXQA5a59QVQxpN9iSyfK` (same org as ebike) | — |

## What This Project Is

AI-powered learning assistant for a Year 10–13 student following Cambridge CIE. Personalised tutoring with mistake memory across 4 subjects.

## Tech Stack

- **Frontend:** Next.js + Tailwind CSS
- **Database:** Supabase (project `yznsyrjqwoyvreswmsez`, Oceania/Sydney)
- **AI:** DeepSeek v4 Flash (default) / Pro (complex questions)
- **Hosting:** Vercel Hobby
- **Auth:** Supabase Auth (student + parent roles)

## Architecture Constraints

- **Free tier limits apply** — Vercel Hobby (100 function invocations/day), Supabase Free (500MB, 2 projects)
- **Minimise serverless functions** — only 1 API route: DeepSeek proxy
- **All DB queries from client** via Supabase JS SDK + Row Level Security
- **No touching ebike data** — separate Supabase account, zero crossover risk

## Phased Build

| Phase | What | Status |
|-------|------|--------|
| 1 | AI Chat + 4 subjects + mistake memory | 🔜 Next |
| 2 | Syllabus map & planner (CIE curriculum) | 📋 Planned |
| 3 | Gamification (XP, streaks, levels) | 📋 Planned |
| 4 | Parent dashboard (read-only overview) | 📋 Planned |
| 5 | Quizzes & past paper drills | 📋 Planned |

## 3-Layer Memory System

- **L1 (Session):** Current chat window — client state
- **L2 (Working):** Mistake patterns with decay curve — injected into AI prompts
- **L3 (Long-term):** Topic mastery profile — for learning reports

## Key Design Decisions

- Primary entry: AI chat Q&A, not a structured planner
- AI knows Cambridge CIE syllabus structure and suggests related topics
- Design style: playful & gamified (progress bars + streaks + XP/levels)
- Separate Supabase account (not schema) to protect ebike data
- Vercel project under same org as ebike (ebike uses 0 functions)

## Reference
- Supabase project ref: `yznsyrjqwoyvreswmsez`
- Supabase org: `qctkjvxerrfifyqakwue`
- Vercel org: `team_lPr5cXQA5a59QVQxpN9iSyfK`
