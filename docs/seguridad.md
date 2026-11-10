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
- How we checked they are not in the code, the site or the repo history: _Pending_

## 4. Personal data classification

| Donor data | Personal? | Stored? | Why | Who can see it |
|---|---|---|---|---|
| Name | | | | |
| Email | | | | |
| RFC | | | | |
| Amount | | | | |
| Donation type | | | | |
| Campaign | | | | |
| Card details | | | | |
| Stripe payment reference | | | | |

## 5. Known risks

| Risk | Impact | What we do |
|---|---|---|
| Spam on the public form (out of scope) | | |
| Malicious text in name fields (cross-site scripting, SOQL injection) | | Sanitize every text input and show it as plain text (US-12) |
| The guest user holds the payment permission, so the validation rule does not stop guest-context Apex from changing a donation's status or amount | A bug in public Apex could let a visitor mark a donation as paid | Public Apex never takes the status or the amount from the browser: it asks Stripe for the session and uses Stripe's status and `amount_total`. Its tests cover a tampered request. |

## 6. Gateway notification (Delivery 2)

_Pending_
