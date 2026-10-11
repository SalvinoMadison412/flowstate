# FlowState

## Research and web search

For any research, web search, or URL-reading request, use the `agent-reach` skill (`.claude/skills/agent-reach/`) by default, not the built-in WebSearch/WebFetch or other search connectors. Fall back to those only if the Agent Reach channel needed is failing or not set up, and say so when you do.

## Keep this repo lean

This repo is the website, CRM and dialer only (`app`, `components`, `lib`, `public`, `chrome-extension`, `supabase`).
Videos, reels, lead sheets, scrapers, handoff folders, briefs and notes go in `~/Desktop/FlowState-Work/`, never in this folder.
Work on `develop`, open a PR into `main`, and never create extra long-lived branches. `.gitignore` is an allowlist, so a new top-level file is ignored until it is added there on purpose.
