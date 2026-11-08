# Architecture

We build the portal with a **hybrid approach**: configuration and Flows for most of the solution, and code only where it adds something the declarative tools don't do well. The data model **reuses Salesforce's standard Campaign and Opportunity objects**, the usual way to model fundraising in Salesforce, and adds custom objects only where nothing standard fits.

## Approach

| Piece | Technology | Why |
|---|---|---|
| Data | Standard **Campaign** and **Opportunity** plus a few custom fields | Reuse avoids duplicating what Salesforce already has: dates, status, amounts and the campaign's raised total. |
| Public site | **Experience Cloud** site (Build Your Own template) with a guest user | Salesforce's native way to publish a site with no login. |
| Campaign pages and donor recognition | **LWC** with a read-only Apex controller | Lets us show images and a progress bar, and exposes only public fields to the guest. |
| Donation form | **Screen Flow** | What the team already knows: conditional fields, validation and the amount confirmation. |
| Start the payment | **Invocable Apex** called from the Flow | Creates the donation and the Stripe Checkout Session in one controlled step. Stripe expects form-encoded requests, which Apex handles easily. |
| Payment confirmation (Delivery 1) | Apex that checks the session with Stripe when the donor returns, plus a **Scheduled Flow** for pending and expired donations | The status always comes from Stripe, never from a person. |
| Receipt and simulated invoice | **Record-triggered Flow** with email templates in Spanish | No code needed. |
| Staff app | **Lightning App**, list views, page layouts and **permission sets** | Configuration only. |
| Webhook (Delivery 2) | **Apex REST** exposed through the site | The only option to receive Stripe's notices and verify their signature. |
| Stripe credentials | **Named Credential + External Credential** | The key never appears in code or metadata (M3). |

## Data model

```mermaid
erDiagram
    Campaign ||--o{ Opportunity : "Primary Campaign Source"
    Opportunity ||--o{ Payment_Notice__c : "Delivery 2"
    Campaign {
        string Name
        date StartDate
        date EndDate
        boolean IsActive
        currency ExpectedRevenue "goal"
        currency AmountWonOpportunities "raised, automatic"
    }
    Opportunity {
        string Donation_Reference__c "auto-number"
        currency Amount
        string StageName "Pending, Paid, Expired"
        date CloseDate
        boolean Is_Anonymous__c
        boolean Invoice_Requested__c
    }
    Payment_Notice__c {
        string Stripe_Event_Id__c "unique"
        string Result__c "Accepted, Rejected"
    }
```

### Campaign (standard): campaigns

| Need | Field | Standard or custom | Story |
|---|---|---|---|
| Name | `Name` | Standard | US-08 |
| Description | `Description` | Standard | US-01 |
| Start and end date | `StartDate`, `EndDate` | Standard | US-08 |
| Active or paused | `IsActive` | Standard | US-08 |
| Goal | `ExpectedRevenue`, relabeled "Goal" | Standard | US-08 |
| Amount raised | `AmountWonOpportunities`: Salesforce sums the paid donations automatically | Standard | US-01 AC2 |
| Image | `Image_URL__c` (URL) | Custom | US-01 |
| What the money is for | `Purpose__c` (text) | Custom | US-01 |
| Progress % | `Progress__c`: formula, raised ÷ goal | Custom | US-01 |
| Accepting donations now | `Accepts_Donations__c`: formula, `IsActive` and today within the dates (or no end date) | Custom | US-08 AC7 |

The always-open general donation campaign is a Campaign with no end date (US-08 AC8). Campaign managers need the "Marketing User" checkbox on their user to edit campaigns.

### Opportunity (standard): donations

Donations use their own record type "Donation", with a sales process whose stages are the donation statuses:

| Stage | Type | Meaning |
|---|---|---|
| `Pending` | Open | The form was submitted and we are waiting for Stripe. Not public and not counted. |
| `Paid` | Closed / Won | Stripe confirmed the payment. It counts in the campaign's raised amount. |
| `Expired` | Closed / Lost | The Stripe session expired without a payment. |

