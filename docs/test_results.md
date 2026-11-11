# Test results · Delivery 1

Run 1 of `docs/test_plan.md`, Nov 10, 2026 (night, Mérida time). It records what was run, what was found, what was fixed and what is still open. Nothing here is a "pass" unless it says what proved it.

## 1. Result in one table

| Level | Result | Detail |
|---|---|---|
| **Apex** (6 classes, run `707g7000019W4T0`) | **52 of 55 pass**, 3 fail | The 3 failures are findings R-02 and R-04. **Fixed and deployed** later the same night (deploy `0Afg700000JCUYrCAP`, 8 test classes): **73 of 73 pass**. Coverage of our classes in the first run: 97%. |
| **Jest** (branch `feature/delivery-1-frontend2`) | **112 of 112 pass** in 14 suites; ESLint clean | The site's data service now calls Apex (G1 is resolved). **Coverage not measured:** `npm run test:coverage` printed an empty table (0 files) and exited 0 despite the 90% threshold, also with the `v8` provider. It ran from a temporary worktree, so it's not confirmed to be the repo; re-run it from a normal checkout before reporting a number. |
| **Validation rules** (backend, in the org, rolled back) | **34 of 34 as expected** | RFC pattern, invoice data, required names, the four donation types, campaign fields. Section 3. |
| **Public controller** (backend, in the org) | **7 of 7 as expected** | Only public campaigns, no private data in the recognition, empty answers for hostile ids. Section 3. |
| **Scheduled check, against real Stripe** (US-03 AC5) | **Logic passes, schedule fails** | Run by hand, the check finished without errors (job `707g7000019XbUs`) and marked the pending donation `DON-48880C64` `Expired`, as Stripe reported. But the 60 schedules fired 51 times in about an hour and created **no** job: the donation stayed `Pending` for 20 minutes after its session expired. R-13 |
| **Visitor call of `startCheckout`** (R-14) | **Fixed and verified** | The button failed for every campaign; after the fix both public campaigns reach the amount check. See R-14 |
| **E2E and Security** (through the site) | **Blocked** | The site is not published (R-01): every address asks for a login. |
| **Staff** (as each role) | **Not run** | No donations list view, invoice requests view or donation record page yet (G3, P10). `StaffRolesTest` covers the permissions in Apex. |

Delivery 1 does **not** pass yet: the plan requires every case to pass, and no E2E case could run.

## 2. Gate (section 2.1 of the plan) as found

| # | Precondition | State |
|---|---|---|
| P1 | Org language, currency, time zone and stages | Met (language `es`, locale `es_MX`, time zone America/Merida and the three stages, re-checked in this run; currency not re-checked) |
| P2 | Backend deployed, PR #62 merged | Met: PRs #62, #64 and #65 are merged and the classes are in the org |
| P3 | Frontend connected to Apex and deployed | **Partial**: connected and deployed to the org, but `feature/delivery-1-frontend2` has no PR and isn't in `develop` or `main` |
| P4 | Site published; guest user ready | **Not met**: site is `UnderConstruction` (R-01); guest user time zone is GMT (R-06). Guest has "Sitio público" and "Payment Integration"; default record owner is set |
| P5 | Stripe connected | **Partial**: the `Stripe` credential exists and real test Checkout Sessions were created from Salesforce. Checkout settings not checked |
| P6 | Return address labels | **Not met**: both still point to `example.com` (R-05) |
| P7 | Receipt sender | **Partial**: the address exists but is **not verified** (R-02) |
| P8 | Scheduled check | **Partial**: scheduled every minute (60 jobs), run by the admin user (R-03, R-07) |
| P9 | Staff users | Partial: the three role groups exist; the "Staff Demo" user has the Campaign Manager group |
| P10 | Staff views | **Not met**: only the standard campaign list views exist (G3) |
| P11 | Demo data | **Partial**: 3 open campaigns (one over its goal), 1 past, 26 demo donations. No future, paused or goal-met-by-payment campaign |

