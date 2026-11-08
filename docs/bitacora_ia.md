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
