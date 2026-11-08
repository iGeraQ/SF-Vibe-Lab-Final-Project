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