## 3. What was run without the site

**Validation matrix.** One anonymous Apex script inserted 34 cases and rolled everything back (0 records left). Every case was accepted or rejected as the stories say, with the donor-facing message:

| Plan cases it backs | Cases | Outcome |
|---|---|---|
| TC-US03-04, TC-US03-05 | no email; credited without public name; credited without name or company | Rejected, each with its own Spanish message. A company name alone is accepted |
| TC-US02-03, TC-US02-05 | anonymous with only the email; anonymous with invoice | Both accepted (US-02 AC3, approved by the client on Nov 9) |
| TC-US06-01, TC-US06-02, TC-US06-07 | invoice without RFC, without person type, without consent, without name or company | Rejected, each with its own message |
| TC-US06-03, TC-US06-06 | RFC valid for an individual (13), a company (12) and a company with `&`; invalid: 12 characters for an individual, month 13, day 32, bad check character, symbol, lowercase; a company with 13 characters | Valid ones accepted; all invalid ones rejected with the format message |
| TC-US03-03, TC-US09-01 (type) | the four combinations | `Donation_Type__c` = Acreditada, Factura, Anónima, Anónima con factura |
| TC-US12-08 | the hostile texts of section 2.3 | Same results as the plan's table; markup-only names are emptied |
| US-08 AC3 | campaign without start date, goal or image | Rejected with one message listing the six required fields (G9) |
| G12 | end date before start date | **Rejected by Salesforce's own rule**: not a gap |

**Public controller.** Called as the admin in the org: 3 open campaigns and 1 past one come back, and the 4 sample campaigns of the Developer Edition (no purpose) stay hidden. "Viaje y hospedaje" shows 103.3% (US-08 AC5 data). The recognition of that campaign has 6 donors and an anonymous total of 7,000, with no `@` and nothing shaped like an RFC. `getRecognition` with a null id, an Opportunity id and a non-donation campaign returns nothing (TC-US12-02, TC-US12-06 at the backend level).

These are **backend-level evidence**. The plan still requires the same cases through the site (they stay Blocked) and the guest's own call of the endpoint.

## 4. Findings

Severity: **Blocker** stops the demo, **High** breaks a story, **Medium** breaks an edge or a rule, **Low** is clean-up.

