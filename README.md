# Mexico Dreamin Donation Portal

Final project for SF Vibe Lab (UADY × Salesforce, Mérida). A public Salesforce site that takes simulated donations so program students can attend Mexico Dreamin 2026. Everything runs in a test scenario: Salesforce Developer Edition, Stripe in test mode and fictitious data.

| | |
|---|---|
| Backlog board | [GitHub Project](https://github.com/users/iGeraQ/projects/7) |
| Public site | https://wise-hawk-g8sj39-dev-ed.trailblaze.my.site.com/s/ |
| Demo video (5 min) | https://youtu.be/LzqVhyUlHzo |
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
| Delivery 1 | Tue Nov 10, 2026 | Delivery 1 stories met ÷ 11 × 100 | 90% met; 10 of 11 built (Nov 10) |
| Delivery 2 | Tue Nov 17, 2026 | in-scope stories met across the whole backlog ÷ 16 × 100 | In progress: 62.5% met; 10 of 16 (Nov 18) |

### Story status

Copied from the board on Nov 18, 2026; update it when a card changes. Only **AC status** counts toward progress: **Board status** tracks the work, not the evidence.

| Story | Delivery | Board status | AC status |
|---|---|---|---|
| [US-01](https://github.com/iGeraQ/SF-Vibe-Lab-Final-Project/issues/1) Choose a campaign and see its progress | 1 | Done | Met |
| [US-02](https://github.com/iGeraQ/SF-Vibe-Lab-Final-Project/issues/2) Donate anonymously | 1 | Done | Met |
| [US-03](https://github.com/iGeraQ/SF-Vibe-Lab-Final-Project/issues/3) Record the donation before payment | 1 | In Progress | Met |
| [US-04](https://github.com/iGeraQ/SF-Vibe-Lab-Final-Project/issues/4) Thank-you page | 1 | Done | Met |
| [US-05](https://github.com/iGeraQ/SF-Vibe-Lab-Final-Project/issues/5) Appear as a donor | 1 | In Progress | Met |
| [US-06](https://github.com/iGeraQ/SF-Vibe-Lab-Final-Project/issues/6) Enter invoice details | 1 | Done | Met |
| [US-07](https://github.com/iGeraQ/SF-Vibe-Lab-Final-Project/issues/7) Flag invoice requests | 1 | Done | Met |
| [US-08](https://github.com/iGeraQ/SF-Vibe-Lab-Final-Project/issues/8) Manage campaigns | 1 | Done | Met |
| [US-09](https://github.com/iGeraQ/SF-Vibe-Lab-Final-Project/issues/9) View all donations | 1 | Done | Met |
| [US-11](https://github.com/iGeraQ/SF-Vibe-Lab-Final-Project/issues/11) Scoped public site | 1 | Done | Met |
| [US-12](https://github.com/iGeraQ/SF-Vibe-Lab-Final-Project/issues/12) Visitor security test | 1 | Todo | Not met |
| [US-13](https://github.com/iGeraQ/SF-Vibe-Lab-Final-Project/issues/13) Donate any amount | 2 | Done | Not met |
| [US-14](https://github.com/iGeraQ/SF-Vibe-Lab-Final-Project/issues/14) Automatic confirmation and receipt | 2 | Done | Not met |
| [US-15](https://github.com/iGeraQ/SF-Vibe-Lab-Final-Project/issues/15) View automatic confirmations and rejected notifications | 2 | Done | Not met |
| [US-16](https://github.com/iGeraQ/SF-Vibe-Lab-Final-Project/issues/16) Receive the payment notification (minimum level) | 2 | Done | Not met |
| [US-17](https://github.com/iGeraQ/SF-Vibe-Lab-Final-Project/issues/17) Only authentic, non-duplicated notifications (second level) | 2 | Done | Not met |
| **Total** | | | **10 of 16 met (62.5%)** |

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
  deliveries/delivery-2/   Delivery 2 evidence
CLAUDE.md                  context file for the AI
```

The four Spanish file names in `docs/` are required by the course guide, so they keep those names. Their content is in English.

## Branches and commits

- `main`: delivered work only. Each delivery is tagged `entrega-1` / `entrega-2` (tag names required by the guide).
- `develop`: day-to-day integration.
- `release/delivery-1`: Delivery 1 preparation. Merged into `main` through a PR.
- `release/delivery-2`: Delivery 2 preparation, created from `develop`. Merged into `main` through a PR.
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
6. Users: give each person one **permission set group**, the one of their role: "Rol · System Admin", "Rol · Campaign Manager" or "Rol · Moderator". Each group is "Donaciones · Staff base" (what the three share) plus the role's own permission set.
   - Campaign Manager and Moderator users get the **Minimum Access - Salesforce** profile, so they can do only what their group allows. A permission set can add access but never remove what a profile gives.
   - The System Admin keeps the System Administrator profile.
   - Campaign managers also need the "Marketing User" checkbox on their user.
   - The org has one free Salesforce license: for the demo, one "Staff demo" user can switch between the Campaign Manager and Moderator groups and be shown with "Login As".
7. Once the site exists, set the guest user's time zone to America/Merida and assign it "Donaciones · Sitio público" (campaign pages) and "Donaciones · Payment Integration" (applies Stripe's confirmation). Also assign "Donaciones · Payment Integration" (only that one) and access to the Stripe credential to the integration user, and, logged in as that user, schedule the pending-donations check (US-03 AC5) once from the Developer Console → Execute Anonymous: `PendingDonationCheck.scheduleEveryQuarterHour();` Both are documented in `docs/seguridad.md`.
8. Connect Stripe (#49). The key only lives in Setup, never in the repo:
   - **External Credential** "Stripe": Custom protocol, a named principal `StripeKey` with an authentication parameter `ApiKey` holding the restricted key (`rk_test_…`), and a custom header `Authorization` = `{!'Bearer ' & $Credential.Stripe.ApiKey}`.
   - **Named Credential** "Stripe": URL `https://api.stripe.com`, the External Credential above, "Allow Formulas in HTTP Header" on, "Generate Authorization Header" off.
   - Give the `Stripe-StripeKey` principal access in "Donaciones · Payment Integration", then retrieve the credential metadata (`sf project retrieve start --metadata ExternalCredential:Stripe --metadata NamedCredential:Stripe --metadata PermissionSet:Donations_Payment_Integration`) and check that no real key is in the repo or its history: `git grep -E '(rk|sk|whsec)_(test|live)_[A-Za-z0-9]{10,}' $(git rev-list --all)` must find nothing. (A plain `git grep rk_test_` also matches this README's own examples.)
   - Stripe returns the donor to `/s/gracias` (thank-you page) and `/s/pago-no-completado` (cancel page) on the org's Experience Cloud domain. The paths are in the custom labels `Stripe_Success_Url` and `Stripe_Cancel_Url`; change them only if the site uses another path prefix.
   - In the site settings, choose the default owner for records the guest user creates.
9. Create the general donation campaign with a far end date (for example 2099-12-31), so it is always open (US-08 AC8).
10. Receipts (#44): Setup → Organization-Wide Addresses → Add, with display name **Donaciones Mexico Dreamin** and an email the team controls, allowed for all profiles; verify it from the email Salesforce sends. Receipts are sent from it and show it as the support contact (US-11 AC6). Without it, receipts go out from the default sender and without the support line. Email deliverability (Setup → Deliverability) must be "All email".

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
