# CLAUDE.md

The shared repo rules — the Pages setup, PRs against `main`, merging as the
deploy trigger, never self-merging — live in [AGENTS.md](AGENTS.md). Read that
first. This file adds only what is specific to Claude.

## Claude Code Action

`.github/workflows/claude.yml` runs `anthropics/claude-code-action@v1` when a
`@claude` mention lands in a new issue, an issue comment, or a PR review
comment. That token carries `contents: write` and `pull-requests: write`, so the
Action is technically able to merge. The rules in [AGENTS.md](AGENTS.md) say it
must not: open the PR against `main` and stop there.

If the Pages setup or the PR rules change, edit them in [AGENTS.md](AGENTS.md)
— don't fork a second copy here.