| # | Sev | Finding | Stories / cases | Status |
|---|---|---|---|---|
| R-01 | **Blocker** | The Experience Cloud site is `UnderConstruction` (not published). `<site>/` and `<site>/s/` both redirect to the login page ("To access this page, you have to log in"). | US-11 AC1, AC3, AC5; every E2E and Security case (G5) | **Open.** Publish the site in Experience Builder, or `sf community publish --name "Portal de donaciones"`. Needs the team's OK: it makes the site public. Check first that the pages exist and are public |
| R-02 | **High** | The Org-Wide Email Address "Donaciones Mexico Dreamin" exists but is **not verified** (`IsVerified = false`). In the org, the two receipt tests that passed in the baseline now fail: the email is queued but `Receipt_Sent__c` is false after the save, which is what `DonationReceiptService` does when the send is rejected. So donors would get **no receipt**, and nothing resends it. The exact error text was not captured: it is confirmed when the fix is deployed and those two tests pass. | US-14 AC2, US-02 AC2, US-06 AC8, US-11 AC6 | **Code fixed and deployed** (deploy `0Afg700000JCUYrCAP`, 73 tests pass): the receipt is sent from the address only when it's verified; unverified, it goes from the default sender and still shows the support email. 2 new tests. **Open for the team:** verify the address (the link Salesforce emailed to it). No resend path yet: a follow-up |
| R-03 | **High** | (Cleared on Nov 10 night once a one-off diagnostic job fired; it comes back with any scheduled job.) Deploys to the org are **blocked**: 60 scheduled jobs ("Donaciones pendientes cada minuto :00 to :59") reference `PendingDonationCheck`, so Salesforce refuses any deploy of Apex that depends on it ("This schedulable class has jobs pending or in progress"). | Every future deploy, including the demo | **Open.** In Setup → Deployment Settings, allow deployments with pending Apex jobs; or abort the jobs and schedule them again after the deploy. Also: the README says every 15 minutes, the org runs every minute (the demo choice); say so in the README |
| R-04 | Medium | `PendingDonationCheckTest.schedulingCreatesOneJobPerQuarterHour` counted the org's real jobs (expected 4, got 64): a test that depends on the org's data. | TC-US03-06 | **Fixed and deployed:** the test schedules under its own name prefix |
| R-05 | **High** | `Stripe_Success_Url` and `Stripe_Cancel_Url` are still `https://example.com/…` in the org and in the repo (G2). After paying, Stripe sends the donor to `example.com`. | US-04 AC1 to AC6, every payment E2E | **Open.** Needs the published site's address. Set them in the repo too, or the next deploy puts the placeholders back |
| R-06 | Medium | The site guest user's time zone is GMT. Date comparisons use the viewer's time zone, so a campaign closes at 18:00 Mérida time on its end date and opens at 18:00 the day before its start. | US-01 AC6, US-08 AC4 | **Open.** Set the guest user's time zone to America/Merida |
| R-07 | Medium | The admin user holds "Donaciones · Payment Integration", so it can change any donation's stage, amount or campaign by hand, and the scheduled jobs run as that user (G11). The 26 demo donations were created that way. | US-09 AC3 (System Admin edge) | **Open: decision.** Use a dedicated integration user, or write it down as a known risk in `docs/seguridad.md` section 5 |
| R-08 | Low | The 26 `DON-DEMO` donations are `Paid` with `Confirmation_Source__c = Return_Page` but have no Stripe session or payment id: the source is not true. They feed the campaigns' progress (for example 103% on "Viaje y hospedaje"). | US-01 AC1, US-09 | **Open.** Fine as fictitious demo data; say so in the video |
| R-09 | Medium | The payment in Stripe didn't carry the donation's reference, only the Checkout Session did (G8). | US-03 AC2, US-09 AC5 | **Fixed and deployed:** `StripeClient` sends `payment_intent_data[metadata][donation_reference]` and a description with the reference; `StripeClientTest` checks both. Payments already created don't have it |
| R-10 | Low | No Apex test covered the validation rules, the donation type formula or the invoice rules (G14). | US-02 AC3, US-03 AC3/AC4, US-06 AC1/AC2/AC5 | **Added and deployed:** `DonationRulesTest`, 7 tests (the matrix of section 3) |
| R-11 | Low | The frontend branch commits a stray `Claude outputs/` folder with a copy of the labels file (G6). | none | **Open.** Remove before merging |
| R-13 | **High** | **The scheduled check never runs.** The 60 "Donaciones pendientes cada minuto" schedules fired 51 times (they fire late and in bursts, up to about 10 minutes after their minute) and not one created a `Queueable` job: the only one in the org is the manual run. `DON-48880C64` stayed `Pending` 20 minutes after its Stripe session expired. Run by hand (`System.enqueueJob(new PendingDonationCheck())`) the same class works: the job completed with 0 errors and the donation became `Expired`. The deployed class is identical to the repo's, and the schedules belong to the active admin user. **The cause was not determined**: there are no debug logs. | US-03 AC5, US-03 refinement 2 (donor pays and closes the browser) | **Open.** Turn on a debug log for the admin user (Setup → Debug Logs), wait for a schedule to fire and read it. Meanwhile the thank-you page's `confirmCheckout` is the only path that confirms payments, and before the demo the check can be run by hand from Execute Anonymous: `System.enqueueJob(new PendingDonationCheck());` |
| R-14 | **Blocker** | **"Ir a pagar" always fails with "Esta campaña ya no recibe donaciones.", for every campaign.** The Aura call is well formed (`campaignId`, `amount`, …), but `startCheckout` gets a `DonationRequest` with its fields empty: it reaches `openCampaignName`, so the object isn't null, and the query returns the 4 campaigns, yet nothing matches. Replayed as a visitor through the site's Aura endpoint with `campaignId = "notanid"` and `amount = "abc"`, the answer is the same message instead of a type error, so the server never reads the fields. The same JSON deserializes into `DonationRequest` correctly in plain Apex (`JSON.deserializeStrict`), and `getActiveCampaigns()` as a visitor does return the campaigns. It is not caused by the campaign, by Stripe (the credential answers) or by the scheduled job. Cause: how Aura passes a parameter of an Apex inner-class type to the method; not confirmed beyond that. | US-03 AC1, US-04, US-01 AC7/AC8 and every payment E2E | **Fixed and deployed** (deploy `0Afg700000JCX3hCAH`, 77 tests pass): the Aura-facing `startCheckout` takes `Map<String, Object> request` (the LWC call is unchanged) and builds the `DonationRequest` inside; the typed method is now `startCheckoutFor`, used by the Apex tests; 4 new tests. Unreadable data now says "No pudimos leer los datos de tu donación…" instead of blaming the campaign. **Verified as a visitor** through the site's Aura endpoint (no donation created): both public campaigns now reach the amount check ("El monto mínimo es de $10 MXN." with amount 5), a non-public campaign still gets "Esta campaña ya no recibe donaciones.", and a bad id, a bad amount or a null request get the new message. A full payment through the button is not yet run |
| R-12 | Info | G12 isn't a gap: Salesforce already rejects an end date before the start date. | US-08 | No change needed |