| Need | Field | Standard or custom | Story |
|---|---|---|---|
| Campaign | `CampaignId` (Primary Campaign Source) | Standard | US-03 |
| Amount | `Amount` | Standard | US-03, US-13 |
| Status | `StageName` | Standard | US-03 |
| Payment date | `CloseDate` | Standard | US-14 |
| Record name | `Name`, set automatically, for example "DON-0001 · Campaign" | Standard | — |
| Our reference | `Donation_Reference__c`: auto-number `DON-{0000}`, sent to Stripe as `client_reference_id` | Custom | US-03 AC2 |
| Anonymous | `Is_Anonymous__c` | Custom | US-02 |
| Invoice requested | `Invoice_Requested__c` | Custom | US-06, US-07 |
| Donor email | `Donor_Email__c` (required) | Custom | US-02 |
| Donor first and last name | `Donor_First_Name__c`, `Donor_Last_Name__c` | Custom | US-05 |
| Company name | `Donor_Company__c` | Custom | US-05 |
| Name shown in public | `Public_Name__c`, editable only by the Moderator | Custom | US-05 |
| Person type | `Person_Type__c`: Individual or Company | Custom | US-06 |
| RFC | `RFC__c`, with a validation rule for the SAT pattern | Custom | US-06 |
| Invoice consent | `Invoice_Consent__c` and `Invoice_Consent_Date__c` | Custom | US-06 |
| Stripe session | `Stripe_Session_Id__c` and `Stripe_Session_Expires_At__c` | Custom | US-03, US-04 |
| Stripe payment | `Stripe_Payment_Intent_Id__c` | Custom | US-09 |
| Confirmed by | `Confirmation_Source__c`: Return page or Webhook | Custom | US-15 |
| Receipt sent | `Receipt_Sent__c`, so a receipt is never sent twice | Custom | US-17 |

Anonymity and invoicing are two separate checkboxes, so the model supports both answers to the open question in US-02.

### Payment_Notice__c (custom, Delivery 2)

One record per Stripe notice that reaches Salesforce: `Stripe_Event_Id__c` (unique, used to ignore repeated notices), `Event_Type__c`, `Received_At__c`, `Result__c` (Accepted or Rejected), `Rejection_Reason__c`, and a lookup to the donation. Staff reviews the rejected notices here (US-15). Nothing standard records incoming notices, so this one is custom.

### Suggested_Amount__mdt (custom metadata, nice to have)

The suggested amounts ($100 to $20,000) as configuration, so staff can change them without code (US-01 refinement 6).

### What we don't reuse, and why

| Option | Why not |
|---|---|
| Contact and Account for donors | Every donation would create or match a person. That needs duplicate handling, adds personal data to protect and needs more guest access, while the client asked to keep the data minimal. The donor's data stays on the donation. We can move to Contacts later if donor history matters. |
| Campaign Members | They require a Contact or Lead. |
| Products and Price Books | A donation has a single amount; products add nothing. |
| Nonprofit Success Pack (NPSP) | A large managed package that needs the instructor's approval; too much for the time we have. |
| Nonprofit Cloud | Paid license. |

## Access and security

- **Guest user (visitor):** no object permission on Opportunity. It reads campaigns and recognition only through the LWC's Apex controller, which returns public fields only: name and amount of paid donations that are not anonymous. It creates donations only through the invocable Apex action. This keeps other donors' data out of reach (M2, US-12). Each permission it gets goes in `docs/seguridad.md` section 2.
- **Staff:** one permission set per role (see `docs/requirements.md`). Nobody edits `Amount` or `StageName` by hand; only the payment integration sets them.

| Permission set | Campaign | Donation |
|---|---|---|
| System Admin | Full | Read all; amount and status read-only |
| Campaign Manager | Create and edit | Read, including email |
| Moderator | Read | Read, including email; edit `Public_Name__c` only |

## Inventory

**Flows:** donation form (Screen Flow), receipt and invoice emails (record-triggered), expiring and checking pending donations (scheduled).

**Apex:** `DonationCheckoutService` (invocable: creates the donation and the Checkout Session), the payment check when the donor returns, `PublicCampaignController` (for the LWC), and the webhook REST class in Delivery 2. Each class has tests with a mocked Stripe callout and goes through Code Analyzer.

**LWC:** campaign list, campaign detail with progress and recognition.

## Risks to check first

| Risk | How we check | If it fails |
|---|---|---|
| The org can't publish an Experience Cloud site | Create and publish the site | Tell the instructor the same day (guide's plan B) |
| The guest can't run the Screen Flow on the site | Run the form as a visitor | Move the form to the LWC |
| Email doesn't leave the Developer Edition | Set Deliverability to "All email" and send a test receipt | Alternative evidence of the receipt, as the guide allows |
| Campaign managers can't edit campaigns | Check the "Marketing User" checkbox | Grant it on their users |
