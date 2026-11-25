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

### 2026-11-08 · Backlog review for the frontend tasks
- **Author:** @CaballeroEscamilla
- **Tool:** Claude (Claude Opus 5.5) with the GitHub CLI, read only
- **Related story:** #19, #21, #23, #25, #26, #28, #30, #32, #34, #38
- **What we asked:** read the repo docs (`main` and `develop`) and every issue, to understand how the backlog is organized and what the frontend tasks need.
- **What we got:** a summary of the 51 issues (20 stories, the Delivery 1 checklist, 22 tasks and the Stripe setup) and a detailed read of the 11 Delivery 1 stories and the 10 frontend tasks. Findings: the 10 frontend tasks had an empty "To refine" section; US-06 AC8 (invoice sent by email automatically) contradicts the US-07 conclusion (sending the invoice is out of scope); US-05 says "no blocklist", which clashes with the moderation we wanted; an empty state for "no active campaign" is not in the backlog, and US-08 AC8 says the general campaign is always open.
- **What we verified and how:** each finding was checked against the text of the issue it cites.
- **What we corrected:** nothing; the findings were inputs for the next documents.
- **AI error:** no
- **Speed-up:** _Pending_

### 2026-11-08 · Organization of the visual layer
- **Author:** @CaballeroEscamilla
- **Tool:** Claude (Claude Opus 5.5)
- **Related story:** US-01 to US-12
- **What we asked:** describe in text, without visual design, how the donor site and the staff app should be organized.
- **What we got:** a document with the principles, the public site map (7 pages plus the not found page), the content of each page, the 4-step form with its fields per donation type, the donor flow, the staff app (Campaigns, Donations and Notices tabs, views, record pages and permissions per role), the staff flows, the emails, a table of pages against frontend tasks and open points.
- **What we verified and how:** every element cites the story and criterion it covers. The AI marked its own assumptions: the form as a separate 4-step page, and the Campaign Manager not seeing rejected notices.
- **What we corrected:** _Pending_
- **AI error:** no
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

### 2026-11-09 · Plan from the designs to Salesforce
- **Author:** @CaballeroEscamilla
- **Tool:** Claude (Claude Opus 5.5)
- **Related story:** US-01 to US-12
- **What we asked:** plan how to move the public site and staff design proposals to Salesforce, taking into account the client answers of Nov 9 (an anonymous donor can ask for an invoice, anonymous donations are added up and shown apart in the recognition, support email in the receipt from Delivery 1).
- **What we got:** a plan with the changes from the client answers, what moves from the designs and what doesn't, the Salesforce piece for each public page and each staff view, the work order until Delivery 1, the risks and what the frontend needs from the backend.
- **What we verified and how:** the AI read both prototypes, `docs/architecture.md` and the `feature/data-model` branch. It flagged three things to check: the `Anonymous_Without_Invoice` validation rule contradicts client answer 1; the staff prototype locks the goal, which contradicts US-08 AC2; the prototypes use fictitious names and dates (Puentes Tech, 2027) instead of Mexico Dreamin 2026.
- **What we corrected:** _Pending_
- **AI error:** no
- **Speed-up:** _Pending_

