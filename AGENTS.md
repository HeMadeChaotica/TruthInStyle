# TruthInStyle release workflow

- Address the user as Mista.Thicc. Preserve approved Crystallization artwork, layouts, character identities, and functioning data entry.
- Production at https://www.tellnolies.app is the user's review and daily-use version. Do not present localhost as the delivered app.
- Implement and perform proportionate pre-release checks in the repository, commit intended changes to `deeperdaddy`, push, then confirm the matching Vercel production deployment is READY and the production alias is assigned before asking the user to review.
- Keep the local checkout synchronized with the released Git commit. Vercel deploys repository code; it is not the source from which to overwrite the checkout. Do not discard local changes or automatically pull over unfinished work.
- Local previews are internal diagnostics only unless Mista.Thicc explicitly requests one. Never leave an isolated local preview open as the user's apparent live app. A local missing integration setting is not evidence that production is misconfigured.
- Do not claim completion from a successful build alone. Report the commit, deployment, verified behavior, and any actual blockers concisely.
- Remove demonstrably unused code and superseded assets when requested. Keep recoverability in Git; preserve active assets, user records, authentication, and useful compatibility safeguards.
- Never commit secrets or auth bypasses. Do not wipe browser storage to refresh the interface.
