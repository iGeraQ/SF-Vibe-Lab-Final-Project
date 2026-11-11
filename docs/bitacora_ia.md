# AI usage log

One entry per relevant use, written when it happens, not at the end. Flag the entries where the AI got something wrong and how you caught it. Never paste keys, tokens or personal data into a prompt.

Template:

```markdown
### YYYY-MM-DD · Short title
- **Author:**
- **Tool:**
- **Related story:**
- **What we asked:** the prompt or a summary, with a link if there is one
- **What we got:**
- **What we verified and how:**
- **What we corrected:**
- **AI error:** no / yes, and how we caught it
- **Speed-up:** how long it would have taken without AI
```

## Entries

### 2026-11-07 · Repo structure and initial backlog
- **Author:** @iGeraQ
- **Tool:** Claude Code (Claude Opus 5.5)
- **Related story:** all (repo and backlog setup)
- **What we asked:** create the base repo structure, the Delivery 1 branches, the docs and video folders, and turn the guide's stories into issues on GitHub Projects with the initial documentation. The guide was provided as a PDF.
- **What we got:** a minimal Salesforce DX project, `docs/` with templates, the `develop` and `release/delivery-1` branches, the board with the Requirement, AC Status and Evidence fields, 17 stories (US-01 to US-17) and a Delivery 1 checklist issue.
- **What we verified and how:** _Pending: compare each issue against section 4 of the guide to confirm the minimum criteria kept their meaning in translation._
- **What we corrected:** we asked for everything in English (docs, issues, board and commits) with Conventional Commits. The AI translated it and rewrote the first commit.
- **AI error:** yes, twice. Its first proposal, made before it could read the guide, named a branch `entrega-1`, which clashes with the `entrega-1` tag required by section 8; the AI caught it when reading the guide and the branch became the release branch. It also said GitHub's API could not create board views; when asked for a Kanban view it checked the API, found `createProjectV2View` and created the view with it.
- **Speed-up:** _Pending_

### 2026-11-07 · Backlog refinement from client answers
- **Author:** @iGeraQ
- **Tool:** Claude Code (Claude Opus 5.5) with the Slack connector
- **Related story:** US-01 to US-17
- **What we asked:** read the `#questions` Slack channel, tell us which client questions other teams had already asked and which were answered, then record them in each issue as refinement with a conclusion, together with our notes from the client meeting.
- **What we got:** about 30 questions from three teams, all answered on Nov 4 except a few; a Refinement section (question, client answer, source, conclusion) in 14 issues, open questions in US-08 and US-10, and two out-of-scope items in `docs/problem.md`. It flagged 4 client answers that conflict with the guide (US-03, US-06, US-08, US-10).
- **What we verified and how:** _Pending: check each conclusion against the Slack thread and the meeting notes._
- **What we corrected:** _Pending_
- **AI error:** _Pending_
- **Speed-up:** _Pending_