### 2026-11-09 · Public site components
- **Author:** @CaballeroEscamilla
- **Tool:** Claude (Claude Opus 5.5)
- **Related story:** US-01, US-02, US-04, US-11 (#19, #21, #23, #25, #26, #28, #38)
- **What we asked:** implement the public site from the plan, after reading the issues again.
- **What we got:** LWC for the header, footer, active and past campaign lists, campaign page, recognition with the anonymous donors row, the 4-step form, the thank-you page, the payment not completed page and the not found page, with every text as a Spanish Custom Label. Step 2 of the form asks two separate questions (appear in the list, ask for an invoice). The form is an LWC, not a Screen Flow (plan B in `architecture.md`), because the design doesn't fit Flow screens.
- **What we verified and how:** the AI re-read the issues and PRs first: the data model was already in `develop` (PR #53), `PublicCampaignController` was in review (PR #54) and `DonationCheckoutService` didn't exist yet. A credited donor is asked for first and last name or company, besides the public name, because the `Donor_Name_Required` rule requires it.
- **What we corrected:** see the next three entries.
- **AI error:** see the next three entries.
- **Speed-up:** _Pending_

### 2026-11-09 · Unit tests for the public site
- **Author:** @CaballeroEscamilla
- **Tool:** Claude (Claude Opus 5.5)
- **Related story:** US-01, US-02, US-04, US-11
- **What we asked:** add unit tests, since they count in the evaluation.
- **What we got:** Jest tests with `sfdx-lwc-jest`, one file per component, each test naming the acceptance criterion it covers, plus ESLint with Salesforce's LWC rules.
- **What we verified and how:** all tests and the linter run clean, with coverage over the 90% threshold.
- **What we corrected:** a test found a real bug: the form moved the focus to the first field with an error before the errors were on screen. It now moves the focus after the render.
- **AI error:** yes. The AI's own form code had the focus bug; its own test caught it.
- **Speed-up:** _Pending_

### 2026-11-09 · Frontend on its own branch with fictitious data
- **Author:** @CaballeroEscamilla
- **Tool:** Claude (Claude Opus 5.5)
- **Related story:** US-01, US-04
- **What we asked:** put the frontend on its own branch from `develop`, working with fictitious data and without depending on the backend.
- **What we got:** all data access goes through one module, `donationDataService`, which answers with fictitious data shaped like the controller's; connecting the backend only changes that file (`docs/public-site.md`). In fictitious mode an email starting with `cancelar@` goes to payment not completed and one with `error@` shows the form error, so every path can be recorded without Stripe.
- **What we verified and how:** the tests pass with no Apex class in the project.
- **What we corrected:** the first version was built on the backend branch and imported Apex classes that didn't exist yet.
- **AI error:** yes. Juan caught that the work was on the wrong branch and depended on unfinished backend code.
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

### 2026-11-10 · Styled receipt email
- **Author:** @iGeraQ
- **Tool:** Claude Code (Claude Sonnet 5.5)
- **Related story:** US-14, US-06 (#44, #29)
- **What we asked:** the receipt arrived as bare plain text; make it an email worthy of a donation platform.
- **What we got:** `DonationEmailTemplate` (new) builds an HTML email with tables and inline styles in Spanish, a plain-text fallback, and a styled simulated invoice PDF. The layout follows a payment-receipt look the team pasted as reference (demo ribbon, strong-blue header, title with receipt number, key data row, summary box, contact and legal lines), with a stronger blue and none of the reference's images, logo or brand name; the PDF has the same look. `DonationReceiptService` keeps only the when and to whom. 12 new tests in `DonationEmailTemplateTest`; donor text is escaped and an anonymous receipt still shows no name.
- **What we verified and how:** we deployed the classes to the team org and rendered the real email and PDF with a donation already paid there (a desktop and a phone-width view of the email, and the PDF). Check-only deploy: 63 tests pass; `DonationEmailTemplate` coverage 99%. We did not check Gmail, Outlook or dark mode.
- **What we corrected:** the amount showed as `$500` because `Decimal.format()` drops trailing zeros; it is now built by hand ($500.00, $1,234,567.50), independent of the sender's locale. In the second design a divider came out red: Apex is case-insensitive and a local variable `line` shadowed the `LINE` color constant.
- **AI error:** the amount format and the shadowed color constant; the preview caught both, the tests did not.
- **Speed-up:** _Pending_

### 2026-11-10 · Personal data classification and Stripe notes
- **Author:** @iGeraQ
- **Tool:** Claude Code (Claude Sonnet 5.5)
- **Related story:** US-02, US-05, US-06, US-09, US-12 (#40, #50)
- **What we asked:** fill section 4 of `docs/seguridad.md` (personal data) and write `docs/stripe.md` with the test cards.
- **What we got:** the table of what is stored for each kind of donor data, why, and who sees it (staff, the donor, the public site), plus what goes to Stripe and what the email carries; and `docs/stripe.md` with the cards, the Checkout settings and the CLI commands.
- **What we verified and how:** each row was written from the fields in `force-app/` and from what `PublicCampaignController`, `DonationCheckoutService` and the email templates send. The card numbers come from Stripe's public test list. Not re-checked against a visitor test yet (#40).
- **What we corrected:** _Pending_
- **AI error:** _Pending_
- **Speed-up:** _Pending_

### 2026-11-10 · First run of the test plan
- **Author:** @iGeraQ
- **Tool:** Claude Code (Claude Sonnet 5.5)
- **Related story:** US-01 to US-09, US-11, US-12, US-14
- **What we asked:** start running `docs/test_plan.md`, document the findings and fix what could be fixed.
- **What we got:** `docs/test_results.md` with the run (Apex 52 of 55 pass, Jest 112 of 112, a 34-case validation matrix and the public controller checks in the org, E2E and Security blocked) and 12 findings. Code fixes, written but not yet validated in the org because deploys are blocked by scheduled jobs: the receipt is sent from the Org-Wide Email Address only when it is verified (it isn't, so no receipt was reaching donors), the schedule test no longer counts the org's real jobs, the Stripe payment carries the donation reference, and `DonationRulesTest` (7 tests) keeps the validation matrix from regressing.
- **What we verified and how:** the matrix and the public controller checks ran in the team org as anonymous Apex with a rollback (0 records left); the site check ran in the built-in browser as a visitor; the site, the receipt sender, the scheduled jobs and the guest user were read from the org. The code fixes passed Code Analyzer and compile only when deployed: _Pending until the deploy is allowed_.
- **What we corrected:** the AI first read the 60 "Queued" rows of `AsyncApexJob` as stuck jobs; they are the schedules themselves (`ScheduledApex`). It also gave a wrong clock for when the Stripe session would expire and had to wait; the check by hand then showed the logic works and the schedules are what fails (R-13, cause not determined). It also assumed anonymous Apex could run DML in system mode and call `AuraHandledException` code paths; both fail there, so those checks stayed in Apex tests.
- **AI error:** the first matrix script didn't compile (a placeholder line, and method declarations aren't allowed in anonymous Apex).
- **Speed-up:** _Pending_

### 2026-11-10 · Frontend contract against the real backend
- **Author:** @CaballeroEscamilla
- **Tool:** Claude (Claude Opus 5.5)
- **Related story:** US-01, US-04 (#21, #25, #28)
- **What we asked:** review the frontend files for errors.
- **What we got:** comparing with `develop` after PR #55, four differences with the real backend: the form sent `isAnonymous` and `invoiceRequested` instead of `anonymous` and `invoice`; the thank-you page called `confirmReturn` and expected the campaign name, but the service has `confirmCheckout`, which returns the status; the fictitious mode only accepted suggested amounts while the service accepts from $10 MXN; and the frontend labels file would have replaced the backend's `Stripe_Success_Url` and `Stripe_Cancel_Url`.
- **What we verified and how:** each difference was checked against the `DonationCheckoutService` code in `develop`; the four were fixed and the tests updated.
- **What we corrected:** the four differences. Pending for the team: `Stripe_Cancel_Url` must point to the `pago-no-completado` page.
- **AI error:** yes. The AI had invented the `DonationCheckoutService` contract instead of waiting for the backend's; it caught the differences when asked to review.
- **Speed-up:** _Pending_

### 2026-11-10 · Invalid style binding in campaignCard
- **Author:** @CaballeroEscamilla
- **Tool:** Claude (Claude Opus 5.5)
- **Related story:** US-01 (#19)
- **What we asked:** fix the error VS Code showed in `campaignCard.html`, line 37.
- **What we got:** the cause was `style={campaign.barStyle}`: the editor validates the `style` attribute as CSS, and an LWC expression isn't CSS. The same pattern was in three other places. The progress bars are now a `progressBar` component that sets the width from JavaScript, and the recognition sets its animation duration the same way.
- **What we verified and how:** no `style={...}` is left in any template; tests and linter pass.
- **What we corrected:** the four bindings.
- **AI error:** yes. Juan found the error in VS Code; the AI's previous review had missed it.
- **Speed-up:** _Pending_

### 2026-11-10 · Staff app configuration
- **Author:** @CaballeroEscamilla
- **Tool:** Claude (Claude Opus 5.5)
- **Related story:** US-07, US-08, US-09 (#30, #32, #34)
- **What we asked:** build the staff app.
- **What we got:** the AI walked through the "Staff A" prototype with the three roles and moved it to configuration, as the plan said: the "Donaciones Mexico Dreamin" Lightning app, 4 campaign list views and 6 donation list views (including "Solicitan factura" with name, RFC, person type and consent) and two record pages with Dynamic Forms. The Invoice section only shows when an invoice was requested. The prototype's login is the org's standard login, and its role switcher is replaced by three test users.
- **What we verified and how:** XML checked for well-formedness and every field checked against the objects in `develop`. Only list view columns found in reference projects were used, so the campaign goal is on the record page, not in the list. The deploy was not tested in this session.
- **What we corrected:** the app was added to `Donations_Staff_Base`, a backend file; flagged to the team.
- **AI error:** yes. The AI delivered only configuration without saying it didn't follow the design's visual style; Juan caught it (next entry).
- **Speed-up:** _Pending_

### 2026-11-10 · Staff app components
- **Author:** @CaballeroEscamilla
- **Tool:** Claude (Claude Opus 5.5)
- **Related story:** US-07, US-08, US-09 (#30, #32, #34)
- **What we asked:** add LWC with the design's style for everything possible in the staff app.
- **What we got:** 7 LWC with the "Staff A" look: "Campañas" and "Donaciones" tabs with the design's tabs and counts, the campaign progress and situation card, the campaign donations, the donation summary and payment card, and the donor card, where only users with field permission (the Moderator) get the input to change the public name. They read through GraphQL and Lightning Data Service with no Apex, so the user's permissions apply and no backend code changes. Editing campaigns stays on the standard forms, which apply the validation rules. 80 staff Custom Labels.
- **What we verified and how:** 77 new Jest tests (197 in total, 99% of lines) and a clean linter. The GraphQL queries were only tested with fictitious data before the deploy.
- **What we corrected:** Jest coverage showed 0% on Node 22 with the default provider; it was switched to `coverageProvider: 'v8'`.
- **AI error:** no
- **Speed-up:** _Pending_

### 2026-11-10 · Public site connected to the Apex backend
- **Author:** @CaballeroEscamilla
- **Tool:** Claude Code (Claude Opus 5.5)
- **Related story:** US-01, US-03, US-04, US-05 (#19, #23, #25, #26)
- **What we asked:** connect the public site to the backend that was already in `develop`, and later check whether the new backend commits (receipt email, simulated invoice, Stripe credential, staff role groups) needed frontend changes.
- **What we got:** `donationDataService` now calls `PublicCampaignController` (`getActiveCampaigns`, `getPastCampaigns`, `getRecognition`) and `DonationCheckoutService` (`startCheckout`, `confirmCheckout`) imperatively, because those methods are not cacheable. The fictitious data module was removed, the service tests now mock the Apex imports, and `docs/public-site.md` describes the full deploy and org setup. The review of the new backend commits found no new `@AuraEnabled` methods, no change to `DonationRequest` and no change to guest access, so no frontend change was needed.
- **What we verified and how:** Jest (111 tests) and the linter. After the deploy, the campaign page in the site preview showed the real "Donación general" figures from the org. The method names and shapes were compared with the Apex classes.
- **What we corrected:** _Pending_
- **AI error:** yes, found later. The connection was only tested with mocked Apex imports. A real submission on 2026-11-11 showed that `startCheckout` receives an empty request (see "Test donation through the site").
- **Speed-up:** _Pending_

### 2026-11-10 · Logo for the donation form wizard
- **Author:** @CaballeroEscamilla
- **Tool:** Claude Code (Claude Opus 5.5)
- **Related story:** US-01 (#21)
- **What we asked:** design a logo to show in the donation form wizard.
- **What we got:** three original concepts in the site's colors, shown on a mock of the wizard header. Juan chose "mano que impulsa" (a hand offering a star). It is inline SVG in `donationForm`, next to the program name, using the site's design tokens and hidden from screen readers, so it needs no static resource or extra guest access. The AI also exported it as SVG and PNG files for other uses. It was designed on purpose not to imitate the official Mexico Dreamin' event logo.
- **What we verified and how:** a new Jest test (112 in total) and the linter. Checked in the site preview on the "Donar" page.
- **What we corrected:** _Pending_
- **AI error:** no
- **Speed-up:** _Pending_

### 2026-11-10 · Experience Cloud site setup
- **Author:** @CaballeroEscamilla
- **Tool:** Claude Code (Claude Opus 5.5) with Claude in Chrome and the Salesforce CLI
- **Related story:** US-11, US-01, US-04 (#38)
- **What we asked:** find out why the deployed components didn't show, and then build the site pages in Experience Builder.
- **What we got:**
  - The first diagnosis: the org had no Experience Cloud site yet and still had the version of the components with fictitious data.
  - Once the site existed, the AI created the "Campaña", "Donar", "Gracias", "Pago no completado" and "Campañas pasadas" pages (one full-width column, with the URLs the components link to) and set "Campañas pasadas" to past mode.
  - It hid the header's search and notifications and removed the default English error component.
  - It assigned "Donaciones · Sitio público" and "Donaciones · Payment Integration" to the site guest user, after Juan approved each one.
  - It found why visitors were sent to the login page: Public Access was off, and the Home page of the Customer Account Portal template requires login by default.
- **What we verified and how:**
  - Each page checked in the preview and then on the published site as a visitor: campaign, donation form, thank-you, payment not completed, past campaigns and the error page.
  - Permission set assignments confirmed with SOQL.
- **What we corrected:**
  - Juan dragged the components onto the pages, because Experience Builder did not accept automated drag and drop.
  - Juan turned on Public Access, because enabling it from the AI was blocked as a permission change.
  - Pending: a duplicated footer on Home.
- **AI error:** yes. "Hide the header region" also hid our `siteHeader`; the AI saw it in the builder and undid it, then hid only the search and notifications.
- **Speed-up:** _Pending_

### 2026-11-10 · Staff app deploy and navigation
- **Author:** @CaballeroEscamilla
- **Tool:** Claude Code (Claude Opus 5.5) with Claude in Chrome and the Salesforce CLI
- **Related story:** US-07, US-08, US-09 (#30, #32, #34)
- **What we asked:** build the staff app pages in the org.
- **What we got:**
  - The staff metadata was not in the org (checked in Setup and with the CLI), so the AI deployed it in the order of `docs/staff-app.md`.
  - The record pages arrived ready through the app's overrides, so nothing had to be built in Lightning App Builder.
  - The admin user needed the System Admin role group to open the app; the AI assigned it after Juan approved.
  - It renamed the Opportunity tab to "Donación" / "Donaciones". That left two "Donaciones" tabs, so it removed the standard Campaign and Opportunity tabs from the app and turned off temporary tabs.
- **What we verified and how:** opened the app in Chrome. The campaign and donation lists showed the org's counts, and the campaign and donation pages showed every card and section. Checked the navigation after the rename, including with a record open.
- **What we corrected:** the duplicated "Donaciones" tab, and the guide now says the list views open from the App Launcher.
- **AI error:** yes, minor. The AI suggested renaming the Opportunity tab without expecting the duplicated tab name; it noticed it when checking the result.
- **Speed-up:** _Pending_

### 2026-11-11 · Campaign images and card buttons
- **Author:** @CaballeroEscamilla
- **Tool:** Claude Code (Claude Opus 5.5) with Claude in Chrome
- **Related story:** US-01 (#19)
- **What we asked:** find out why no campaign image showed; then serve the images from Salesforce, show a placeholder when an image fails, and fix the "Ver campaña" button wrapping to a second line.
- **What we got:**
  - The diagnosis: the images were external URLs. `placehold.co` was blocked by the site's Content Security Policy (`img-src`), and one URL pointed to an image that doesn't exist.
  - Four original fictitious SVGs in a public `Donation_Campaign_Images` static resource. `Image_URL__c` now accepts a file name, which `donationUtils.campaignImageUrl` turns into the resource's address; a full https address still works, and anything else is ignored.
  - Card, campaign page and form show the heart placeholder when an image fails to load.
  - The two card buttons share a two-column grid with no wrapping.
  - The field got Spanish help text, and the four campaigns in the org were updated.
- **What we verified and how:** 196 Jest tests (7 new) and the linter. Images, placeholder and buttons checked on the published site as a visitor.
- **What we corrected:** the linter rejected a `javascript:` string literal in a test (`no-script-url`); it is now built from parts.
- **AI error:** yes, minor (the test literal). Juan noticed the button wrapping.
- **Speed-up:** _Pending_

### 2026-11-11 · Test donation through the site
- **Author:** @CaballeroEscamilla
- **Tool:** Claude Code (Claude Opus 5.5) with Claude in Chrome and the Salesforce CLI
- **Related story:** US-03 (#23)
- **What we asked:** make a test donation on the published site.
- **What we got:**
  - The AI filled in the form with fictitious data (credited, no invoice, $100 MXN) up to the review step; it does not enter card data, so the Stripe step was left to Juan.
  - "Ir a pagar" answered "Esta campaña ya no recibe donaciones", even though the campaign accepts donations.
  - With a temporary debug log on the guest user, the AI found that `DonationCheckoutService.startCheckout` receives an empty request, with a null `campaignId`. As admin, deserializing the same JSON works.
  - Its hypothesis: the `DonationRequest` fields need `{ get; set; }` to be filled from an LWC call.
- **What we verified and how:** the org's Apex classes match the repo, the campaign is active and matches the id, and the debug log shows the empty request.
- **What we corrected:** _Pending: fix `DonationRequest`, deploy and repeat the donation up to Stripe's page._
- **AI error:** _Pending: the hypothesis is not confirmed yet._
- **Speed-up:** _Pending_

### 2026-11-11 · Task board update
- **Author:** @CaballeroEscamilla
- **Tool:** Claude Code (Claude Opus 5.5) with Claude in Chrome
- **Related story:** #19, #21, #23, #25, #26, #28, #30, #32, #34, #38
- **What we asked:** move the frontend tasks on the GitHub Project and replace each task's "To refine" placeholder with the plan we followed.
- **What we got:** the Project's Status has only Todo, In Progress and Done, and the 10 tasks were in Todo. Juan's account has read-only access to the Project (the CLI token can't see it, and GitHub refused the change in the browser), so no Status was changed. The "To refine" text for #19 was drafted and shown as a diff; no issue was edited yet.
- **What we verified and how:** the Status field and the read-only notice on the board and on the issue page.
- **What we corrected:** _Pending: write access to the Project from its owner, then the Status changes and the "To refine" edits._
- **AI error:** no
- **Speed-up:** _Pending_

### 2026-11-11 · Stripe return pages
- **Author:** @jeusmateo
- **Tool:** Claude Code (Claude Opus 5.5)
- **Related story:** US-04
- **What we asked:** after paying in Stripe the donor landed on example.com instead of the thank-you page.
- **What we got:** the `Stripe_Success_Url` and `Stripe_Cancel_Url` labels held `https://example.com/...` placeholders, and every deploy reset the org to them. The labels now hold the page paths (`/s/gracias`, `/s/pago-no-completado`) and `DonationCheckoutService` adds the org's Experience Cloud domain with `DomainCreator.getExperienceCloudSitesHostname()`; a full `https://` URL in a label is still used as is. No org address is versioned. README and `docs/public-site.md` updated.
- **What we verified and how:** deployed to the team org with `DonationCheckoutServiceTest` and `StripeClientTest` (20 pass). Anonymous Apex printed `https://<org>.my.site.com/s/gracias`, and that page answers 200. We did not repeat a full payment in this session.
- **What we corrected:** nothing.
- **AI error:** none found.
- **Speed-up:** _Pending_

### 2026-11-11 · Staff "Actualizar" button
- **Author:** @jeusmateo
- **Tool:** Claude Code (Claude Opus 5.5)
- **Related story:** US-08, US-09
- **What we asked:** the "Actualizar" button in the staff donation list did nothing; we had to switch tabs to see new data.
- **What we got:** `staffDonationList` and `staffCampaignList` called `this.result.refresh()`, but `lightning/graphql` does not put `refresh` on every wire emission, so a later emission without it left the button calling nothing. Both components now keep the last `refresh` they receive, as Salesforce's lwc-recipes `graphqlRefresh` does. The Jest tests now emit a second result without `refresh` and check the button still works.
- **What we verified and how:** `npm test` (196 pass) and ESLint on both components. _Pending: deploy and click "Actualizar" in the org after a donation changes status._
- **What we corrected:** nothing.
- **AI error:** none found.
- **Speed-up:** _Pending_

### 2026-11-11 · Delivery 1 status in the README
- **Author:** @jeusmateo
- **Tool:** Claude Code (Claude Opus 5.5)
- **Related story:** US-01 to US-12
- **What we asked:** how many Delivery 1 stories are done on `release/delivery-1`, and to write the answer in the README.
- **What we got:** a per-story table in the README's Progress section. It is based on the code in the branch, `docs/test_results.md` and the issues' acceptance criteria. Ten stories are built and US-12 is not started. None is met yet, because no issue has evidence.
- **What we verified and how:** the published site's `/s/` page answers 200 without a login. The team confirmed that US-03 works in the org. The board's AC Status field was not read: the `gh` token lacks the `read:project` scope.
- **What we corrected:** the AI first counted US-03 as failing and US-11 as unpublished, based on the Nov 10 test run. The team corrected both.
- **AI error:** yes, it relied on an outdated test run.

### 2026-11-10 · Deploy of the day and the "Ir a pagar" error
- **Author:** @iGeraQ
- **Tool:** Claude Code (Claude Sonnet 5.5)
- **Related story:** US-03, US-04, US-14
- **What we asked:** deploy what we have today, and find out why the "Ir a pagar" button answers "Esta campaña ya no recibe donaciones." and whether the scheduled job has anything to do with it.
- **What we got:** a check of what the deploy would overwrite (labels and permission sets identical to the repo), a dry-run and then the real deploy once a one-off scheduled job stopped blocking Apex deploys (72 components, 73 tests pass), and a diagnosis of the button: the server receives a `DonationRequest` with empty fields. It is not the job.
- **What we verified and how:** the visitor's Aura call replayed with `curl` against the site, with invalid values to see whether the server reads them; the debug log of the user's click; the same JSON deserialized in anonymous Apex; the Stripe credential probed after the deploy (read-only).
- **What we corrected:** the AI first suspected the mock data, then the guest user's time zone and the campaign dates; the replay and the log disproved both.
- **AI error:** two wrong guesses about the cause before the evidence; the cause itself is only narrowed to how Aura passes the inner-class parameter. Later the same day the user approved the fix: `startCheckout` now takes a `Map<String, Object>` and builds the `DonationRequest` inside (4 new tests, 77 pass), deployed and verified as a visitor with the Aura replay. The new tests were written first but not watched failing one by one: the failure had been reproduced live with the replay before the change, and the same replay passes after it.
- **Speed-up:** _Pending_

### 2026-11-11 · Testing the button again with curl
- **Author:** @iGeraQ
- **Tool:** Claude Code (Claude Sonnet 5.5)
- **Related story:** US-03, US-04
- **What we asked:** test with curl whether the donation button works after the fix, before pushing.
- **What we got:** the visitor's call failed again; the cause of that was a deploy that reverted 8 classes (R-16), fixed by redeploying the committed code. After that, the visitor's `startCheckout` passes the campaign and amount checks but every Stripe call fails for the visitor, while the same code works as the admin (R-15).
- **What we verified and how:** each class in the org compared with the repo and with every branch; the visitor's Aura calls replayed with curl (no donation is created by the failing ones); Stripe's reply to a 1-cent request read from Apex; the same flow run as the admin, which saved a Pending donation.
- **What we corrected:** the AI first assumed its own watcher or a stale checkout had deployed the reverting package and blamed the other session; the comparison with the branches showed it came from a pushed branch. It also guessed the guest had lost the Stripe principal after the deploys; the org shows the principal is still granted.
- **AI error:** the wrong guess about who deployed, and the wrong guess about the principal.
- **Speed-up:** _Pending_

### 2026-11-17 · Stripe webhook receiver (Delivery 2 backend)
- **Author:** @iGeraQ
- **Tool:** Claude Code (Claude Sonnet 5.5)
- **Related story:** US-14, US-15, US-16, US-17, #51
- **What we asked:** start the pending Delivery 2 backend tickets.
- **What we got:** `StripeWebhook` (Apex REST at `/stripe/webhook`) that verifies the `Stripe-Signature` header, pays or expires the donation from the signed event, ignores repeated event ids and records a `Payment_Notice__c` for every notice; `Stripe_Webhook_Config__c` custom setting for the signing secret (value typed in Setup); guest class access; `StripeWebhookTest`.
- **What we verified and how:** dry-run deploy to the personal org running `StripeWebhookTest` (8 of 8 pass). Not yet tested with `stripe trigger` against a real endpoint.
- **What we corrected:** on review, Code Analyzer (not run the first time) flagged two Moderate issues (a method too complex, a method with too many parameters); a body that was signed but unreadable crashed with a 500 and left no notice; a huge timestamp could overflow. All fixed. The test class now has 9 tests, all passing in the dry-run.
- **AI error:** it used multi-catch (`catch (A | B e)`), which Apex does not support, and the dry-run caught it; its first sed edit also failed on macOS. It also skipped Code Analyzer at first.
- **Speed-up:** _Pending_

### 2026-11-15 · Custom amount and fewer clicks to donate
- **Author:** @CaballeroEscamilla
- **Tool:** Claude Code (Claude Opus 5.5)
- **Related story:** US-13, US-01
- **What we asked:** let donors type any amount, and cut the clicks needed to donate. On Nov 17 we added that the "Otro monto" field must only accept positive numbers while typing, not only when the donor continues.
- **What we got:** a shared `amountPicker` (eight suggested amounts and an always visible "Otro monto" field, $10 to $999,999.99 MXN, Stripe's limit), a three-step form (type and donor data share step 2), and the campaign page's card choosing the amount so "Donar" opens the form at step 2. Later, `cleanAmountText` drops signs, letters, "$" and commas as they are typed or pasted; the limits are still checked on blur or when continuing. Commits `95b79ec`, `35b16e1`, `6b807e9`.
- **What we verified and how:** Jest (241 pass) and ESLint; deployed to the team org and checked on the published site: typing `-abc1,250.759` leaves `1250.75`, and $5 and $1,000,000 show the minimum and maximum messages.
- **What we corrected:** we rejected a first design where "Otro monto" was a button that revealed the field (one more click), and asked for compact one-line answers with even grids.
- **AI error:** yes. The first version only validated the amount when continuing, so letters and a minus sign could be typed; we caught it testing the site.
- **Speed-up:** _Pending_

### 2026-11-17 · Help tooltips, Logros, header fix and FAQ page
- **Author:** @CaballeroEscamilla
- **Tool:** Claude Code (Claude Opus 5.5)
- **Related story:** US-11, US-01, US-02, US-06
- **What we asked:** explain the recognition and invoice answers with tooltips and remove filler text; rename "Campañas pasadas" (the instructors disliked the name); fix the header, which kept "Campañas" highlighted on the past campaigns page; and add an FAQ page.
- **What we got:** a reusable `infoTip` component (hover, focus or tap; Escape closes) on the two questions, public name and RFC; six filler texts removed and their labels deleted from the org; the section renamed "Logros"; the header now recomputes the current link on every site navigation (`CurrentPageReference`), because the theme keeps it alive between pages; a static `faqPage` with ten questions and an "Ayuda" link. The AI also created the FAQ page and renamed the Logros page in Experience Builder and published the site. Commit `aad9e53`.
- **What we verified and how:** Jest (238 pass) and ESLint; on the published site: the tooltips open, Campañas → Logros → Campañas moves the highlight, and the FAQ page loads for a visitor without login.
- **What we corrected:** we kept two texts the AI had removed as filler ("Cualquier monto suma…" and "Confirma que todo está bien…"). We also checked the rules before blocking donations to campaigns over their goal: US-08 AC5 says they keep receiving, so nothing was blocked.
- **AI error:** yes. Restoring the step intros, it used a `:has()` selector and broke the title's CSS rule; it caught both while reading the file and replaced them with a class. It also said a support email "needs permission", mixing up the technical side (a mail link needs none) with the US-11 AC6 agreement.
- **Speed-up:** _Pending_

### 2026-11-17 · Evidence for the frontend tasks
- **Author:** @CaballeroEscamilla
- **Tool:** Claude Code (Claude Opus 5.5) with Claude in Chrome
- **Related story:** #13, #19, #21, #23, #25, #26, #28, #30, #32, #34, #38
- **What we asked:** review the frontend tasks, add evidence with images and move the finished ones.
- **What we got:** a review of each task's scope against the code and the site, 16 screenshots in `docs/evidence/` (commit `7fd1a4a`) and a comment with images on 11 issues; 8 tasks closed, which the board's automation moved to Done. #23, #25 and #13 stay open until a paid test donation.
- **What we verified and how:** each comment and state with `gh issue view`; the site works without login, checked in a browser with no session.
- **What we corrected:** the signed-in user bar was cropped out of every screenshot, and the RFC column of the invoice requests view was masked, because some RFCs looked real and the repo is public. The #21 comment explains that anonymous donations can request an invoice (client approval of Nov 9), unlike the task's original scope.
- **AI error:** yes. The `gh` token can't comment, but it closed #19 before failing; the comments were then posted through the browser. It also closed #25 by mistake; we reopened it, but its board Status stays Done until the Project owner changes it.
- **Speed-up:** _Pending_

### 2026-11-17 · Support address on the FAQ page
- **Author:** @CaballeroEscamilla
- **Tool:** Claude Code (Claude Opus 5.5)
- **Related story:** US-11 (AC6 is outdated: the team was later told a support section is allowed)
- **What we asked:** add "contact the support team" with its email to the FAQ, and estimate a full support section.
- **What we got:** the address is not in the repo on purpose (#56 forbids writing it there), so `PublicCampaignController.getSupportEmail` reads the Org-Wide Email Address the receipt uses, and the FAQ shows it as a mail link, hidden while none is set up. Estimate: a mail link is under an hour with no backend; a form that creates Cases takes 1 to 2 days and needs backend, guest create access and US-12 tests. Commit `61e20e9`.
- **What we verified and how:** Apex (10 pass, 100% coverage of the controller), Code Analyzer (0 violations), Jest (244 pass); on the site as a visitor, the box shows the address once Luis set it up in the org.
- **What we corrected:** the first version changed `DonationReceiptService`; we moved the query to the controller instead (see the error below).
- **AI error:** no in our code. We found that, inside a deploy, `DonationReceiptServiceTest.paidDonationGetsOneReceipt` and `paidInvoiceDonationSendsOneEmail` fail (the test email send fails and the receipt flag resets), while they pass when run normally. _Pending: tell the backend team._
- **Speed-up:** _Pending_

### 2026-11-16 · Why payments look slow to confirm
- **Author:** @jeusmateo
- **Tool:** Claude Code (Claude Opus 5.5, then a recheck with Claude Fable 5.2)
- **Related story:** US-03, US-04
- **What we asked:** why Stripe takes so long to process a payment, and whether setting "any card" in the configuration fixes it, as a teammate suggested.
- **What we got:** Stripe is not slow: in the sampled sessions the payment succeeded 5 to 10 seconds after the session was created, and donations confirmed by the thank-you page became `Paid` 10 to 11 seconds after they were created. The delay is on the Salesforce side. Nine donations are paid in Stripe but still `Pending`: four were sent to an `example.com` return URL, and five reached `/s/gracias` but the page's check never saved (cause not determined: there are no logs). The scheduled check that should catch them has no schedule in the org: its jobs were aborted on Nov 11 and never scheduled again (R-03, R-13). Seven expired sessions are also still `Pending`. The recheck found the current cause: since Nov 16, 01:53 UTC, the org's labels `Stripe_Success_Url` and `Stripe_Cancel_Url` hold the `https://example.com/…` placeholders again, so after paying the donor lands outside the site, the thank-you page never runs and nothing confirms the payment. The branch has the right values (`/s/gracias`, `/s/pago-no-completado`); `main`, `develop`, the older feature branches and `Claude outputs/CustomLabels.labels-meta.xml` still have the placeholders, so a deploy from any of them brings the problem back. No donation has become `Paid` since Nov 13. Checkout offers `card` and `link`, so Link is on, against prerequisite P5. No Stripe setting called "any card" was found. Restricting Checkout to cards would remove Link's step on Stripe's page, but it would not fix the confirmations.
- **What we verified and how:** read-only queries to the org (`sf data query`), and Anonymous Apex that only reads each session from Stripe through the `Stripe` Named Credential and changes no record.
- **What we corrected:** the first pass called the `example.com` return URL old and counted two donations; the recheck compared the labels in the org with the repo and found the placeholder is the org's current value. Nothing was changed in the org.
- **AI error:** yes, the first pass did not compare the org's labels with the repo.
- **Speed-up:** _Pending_

### 2026-11-17 · Long wait after paying, and whether being logged in causes it
- **Author:** @jeusmateo
- **Tool:** Claude Code (Claude Opus 5.5)
- **Related story:** US-03, US-04
- **What we asked:** continue the Nov 16 review: why Stripe's green check stays on screen for minutes before `/s/gracias` loads, and whether it happens because the donor was logged in to the site, since receipts seem to arrive only for logged-in donors.
- **What we got:** the return URLs are fixed: the deploy of Nov 17, 04:23 UTC put back `/s/gracias` and `/s/pago-no-completado`, but `main`, `develop` and the older feature branches still hold the `example.com` placeholders, so a deploy from them breaks the return again. The campaign images are fixed too: the five donation campaigns point to the `.svg` files of `Donation_Campaign_Images`, and the site serves all four. The wait happens on the GET of `/s/gracias`, before our code runs: of 18 donations confirmed by the thank-you page right after paying, 8 became `Paid` 2 to 4 seconds after Stripe completed the session, 2 after 25 and 28 seconds, and 8 after 82 to 231 seconds. A GET from a script, with no cookies, once took 98 seconds. Being logged in is not what causes it: 4 of the 11 payments made as the site's guest user also waited 132 to 231 seconds, and the guest user confirmed all 11. Logged-in payments were slow more often (1 of 7 under 5 seconds, against 7 of 11 as guest), but the sample is too small to say that being logged in makes it worse. `Messaging.sendEmail` reported success for the receipt of every paid donation, guest or not (`Receipt_Sent__c` is true); why guest receipts don't arrive was not reviewed. Ten donations are paid in Stripe and still `Pending` (3 made logged in, 7 as guest), and `PendingDonationCheck` still has no scheduled job, so nothing confirms a payment whose donor closes the tab during the wait.
- **What we verified and how:** read-only queries with `sf data query` (each donation's creator, last modifier and dates, the labels, the campaigns and `CronTrigger`), Anonymous Apex that lists Stripe's `checkout.session.completed` events through the `Stripe` Named Credential with no DML, and `curl` to the site. The org has no event logs, so the server side of the wait can't be seen. Nothing was changed in the org or in Stripe.
- **What we corrected:** the Nov 16 entry said donations confirmed by the thank-you page became `Paid` 10 to 11 seconds after they were created; that only holds for the fast half.
- **AI error:** yes, the Nov 16 pass generalized from a few fast payments.
- **Speed-up:** _Pending_


### 2026-11-17 · Check the "Done" column against its acceptance criteria
- **Author:** @jeusmateo
- **Tool:** Claude Code (Claude Opus 5.5)
- **Related story:** the 25 issues in the board's Done column (US-01, 02, 04, 06 to 11, their backend tasks and setup #46, #49, #58, #59)
- **What we asked:** review every Done issue against its acceptance criteria or its "Done when", and take screenshots as evidence.
- **What we got:** a verdict per issue and 35 screenshots of the public site as a visitor and of the staff app. Gaps found: the org has no Org-Wide Email Address, so receipts go out without the support email (US-11 AC6, #44); the site's theme shows "Home" and "Login" in English (US-11 AC4); no user has the Moderator group and the admin user still holds "Donaciones · Payment Integration" (#58); the guest profile's `UserExternalCredential` read is not in `docs/seguridad.md` (#39); the eight frontend tasks are still Todo while their stories are Done.
- **What we verified and how:** read-only `sf data query`; Anonymous Apex that calls `PublicCampaignController` and inserts a campaign without fields inside a savepoint and rolls it back; all local Apex tests in the org (our 71 pass; the 4 failures are the org's DreamHouse sample classes); `git grep` of every commit for Stripe keys (none); headless Chromium as an anonymous visitor through the whole donation form up to the confirmation step, without pressing "Ir a pagar", so no donation was created. Staff screenshots mask donor emails, RFCs and user names before capture.
- **What we corrected:** nothing in the org or in Stripe.
- **AI error:** no
- **Speed-up:** _Pending_

### 2026-11-17 · Done-check screenshots in the repo and in the issues
- **Author:** @jeusmateo
- **Tool:** Claude Code (Claude Opus 5.5)
- **Related story:** the 22 checked issues of the Done column
- **What we asked:** commit the screenshots of the Done check to `docs/evidence/` and leave a comment with the links on each issue.
- **What we got:** 34 screenshots on branch `docs/done-evidence` (commit `04f7ae4`; one duplicate dropped) and a comment on 22 issues with a table per criterion: result, what was checked and links pinned to that commit. #10, #36 and #37 got no comment: they are out of scope. The screenshots were later moved to `docs/deliveries/delivery-1/evidence/` (PR #78), next to `docs/deliveries/delivery-2/evidence/`.
- **What we verified and how:** every screenshot was looked at before publishing, since the repo is public; the staff ones mask donor emails, RFCs and user names before capture. Each comment was rendered with the GitHub markdown API before posting. After the move, the old links still answer 200.
- **What we corrected:** the `git grep` pattern in the #49 comment had `|` inside a table cell, which split the cell; escaped before posting.
- **AI error:** yes, the unescaped `|`; caught by rendering the comment first.
- **Speed-up:** _Pending_

### 2026-11-17 · Branches out of sync: Delivery 1 into develop
- **Author:** @jeusmateo
- **Tool:** Claude Code (Claude Opus 5.5)
- **Related story:** none (repository); PRs #74, #76, #78, #79
- **What we asked:** what to do after `docs/delivery-2-evidence` appeared and screenshots were also pushed to `feature/delivery-2-frontend`; then merge Delivery 1 into `develop`, explain #74 and review the webhook change on `docs/delivery-2-evidence`.
- **What we got:** `release/delivery-1` had 41 commits that `develop` and `main` didn't (the button fix, the guest profile, the classes folder refactor, the return URLs, the staff app and the public site), so a deploy from `develop` or `main` would take them out of the org again (R-16). PR #76 merges `release/delivery-1` into `develop` from its own branch and leaves `release/delivery-1` unchanged; the only conflict was this log, resolved by keeping every entry of both sides. #74 (`main -> release/delivery-1`) brings no code: its commits are copies of ones `release/delivery-1` already has (three with the same patch, two with other patches but the same final content), so it only conflicts in this log; the advice is to close it. Commit `5328cb7` makes `StripeWebhook` answer 200 "ignored" to event types other than `checkout.session.completed` and `checkout.session.expired`, after the signature check and without saving a `Payment_Notice__c`; it looked correct and merged cleanly (#79). Also found: a stray `.tmp-guest-profile/` folder on `main`, `release/delivery-1` and `develop`.
- **What we verified and how:** `git merge-tree` for conflicts; `git patch-id` and a tree diff for #74; a check-only deploy of the merged tree (`0Afg700000KCFPZCA5`: 310 of 310 components, 86 of 86 tests of our 9 test classes); Jest 196 of 196 and ESLint clean.
- **What we corrected:** the conflict resolution first added a blank line inside the template's code block at the top of this log; removed after comparing the file with both sides.
- **AI error:** yes, that blank line.
- **Speed-up:** _Pending_

### 2026-11-17 · Validation of develop and the daily email limit
- **Author:** @jeusmateo
- **Tool:** Claude Code (Claude Opus 5.5)
- **Related story:** US-02 AC2, US-14, #44
- **What we asked:** why the check-only deploy of `develop` with the webhook change failed.
- **What we got:** the first failure came from the command the AI suggested: `RunSpecifiedTests` with only `StripeWebhookTest` and `DonationCheckoutServiceTest` requires 75% coverage of every class in `force-app` from those two tests. With the nine test classes, the validation (`0Afg700000KCMR3CAP`) ran 88 tests: 86 pass, including `StripeWebhookTest`. `DonationReceiptServiceTest.paidDonationGetsOneReceipt` and `paidInvoiceDonationSendsOneEmail` fail because the org's daily single-email limit is used up (`SingleEmail` max 15, remaining -1): `Messaging.sendEmail` fails also inside tests and `Receipt_Sent__c` goes back to false. The receipt code had not changed since the validation that passed. Two donations paid that night, `DON-7918AA47` and `DON-838A91AC`, have no receipt, and there is no resend path. Every real payment uses one of the 15 daily emails, which matters for the demo.
- **What we verified and how:** `sf project deploy report` for the failing assertions, `sf org list limits`, and a read-only query of paid donations without a receipt.
- **What we corrected:** the validation command, now with the nine test classes.
- **AI error:** yes, the suggested command named only two test classes.
- **Speed-up:** _Pending_

### 2026-11-18 · Campaign photos and names
- **Author:** @iGeraQ
- **Tool:** Claude Code (Claude Sonnet 5.5)
- **Related story:** US-01, US-08
- **What we asked:** make the current campaigns look like the ones we would publish, check why their images had reset, and find free photos.
- **What we got:** a likely cause for the reset (a deploy replaces the whole `Donation_Campaign_Images` static resource, so an image added only in the org is lost); 5 free Pexels photos cropped to 1600×800 and added to the static resource, with credits in `docs/image_credits.md`; the campaigns renamed with new images, the "Mexico Dreamin 2026" purpose fixed, and three end dates moved to 2026-12-31 (data changes in the org, not in the repo).
- **What we verified and how:** the resource deployed to the personal org; a query of the five campaigns after the update; the public site only lists campaigns with a purpose, so the four Developer Edition sample campaigns never show. The photos were looked at one by one before use.
- **What we corrected:** the AI's first draft used the test plan's campaign names ("Campaña A", …), which do not exist in the org; it re-read the org and redid the draft. Unsplash blocked automated downloads, so all photos come from Pexels. The first crop of the Angel of Independence cut the statue and was replaced.
- **AI error:** the wrong campaign names in the first draft, a date filter that matched no sample campaign, and a first crop that lost the subject. The reset cause is a hypothesis: the previous version of the resource could not be recovered.
- **Speed-up:** _Pending_
