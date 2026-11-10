# Mexico Dreamin Donation Portal

Final project for SF Vibe Lab (UADY × Salesforce, Mérida). A public Salesforce site that takes simulated donations so program students can attend Mexico Dreamin 2026. Everything runs in a test scenario: Salesforce Developer Edition, Stripe in test mode and fictitious data.

| | |
|---|---|
| Backlog board | [GitHub Project](https://github.com/users/iGeraQ/projects/7) |
| Public site | _Pending_ |
| Delivery 1 (video and checklist) | [docs/deliveries/delivery-1](docs/deliveries/delivery-1/README.md) |
| Project guide | [Guidelines](https://claude.ai/artifact/92XBSbogpRgFEzUHCS1MZs) (Spanish) |

## Team

| Member | GitHub | Role |
|---|---|---|
| Gerardo Villanueva | [@iGeraQ](https://github.com/iGeraQ) | Backend |
| Mateo Ortiz | [@jeusmateo](https://github.com/jeusmateo) | Backend |
| Juan Poot Escamilla | [@CaballeroEscamilla](https://github.com/CaballeroEscamilla) | Frontend |

## Progress

A story is **met** when all its acceptance criteria are shown with evidence in the test scenario, without breaking minimums M1 to M3. Each story's status is in the board's **AC Status** field, and its label says which delivery it counts toward: `delivery-1` (US-01 to US-12, except US-10) or `delivery-2` (US-13 to US-17). Stories labeled `out-of-scope` (US-10, US-18 to US-20) were captured in discovery but are not part of the scope and do not count.

| Delivery | Date | Calculation | Progress |
|---|---|---|---|
| Delivery 1 | Tue Nov 10, 2026 | Delivery 1 stories met ÷ 11 × 100 | _Pending_ |
| Delivery 2 | Tue Nov 17, 2026 | in-scope stories met across the whole backlog ÷ 16 × 100 | _Pending_ |

## Structure

```
force-app/main/default/    Salesforce metadata (backed up with Salesforce CLI)
docs/
  problem.md               context, problem and scope
  requirements.md          functional and non-functional requirements, constraints
  architecture.md          hybrid approach, data model and access
  seguridad.md             security and personal data
  bitacora_ia.md           AI usage log
  contribucion.md          contribution log per milestone
  preguntas_y_reportes.md  questions and problem reports log
  deliveries/delivery-1/   checklist, video link and delivery material
CLAUDE.md                  context file for the AI
```

The four Spanish file names in `docs/` are required by the course guide, so they keep those names. Their content is in English.

## Branches and commits

- `main`: delivered work only. Each delivery is tagged `entrega-1` / `entrega-2` (tag names required by the guide).
- `develop`: day-to-day integration.
- `release/delivery-1`: Delivery 1 preparation. Merged into `main` through a PR.
- `feature/US-XX-short-name`: one branch per story, created from `develop`.

Commit messages are in English and follow [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`. Example: `feat(US-03): create pending donation before checkout`.

To tag a delivery after merging into `main`:

```bash
git checkout main && git pull && git tag entrega-1 && git push origin entrega-1
```

## Set up the org

The data model in `force-app/` follows `docs/architecture.md`. API names are in English; labels and messages users see are in Spanish.

1. Connect the team's Developer Edition org:

```bash
sf org login web --alias donaciones
```

2. Set the org's language, currency and time zone (Setup → Company Information): default language **Spanish** (the metadata uses Spanish grammatical gender, so a deploy to an English org fails), default locale **Spanish (Mexico)**, currency locale **Spanish (Mexico) – MXN** and time zone **America/Merida**. Amounts are in MXN, and campaign dates close at midnight Mérida time.
3. Add the donation stages to the Opportunity **Stage** picklist (Setup → Object Manager → Opportunity → Fields & Relationships → Stage → New). They must exist before the deploy, because the "Donation" sales process uses them:

| Stage | Type | Probability |
|---|---|---|
| Pending | Open (Pipeline) | 10% |
| Paid | Closed/Won | 100% |
| Expired | Closed/Lost | 0% |

4. Deploy the data model:

```bash
sf project deploy start --source-dir force-app --target-org donaciones
```

5. Optional: relabel the Campaign field "Expected Revenue in Campaign" as "Meta" (Setup → Rename Tabs and Labels).
6. Users: assign each person the permission set of their role. Campaign managers also need the "Marketing User" checkbox on their user.
7. Once the site exists, set the guest user's time zone to America/Merida and assign it "Donaciones · Sitio público" (campaign pages) and "Donaciones · Payment Integration" (applies Stripe's confirmation). Also assign "Donaciones · Payment Integration" (only that one) to the integration user that schedules the pending-donations check. Both are documented in `docs/seguridad.md`.
8. Connect Stripe (#49). The key only lives in Setup, never in the repo:
   - **External Credential** "Stripe": Custom protocol, a named principal `StripeKey` with an authentication parameter `ApiKey` holding the restricted key (`rk_test_…`), and a custom header `Authorization` = `{!'Bearer ' & $Credential.Stripe.ApiKey}`.
   - **Named Credential** "Stripe": URL `https://api.stripe.com`, the External Credential above, "Allow Formulas in HTTP Header" on, "Generate Authorization Header" off.
   - Give the `Stripe-StripeKey` principal access in "Donaciones · Payment Integration", then retrieve the credential metadata and check `git grep rk_test_` finds nothing.
   - Change the custom labels `Stripe_Success_Url` (thank-you page) and `Stripe_Cancel_Url` (cancel page) to the site's URLs (Setup → Custom Labels).
   - In the site settings, choose the default owner for records the guest user creates.
9. Create the general donation campaign with a far end date (for example 2099-12-31), so it is always open (US-08 AC8).

## Metadata backup (weekly and before each delivery)

```bash
sf org login web --alias donaciones
```

```bash
sf project retrieve start --target-org donaciones --metadata CustomObject ApexClass ApexTrigger Flow LightningComponentBundle PermissionSet
```

Add to `--metadata` every type you use, such as the public site's.

## Secrets (minimum M3)

- Stripe keys, even test keys, never go in code, versioned metadata, screenshots, the AI log or AI prompts.
- Review every commit before pushing: the repo is public, and so is its history.
- If a key leaks, roll it in Stripe and tell the instructor the same day.
