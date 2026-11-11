# Delivery 1 test plan

> Results of run 1 (Nov 10, 2026), with the findings and their status: [docs/test_results.md](test_results.md). The gaps of section 6 are updated there (section 5 of that file).

## 1. Introduction

This plan verifies Delivery 1 against **every acceptance criterion** of its 11 stories (US-01 to US-09, US-11 and US-12): 78 criteria, as they read after refinement in each story's issue. Delivery 1 passes only when every test case passes: no exceptions, no "known failures". Where the code doesn't meet a criterion yet, the case says so and section 6 lists the gap.

### How this plan is structured

- **Section 2** says what must be in place before testing (the gate), the addresses used in the steps and the test data.
- **Section 3** explains how to run the automated tests and records their baseline.
- **Section 4** has one subsection per story. Each one is a table with one row per test case:
  - **ID**: `TC-USxx-nn`, where `xx` is the story and `nn` a running number.
  - **AC**: the acceptance criterion (or criteria) the case proves, for example `AC3`. Every criterion of every story has at least one case.
  - **Level**: how the case is run (see below).
  - **Steps** and **Expected result**.
  - **Automated by**: the Apex test method or Jest test that already covers that logic, or "—" when none does. A manual case still has to be run end to end even when the logic is covered by an automated test.
- After each table, **Edge cases** lists the boundary and negative cases for that story. They are test cases too: an edge case that fails means the story fails.
- **Section 5** is the traceability matrix (criterion → test cases), and **section 6** lists the gaps found while writing and reviewing this plan: what will make cases fail or keep them blocked until it's fixed or decided.

### Test levels

| Level | What | Who runs it | Where the result goes |
|---|---|---|---|
| **Apex** | Apex unit tests in `force-app/main/default/classes/*Test.cls` | Anyone, with the command in section 3 | Test run ID in the story's Evidence |
| **Jest** | LWC unit tests in `force-app/main/default/lwc/*/__tests__` | Anyone, with `npm test` | Output in the story's Evidence |
| **E2E** | Manual test on the published site, with Stripe in test mode, as a visitor without login | Tester | Screenshot or video timestamp in the story's Evidence |
| **Staff** | Manual test in Salesforce as a staff user (System Admin, Campaign Manager or Moderator) | Tester | Screenshot in the story's Evidence |
| **Security** | Manual attack attempts as a visitor (US-12) | Tester, then someone else repeats it | A row in `docs/seguridad.md` section 1 (channel, expected, actual, evidence) |

### Recording results

For each case write **Pass**, **Fail** or **Blocked** (a precondition from section 2 is missing) with the date and the evidence link. A Fail opens a bug issue linked to the story. Delivery 1 is done when every case is Pass.

## 2. Preconditions and test data

### 2.1 Gate: what must be true before testing

