# Project context for the AI

Mexico Dreamin Donation Portal, the final project for SF Vibe Lab (UADY × Salesforce). Team of 3. Everything in the repo is in English: docs, issues and commit messages.

## What we are building

- A public Salesforce site with no login: campaigns, each goal's progress, recognition of credited donors and a donation form.
- Three donation types: anonymous, credited (name shown) and invoice (name and RFC, the Mexican tax ID).
- The donation is saved as `Pending` when the form is submitted and is only shown or counted once Stripe confirms the payment (statuses `Pending`, `Paid`, `Expired`; see US-03). Payment goes through Stripe in test mode and ends on a thank-you page. Payment status comes only from Stripe.
- Staff (System Admin, Campaign Manager, Moderator; see `docs/requirements.md`) manages campaigns and reviews donations. Nobody changes amounts or payment status by hand. The donor gets a receipt by email from Salesforce, since Stripe sends none in test mode.
- Delivery 2: automatic confirmation from Stripe's payment notification.

Stories and their acceptance criteria are in the repo issues (US-01 to US-20; US-10 and US-18 to US-20 are out of scope). Each story's source requirement is in the board's Requirement field and in `docs/requirements.md`. The technical design (hybrid approach, data model reusing Campaign and Opportunity, access) is in `docs/architecture.md`.

## Constraints

- Salesforce Developer Edition, one org per team. No paid licenses or add-ons.
- Stripe in test mode only, never activate the account. Currency MXN, or USD if MXN fails.
- Fictitious data only, and only email addresses the team controls.
- Zero cost: check with the instructor before using an AppExchange package or any external service.
- Nothing is published outside the test scenario.

## Working rules

- Never put keys, tokens or personal data in code, versioned metadata, screenshots, the AI log or prompts. The repo is public.
- The guest visitor gets the minimum access needed. Every permission is documented in `docs/seguridad.md`.
- No queries or DML inside loops and no hard-coded IDs. Any Apex has tests and is checked with Code Analyzer.
- On errors, the user sees a clear message and the donation is never left in an inconsistent state.
- Salesforce metadata: API names in English; labels and messages users see in Spanish.
- Commit messages follow Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`), in English.
- Log every relevant AI use in `docs/bitacora_ia.md` as it happens.
