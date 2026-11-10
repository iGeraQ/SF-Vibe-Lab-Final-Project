# Questions and problem reports

Ongoing log from October 27 to November 17, 2026. Each entry has an author, a date and the five parts of a good report. Client questions and their answers are also noted in the story's issue.

Template (check the five parts against section 12 of the guide):

```markdown
### YYYY-MM-DD · Short title · @author
- **Type:** client question / technical question / problem report
- **What we tried:**
- **What we expected:**
- **What we got:** the exact error or what happened
- **What we consulted:** documentation, AI (with its log entry), classmates
- **What happened next:** the answer we got and what we did with it
```

## Entries

### 2026-11-07 · Anonymous invoices, anonymous donations in the recognition and donor support · @iGeraQ
- **Type:** client question
- **What we tried:** refining US-02, US-05, US-06 and US-11, we found three points the requirements and the discovery session left open: whether an anonymous donor can request an invoice (RF-D2 said no, discovery said they are separate decisions), how anonymous donations appear in the public recognition, and how a donor reaches the program if the receipt or invoice has a problem.
- **What we expected:** a decision on each point, so the acceptance criteria and the data model stop depending on an open question.
- **What we got:** we asked in Slack #questions on Nov 7 with our suggestion for each point (separate choices; "Anonymous donor" with the amount; a support email in the receipt instead of a contact page).
- **What we consulted:** the requirements guide (RF-D2, RF-C1, RF-F1, RF-V1), the discovery session S20 notes and AI to draft the questions (`docs/bitacora_ia.md`, Nov 7).
- **What happened next:** the instructor answered on Nov 9: (1) anonymous donations with invoice are approved; (2) show the combined total of anonymous donations apart from the list, or list them as GoFundMe does; (3) a support email in the receipt is fine, in Delivery 1. We updated US-02, US-05, US-06 and US-11 and tasks #22, #26, #27, #29 and #44, chose the combined total, and removed the `Anonymous_Without_Invoice` validation rule.