| # | Precondition | Where it's done | Blocks |
|---|---|---|---|
| P1 | Org in Spanish, locale Spanish (Mexico), currency MXN, time zone America/Merida, stages `Pending`, `Paid` and `Expired` | README "Set up the org", steps 2 and 3 | Everything |
| P2 | Backend deployed with PR #62 (roles as permission set groups, simulated invoice, Stripe credential metadata) merged into `develop` | README step 4 | Apex, Staff, E2E |
| P3 | Frontend (`feature/delivery-1-frontend2`) merged and deployed, with **`donationDataService.js` connected to Apex** instead of the mock data | `docs/public-site.md`, "Connecting the backend" | E2E, Security |
| P4 | Experience Cloud site published in Spanish. Guest user with "Donaciones · Sitio público" and "Donaciones · Payment Integration" and time zone America/Merida. Default owner set for records the guest creates. Image and font hosts added to CSP Trusted Sites (otherwise campaign images show a placeholder). | README step 7, #38, #39 | E2E, Security |
| P5 | Stripe connected: test account and sandbox, restricted key in the `Stripe` credential, checkout settings with cards only, Spanish and MXN, and **Link turned off** | #46 to #49 | US-01 AC2, US-03, US-04 and every E2E payment |
| P6 | Custom Labels `Stripe_Success_Url` = `<site>/gracias` and `Stripe_Cancel_Url` = `<site>/pago-no-completado`, set in the org **after every deploy** (the repo has placeholders, G2) | `docs/public-site.md`, "Stripe return addresses" | US-04 |
| P7 | Receipt sender: Org-Wide Email Address "Donaciones Mexico Dreamin" verified, deliverability "All email" | #56 | US-02 AC2, US-06 AC8, US-11 AC6 |
| P8 | Integration user with "Donaciones · Payment Integration" and the scheduled check scheduled (`PendingDonationCheck.scheduleEveryQuarterHour()`); who it is decided (G11) | #57 | US-03 AC5 |
| P9 | Staff users: the admin with "Rol · System Admin", and the "Staff demo" user that switches between "Rol · Campaign Manager" and "Rol · Moderator" (the org has one free license). "As Campaign Manager" or "as Moderator" in the steps means the Staff demo user with that group. | README step 6, #58 | Staff cases |
| P10 | Staff views: the invoice requests list view (#30), campaign management (#32), the donations list view (#34), and a **donation record page or layout** that shows the custom fields (G3) | #30, #32, #34 | US-07, and staff cases that open a donation |
| P11 | Demo data loaded (section 2.3) | #59 | E2E |

### 2.2 Addresses

- **`<site>`**: the site's base address, with its path prefix. For an Aura "Build Your Own" site it ends in `/s`, for example `https://<domain>.my.site.com/donaciones/s`; for an LWR site it has no `/s`. The site pages are `<site>/` (home), `<site>/campana?id=<Id>`, `<site>/donar?campana=<Id>`, `<site>/campanas-pasadas`, `<site>/gracias` and `<site>/pago-no-completado` (check the exact names in Experience Builder).
- **Site Apex endpoint** (what the pages call): `<site>/sfsites/aura` for Aura, or `/webruntime/api/apex/execute` on the site domain for LWR.
- **`<org>`**: the org's My Domain address, `https://<mydomain>.my.salesforce.com`, used by staff.

### 2.3 Test data

Use fictitious data only, and only email addresses the team controls (CLAUDE.md). Where a step needs several emails, use the team address with a plus tag, for example `<team address>+anonima`.

**Campaigns** (all with description, image URL and purpose, which `Campaign_Required_Fields` requires):

| Name | Active | Start | End | Goal | Used by |
|---|---|---|---|---|---|
| Donación general | Yes | Today | 2099-12-31 | Any | US-08 AC8, US-01 AC4 |
| Campaña A | Yes | Yesterday | +30 days | $10,000 | Most cases |
| Campaña B | Yes | Yesterday | +30 days | $5,000 | US-01 AC1 |
| Campaña meta cumplida | Yes | Yesterday | +30 days | $1,000; reach it by paying $1,000 with card 4242 (only Stripe can mark donations paid) | US-08 AC5 |
| Campaña pasada | Yes | -30 days | Yesterday | Any | US-01 AC6 |
| Campaña futura | Yes | Tomorrow | +30 days | Any | US-08 AC4 |
| Campaña pausada | **No** | Yesterday | +30 days | Any | US-08 AC7, US-12 AC4 |

Cases that deactivate or change a campaign (TC-US01-05, TC-US08-02, TC-US08-07, TC-US08-08) say "restore afterwards": put the campaign back as in this table before the next case.

**Stripe test cards** (any future date, any CVC): `4242 4242 4242 4242` (success), `4000 0000 0000 0002` (generic decline), `4000 0048 4000 8001` (Mexico Visa), a 3D Secure card from Stripe's testing page.

**RFCs** (fictitious, valid format): individual `PEGJ800101AB3` (13), company `ABC010101AB1` (12), company with `&` `A&B010101AB1`, generic `XAXX010101000` (13). Invalid: `ABC010101AB` (11), `PEGJ801301AB3` (month 13), `PEGJ800132AB3` (day 32), `PEGJ800101ABZ` (bad check character), `PEG$800101AB3` (symbol).

**Hostile text** for name fields, and what the server does with it (checked in the org with `stripHtmlTags`):

| Text | Stored as |
|---|---|
| `<script>alert(1)</script>` | Empty: the tags and their content are removed |
| `<img src=x onerror=alert(1)>` | Empty |
| `<b>Ana</b>` | `Ana` |
| `' OR Name LIKE '%` | As typed (plain text) |
| `Ana"; DROP TABLE x; --` | As typed (plain text) |

## 3. Running the automated tests

**Apex**, in the team org (`donaciones` is the README's alias; use yours):

```bash
sf apex run test --class-names PublicCampaignControllerTest --class-names DonationCheckoutServiceTest --class-names StripeClientTest --class-names DonationReceiptServiceTest --class-names PendingDonationCheckTest --class-names StaffRolesTest --target-org donaciones --result-format human --code-coverage --wait 20
```

Pass: 0 failures, and at least 75% coverage on each class (team rule; the platform itself requires 75% org-wide to deploy to production).

**Jest**, from the repo root after `npm ci`. Until the frontend is merged, run it on the `feature/delivery-1-frontend2` branch, which has the `package.json`:

```bash
npm test
```

Pass: 0 failures. `npm run test:coverage` adds the coverage report and fails below 90% of lines.

**Baseline on Nov 10, 2026** (before the manual cases):

| Suite | Result | Run |
|---|---|---|
| Apex: `PublicCampaignControllerTest`, `DonationCheckoutServiceTest`, `StripeClientTest`, `DonationReceiptServiceTest`, `PendingDonationCheckTest` | All pass: 44 test methods (the CLI counts 48, including the 4 `@TestSetup` methods). Coverage of these classes 92% to 100% (96% for the run). | `707g7000019V5ZH` |
| Apex: `StaffRolesTest` | All pass: 7 test methods (the CLI counts 8) | `707g7000019UxxE` |
| Jest, branch `feature/delivery-1-frontend2` | 14 suites, 120 of 120 pass | Local run; the site still uses mock data (G1) |

## 4. Test cases by story

### US-01 · Choose a campaign and see its progress (#1)

| ID | AC | Level | Steps | Expected result | Automated by |
|---|---|---|---|---|---|
| TC-US01-01 | AC1 | E2E | With Campaña A and Campaña B active, open `<site>/` in a private window. | Each active campaign shows its name, goal and progress (amount raised and %), with no login. | Apex `activeCampaignsExcludePastFutureAndPaused`; Jest campaignList "shows one card per active campaign" |
| TC-US01-02 | AC2 | E2E | Note Campaña A's raised amount. Donate $250 with card 4242 and return to the site. Reload the home page. | Raised grows by exactly $250 and the % updates. | Apex `activeCampaignShowsGoalAndPaidProgressOnly` |
| TC-US01-03 | AC2 | E2E | Start a $500 donation to Campaña A and stop on Stripe's page without paying. Reload the home page. | Raised does not change: a `Pending` donation never counts. | Apex `activeCampaignShowsGoalAndPaidProgressOnly` |
| TC-US01-04 | AC3, AC7 | E2E | Choose Campaña A → "Donar". | Step 1 offers exactly $100, $250, $500, $1,000, $2,000, $5,000, $10,000 and $20,000 MXN; the form doesn't continue, and says "Elige un monto para continuar.", until one is chosen. | Jest donationForm "offers the eight suggested amounts", "does not continue until an amount is chosen" |
| TC-US01-05 | AC4 | E2E | Deactivate every campaign except Donación general (which is always open). Open `<site>/`. Restore afterwards. | The site opens Donación general's page directly. | Jest campaignList "opens the only active campaign directly" |
| TC-US01-06 | AC5 | E2E | Open Campaña A's page. | Shows description, image, end date ("Cierra el …"), purpose, goal and progress. Donación general shows that it is always open instead of an end date. | Jest campaignDetail "shows everything the campaign page needs"; donationUtils "labels the general campaign as always open" |
| TC-US01-07 | AC6 | E2E | Open the home page and the past campaigns page. | Campaña pasada is not on the home page; it's on the past campaigns page, with its closing date and no "Donar" button. | Apex `pastCampaignsListOnlyCampaignsThatEndedWhileActive`; Jest campaignCard "has no donate button for a past campaign" |
| TC-US01-08 | AC6 | E2E | Open `<site>/donar?campana=<Campaña pasada Id>` directly. | The form does not let you donate. | Jest donationForm "does not let anyone donate to a past or unknown campaign"; Apex `closedCampaignIsRejectedWithoutCallingTheGateway` |
| TC-US01-09 | AC8 | E2E | Choose $1,000, complete the data and reach the confirmation. Repeat with $500. | The confirmation shows the amount before Stripe opens; $1,000 is highlighted, $500 is not. | Jest donationForm "summarizes the donation and highlights $1,000 or more", "does not highlight amounts under $1,000" |
| TC-US01-10 | AC9 | E2E | On the confirmation, choose "Cambiar monto" and pick another amount. | Back on step 1 with Stripe never opened; the new amount reaches the confirmation. Salesforce has no new donation. | Jest donationForm "lets the donor change the amount without opening the gateway" |
| TC-US01-11 | AC10 | E2E | Run TC-US01-04 three times, choosing anonymous, credited and invoice on step 2. | Campaign and amount are chosen the same way (step 1) for all three types. | — |

**Edge cases**
- End date = today: the campaign is still active until midnight Mérida time; tomorrow it moves to past campaigns.
- A campaign that ended while **inactive** shows in neither list (Apex `pastCampaignsListOnlyCampaignsThatEndedWhileActive`).
- In the Experience Builder preview, a single active campaign does not redirect (Jest "does not redirect inside the Experience Builder preview").
- A campaign over 100% shows its real % (for example 130%) with the bar full (Jest progressBar "keeps the bar full over 100% but reports the real value").
- Exactly $1,000 is highlighted. Only the eight amounts exist in Delivery 1; a custom amount is US-13 (Delivery 2).
- Progress shows the new paid donation right after a reload: the controller is not cacheable.
- A campaign that closes (deactivated, or its end date passes) while the donor is on the form: "Ir a pagar" fails with "Esta campaña ya no recibe donaciones." and nothing is saved.
- A campaign that closes while the donor is already on Stripe: the payment still completes and the donation is marked `Paid` on that campaign (expected: the donor was charged).

### US-02 · Donate anonymously (#2)

| ID | AC | Level | Steps | Expected result | Automated by |
|---|---|---|---|---|---|
| TC-US02-01 | AC1 | E2E | Donate $250 to Campaña A as anonymous, without invoice, with card 4242. Check the home page, Campaña A's page (recognition) and the thank-you page. | No name appears anywhere public. | Apex `anonymousDonationStoresNoNames`, `recognitionExposesNoPrivateData` |
| TC-US02-02 | AC2 | E2E | Open the receipt email of TC-US02-01. | The receipt has reference, campaign, amount, date and type "Anónima", and no "Donante:" line. | Apex `anonymousReceiptShowsNoName` |
| TC-US02-03 | AC3 | E2E | Donate as anonymous **with** invoice (individual, RFC `PEGJ800101AB3`, consent ticked) and pay. | The form allows it and asks for the name "only for your invoice". After payment, neither name nor RFC appears on the site. The email body has no "Donante:" line; the name and RFC are only in the attached invoice PDF. | Jest donationForm "anonymous with invoice asks for the name only for the invoice"; Apex: none for this combination (G14) |
| TC-US02-04 | AC4 | Staff | As System Admin, and as the Staff demo user in each group, open TC-US02-01's and TC-US02-03's donations. | "Anónima" is checked; "Tipo de donación" shows "Anónima" and "Anónima con factura". | — |
| TC-US02-05 | AC5 | E2E | Choose anonymous without invoice, then anonymous with invoice. | Without invoice: only the email is asked, with no public name and no donor name. With invoice: the name fields appear with the note "Solo se usa para tu factura; nunca se muestra en público." and still no public name. | Jest donationForm "anonymous without invoice asks only for the email" |
| TC-US02-06 | AC6 | E2E | Anonymous, leave the email empty, press "Continuar". | The form does not continue, marks the email as required and moves the focus to it. | Jest donationForm "anonymous without invoice asks only for the email", "moves focus to the first invalid field" |
| TC-US02-07 | AC7 | E2E | After TC-US02-01, open Campaña A's recognition. | The anonymous donation is not a row; a separate "Donantes anónimos" row shows the total of paid anonymous donations, with no names. | Apex `recognitionSumsAnonymousDonationsApart`; Jest donorRecognition "shows the anonymous total apart from the list" |

**Edge cases**
- A request sent straight to `startCheckout` with `anonymous: true` and a `publicName` stores no public name (Apex `anonymousDonationStoresNoNames`).
- Two anonymous donations of $100 and $50: the total row shows $150.
- A campaign with only anonymous donations shows only the total row (Jest "shows only the anonymous total when nobody asked for credit").
- A Moderator marks a credited donation anonymous: it leaves the list and its amount joins the total.

### US-03 · Record the donation before payment (#3)

| ID | AC | Level | Steps | Expected result | Automated by |
|---|---|---|---|---|---|
| TC-US03-01 | AC1 | E2E + Staff | Fill in a credited $500 donation to Campaña A and press "Ir a pagar". While Stripe's page is open, look up the donation in Salesforce. | A donation already exists in `Pending` with Campaña A, type "Acreditada" and amount $500, before any payment. | Apex `startCheckoutSavesPendingDonationAndReturnsGatewayUrl` (the `Pending` donation; not its type) |
| TC-US03-02 | AC2 | E2E + Staff | Pay TC-US03-01 with card 4242. In Salesforce, note the donation's "Referencia de donación" (`DON-` plus 8 characters), "ID de sesión de Stripe" and "ID de pago de Stripe". In Stripe, open that Checkout Session (`stripe checkout sessions retrieve <cs_test_…>` with the Stripe CLI, or the `checkout.session.completed` event) and the payment. | The Checkout Session's `client_reference_id` and `metadata.donation_reference` equal the donation's reference, and the payment's ID equals "ID de pago de Stripe", so staff can go from the test payment to the donation. The payment itself doesn't carry the reference (G8). | Apex `startCheckoutSendsTheDonationToTheGateway`; StripeClientTest `createCheckoutSessionPostsTheDonationToStripe` |
| TC-US03-03 | AC3 | E2E + Staff | Submit one donation of each type: anonymous, credited, invoice, and anonymous with invoice. | Each `Pending` donation has the matching "Tipo de donación": Anónima, Acreditada, Factura, Anónima con factura. | — (G14) |
| TC-US03-04 | AC4 | E2E + Staff | Try to submit with each required field missing or invalid (email, public name, donor name, RFC, consent). | The form stays on step 3, shows each problem, and Stripe never opens. Salesforce has no new donation. | Jest donationForm step 3 tests; "stays on the page with the server message if the donation fails" |
| TC-US03-05 | AC4 | Security | Call `startCheckout` through the site Apex endpoint (section 2.2) with an invalid RFC, with no email, and with no public name for a credited donation. | Each returns the validation rule's Spanish message; no donation is saved. | Apex `validationRuleMessageReachesTheDonor` (public name rule only; G14) |
| TC-US03-06 | AC5 | E2E + Staff | Start a donation and close Stripe's page without paying. Expire its Checkout Session with the Stripe CLI (`stripe checkout sessions expire <cs_test_…>`), or wait the 60 minutes. Then wait up to 20 minutes. | The donation becomes `Expired` and Campaña A's progress does not change. | Apex `confirmMarksExpiredSession`, `checkAppliesTheGatewayStatus` |
| TC-US03-07 | AC6 | E2E | Enter these emails: `ana@`, `ana@dominio`, `ana dominio.com`, `ana@dominio.c`. Then the team address with a plus tag. Stop before paying. | The first four show "El correo no tiene un formato válido. Ejemplo: nombre@dominio.com" and block the form; the last one is accepted. | Jest donationForm "rejects an email without a valid format"; donationUtils "accepts a valid email" |
| TC-US03-08 | AC7 | E2E | On step 3, look at the email field. | It says "Aquí te enviaremos tu comprobante." | — |

**Edge cases**
- Double-click "Ir a pagar": the button is disabled while processing, so only one donation is created (Jest "disables the button while processing").
- Stripe down: the donor sees "No pudimos abrir la pasarela de pago. Intenta de nuevo en unos minutos." and nothing is saved (Apex `gatewayErrorSavesNothing`).
- An amount under $10 MXN sent straight to `startCheckout` is rejected with "El monto mínimo es de $10 MXN." (Apex `amountBelowMinimumIsRejected`).
- The paid amount comes from Stripe, not the form: if the request said $250 and Stripe charged $300, the donation is saved with $300 (Apex `confirmMarksPaidWithTheGatewayAmount`).
- A donor who pays and closes the browser before returning: within about 20 minutes (5-minute grace period plus the 15-minute schedule) the scheduled check marks it `Paid` and the receipt is sent (Apex `checkAppliesTheGatewayStatus`).
- A donation created less than 5 minutes ago is left alone by the scheduled check (Apex `checkLeavesRecentDonationsAlone`).
- `startCheckout` with an invalid `personType` (not `Individual` or `Company`) returns a platform error rather than a Spanish message (G13).

### US-04 · Thank-you page (#4)

| ID | AC | Level | Steps | Expected result | Automated by |
|---|---|---|---|---|---|
| TC-US04-01 | AC1 | E2E | Pay with card 4242. | Stripe returns to `<site>/gracias?session_id=cs_test_…` and the page shows "¡Gracias por tu donación!". The donation becomes `Paid` with "Confirmado por" = "Página de regreso". | Jest donationThanks "asks the backend to apply the Stripe session status"; Apex `confirmMarksPaidWithTheGatewayAmount` |
| TC-US04-02 | AC2 | E2E | Read the thank-you page, both before and after the donation is `Paid`. | It never says the payment is confirmed: "Estamos confirmando tu pago…". | Jest donationThanks "shows the same text whatever the status…" |
| TC-US04-03 | AC3 | E2E | Inspect the page and its network responses. | No name, email, amount or data from any donor, including the current one. | Jest donationThanks "shows the same text whatever the status…" |
| TC-US04-04 | AC4 | E2E | Repeat TC-US04-01 for anonymous, credited and invoice. | The same thank-you page every time. | — |
| TC-US04-05 | AC5 | E2E | On Stripe's page, use its back link to cancel. | The site shows "Tu donación no se completó y no se hizo ningún cargo" and "Intentar de nuevo", which opens the home page. The thank-you page is not shown. The donation stays `Pending` until it expires (TC-US03-06). | Jest donationCancelled "says no charge was made…", "sends to the home page without a campaign" |
| TC-US04-06 | AC6 | E2E | Read the thank-you page. | "…te enviaremos tu comprobante al correo que registraste.", still without saying the payment is confirmed. | — |

**Edge cases**
- `<site>/gracias` without `session_id`: the page thanks the donor and calls nothing (Jest "does not call the backend without a session id").
- `<site>/gracias?session_id=cs_test_unknown`: the page still thanks, without errors on screen, and no donation changes (Jest "still thanks the donor if the check fails"; Apex `confirmOfUnknownSessionFails`).
- Reload the thank-you page of a paid donation: Stripe is not called again and no second receipt is sent (Apex `confirmOfFinishedDonationDoesNotCallTheGateway`, `receiptIsNotSentTwice`).
- Declined card `4000 0000 0000 0002`: Stripe shows the decline and the donor stays on Stripe; nothing is marked paid.
- 3D Secure card: after authenticating, the flow ends on the thank-you page.

### US-05 · Appear as a donor (#5)

| ID | AC | Level | Steps | Expected result | Automated by |
|---|---|---|---|---|---|
| TC-US05-01 | AC1 | E2E | Donate $250 to Campaña A as credited, public name "Familia Prueba", and pay. Open Campaña A as a visitor. | The recognition lists "Familia Prueba — $250" for Campaña A only. | Apex `recognitionListsPaidCreditedDonorsNewestFirst`; Jest donorRecognition "lists each credited donor with name and amount" |
| TC-US05-02 | AC2 | E2E + Security | Inspect the recognition on screen and its `getRecognition` network response. | Only display name and amount: no email, real name, RFC or any other field. | Apex `recognitionExposesNoPrivateData` |
| TC-US05-03 | AC3 | E2E | As credited, choose the person type ("Donas como"), write the donor name "Ana Pérez" and leave the field: the public name is suggested. Change the public name to "Empresa Uno SA de CV", then edit the donor name and leave it again. Pay. | The public name is free text; the suggestion doesn't overwrite what you wrote; the recognition shows "Empresa Uno SA de CV". | Jest donationForm "credited asks for the public name…", "suggests the public name from the donor name without overwriting it" |
| TC-US05-04 | AC4 | E2E | Give Campaña A more than 5 paid credited donations (the list shows about 5 rows at a time). | The list scrolls by itself and every donor can be seen. | Jest donorRecognition "scrolls by itself when the donors do not fit" |
| TC-US05-05 | AC5 | E2E | Donate credited **with** invoice (company, RFC `ABC010101AB1`) and pay. | The recognition shows its public name and amount, never the RFC. | Apex `recognitionExposesNoPrivateData` |
| TC-US05-06 | AC6 | E2E | Start a credited donation and do not pay. | It is not in the recognition. | Apex `recognitionListsPaidCreditedDonorsNewestFirst` |
| TC-US05-07 | AC7 | Staff + E2E | As Moderator, change TC-US05-01's "Nombre público" to "Familia Prueba Editada". Reload Campaña A. | The recognition shows the new name. | Apex StaffRolesTest `moderatorChangesTheDisplayName` |
| TC-US05-08 | AC8 | E2E | With paid anonymous donations in Campaña A, open it. | "Donantes anónimos" shows their total apart from the list, with no names. | Apex `recognitionSumsAnonymousDonationsApart`; Jest donorRecognition "shows the anonymous total apart from the list" |

**Edge cases**
- Newest first: a donation paid today appears above one paid yesterday (Apex `recognitionListsPaidCreditedDonorsNewestFirst`).
- A public name of 120 characters is saved and shown whole; the form doesn't accept more.
- A Moderator marks a donation anonymous to hide an offensive name: it leaves the list and its amount joins the anonymous total.
- A Moderator cannot empty the public name of a credited donation (validation rule `Public_Name_Required`).
- A campaign with no paid donations invites to donate (Jest "invites to donate when there are no paid donations yet").
- Hostile text as public name: see TC-US12-08.

### US-06 · Enter invoice details (#6)

| ID | AC | Level | Steps | Expected result | Automated by |
|---|---|---|---|---|---|
| TC-US06-01 | AC1 | E2E | Request an invoice, choose the person type ("Donas como"), and leave the name (or company) and the RFC empty. Continue. | The form doesn't continue and marks each missing field separately. | Jest donationForm "invoice asks for person type, RFC and consent" |
| TC-US06-02 | AC1 | Security | Send an invoice request through the site Apex endpoint without RFC, then without person type. | "Captura tu RFC para solicitar factura." and "Indica si eres persona física o moral para emitir la factura."; no donation saved. | — (G14) |
| TC-US06-03 | AC2 | E2E | Enter `PEGJ800101AB3` (individual) and `ABC010101AB1` and `A&B010101AB1` (company), then each invalid RFC from section 2.3. | The valid ones pass, including the `&`; each invalid one is rejected with "El RFC no tiene un formato válido. Revisa las letras, la fecha y la homoclave." Nothing calls the SAT. | Jest donationUtils "accepts a valid RFC for each person type"; server rule `RFC_Format` has no Apex test (G14) |
| TC-US06-04 | AC3 | E2E + code review | Complete an invoice donation and pay. Check the email and the org. | The invoice says it is not a tax document; no CFDI is issued and the only external call is Stripe. | Apex `invoiceShowsTaxDataAndSaysItIsNotATaxDocument` |
| TC-US06-05 | AC4 | E2E | Request an invoice. | The form asks to choose "Persona física" or "Persona moral". | Jest donationForm "invoice asks for person type, RFC and consent" |
| TC-US06-06 | AC5 | E2E | Company + `PEGJ800101AB3` (13 characters); individual + `ABC010101AB1` (12). | "Para persona moral el RFC tiene 12 caracteres." and "Para persona física el RFC tiene 13 caracteres."; both blocked. | Jest donationForm "checks the RFC length against the person type" |
| TC-US06-07 | AC6 | E2E | Request an invoice and don't tick the consent. | "Necesitamos tu autorización para emitir la factura."; the form doesn't continue. | Jest donationForm "stops asking for the consent once ticked" |
| TC-US06-08 | AC7 | Staff | After an invoice donation, open it as System Admin and as the Staff demo user in each group. | "Consentimiento para factura" is checked with its date and time; staff can read it but not edit it. | Apex `invoiceDataIsCleanedBeforeSaving` |
| TC-US06-09 | AC8 | E2E | Pay an invoice donation. | The email arrives automatically with the simulated invoice attached as a PDF, marked as not a tax document, with the name (or company) and RFC. | Apex `invoiceDonationGetsTheSimulatedInvoiceAttached`, `paidInvoiceDonationSendsOneEmail` |
| TC-US06-10 | AC9 | E2E | Donate anonymous with invoice and pay. Open the campaign. | Neither the name nor the RFC appears; only the anonymous total grows. | Apex `recognitionExposesNoPrivateData` |

**Edge cases**
- Lowercase and spaces: typing `pegj 800101 ab3` becomes `PEGJ800101AB3`. Pasting it doesn't: the 13-character limit cuts it before the spaces are removed.
- `Ñ` is a valid RFC letter (for example `ÑAB010101AB1`).
- Generic RFC `XAXX010101000` is accepted (individual pattern).
- `PEGJ800230AB3` (February 30) passes: the SAT pattern checks the digits, not the calendar (AC2 asks for the pattern only).
- An RFC typed before choosing the person type is not judged until the type is chosen (Jest "does not judge the pattern before the person type is known").
- `<b>ACME</b>` as company name is saved as `ACME`; the invoice escapes any special characters that remain (Apex `invoiceEscapesTheDonorText`).
- A donation without invoice gets no attachment (Apex `donationWithoutInvoiceGetsNoAttachment`).

### US-07 · Flag invoice requests (#7)

| ID | AC | Level | Steps | Expected result | Automated by |
|---|---|---|---|---|---|
| TC-US07-01 | AC1 | Staff | Open an invoice donation. | "Solicita factura" is checked and the name (or company) and RFC are visible. | — |
| TC-US07-02 | AC2 | Staff | Open the invoice requests view (#30) with donations of all four types present. | Only donations with "Solicita factura" are listed, including "Anónima con factura". | — |
| TC-US07-03 | AC3 | Staff | Open an invoice donation. | Person type and consent (with its date) are visible. | — |
| TC-US07-04 | AC4 | Staff | With one invoice donation `Pending` and one `Paid`, open the invoice requests view. | The view shows each one's status, so the pending one can be told apart. | — |

**Edge cases**
- An `Expired` invoice donation also shows its status, so nobody issues an invoice for an unpaid donation.
- An anonymous donation with invoice appears in the invoice requests view with its name and RFC, which are stored only for the invoice.
- Campaign Manager and Moderator can't change "Solicita factura"; the System Admin can (its permission set allows it), so a change by hand would be visible only in the field history.

### US-08 · Manage campaigns (#8)

| ID | AC | Level | Steps | Expected result | Automated by |
|---|---|---|---|---|---|
| TC-US08-01 | AC1 | Staff + E2E | As Campaign Manager, create an active campaign with name, goal, dates that include today, description, image and purpose. Open the site. | It appears among the active campaigns. | Apex StaffRolesTest `campaignManagerCreatesACompleteCampaign` |
| TC-US08-02 | AC2 | Staff + E2E | Change that campaign's goal. Reload the site. Restore afterwards. | The site shows the new goal and the recalculated %. | — |
| TC-US08-03 | AC3 | Staff | As Campaign Manager, try to save a campaign without start date; then without end date; then without goal. | Not saved, with "Para guardar la campaña captura fecha de inicio, fecha de fin, meta, descripción, URL de imagen y propósito." The message lists every required field, not only the missing one (G9). | Apex StaffRolesTest `campaignManagerCannotSaveAnIncompleteCampaign` |
| TC-US08-04 | AC4 | E2E | With Campaña futura (starts tomorrow), open the site; then set its start date to today. | Not shown as active while its start date is in the future; shown once it starts. | Apex `activeCampaignsExcludePastFutureAndPaused` |
| TC-US08-05 | AC5 | E2E | Open Campaña meta cumplida (≥100%) and donate $100. | It's still active, shows its real % over 100, and the donation goes through. | Jest donationUtils "keeps the real percentage over 100%" |
| TC-US08-06 | AC6 | Staff | As Moderator, try to create a campaign and to edit one. | There is no way to create or edit. | Apex StaffRolesTest `moderatorCannotCreateCampaigns` |
| TC-US08-07 | AC7 | Staff + E2E | As Campaign Manager, untick "Activa" on Campaña A (dates still current). Open the site and `<site>/donar?campana=<Campaña A Id>`. Restore afterwards. | Campaña A disappears from the active campaigns and the form refuses it; `startCheckout` rejects it too. | Apex `activeCampaignsExcludePastFutureAndPaused`, `closedCampaignIsRejectedWithoutCallingTheGateway` |
| TC-US08-08 | AC8 | E2E | Leave only Donación general active. Donate $100. Restore afterwards. | The donation goes through (and the home page opens Donación general directly, TC-US01-05). | — |

**Edge cases**
- A campaign also needs description, image and purpose; missing any of them gives the same message (`Campaign_Required_Fields`).
- Changing the goal of an active campaign is allowed (no lock; it's a documented policy, US-08 refinement 3).
- An end date before the start date is accepted with no message, and such a campaign is never active (G12).

### US-09 · View all donations (#9)

| ID | AC | Level | Steps | Expected result | Automated by |
|---|---|---|---|---|---|
| TC-US09-01 | AC1 | Staff | With donations of the three types in `Pending`, `Paid` and `Expired`, open the donations list (#34) as System Admin and as the Staff demo user in each group. | Each row shows status, amount, "Tipo de donación" and campaign. | Apex StaffRolesTest `everyRoleSeesDonationStatusAmountCampaignAndEmail` (Campaign Manager and Moderator only; doesn't check the status) |
| TC-US09-02 | AC2 | Staff | As System Admin, Campaign Manager and Moderator, open a donation. | All three see "Correo del donante". | Apex StaffRolesTest `everyRoleSeesDonationStatusAmountCampaignAndEmail` (Campaign Manager and Moderator only) |
| TC-US09-03 | AC3 | Staff | As Campaign Manager and as Moderator, try to change a donation's amount and its stage. | Campaign Manager: no edit access to donations. Moderator: the amount is read-only (no field access); a stage change is rejected with "Una donación nueva empieza en Pending, y el estado, el monto y la campaña solo los cambia la integración con Stripe." | Apex StaffRolesTest `moderatorCannotChangeTheAmount` |
| TC-US09-04 | AC4 | Staff | As Campaign Manager, try to change a donation's "Nombre público". | Not possible. | Apex StaffRolesTest `campaignManagerCannotChangeTheDisplayName` |
| TC-US09-05 | AC5 | Staff | As Moderator, open a paid donation and find it in Stripe (TC-US03-02). | "Referencia de donación", "ID de sesión de Stripe" and "ID de pago de Stripe" are visible and match Stripe. | — |

**Edge cases**
- The System Admin can't change amount, stage or campaign by hand either: only the payment integration can (`Payment_Fields_Locked`). This holds only if the admin doesn't hold "Donaciones · Payment Integration" (G11).
- Nobody can create a donation directly as `Paid`.
- Nobody can move a paid donation to another campaign.
- An Opportunity without the Donation record type can't be saved (`Donation_Record_Type_Required`).

### US-11 · Scoped public site (#11)

| ID | AC | Level | Steps | Expected result | Automated by |
|---|---|---|---|---|---|
| TC-US11-01 | AC1 | E2E | Open `<site>/` in a private window. | The campaigns show, with no login prompt. | — |
| TC-US11-02 | AC2 | E2E | Go through every page and link: home, campaign page, donation form, past campaigns, thank-you, payment not completed, not found. | Only campaigns, progress, credited donors' recognition (name and amount) and the donation form; no contact page. | Jest siteFooter "shows the program and the payment note, with no contact link" |
| TC-US11-03 | AC3 | E2E | Do a full donation, including Stripe. | Nothing asks to create an account, sign in or enter a token. | — |
| TC-US11-04 | AC4 | E2E | Read every page, every error message and Stripe's checkout. | Everything is in Spanish, including errors, dates (es-MX) and Stripe's page (`es-419`). | Jest donationLabels "exposes every label of the site" |
| TC-US11-05 | AC5 | E2E | Open staff addresses directly, as a visitor: on `<org>`, `/lightning/o/Opportunity/list`, `/lightning/o/Campaign/list` and `/lightning/setup/SetupOneHome/home`; on the site, `<site>/opportunity/<Id>` and `<site>/campaign/<Id>`. | No access: the org's login page, or the site's "No encontramos lo que buscabas". | Jest pageNotFound "explains the page is not available…" |
| TC-US11-06 | AC6 | E2E | Open a receipt email. | It ends with a support email to contact the program; the site has no contact page. | Apex `receiptShowsSupportEmailWhenConfigured` |

**Edge cases**
- An address that doesn't exist on the site (`<site>/no-existe`) shows "No encontramos lo que buscabas" in Spanish, with a link to the home page.
- Dates show in Spanish without shifting a day (Jest donationUtils "formats in Spanish without shifting the day").

### US-12 · Visitor security test (#12)

Every case below becomes a row in `docs/seguridad.md` section 1 with **channel, expected result, actual result and evidence**. Run them as a visitor without login, in a private window, with the browser's developer tools.

| ID | AC | Level | Steps | Expected result | Automated by |
|---|---|---|---|---|---|
| TC-US12-01 | AC1 | Security | **Site**: browse every page and read every network response. | No data from other donations beyond credited names and amounts. | Apex `recognitionExposesNoPrivateData` |
| TC-US12-02 | AC1, AC4 | Security | **Site Apex endpoint** (section 2.2): replay the `getRecognition` call with `campaignId` = null, a paused campaign's Id, a future campaign's Id and a well-formed Id of another object (for example an Opportunity Id). | Always an empty recognition: no donors, total 0. (A malformed Id is rejected before the method runs.) | Apex `recognitionWithoutCampaignIsEmpty`, `recognitionOfHiddenCampaignIsEmpty` |
| TC-US12-03 | AC1 | Security | **REST API** on `<org>`: `GET /services/data/v67.0/query?q=SELECT+Donor_Email__c+FROM+Opportunity` without a session, then with the guest's session from the site's cookies. | 401 without a session; with the guest's, no access (the guest has no object permission on Opportunity). | — |
| TC-US12-04 | AC2 | Security | Try to modify a donation: (a) `PATCH /services/data/v67.0/sobjects/Opportunity/<Id>`; (b) replay `startCheckout` adding `StageName`, `Amount` = 0 or another `campaignId`; (c) replay `confirmCheckout` with another donor's session id. | (a) fails; (b) extra fields are ignored or rejected, never applied; a closed campaign is rejected, the amount minimum holds, and a new donation always starts `Pending`; (c) only Stripe's real status is applied, nothing the visitor sends. | Apex `closedCampaignIsRejectedWithoutCallingTheGateway`, `amountBelowMinimumIsRejected`, `confirmMarksPaidWithTheGatewayAmount` |
| TC-US12-05 | AC3 | Security | Another team member follows `docs/seguridad.md` section 1 step by step. | Same results as the first run. | — |
| TC-US12-06 | AC4 | Security | Change Ids in addresses: `<site>/donar?campana=<paused Id>`, `<site>/campana?id=<Opportunity Id>`, `<site>/gracias?session_id=<another session>`. | No data from other donations; the form refuses closed campaigns. | Jest donationForm "does not let anyone donate to a past or unknown campaign" |
| TC-US12-07 | AC5 | Security | For a credited and an invoice donation shown in public, try to get their email and RFC from the page, the network responses and the endpoints in TC-US12-02 and TC-US12-03. | No email or RFC anywhere. | Apex `recognitionExposesNoPrivateData` |
| TC-US12-08 | AC7 | Security | Start a credited donation with each hostile text from section 2.3 as public name, then as donor name. Pay the ones the form accepts; open the recognition and the staff record. | Nothing runs and no query changes. `<script>…` and `<img …>` are removed, so the name is empty and the donation is rejected with "Escribe el nombre que quieres que aparezca públicamente." (public name) or "Captura tu nombre y apellidos o, si eres persona moral, el nombre de tu empresa." (donor name) (G10). `<b>Ana</b>` is saved as "Ana". The SQL-like texts are saved and shown as plain text. | Jest donorRecognition "shows names as plain text, never as HTML"; Apex `invoiceEscapesTheDonorText` |
| TC-US12-09 | AC8 | Security | As the visitor, open staff pages and internal URLs: on `<org>`, `/lightning`, `/lightning/setup/SetupOneHome/home`, `/_ui/common/apex/debug/ApexCSIPage` and `/services/data/`; on the site, `<site>/opportunity/<Id>` and `<site>/campaign/<Id>`. | No access for any of them; each URL is one row in the security document. | — |
| TC-US12-10 | AC6 | Security | A reviewer who didn't run the tests reads `docs/seguridad.md` section 1. | Every row lists the channel used, the expected result, the actual result and the evidence. | — |

**Edge cases**
- A malformed Id in a site address (for example `<site>/campana?id=abc`) shows an error or the not found page, never data.
- Anyone can call `startCheckout` repeatedly and create `Pending` donations and Stripe sessions; no Delivery 1 criterion covers it, so it goes in `docs/seguridad.md` known risks.

## 5. Traceability matrix

Every acceptance criterion of Delivery 1 and the cases that prove it. Read a cell as `TC-<story>-<number>`: for example, US-06 AC2 → TC-US06-03.

| Story | AC1 | AC2 | AC3 | AC4 | AC5 | AC6 | AC7 | AC8 | AC9 | AC10 |
|---|---|---|---|---|---|---|---|---|---|---|
| US-01 | 01 | 02, 03 | 04 | 05 | 06 | 07, 08 | 04 | 09 | 10 | 11 |
| US-02 | 01 | 02 | 03 | 04 | 05 | 06 | 07 | | | |
| US-03 | 01 | 02 | 03 | 04, 05 | 06 | 07 | 08 | | | |
| US-04 | 01 | 02 | 03 | 04 | 05 | 06 | | | | |
| US-05 | 01 | 02 | 03 | 04 | 05 | 06 | 07 | 08 | | |
| US-06 | 01, 02 | 03 | 04 | 05 | 06 | 07 | 08 | 09 | 10 | |
| US-07 | 01 | 02 | 03 | 04 | | | | | | |
| US-08 | 01 | 02 | 03 | 04 | 05 | 06 | 07 | 08 | | |
| US-09 | 01 | 02 | 03 | 04 | 05 | | | | | |
| US-11 | 01 | 02 | 03 | 04 | 05 | 06 | | | | |
| US-12 | 01, 02, 03 | 04 | 05 | 02, 06 | 07 | 10 | 08 | 09 | | |

## 6. Gaps found while writing and reviewing this plan

These will make cases fail or keep them blocked until they are fixed or decided. Each one should be an issue before testing starts.

| # | Gap | Affects | What to do |
|---|---|---|---|
| G1 | The site's `donationDataService.js` still answers with mock data (`donationMockData`), so the site doesn't read or write Salesforce. | Every E2E and Security case | Connect it to Apex as `docs/public-site.md` says, delete the mock and update its Jest tests (P3). |
| G2 | Both `Stripe_Success_Url` (`https://example.com/gracias`) and `Stripe_Cancel_Url` (`https://example.com/donacion-cancelada`) are placeholders, on both branches; deploying either branch resets the org's values. | US-04 (all), and every E2E payment | Set both labels to the site's pages after every deploy (P6), or keep the real values out of the repo. |
| G3 | The repo has no staff views (invoice requests, campaign management, donations list) and no donation record page or layout: fields deployed through the Metadata API are not on any layout. | US-07 (all); staff cases that open a donation (TC-US02-04, TC-US06-08, TC-US09-02, TC-US09-05) | Build #30, #32, #34 and the donation record page, and retrieve them into `force-app/`. US-08 AC1 to AC3 and US-09 AC1 can run meanwhile on the standard Campaign and Opportunity tabs. |
| G4 | PR #62 (permission set groups, simulated invoice, Stripe credential metadata) is still open. | US-06 AC8, US-09, role cases | Merge and deploy it before testing (P2). |
| G5 | The org has no site, Stripe credential, receipt sender, integration user or demo data yet. | Most E2E cases | #38, #39, #46 to #49, #56 to #59. |
| G6 | The frontend branch commits a stray `Claude outputs/` folder at the repo root. | None (clean-up) | Remove it before merging. |
| G7 | With the general campaign always active, US-01 AC4 (redirect with only one active campaign) only happens when the general campaign is the only one. | US-01 AC4 | Test it that way (TC-US01-05); no code change. |
| G8 | `StripeClient` sends the reference on the Checkout Session (`client_reference_id`, `metadata`) but not on the payment (`payment_intent_data[metadata]`), so the payment in Stripe's Payments list doesn't show it. | US-03 AC2, US-09 AC5 | Decide: accept going through the Checkout Session or "ID de pago de Stripe" (TC-US03-02 as written), or add `payment_intent_data[metadata][donation_reference]` in `StripeClient`. |
| G9 | `Campaign_Required_Fields` shows one message listing all six required fields, whatever is missing; US-08 AC3 says "I see what is missing". | US-08 AC3 | Decide: record that the team accepts the full list as meeting AC3, or split the rule per field with `errorDisplayField`. |
| G10 | A name made only of markup (`<script>…`, `<img …>`) is emptied by the server and the donation is rejected after the Stripe session was created; the donor sees a "write your name" message that doesn't say why. | US-12 AC7 (TC-US12-08) | Nothing runs, so AC7 is met. Optionally reject such names in the form first, with a clearer message. The unused Stripe session expires on its own. |
| G11 | The org has one free license (README step 6). If an admin, not a dedicated integration user, schedules the check, that admin holds "Donaciones · Payment Integration" and can change amounts and stages by hand. | US-09 System Admin edge case, US-03 AC5 | Decide who the integration user is (#57) and record it in `docs/seguridad.md`. |
| G12 | A campaign with its end date before its start date is accepted with no message, and it can never be active. | US-08 (edge) | Add a validation rule "the end date can't be before the start date". |
| G13 | `startCheckout` with an invalid `personType` returns the platform's technical message, not a Spanish one. Only reachable by calling the endpoint directly. | US-11 AC4 (edge), US-12 | Optionally validate `personType` in `DonationCheckoutService` with a Spanish message. |
| G14 | No Apex test covers the invoice validation rules (`RFC_Format`, `Invoice_RFC_Required`, `Invoice_Person_Type_Required`, `Invoice_Consent_Required`), `Donor_Email_Required`, `Donor_Name_Required`, `Donation_Type__c` across the four types, or an anonymous donation with invoice through `startCheckout`. | US-02 AC3, US-03 AC3 and AC4, US-06 AC1 and AC2 | The manual cases still prove them; add small Apex tests so a regression is caught automatically. |
