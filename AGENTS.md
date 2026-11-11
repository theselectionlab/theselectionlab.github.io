# AGENTS.md

Instructions for AI coding agents working in this repository. Claude Code reads
this file too; [CLAUDE.md](CLAUDE.md) builds on it with details specific to the
Claude Code Action. The shared rules live here only, so there is one source of
truth.

## Repository

`theselectionlab/theselectionlab.github.io` is a static one-page site served by
GitHub Pages at <https://theselectionlab.ai> (see `CNAME`). There is no build
step — `index.html`, `styles.css` and `main.js` are shipped as written.

`main` is the production branch: GitHub Pages serves directly from it, with no
separate `gh-pages` or staging branch.

## Pull requests

- Always open pull requests **against `main`**.
- Opening a PR does **not** deploy anything — the site only updates when a PR is
  **merged** into `main`. Merging is the deploy trigger, so a human reviewing and
  merging the PR is what gates any change from going live.
- Never merge your own PR. Leave it open for human review.