Not fixed on purpose: G10 and G13 (hostile or invalid text that only the server sees, after the Stripe session exists: the donation is rejected, nothing is stored, the unused session expires on its own), and the missing resend path of R-02.

## 5. Gaps of the plan (section 6) after this run

| Gap | State |
|---|---|
| G1 frontend on mock data | **Resolved**: the data service calls Apex |
| G2 placeholder return addresses | Open (R-05) |
| G3 no staff views or record page | Open |
| G4 PR #62 open | **Resolved**: merged |
| G5 no site, credential, sender, integration user or data | Partly resolved: credential, sender (unverified), scheduled check and demo data exist; the site is not published |
| G6 stray folder | Open (R-11) |
| G7 general campaign and US-01 AC4 | No change; test it as the plan says |
| G8 reference not on the payment | Fixed in code (R-09) |
| G9 one message for six campaign fields | Open: decide |
| G10, G13 | Accepted, as above |
| G11 admin holds the payment permission | Open (R-07); it happened |
| G12 end before start | **Not a gap** (R-12) |
| G14 no tests for the rules | Added (R-10) |

## 6. Repeat it

```bash
# Apex, in the org (alias of the README: donaciones)
sf apex run test --class-names PublicCampaignControllerTest --class-names DonationCheckoutServiceTest --class-names StripeClientTest --class-names DonationReceiptServiceTest --class-names PendingDonationCheckTest --class-names StaffRolesTest --class-names DonationRulesTest --target-org donaciones --result-format human --code-coverage --wait 20
```

```bash
# Jest, on the frontend branch
npm ci && npm test
```

The validation matrix is plain anonymous Apex that inserts and rolls back; `DonationRulesTest` now holds the same cases.

## 7. To do before the next run

1. Publish the site (R-01), set the guest user's time zone (R-06) and the two return address labels (R-05).
2. Verify the receipt sender (R-02), allow deployments with Apex jobs (R-03) and find out why the schedules create no job (R-13).
3. Deploy the fixes of R-02, R-04, R-09 and R-10, and run the Apex suite again.
4. Run the E2E and Security cases in the order of the plan.
