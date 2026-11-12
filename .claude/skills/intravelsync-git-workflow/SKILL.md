---
name: intravelsync-git-workflow
description: Commit, push and pull workflow for the InTravelSync repository, including pre-commit checks, commit message style, the recurring package-lock and routeTree pull conflicts, Windows quirks and safe handling of GitHub tokens and the tracked .env file. Use before committing or pushing, or when git fails.
---

# Git workflow

Reference: `docs/DEVELOPMENT.md` section 10. Repo: `github.com/eridatech-stack/voyage-flow-ops`, branch `main`.

## How work flows

An agent or developer commits and pushes to `main`; the maintainer pulls and runs locally on Windows (PowerShell). After pulling: `npm install` if `package.json` changed, `npm run db:push` if `src/db/schema.ts` changed.

## Before every commit

1. `npx tsc --noEmit` returns zero errors.
2. `git status` and read it. Stage specific paths. Avoid `git add -A` blindly: it is how `.env` got committed. Never stage `.env`.
3. Commit message style: `feat:`, `fix:`, `chore:`, `docs:` prefix, then a short summary; body explains the cause and the fix. Mention schema changes and new npm scripts.
4. If the environment has no git identity: `git config user.name` and `git config user.email` for this repo only.

## Pull conflicts (very common)

`git pull` is refused because `package-lock.json` and `src/routeTree.gen.ts` were regenerated locally. If there are no intentional edits to them:

```
git checkout -- package-lock.json src/routeTree.gen.ts
git pull origin main
```

If you added route files, commit the regenerated route tree instead of discarding it. On Windows, `error: cannot spawn .git/hooks/post-checkout: No such file or directory` is a missing Git LFS hook and harmless; the checkout still completed. Older PowerShell does not support `&&`; run commands on separate lines.

## Tokens and credentials

- Prefer Git Credential Manager (`git config --global credential.helper manager`) or SSH keys. Never ask a person to paste a token into chat.
- If a token has been supplied for one push: use it only inside that single command, restore the plain remote URL immediately after (`git remote set-url origin https://github.com/eridatech-stack/voyage-flow-ops.git`), never write it to a file or commit, and tell the owner to revoke it. Tokens need only the `repo` scope.
- Never print `.env` contents, database passwords, `JWT_SECRET` or a Resend key into logs, commits or docs.

## The tracked `.env` problem

`.env` is currently tracked in git (guide 11, item 3). Fix: add `.env` to `.gitignore`, `git rm --cached .env`, rotate the database password and `JWT_SECRET` if the repo was ever shared. Warn the maintainer first: pulling the untracking commit deletes an unmodified local `.env`; they must copy it before pulling and use `.env.example` as the template.
