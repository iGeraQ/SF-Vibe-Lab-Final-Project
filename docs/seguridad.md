# Security and personal data

Document for Delivery 1. In Delivery 2 it is updated for the gateway notification.

## 1. Visitor test without login

Another person must be able to repeat each test by following these steps (RF-V2, minimum M2).

### Read

| Step | Channel (site or other) | Expected result | Actual result | Evidence |
|---|---|---|---|---|
| _Pending_ | | The visitor gets no data from other donations | | |

### Modify

| Step | Channel (site or other) | Expected result | Actual result | Evidence |
|---|---|---|---|---|
| _Pending_ | | The attempt to modify fails | | |

## 2. Visitor permissions

| Permission | Why it is needed |
|---|---|
| Permission set "Donaciones · Payment Integration" (custom permission `Donation_Payment_Updates`) | When the donor returns, the guest user's Apex applies Stripe's confirmation: it changes the status and the amount, which the `Payment_Fields_Locked` validation rule blocks for everyone else. The guest user gets no object permission on Opportunity; it only works through our Apex. See the risk in section 5. |
| Permission set "Donaciones · Sitio público": access to the `PublicCampaignController` Apex class | The campaign and recognition pages read through it. The class runs without sharing because the guest has no access to Campaign or Opportunity. It only returns public campaigns (donation campaigns that are open, or that ended while active) and only public fields: campaign data, display name and amount of paid credited donations, and the anonymous total. Never emails, real names or RFCs. Any other campaign id, or none, returns nothing. The tests check the response has no private data and that hidden campaigns return nothing; they run as an administrator, not as the guest. |
| Permission set "Donaciones · Sitio público": access to the `DonationCheckoutService` Apex class | The donation form and the thank-you page use it. `startCheckout` only accepts open campaigns and an amount of at least $10 MXN, strips HTML from the text and saves the donation as `Pending`; it never takes the status from the browser. `confirmCheckout` only acts on a donation that has that Stripe session, and takes the status and amount from Stripe. |
| Principal access to the `Stripe` External Credential (in "Donaciones · Payment Integration") | Lets the guest user's Apex call Stripe with the restricted key without seeing it. Set up with #49. |

## 3. Gateway keys

- Where they are stored: only in the `Stripe` External Credential in Setup (principal `StripeKey`). Apex calls Stripe through the `Stripe` Named Credential (`callout:Stripe`), so no key is in code, metadata or the repo.
- How we checked they are not in the code, the site or the repo history: on Nov 10, after retrieving the `Stripe` External Credential and Named Credential into `force-app/`, `git grep -E '(rk|sk|whsec)_(test|live)_[A-Za-z0-9]{10,}' $(git rev-list --all)` found nothing in the files or in any commit. The retrieved metadata has the principal and the header formula, never the key. The check runs again before each delivery.

## 4. Personal data classification

What the portal stores about a donor, in the Opportunity that records the donation. "Staff" is the System Admin, Campaign Manager and Moderator permission set groups: all three read every field below (US-09), and only the Moderator edits the public name. The public site never reads these objects directly: the guest user only calls `PublicCampaignController` and `DonationCheckoutService`.

| Donor data | Personal? | Stored? | Why | Who can see it |
|---|---|---|---|---|
| Name (first and last name, or company) | Yes | Yes, except for an anonymous donation without invoice | The recognition list (credited donations) and the invoice | Staff. The donor, in their own receipt and invoice PDF. The public site shows only the **public name**, and only for paid, non-anonymous donations; an anonymous donor's name never leaves Salesforce |
| Public name | Yes, the donor chooses it | Yes, unless anonymous | The name shown in the recognition list. The donor can write anything; the Moderator can change it | Everyone, if the donation is paid and not anonymous |
| Email | Yes | Yes, always | To send the receipt (and the invoice) | Staff. The donor, in the email they receive. Never the public site |
| RFC (Mexican tax ID) and person type | Yes, tax data | Only if the donor asks for an invoice | The simulated invoice (US-06). No CFDI is issued | Staff and the donor (in their invoice PDF). Never the public site, even for a credited donor (US-05 AC5) |
| Invoice consent and its date | Yes, a record of the donor's consent | Only if the donor asks for an invoice | Proof that the donor accepted the use of their data for the invoice (US-06 AC7) | Staff. Nobody edits it by hand |
| Amount | Not by itself, but it is linked to a donor | Yes | Campaign progress, the recognition list and staff review | Staff. The public site shows each credited donation's amount next to its public name, and only the **combined total** of anonymous donations |
| Donation type (anonymous, credited, invoice) | Not by itself | Yes, as two checkboxes (`Is_Anonymous__c`, `Invoice_Requested__c`) and a formula | To hide an anonymous donor and to flag invoice requests (US-07) | Staff. The public site only sees the effect: an anonymous donation is not listed |
| Campaign | No | Yes | To which campaign the donation counts | Everyone: campaigns are public |
| Card details | Yes, financial | **No** | The donor types them on Stripe's own payment page, so Salesforce and this repo never receive them | Only Stripe |
| Stripe references (session id, payment intent id) and our donation reference (`DON-…`) | No personal data, but they identify a payment | Yes | To confirm the payment with Stripe and to compare the portal with the Dashboard (US-09 AC5) | Staff. Not shown on the public site |

**What we send to Stripe:** the amount, the currency, the campaign name, our donation reference and, as metadata, the campaign id and two flags (anonymous, invoice). We send **no name, email or RFC**. Stripe's page asks the donor for the card and its own contact details; those stay in Stripe, visible to the people with access to the team's Stripe sandbox.

**What the email carries:** the receipt goes only to the email the donor typed. An anonymous receipt shows no name, even when the donor also asked for an invoice (US-02 AC2). The invoice PDF shows the name and RFC, and goes only to that donor.

**Gap we know about:** there is no retention or deletion process for donor data. It is out of scope for the test scenario, and everything stored is fictitious.

## 5. Known risks

| Risk | Impact | What we do |
|---|---|---|
| Spam on the public form (out of scope) | | |
| Malicious text in name fields (cross-site scripting, SOQL injection) | | Sanitize every text input and show it as plain text (US-12) |
| The guest user holds the payment permission, so the validation rule does not stop guest-context Apex from changing a donation's status or amount | A bug in public Apex could let a visitor mark a donation as paid | Public Apex never takes the status or the amount from the browser: it asks Stripe for the session and uses Stripe's status and `amount_total`. Its tests cover a tampered request. |

## 6. Gateway notification (Delivery 2)

_Pending_
