# InTravelSync (voyage-flow-ops)

Operations console for a travel agency: tours, transfers, one-time trips, customers, fleet and drivers, accounting, calendar dashboard, vouchers and email reminders.

Stack: TanStack Start + Router, React 19, Tailwind v4, shadcn/ui, Drizzle ORM, MySQL 8.

Quick start:

```
copy .env.example .env     # edit values
npm install
npm run db:push
npm run db:seed            # run once
npm run dev                # http://localhost:8080
```

Full documentation, conventions, data model, extension recipes and the security/hardening checklist: [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md).

## For AI agents and new contributors

- `AGENTS.md` (also imported by `CLAUDE.md`): the rules that cause the most breakage, and which skill to load.
- `.claude/skills/`: task playbooks (project guide, adding features, database changes, bookings and accounting, troubleshooting, git workflow).
- `docs/DEVELOPMENT.md`: the full reference.

Keep the docs true: when behaviour changes, update the guide and the relevant skill in the same commit.

Status: runs locally; not production-ready until the authentication gaps in section 11 of the guide are closed.
