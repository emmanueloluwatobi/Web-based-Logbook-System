<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:installed-skills -->
# Installed Skills

This project has skills installed from [emilkowalski/skills](https://github.com/emilkowalski/skills). Before implementing any UI animation, interaction, or transition, check the installed skill files for the relevant pattern before reaching for general training knowledge — these skills encode specific, tested approaches this project should follow rather than generic alternatives.
<!-- END:installed-skills -->

---

## Application Building Context

Read the following files **in order** before implementing any feature or making any architectural decision, at the start of a session or whenever context has reset:

1. `context/project-overview.md` — product definition, roles, user flows, grading rubric, scope (in/out)
2. `context/architecture.md` — stack, folder structure, system boundaries, database schema, data flows, invariants
3. `context/ui-tokens.md` — colors, typography, spacing, component tokens (source of visual truth alongside `DESIGN.md`)
4. `context/ui-rules.md` — page-specific UI patterns and constraints
5. `context/ui-registry.md` — components already built — check before building a new one
6. `context/code-standards.md` — implementation rules and conventions
7. `context/library-docs.md` — project-specific usage patterns for Drizzle, Better Auth, Resend, shadcn/ui, Sonner
8. `context/build-plan.md` — the phased feature list — what to build and in what order
9. `context/progress-tracker.md` — current phase, what's done, what's next

---

## When to Re-Read a Specific File (mid-task)

Don't re-read everything for every task — read the file that matches what you're about to do:

| About to... | Read first |
|---|---|
| Start a new feature/phase | `build-plan.md` — find the feature, read its full UI + Logic spec |
| Build any component | `ui-registry.md` — check if it already exists; if not, `ui-rules.md` + `ui-tokens.md` before writing classes |
| Touch the database schema or a query | `architecture.md` — confirm the table shape and invariants; `library-docs.md` — Drizzle section for the exact pattern |
| Implement auth, login, or role checks | `architecture.md` — Authentication section; `library-docs.md` — Better Auth section |
| Send an email or trigger a notification | `code-standards.md` — Notifications table for the exact `type` string; `library-docs.md` — Resend section |
| Write a Server Action | `code-standards.md` — Server Actions section for the exact return shape and error pattern |
| Unsure if a decision has already been made | `progress-tracker.md` — "Decisions Made During Build" |
| Finishing any feature | Update `progress-tracker.md` — see below |

---

## Update Discipline

- Update `context/progress-tracker.md` after each meaningful implementation change: check off the feature in `build-plan.md`'s numbering, update "Current Status," and log any decision made that isn't already in the context files.
- After building any new component, add it to `context/ui-registry.md` with its file path and exact classes used.
- Context files take precedence over individual spec files or ad-hoc instructions given mid-session. If a request conflicts with what a context file says, raise it as an open question before proceeding — don't silently override the file or silently comply with the conflicting request.
- If implementation forces a change to the architecture, scope, or standards documented in the context files, **update the relevant context file first**, then continue. Never let the code and the docs drift apart.

---

## Scope Discipline

- Build only what the current `build-plan.md` feature requires. Phases 1-3 are Core — the demo-critical path. Do not start Phase 4 or 5 features until Phases 1-3 are checked off in `progress-tracker.md`, unless explicitly told otherwise.
- If a task seems to require something outside the current feature's scope, flag it rather than expanding scope silently.