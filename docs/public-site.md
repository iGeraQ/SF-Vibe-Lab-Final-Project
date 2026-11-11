# Public site (frontend)

The donor site is an Experience Cloud site with the guest user. Each page holds one LWC from `force-app/main/default/lwc`. All the text the site shows is in Custom Labels (`Donations_*`, Spanish), so it can be translated later (US-11 refinement 3).

## Pages

Create these pages in Experience Builder with exactly these URLs; the components build links with them.

| Page | URL | Component | Stories |
|---|---|---|---|
| Home (active campaigns) | `/` (Home) | `campaignList`, mode `active` | US-01 AC1, AC4 |
| Campaign | `campana` | `campaignDetail` (includes `donorRecognition`) | US-01 AC5, US-05 |
| Donation form | `donar` | `donationForm` | US-01 AC3, AC7 to AC10; US-02; US-03; US-06 |
| Thank you (Stripe `success_url`) | `gracias` | `donationThanks` | US-04 |
| Payment not completed (Stripe `cancel_url`) | `pago-no-completado` | `donationCancelled` | US-04 AC5 |
| Past campaigns | `campanas-pasadas` | `campaignList`, mode `past` | US-01 AC6 |
| Error page (any other address) | the site's error page | `pageNotFound` | US-11 AC5, US-12 AC8 |

`siteHeader` and `siteFooter` go in the theme's header and footer regions.

Only ids travel in the address: `campana?id=<campaign id>`, `donar?campana=<campaign id>`, `pago-no-completado?campana=<campaign id>` and `gracias?session_id=<Stripe session id>`. Never an email, a name or an RFC (US-12).

### Look

Colors and spacing follow design proposal A and live in `lwc/donationStyles` (a CSS-only module the components import). Progress bars are the `progressBar` component, which sets the width from JavaScript: templates have no `style={...}` bindings. The font is Nunito with a system fallback; to load Nunito, add it to the site's head markup (Settings → Advanced → Edit Head Markup) and add `fonts.googleapis.com` and `fonts.gstatic.com` to the site's trusted sites. Campaign images are external URLs (`Image_URL__c`): add their domain to the trusted sites too, or the card shows the placeholder.

## Data: mock first, backend later

The components never import Apex. They get and send everything through `lwc/donationDataService`, which for now answers with fictitious data from `lwc/donationMockData` (same shapes as `PublicCampaignController` and `DonationCheckoutService`). So the whole site works in the org with no Apex and no guest permissions: campaigns, progress, recognition, the form and the thank-you page.

While it is on mock data:

- "Ir a pagar" goes straight to the thank-you page instead of Stripe. Nothing is saved.
- To show the other paths in the video: an email that starts with `cancelar@` lands on the payment-not-completed page, and one that starts with `error@` shows the form's error message.
- The mock checks what `DonationCheckoutService` checks, with its messages: the campaign accepts donations and the amount is at least $10 MXN.

### Connecting the backend

The backend in `develop` already has what the site needs: `PublicCampaignController` (campaigns and recognition) and `DonationCheckoutService` (`startCheckout` and `confirmCheckout`), both open to the guest through "Donaciones · Sitio público". The mock already uses their shapes: the form sends a `DonationCheckoutService.DonationRequest` (`campaignId`, `amount`, `email`, `anonymous`, `invoice`, `publicName`, `personType`, `firstName`, `lastName`, `company`, `rfc`, `invoiceConsent`) and the mock answers with the service's own messages.

To connect, only `donationDataService.js` changes; the components and their tests stay as they are. Each function keeps its name and arguments and returns the Apex call. The calls are imperative because the controller methods are not cacheable (progress must be current right after a payment):

```js
import apexGetActiveCampaigns from '@salesforce/apex/PublicCampaignController.getActiveCampaigns';
import apexGetPastCampaigns from '@salesforce/apex/PublicCampaignController.getPastCampaigns';
import apexGetRecognition from '@salesforce/apex/PublicCampaignController.getRecognition';
import apexStartCheckout from '@salesforce/apex/DonationCheckoutService.startCheckout';
import apexConfirmCheckout from '@salesforce/apex/DonationCheckoutService.confirmCheckout';

export const getActiveCampaigns = () => apexGetActiveCampaigns();
export const getPastCampaigns = () => apexGetPastCampaigns();
export const getRecognition = (campaignId) => apexGetRecognition({ campaignId });
export const startCheckout = (request) => apexStartCheckout({ request });
export const confirmCheckout = (sessionId) => apexConfirmCheckout({ sessionId });
```

Then delete `donationMockData` and update `donationDataService`'s tests to mock the Apex imports.

The thank-you page calls `confirmCheckout` so the donation gets Stripe's status, but it does not show that status: it never says the payment is confirmed (US-04 AC2).

The form is an LWC rather than a Screen Flow because the four-step design (amount cards, options with descriptions, highlighted confirmation) does not fit Flow screens; this is the plan B in `docs/architecture.md`.

### Stripe return addresses

`DonationCheckoutService` reads them from two Custom Labels that already exist in `develop`. In the org, set them to the site pages:

- `Stripe_Success_Url`: `<site URL>/gracias` (the service adds `?session_id={CHECKOUT_SESSION_ID}`)
- `Stripe_Cancel_Url`: `<site URL>/pago-no-completado`

The cancel address carries no campaign, so "Intentar de nuevo" on that page goes to the home page.

## Deploy

The components depend on no Apex class, so they deploy on their own:

```bash
sf project deploy start --source-dir force-app/main/default/labels --source-dir force-app/main/default/lwc --target-org donaciones
```

## Unit tests

Every component has Jest tests in its `__tests__` folder (`.forceignore` keeps them out of the deploy). They need Node.js 20 or later:

```bash
npm install
npm test               # all the LWC tests
npm run test:coverage  # with the coverage report; fails under 90% of lines
npm run lint           # ESLint with the Salesforce LWC rules
```

The component tests mock `c/donationDataService` with `jest.fn()`, so they do not depend on the data source; `donationDataService`'s own tests check the mock data and the mock checkout paths. Shared helpers and sample campaigns are in `jest-mocks/testUtils.js`. Each test names the acceptance criterion it covers.

| Component | What the tests check |
|---|---|
| `donationDataService` | Same shapes as the controller, raised amounts match the recognition, checkout paths with the backend's messages (thanks, cancel, gateway down, past campaign, amount under $10) |
| `donationUtils` | MXN format, dates in Spanish, page addresses, progress over 100%, email and RFC rules (US-03 AC6, US-06 AC2, AC5) |
| `campaignList` | One card per campaign, opening the only active one (US-01 AC4), past mode without donate button (AC6), loading and error states |
| `campaignDetail` | Campaign data (US-01 AC5), recognition of the same campaign, unknown or past campaign |
| `donorRecognition` | Name and amount only, names as text (US-12 AC7), anonymous total (US-05 AC8), automatic scroll (AC4), empty state |
| `donationForm` | Suggested amounts, two decisions in step 2, fields per type, errors, focus on the first error, highlight from $1,000 (US-01 AC8), change amount (AC9), the request sent to the backend per type, double submit and error messages (US-03 AC4) |
| `donationThanks` | Calls `confirmCheckout` with the session, same text for any status, no "confirmed" and no personal data (US-04 AC2, AC3, AC6), failure tolerance |
| `progressBar` | Width from the percentage, full bar but real value over 100% (US-08 AC5), sizes |
| `donationCancelled`, `siteHeader`, `siteFooter`, `pageNotFound`, `campaignCard`, `donationLabels` | Links, current page and texts |
