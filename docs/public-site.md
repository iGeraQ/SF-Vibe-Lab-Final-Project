# Public site (frontend)

The donor site is an Experience Cloud site with the guest user. Each page holds one LWC from `force-app/main/default/lwc`. All the text the site shows is in Custom Labels (`Donations_*`, Spanish), so it can be translated later (US-11 refinement 3).

## Pages

Create these pages in Experience Builder with exactly these URLs; the components build links with them.

| Page | URL | Component | Stories |
|---|---|---|---|
| Home (active campaigns) | `/` (Home) | `campaignList`, mode `active` | US-01 AC1, AC4 |
| Campaign | `campana` | `campaignDetail` (includes `amountPicker` and `donorRecognition`) | US-01 AC5, US-05, US-13 |
| Donation form | `donar` | `donationForm` (step 1 is `amountPicker`) | US-01 AC3, AC7 to AC10; US-02; US-03; US-06; US-13 |
| Thank you (Stripe `success_url`) | `gracias` | `donationThanks` | US-04 |
| Payment not completed (Stripe `cancel_url`) | `pago-no-completado` | `donationCancelled` | US-04 AC5 |
| Achievements (past campaigns, shown as "Logros") | `campanas-pasadas` | `campaignList`, mode `past` | US-01 AC6 |
| FAQ (shown as "Ayuda" in the header) | `preguntas-frecuentes` | `faqPage` (static answers, then the support address read from the org; hidden while none is set up) | US-11 |
| Error page (any other address) | the site's error page | `pageNotFound` | US-11 AC5, US-12 AC8 |

`siteHeader` and `siteFooter` go in the theme's header and footer regions.

Only ids and the chosen amount travel in the address: `campana?id=<campaign id>`, `donar?campana=<campaign id>` (optionally `&monto=<amount>`), `pago-no-completado?campana=<campaign id>` and `gracias?session_id=<Stripe session id>`. Never an email, a name or an RFC (US-12).

### Fewer clicks to donate

- The form has three steps: **1. Monto**, **2. Tus datos** (two short questions, recognition and invoice, followed by the donor data on the same page) and **3. Confirmación**.
- The amount step shows the eight suggested amounts as a 4 x 2 grid (2 x 4 on phones) and, below it, an always visible "Otro monto" field: typing in it unselects the chosen button and choosing a button clears the field, with no extra click to type.
- In step 2 each question has one-line answers side by side; what each answer means is in the question's info tooltip (`infoTip`, opens on hover, focus or tap). Public name and RFC explain themselves the same way.
- From the home page, "Donar" on a campaign card opens `donar?campana=<id>` at step 1.
- On the campaign page the side card has the same amount picker with four larger amounts ($1,000, $5,000, $10,000 and $20,000) and the "Otro monto" field. "Donar" opens `donar?campana=<id>&monto=<amount>` at step 2, so the donor skips the amount page. Without an amount it asks for one; with a typed amount that can not be donated it shows why.
- The form applies the same rules to `monto` as to a typed amount ($10 to $999,999.99 MXN, up to two decimals). Anything else is ignored and the form starts at step 1. The server checks the amount again in any case.
- `amountPicker` is shared by both pages: it fires `amountchange` with `{ amount, custom }` and its `validate()` shows why a typed amount is not valid.

### Look

Colors and spacing follow design proposal A and live in `lwc/donationStyles` (a CSS-only module the components import). Progress bars are the `progressBar` component, which sets the width from JavaScript: templates have no `style={...}` bindings. The font is Nunito with a system fallback; to load Nunito, add it to the site's head markup (Settings → Advanced → Edit Head Markup) and add `fonts.googleapis.com` and `fonts.gstatic.com` to the site's trusted sites. Campaign images live in the `Donation_Campaign_Images` static resource (fictitious SVGs: `general.svg`, `becas.svg`, `viaje.svg`, `boletos.svg`). Staff puts the file name in the campaign's `Image_URL__c`, for example `becas.svg`, and `donationUtils.campaignImageUrl` turns it into the resource's address. It is on the site's own domain, so it needs no Trusted URL and works for the guest user. A full `https://` address still works, but its host must be added to Setup → Trusted URLs (`img-src`), and an external image service needs the instructor's approval first. Any other value, or an image that fails to load, shows the heart placeholder instead of a broken image. To add an image, put the file in `staticresources/Donation_Campaign_Images/` and deploy the resource.

## Data

The components never import Apex. They get and send everything through `lwc/donationDataService`, the only module that calls the backend:

