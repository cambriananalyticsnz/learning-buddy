# CLAUDE.md — Learning Buddy

## ⚠️ CRITICAL: Account Isolation

This project uses a SEPARATE account from all other projects:

| Platform | This Project | Other Projects |
|----------|-------------|----------------|
| **GitHub** | `cambriananalyticsnz` | `vivaming` |
| **Supabase** | `cambriananalyticsnz` (cambrian.analytics.nz@gmail.com) | `ebikesfinder@gmail.com` |
| **Vercel** | Same org as ebike (`team_lPr5cXQA5a59QVQxpN9iSyfK`) | Same |

**EVERY GitHub operation** (repo creation, issues, PRs, commits) must go to `cambriananalyticsnz`, NEVER `vivaming`.

## Tech Stack
- Next.js + Tailwind CSS + Supabase JS SDK
- DeepSeek API (Flash default, Pro for complex)
- Vercel Hobby (minimise serverless functions: 1 AI proxy only)
- Supabase project: `yznsyrjqwoyvreswmsez` (Oceania/Sydney)

## Architecture Constraints
- Only 1 Vercel serverless function (DeepSeek proxy)
- All DB queries via Supabase client SDK + RLS (direct from client)
- Supabase free tier: 500MB DB, 50K MAU

## Memory System
- [learning-buddy-infra](~/.claude/projects/-Users-mingzhang-Documents-Python/memory/learning-buddy-infra.md)
- [learning-buddy-plan](~/.claude/projects/-Users-mingzhang-Documents-Python/memory/learning-buddy-plan.md)
