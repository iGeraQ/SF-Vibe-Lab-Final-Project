# Requirements

The full stories, with their acceptance criteria, are in the issues and on the [board](https://github.com/users/iGeraQ/projects/7). Requirement IDs (RF-…) are the ones used in the course guide.

## Functional requirements

| Story | Requirement | Milestone | Issue |
|---|---|---|---|
| US-01 Choose a campaign and see its progress | RF-D1a | Delivery 1 | [#1](https://github.com/iGeraQ/SF-Vibe-Lab-Final-Project/issues/1) |
| US-02 Donate anonymously | RF-D2 | Delivery 1 | [#2](https://github.com/iGeraQ/SF-Vibe-Lab-Final-Project/issues/2) |
| US-03 Record the donation before payment | RF-D3 | Delivery 1 | [#3](https://github.com/iGeraQ/SF-Vibe-Lab-Final-Project/issues/3) |
| US-04 Thank-you page | RF-D4 | Delivery 1 | [#4](https://github.com/iGeraQ/SF-Vibe-Lab-Final-Project/issues/4) |
| US-05 Appear as a donor | RF-C1 | Delivery 1 | [#5](https://github.com/iGeraQ/SF-Vibe-Lab-Final-Project/issues/5) |
| US-06 Enter invoice details | RF-F1 | Delivery 1 | [#6](https://github.com/iGeraQ/SF-Vibe-Lab-Final-Project/issues/6) |
| US-07 Flag invoice requests | RF-F2 | Delivery 1 | [#7](https://github.com/iGeraQ/SF-Vibe-Lab-Final-Project/issues/7) |
| US-08 Manage campaigns | RF-S1 | Delivery 1 | [#8](https://github.com/iGeraQ/SF-Vibe-Lab-Final-Project/issues/8) |
| US-09 View all donations | RF-S2 | Delivery 1 | [#9](https://github.com/iGeraQ/SF-Vibe-Lab-Final-Project/issues/9) |
| US-10 Confirm a payment manually | RF-S3 | Delivery 1 | [#10](https://github.com/iGeraQ/SF-Vibe-Lab-Final-Project/issues/10) |
| US-11 Scoped public site | RF-V1 | Delivery 1 | [#11](https://github.com/iGeraQ/SF-Vibe-Lab-Final-Project/issues/11) |
| US-12 Visitor security test | RF-V2 | Delivery 1 | [#12](https://github.com/iGeraQ/SF-Vibe-Lab-Final-Project/issues/12) |
| US-13 Donate any amount | RF-D1b | Delivery 2 | [#13](https://github.com/iGeraQ/SF-Vibe-Lab-Final-Project/issues/13) |
| US-14 Automatic confirmation and receipt | RF-D5 | Delivery 2 | [#14](https://github.com/iGeraQ/SF-Vibe-Lab-Final-Project/issues/14) |
| US-15 View automatic confirmations and rejected notifications | RF-S4 | Delivery 2 | [#15](https://github.com/iGeraQ/SF-Vibe-Lab-Final-Project/issues/15) |
| US-16 Receive the payment notification (minimum level) | RF-V3a | Delivery 2 | [#16](https://github.com/iGeraQ/SF-Vibe-Lab-Final-Project/issues/16) |
| US-17 Only authentic, non-duplicated notifications (second level) | RF-V3b | Delivery 2 | [#17](https://github.com/iGeraQ/SF-Vibe-Lab-Final-Project/issues/17) |

Rules for refining the backlog:

1. Split large stories, add our own criteria (including negative cases) and clear up anything ambiguous with the client.
2. Credited and invoice donors follow the same flow as anonymous donors (RF-D1 to RF-D5). The backlog must show that the flow works for all three types.
3. Minimum criteria can be made more precise, never weaker.

## Mandatory minimums (pass / fail)

They add no points. Each minimum that fails in Delivery 2 takes 10 points off the team grade, and the affected story does not count as met. In Delivery 1 they are only reviewed.

| ID | Minimum | How it is checked |
|---|---|---|
| M1 | Test mode and fictitious data: Stripe in test mode, test cards, fictitious donors | Demo and configuration review |
| M2 | The visitor without login cannot read or modify other donors' data (least privilege) | Security test (RF-V2) repeated by the instructor |
| M3 | No gateway key in the code, the site or the repo, including commit history | Repo and site review |

## Security

- **Least privilege:** the visitor without login only has the access needed to see campaigns and donate. Every permission is documented with its reason.
- **Integration users:** if a user receives or sends data to the gateway, it only has the access that task needs.
- **Secrets:** Stripe test keys never go in code, versioned metadata, screenshots, the AI log or AI prompts.
- **Personal data:** every donor data point is classified in `seguridad.md`. Only email addresses the team controls.

## Good practices (criterion C6)

- Error handling: a clear message, and the donation is never left in an inconsistent state.
- Governor limits: no queries or writes inside loops; works when several notifications or records arrive at once.
- Any Apex has passing tests and is run through Code Analyzer, with every finding fixed or justified.
- No hard-coded IDs.

## Technical constraints

- Salesforce Developer Edition, one per team, no paid licenses or add-ons.
- Stripe in test mode only. Each team opens its own account, does not activate it and keeps its keys outside the repo.
- Zero cost: check with the instructor before installing anything from AppExchange or using another external service.
- Nothing is published outside the test scenario.
- Someone on the team logs into the org at least once a week, and metadata is backed up to the repo weekly and before each delivery.

## If something in the platform does not work

Report it to the instructor the same day, with context. A blocker reported in time costs no points.

| If this happens | What the instructor does |
|---|---|
| The org does not allow publishing a public site | Gives an alternative or adjusts RF-V1, RF-V2 and M2 |
| The visitor cannot create the donation from the site | Adjusts RF-D3 or approves an alternative |
| The gateway notification cannot reach the org | Approves an alternative plan for RF-D5 and RF-V3a |
| The receipt email does not leave the org | Accepts alternative evidence of the generated receipt |