### 2026-11-07 · Delivery 1 task breakdown
- **Author:** @iGeraQ
- **Tool:** Claude Code (Claude Opus 5.5)
- **Related story:** US-01 to US-12
- **What we asked:** create frontend and backend sub-issues for each Delivery 1 story, without much detail, so each member researches and refines their own cards.
- **What we got:** 22 sub-issues (#19 to #40) labeled `task` plus `frontend` or `backend`, each with a short scope and a "To refine" section, added to the board. The Backlog view now shows only stories, with their sub-issue progress.
- **What we verified and how:** _Pending: each owner checks their task's scope against the story's acceptance criteria and refinement._
- **What we corrected:** _Pending_
- **AI error:** _Pending_
- **Speed-up:** _Pending_

### 2026-11-07 · Own acceptance criteria from the refinement
- **Author:** @iGeraQ
- **Tool:** Claude Code (Claude Opus 5.5)
- **Related story:** US-01 to US-17
- **What we asked:** update the acceptance criteria of every story according to its refinement and add the missing ones.
- **What we got:** 58 own criteria across the 17 stories, 28 of them negative cases; every story has at least one negative case and the three donation types are covered in US-01, US-03, US-04, US-13, US-14 and US-16. The guide's minimum criteria were left unchanged. The four conflicts with the guide stay as "waiting for the instructor" notes instead of criteria.
- **What we verified and how:** _Pending: check that each own criterion is verifiable, does not describe the "how", and does not weaken a minimum criterion._
- **What we corrected:** the AI first put our criteria in a separate "Our own criteria" section. We asked for a single "Acceptance criteria" list, as in a real backlog: the guide's minimum criteria first (same numbers) and ours after them. The issue template was updated the same way.
- **AI error:** _Pending_
- **Speed-up:** _Pending_

### 2026-11-07 · Cross-check with the discovery session video
- **Author:** @iGeraQ
- **Tool:** Claude Code (Claude Opus 5.5), reading the video's auto-generated transcript in the built-in browser
- **Related story:** US-01 to US-20
- **What we asked:** cross-check the roles and the client's answers in the discovery session video (S20, Nov 4) with the backlog, list the questions that are still open, and apply the changes.
- **What we got:** staff roles defined (System Admin, Campaign Manager, Moderator) and mapped to the guide's terms; US-10 (RF-S3) closed as out of scope with its tasks #36 and #37; out-of-scope stories US-18 to US-20; refinement, criteria and task updates in 13 stories and 6 tasks; a new receipt task (#44). Delivery 1 now counts 11 stories.
- **What we verified and how:** _Pending: check the conclusions against the video timestamps cited in each issue._
- **What we corrected:** _Pending_
- **AI error:** yes. From our meeting notes ("el System la cantidad y el status") the AI wrote that only the System Admin could change a donation's amount and status. The video shows the client meant the system, that is the payment gateway, and that no person should change them. Caught when cross-checking the video.
- **Speed-up:** _Pending_

### 2026-11-07 · Stripe setup issues
- **Author:** @iGeraQ
- **Tool:** Claude Code (Claude Opus 5.5), checking Stripe's official docs
- **Related story:** US-03, US-04, US-13, US-14, US-16, US-17
- **What we asked:** create the issues to configure a new Stripe account so implementation runs without problems.
- **What we got:** setup issue #45 with six steps (#46 to #51): account and sandbox, API keys and secret storage, Checkout settings, Salesforce connection, test cards and CLI, and the Delivery 2 webhook. Facts checked in Stripe's docs: new accounts start in a sandbox, restricted keys work in test, `expires_at` ranges from 30 minutes to 24 hours, `es-419` locale, the Mexico test card, and webhook signatures in the `Stripe-Signature` header.
- **What we verified and how:** _Pending: follow the steps on the real account and note any difference in each issue._
- **What we corrected:** _Pending_
- **AI error:** _Pending_
- **Speed-up:** _Pending_

### 2026-11-07 · Client questions and the US-03 decision
- **Author:** @iGeraQ
- **Tool:** Claude Code (Claude Opus 5.5)
- **Related story:** US-02, US-03, US-05, US-06, US-11
- **What we asked:** draft the open questions for the client as consultants, and explain how the recommended donation flow would work.
- **What we got:** a short message with the questions in prose, each with our suggestion and its requirement, and a step-by-step flow for US-03 (statuses `Pending`, `Paid`, `Expired`).
- **What we verified and how:** _Pending_
- **What we corrected:** the AI first wrote the questions as A/B options and included one about when the donation is created. We asked for prose and suggestions instead of options, and dropped that question: RF-D3 is clear and the flow already covers the client's concern, so the team decided it and recorded it in US-03.
- **AI error:** _Pending_
- **Speed-up:** _Pending_

### 2026-11-08 · Technology choice and data model
- **Author:** @iGeraQ
- **Tool:** Claude Code (Claude Opus 5.5)
- **Related story:** US-01 to US-17
- **What we asked:** recommend which Salesforce technologies to use, compare a declarative and a code approach, and design the data model reusing standard objects to avoid redundancy.
- **What we got:** a hybrid approach (Flows and configuration for most of the solution; Apex for Stripe and the webhook; LWC for the public campaign pages) and `docs/architecture.md`: Campaign for campaigns, Opportunity with a "Donation" record type for donations, `Payment_Notice__c` for Stripe notices, permission sets per role, and the risks to check first.
- **What we verified and how:** _Pending: build the objects in the org and confirm the standard fields behave as described (raised amount roll-up, stages, Marketing User)._
- **What we corrected:** _Pending_
- **AI error:** _Pending_
- **Speed-up:** _Pending_

### 2026-11-08 · Data model metadata
- **Author:** @iGeraQ
- **Tool:** Claude Code (Claude Opus 5.5)
- **Related story:** US-01 to US-09, US-15, US-17
- **What we asked:** generate the Salesforce metadata for the data model in `docs/architecture.md`.
- **What we got:** 42 metadata files in `force-app/`: custom fields on Campaign and Opportunity, the "Donation" record type and sales process, the `Payment_Notice__c` object, 7 validation rules (email, public name, invoice data, RFC pattern, consent, anonymous without invoice, locked payment fields), the `Donation_Payment_Updates` custom permission and 4 permission sets. Checked locally: every file is well-formed XML and the project converts to Metadata API format. It was not deployed: no org of the team was connected.
- **What we verified and how:** _Pending: deploy to the team's Developer Edition org and test each validation rule with valid and invalid data._
- **What we corrected:** _Pending_
- **AI error:** _Pending_
- **Speed-up:** _Pending_

### 2026-11-09 · Client answers in the backlog
- **Author:** @iGeraQ
- **Tool:** Claude Code (Claude Opus 5.5)
- **Related story:** US-02, US-05, US-06, US-11
- **What we asked:** find the instructor's answers in Slack #questions and update the stories and tasks that were waiting for them.
- **What we got:** new and changed acceptance criteria (US-02 AC3, AC5, AC7; US-05 AC8; US-06 AC9; US-11 AC6), a refinement entry per answer, scope notes in tasks #22, #26, #27, #29 and #44, the entry in `docs/preguntas_y_reportes.md`, and the `Anonymous_Without_Invoice` validation rule removed.
- **What we verified and how:** each issue body read back from GitHub after the edit and compared with the text we sent.
- **What we corrected:** _Pending_
- **AI error:** _Pending_
- **Speed-up:** _Pending_

### 2026-11-09 · Data model review against the acceptance criteria
- **Author:** @iGeraQ
- **Tool:** Claude Code (Claude Opus 5.5)
- **Related story:** US-01, US-03, US-05, US-06, US-08, US-09
- **What we asked:** review PR #53 for gaps and behavior that does not match the stories and their acceptance criteria, then fix what it found.
- **What we got:** 15 findings and their fixes: `Modify All` without `Delete` would fail the deploy; a donation could be created as `Paid`; the payment lock did not cover the campaign; rules could be skipped with another record type; campaigns had no required fields (US-08 AC3); no donation type field (US-09 AC1); credited donations did not require a name (US-03); invoice errors did not say what was missing (US-06 AC1); the Moderator could not hide a donor; System Admin could edit Stripe and consent fields; a schedule-triggered flow can't hold the payment permission; setup missed currency and time zone; `docs/seguridad.md` lacked the guest permission.
- **What we verified and how:** XML well-formed and the project converts to Metadata API format (10 validation rules). Not deployed yet. The `Modify All` and Automated Process findings come from platform rules, not from a test in the org.
- **What we corrected:** we chose the defaults for the open design points: the general campaign uses a far end date, the Moderator hides a donor by marking the donation anonymous, and the scheduled check is Apex run by an integration user.
- **AI error:** the first data model version allowed the issues above; the review caught them before the deploy.
- **Speed-up:** _Pending_

### 2026-11-09 · Public site controller
- **Author:** @iGeraQ
- **Tool:** Claude Code (Claude Opus 5.5)
- **Related story:** US-01, US-05
- **What we asked:** the read-only Apex controller the campaign pages use: active and past campaigns with progress, and per-campaign recognition with the anonymous total.
- **What we got:** `PublicCampaignController` (three cacheable methods that return only public fields), `PublicCampaignControllerTest` (10 tests, including one that checks no email, real name or RFC leaves the class) and the "Donaciones · Sitio público" permission set for the guest user.
- **What we verified and how:** _Pending: run the tests in the team org. Code Analyzer run locally._
- **What we corrected:** a review of PR #54 found that the guest could call the methods directly and get more than the site shows: `getRecognition(null)` returned donations without a campaign, any campaign id returned its donors, and past campaigns included any ended campaign (such as the Developer Edition's sample campaigns). Now only public donation campaigns are returned, the recognition filters the Donation record type, progress is computed in Apex, and the methods are not cacheable so progress is current after a payment (US-01 AC2).
- **AI error:** the first version trusted the page to send a valid public campaign id; the guest can call the class directly.
- **Speed-up:** _Pending_

### 2026-11-09 · Stripe checkout
- **Author:** @iGeraQ
- **Tool:** Claude Code (Claude Opus 5.5)
- **Related story:** US-03, US-04
- **What we asked:** the Apex the donation form and the thank-you page call: create the Stripe Checkout Session and the pending donation, and confirm the payment when the donor returns. Plan in #24.
- **What we got:** `DonationCheckoutService` (`startCheckout` and `confirmCheckout`), 13 tests with a mocked Stripe, the `Stripe_Success_Url` and `Stripe_Cancel_Url` labels, and `Donation_Reference__c` changed from auto-number to text: Salesforce allows no callout after DML, so Stripe is called before saving and the reference is generated in Apex.
- **What we verified and how:** _Pending: run the tests in the team org and make a test payment once the Stripe credential exists (#49)._
- **What we corrected:** _Pending_
- **AI error:** _Pending_
- **Speed-up:** _Pending_

### 2026-11-09 · First validation in the team org
- **Author:** @iGeraQ
- **Tool:** Claude Code (Claude Opus 5.5)
- **Related story:** US-01, US-03, US-04, US-05
- **What we asked:** run a check-only deploy (`--dry-run`) in the team org with the controller and checkout tests, and fix what failed.
- **What we got:** the deploy validates and the 22 tests pass (coverage: `PublicCampaignController` 100%, `DonationCheckoutService` 96%). Fixes: the Opportunity sales process can't have a default value; `startsWith` doesn't exist in Spanish (we keep `gender`, so the org must be in Spanish); a permission set description was over 255 characters; test users need "Marketing User" to create campaigns; with API version 67, plain SOQL and DML check field access, so test data and helper queries run in system mode; `getPastCampaigns` failed on an empty list (`add(0, ...)`).
- **What we verified and how:** `sf project deploy start --dry-run --test-level RunSpecifiedTests` in the team org, until it succeeded.
- **What we corrected:** the AI assumed plain Apex SOQL and DML skip field access, as in older API versions; the org showed otherwise.
- **AI error:** `List.add(0, element)` on an empty list, and test users without "Marketing User".
- **Speed-up:** _Pending_

### 2026-11-09 · Payment gateway as a dependency
- **Author:** @iGeraQ
- **Tool:** Claude Code (Claude Opus 5.5)
- **Related story:** US-03, US-04
- **What we asked:** refactor the Stripe calls: a `StripeClient` that extends a payment gateway provider, with one method per operation instead of a generic `callStripe`, injected into the service.
- **What we got:** `PaymentGateway` (abstract class with `createCheckoutSession` and `getCheckoutSession`, and gateway-neutral request and session types), `StripeClient` (its Stripe implementation; it knows the form encoding, cents, `es-419` and the `{CHECKOUT_SESSION_ID}` placeholder) and `DonationCheckoutService` receiving the gateway through a `@TestVisible` static field. `StripeClientTest` checks the Stripe requests with a mocked callout; the service tests use a fake gateway, so they make no callouts.
- **What we verified and how:** _Pending: run the three test classes in the team org._
- **What we corrected:** _Pending_
- **AI error:** _Pending_
- **Speed-up:** _Pending_

### 2026-11-09 · Receipt email
- **Author:** @iGeraQ
- **Tool:** Claude Code (Claude Opus 5.5)
- **Related story:** US-14, US-02, US-11 (task #44)
- **What we asked:** send the donor's receipt in Spanish when a donation becomes paid, coordinating files and commits with the other AI session that was refactoring the Stripe client in the same branch.
- **What we got:** `DonationTrigger` and `DonationReceiptService`: when a donation becomes `Paid`, `Receipt_Sent__c` is set and one plain-text receipt is sent with the reference, campaign, amount, date, donation type and, if not anonymous, the donor's name. The sender and support email come from an Org-Wide Email Address set up in Setup, so no address is in the repo. A failed send never undoes the payment: the flag goes back to false. `DonationReceiptServiceTest` has 6 tests.
- **What we verified and how:** check-only deploy in the team org with the four test classes: 32 tests pass; coverage `DonationReceiptService` 88%, `DonationTrigger` 100%. Code Analyzer: only low-severity `runAs` notices.
- **What we corrected:** the AI used a trigger instead of the record-triggered Flow in `docs/architecture.md`, because a hand-written Flow is hard to test; Code Analyzer asked to move the trigger's branching into the class and to split the send step.
- **AI error:** _Pending_
- **Speed-up:** _Pending_

### 2026-11-09 · Bulk confirmation for the scheduled check
- **Author:** @iGeraQ
- **Tool:** Claude Code (Claude Opus 5.5)
- **Related story:** US-03
- **What we asked:** a bulk version of the payment confirmation for the scheduled check of pending and expired donations, agreed with the session that writes the scheduled job.
- **What we got:** `DonationCheckoutService.applyGatewayStatus(donations, source)`: one gateway call per pending donation, one update with partial success, and a session the gateway can't read stays `Pending` for the next run. Plus the `Scheduled_Check` value of `Confirmation_Source__c` and 3 tests with a fake gateway.
- **What we verified and how:** _Pending: run the tests in the team org._
- **What we corrected:** _Pending_
- **AI error:** _Pending_
- **Speed-up:** _Pending_

### 2026-11-09 · Scheduled check for pending donations
- **Author:** @iGeraQ
- **Tool:** Claude Code (Claude Opus 5.5)
- **Related story:** US-03 (AC5 and refinement 2), US-14
- **What we asked:** a scheduled check that applies Stripe's status to pending donations the thank-you page never confirmed, reusing the bulk `applyGatewayStatus` the other AI session added to `DonationCheckoutService`.
- **What we got:** `PendingDonationCheck`, a Queueable with callouts that takes up to 100 pending donations older than 5 minutes and passes them to `applyGatewayStatus` with source `Scheduled_Check`; its inner `ScheduledRun` queues it, and `scheduleEveryQuarterHour()` schedules it at minutes 00, 15, 30 and 45. Paid donations then get their receipt from `DonationTrigger`. `PendingDonationCheckTest` has 4 tests with a fake gateway.
- **What we verified and how:** check-only deploy in the team org with the five test classes: 39 tests pass; coverage `PendingDonationCheck` 100%.
- **What we corrected:** the first version implemented `Queueable` and `Schedulable` in one class, which Salesforce rejects; the schedulable part moved to an inner class. One test ran the real Stripe client at `Test.stopTest()` until it got the fake gateway too.
- **AI error:** the `Queueable` plus `Schedulable` combination above.
- **Speed-up:** _Pending_

### 2026-11-10 · Staff roles as permission set groups
- **Author:** @iGeraQ
- **Tool:** Claude Code (Claude Opus 5.5)
- **Related story:** US-05, US-08, US-09
- **What we asked:** explain how the roles are covered, and fix the access gap it showed.
- **What we got:** the role permission sets only granted custom fields, so with a minimal profile a Campaign Manager couldn't fill dates or goal and nobody saw a donation's amount or campaign; with Standard User the profile gave too much. We chose a shared "Donaciones · Staff base" permission set plus one permission set group per role, with the Minimum Access - Salesforce profile for Campaign Manager and Moderator, and `StaffRolesTest` (7 tests in user mode for US-05 AC7, US-08 AC1, AC3, AC6 and US-09 AC1 to AC4).
- **What we verified and how:** check-only deploy to the team org: the groups validate and the 46 tests pass.
- **What we corrected:** _Pending_
- **AI error:** the first permission sets missed standard field access; it only showed up when we asked how each role works with a minimal profile.
- **Speed-up:** _Pending_

### 2026-11-10 · Stripe credential in the org
- **Author:** @iGeraQ
- **Tool:** Claude Code (Claude Opus 5.5)
- **Related story:** US-03 (#49)
- **What we asked:** the exact Setup steps to store the Stripe key, help with a failed test callout, and a check that the key is not in the repo.
- **What we got:** the External Credential, Named Credential and principal access steps; the callout failed because nobody had the "Donaciones · Payment Integration" permission set; and a key check that only matches real keys, run over the files and the whole history.
- **What we verified and how:** the retrieved credential metadata has no key, and the check found nothing in any commit.
- **What we corrected:** the README's `git grep rk_test_` check matched its own examples; it now uses a pattern for real keys and also searches the history.
- **AI error:** the first check command we wrote in the README gave false matches.
- **Speed-up:** _Pending_

### 2026-11-10 · Simulated invoice PDF
- **Author:** @iGeraQ
- **Tool:** Claude Code (Claude Opus 5.5)
- **Related story:** US-06 (#29)
- **What we asked:** send the simulated invoice by email with a PDF attached.
- **What we got:** when a donation that asked for an invoice becomes paid, the receipt email carries `Factura-simulada-<reference>.pdf` (made with `Blob.toPdf`): folio, date, fictitious issuer, recipient, RFC, person type, concept and total, and "No es un comprobante fiscal (CFDI)". One email per donation, sent once with the receipt's existing flag. 5 new tests in `DonationReceiptServiceTest`, including one that escapes donor text.
- **What we verified and how:** check-only deploy to the team org: 51 tests pass; `DonationReceiptService` coverage 92%. The PDF is generated inside the trigger without errors.
- **What we corrected:** one test expected accented text, but `escapeHtml4` turns accents into HTML entities (the PDF shows them correctly); the test now compares the unescaped text.
- **AI error:** see the correction above.
- **Speed-up:** _Pending_