| Function | Apex method |
|---|---|
| `getActiveCampaigns()` | `PublicCampaignController.getActiveCampaigns` |
| `getPastCampaigns()` | `PublicCampaignController.getPastCampaigns` |
| `getRecognition(campaignId)` | `PublicCampaignController.getRecognition` |
| `getSupportEmail()` | `PublicCampaignController.getSupportEmail` (the receipt sender's address, for the FAQ page) |
| `startCheckout(request)` | `DonationCheckoutService.startCheckout` |
| `confirmCheckout(sessionId)` | `DonationCheckoutService.confirmCheckout` |

Both classes are open to the guest through "Donaciones · Sitio público". The calls are imperative, not `@wire`, because the controller methods are not cacheable: progress must be current right after a payment. The form sends a `DonationCheckoutService.DonationRequest` (`campaignId`, `amount`, `email`, `anonymous`, `invoice`, `publicName`, `personType`, `firstName`, `lastName`, `company`, `rfc`, `invoiceConsent`). Server errors arrive as the `AuraHandledException` message, which the components show.

The thank-you page calls `confirmCheckout` so the donation gets Stripe's status, but it does not show that status: it never says the payment is confirmed (US-04 AC2).

The form is an LWC rather than a Screen Flow because the step-by-step design (amount cards, options with descriptions, highlighted confirmation) does not fit Flow screens; this is the plan B in `docs/architecture.md`.

### Stripe return addresses

`DonationCheckoutService` reads the page paths from two Custom Labels and adds the org's Experience Cloud domain (`DomainCreator.getExperienceCloudSitesHostname()`), so no org address is versioned and a deploy never resets them to a placeholder:

- `Stripe_Success_Url`: `/s/gracias` (the service adds `?session_id={CHECKOUT_SESSION_ID}`)
- `Stripe_Cancel_Url`: `/s/pago-no-completado`

A label that holds a full `https://` URL is used as is.

The cancel address carries no campaign, so "Intentar de nuevo" on that page goes to the home page.

## Deploy

The components call `PublicCampaignController` and `DonationCheckoutService`, so deploy the whole project (classes, objects, permission sets, labels and components) together:

```bash
sf project deploy start --source-dir force-app --target-org donaciones
```

Then, in the org: assign "Donaciones · Sitio público" to the site's guest user, set up the `Stripe` Named Credential with the test key (never in the repo), and set the two Stripe labels above to the site's URL.

## Unit tests

Every component has Jest tests in its `__tests__` folder (`.forceignore` keeps them out of the deploy). They need Node.js 20 or later:

```bash
npm install
npm test               # all the LWC tests
npm run test:coverage  # with the coverage report; fails under 90% of lines
npm run lint           # ESLint with the Salesforce LWC rules
```

The component tests mock `c/donationDataService` with `jest.fn()`, so they do not depend on the data source; `donationDataService`'s own tests mock the Apex imports and check that each function calls the right method with the right arguments. Shared helpers and sample campaigns are in `jest-mocks/testUtils.js`. Each test names the acceptance criterion it covers.

| Component | What the tests check |
|---|---|
| `donationDataService` | Each function calls its Apex method with the right arguments, returns its result and passes server errors through |
| `donationUtils` | MXN format, dates in Spanish, page addresses, progress over 100%, email and RFC rules (US-03 AC6, US-06 AC2, AC5) |
| `campaignList` | One card per campaign, opening the only active one (US-01 AC4), past mode without donate button (AC6), loading and error states |
| `campaignDetail` | Campaign data (US-01 AC5), recognition of the same campaign, unknown or past campaign, choosing the amount in the side card and opening the form at step 2 |
| `amountPicker` | Suggested amounts and the always visible "Otro monto" field, only one amount chosen at a time, the amountchange event, validation with its messages and focus, four amounts in compact mode, a given amount shown as chosen (US-13) |
| `donorRecognition` | Name and amount only, names as text (US-12 AC7), anonymous total (US-05 AC8), automatic scroll (AC4), empty state |
| `donationForm` | Three steps, the amount from the campaign page (`monto`), custom amounts with centavos (US-13), two decisions and the data in step 2, fields per type, errors, focus on the first error, highlight from $1,000 (US-01 AC8), change amount (AC9), the request sent to the backend per type, double submit and error messages (US-03 AC4) |
| `donationThanks` | Calls `confirmCheckout` with the session, same text for any status, no "confirmed" and no personal data (US-04 AC2, AC3, AC6), failure tolerance |
| `progressBar` | Width from the percentage, full bar but real value over 100% (US-08 AC5), sizes |
| `donationCancelled`, `siteHeader`, `siteFooter`, `pageNotFound`, `campaignCard`, `donationLabels` | Links, current page and texts |
