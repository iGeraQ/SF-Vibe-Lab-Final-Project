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
- **AI error:** yes. Its first proposal, made before it could read the guide, named a branch `entrega-1`, which clashes with the `entrega-1` tag required by section 8. The AI caught it when reading the guide and the branch became the release branch.
- **Speed-up:** _Pending_
