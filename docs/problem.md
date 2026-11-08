# Problem and scope

## Problem

SF Vibe Lab's coordination wants more students to attend Mexico Dreamin, but not everyone can pay for the ticket, the trip and the stay in Mexico City. Alumni, families, instructors and local companies are willing to help. What is missing is a simple way to take donations online and keep track of them in Salesforce.

What the client asks for:

- A public page, with no login, where anyone can see the campaigns and how much each has raised toward its goal, and donate by card.
- Respect each type of donor: some do not want anyone to know they donated, others want to be recognized, and companies almost always need an invoice.
- Internally, see all donations, know which ones were paid, and make sure every donor gets a receipt. Today they would confirm by hand; ideally Salesforce finds out on its own when the payment gateway confirms a payment.
- Security: nobody outside can see other donors' data, and the gateway keys are never exposed anywhere.

## Users

| User | What they need |
|---|---|
| Anonymous donor | Donate without their name appearing anywhere public |
| Credited donor | Appear with their name and amount in the campaign's donor recognition |
| Invoice donor | Enter their name and RFC so the program can issue an invoice |
| Staff (coordination or treasury) | Manage campaigns, see donations, confirm payments and send receipts |
| Visitor without login | See campaigns and donate without creating an account |

## Real and simulated

| Real | Simulated |
|---|---|
| Mexico Dreamin 2026: Friday, November 20, 2026, Salesforce Mexico, Mexico City | The donation fund (not tied to the program's sponsorship call) |
| Salesforce Developer Edition and Stripe | Payments: Stripe in test mode with test cards |
| The business problem and the donor types | Donors, their data and invoices (no tax receipt is issued) |

The ticket price is researched during discovery with the client. The team sets the campaign goals with fictitious amounts.

## Scope

**In scope**

- Public site with no login: campaigns, each goal's progress and a donation form.
- Three donation types: anonymous, credited and invoice.
- The donation is recorded in Salesforce before payment, paid with Stripe in test mode, and followed by a thank-you page.
- Internal view for staff: campaigns, donations, manual payment confirmation and an emailed receipt.
- Automatic payment confirmation from the gateway's notification (Delivery 2).
- Security test of the visitor without login and classification of personal data.

**Out of scope**

- Real payments or Stripe accounts in live mode.
- Real tax invoicing (CFDI) or validating the RFC with the SAT.
- Privacy notice, terms of use and legal compliance.
- Login for beneficiary students, or linking a donation to a specific student.
- Reconciliation with the gateway's statement.
- Dashboards or progress reports per student.
- Any link to the real sponsorship call.
- Data about real people.
- Spam protection on the public form (a known risk, documented in `seguridad.md`).

## Dates

| Date | Milestone |
|---|---|
| Tue Nov 10, 2026, 23:59 (Mérida) | Delivery 1: repo tagged `entrega-1` |
| Tue Nov 17, 2026, 23:59 (Mérida) | Delivery 2: repo tagged `entrega-2` |
| Wed Nov 18, 2026 | Oral defense per team |
