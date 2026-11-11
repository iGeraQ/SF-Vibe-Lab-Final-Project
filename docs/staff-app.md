# Staff app

The staff side of the portal (US-07, US-08, US-09) is a Lightning app, "Donaciones Mexico Dreamin", that follows the "Staff A" design. It mixes two kinds of pieces:

- **Staff LWC** for what staff looks at: the campaign and donation lists with the design's tabs, and the cards on the record pages. They use the design's look (Inter, indigo, status pills, locked boxes) and read data through GraphQL and Lightning Data Service, so the user's own sharing and field permissions apply. There is no Apex.
- **Configuration** for what staff edits and for access: Dynamic Forms sections, list views, the app and the permission sets. Editing stays on the standard forms, which apply the validation rules and field permissions.

## Login

Staff signs in on the org's standard Salesforce login page (My Domain). The design's "Inicia sesión · Acceso solo para personal autorizado" screen is that page; its branding can be set in Setup (see below). The design's "Ver como" role switcher is replaced by three test users, one per role group (System Admin, Campaign Manager, Moderator).

## Screens

| Design | Piece | Story |
| --- | --- | --- |
| Sidebar: Campañas, Donaciones | App tabs `Staff_Campaigns` and `Staff_Donations` (LWC tabs) | US-08, US-09 |
| Campañas: Activas, Próximas, Finalizadas, Todas, with goal, raised and % | `staffCampaignList` | US-08 AC2, AC4, AC5, AC7 |
| "Nueva campaña" button, only for users who can create campaigns | `staffCampaignList` (object permission), standard new form | US-08 AC1, AC6 |
| Donaciones: Todas, Pagadas, Pendientes, Expiradas, Solicitan factura, Anónimas | `staffDonationList` | US-09 AC1, US-07 AC2 |
| Solicitan factura: name or company, RFC, person type, consent and status | `staffDonationList` (invoice columns) | US-07 AC1, AC4 |
| Campaign: Datos públicos and Vigencia | `Campaign_Donations_Record_Page`, Dynamic Forms with required fields, backed by `Campaign_Required_Fields` | US-08 AC3 |
| Campaign: situation today and Avance | `staffCampaignProgress` | US-08 AC5, AC7 |
| Campaign: Donaciones de la campaña | `staffCampaignDonations` | US-09 AC1 |
| Donation: badges, Resumen with locked amount and status, Pago | `staffDonationSummary` | US-07 AC1, AC4, US-09 AC1, AC3, AC5 |
| Donation: Donante with email and public name | `staffDonorCard`; the input only shows when the field is editable for the user | US-09 AC2, AC4 |
| Donation: Factura (only when requested) and Stripe data | `Donation_Record_Page`, Dynamic Forms with a visibility rule | US-07 AC3 |
| Avisos de la pasarela | Delivery 2 (`Payment_Notice__c`) | — |

The app's navigation holds only the two component tabs, so there is no second "Donaciones" tab once Opportunity is renamed, and opening a record adds no temporary tab. The list views in `objects/*/listViews` stay available from the App Launcher (Campaigns and Donaciones), for searches the component tabs don't cover. The component lists show the first 200 records and say so when there are more.

Shared code: `staffLabels` (Custom Labels in the "Donations Staff App" category), `staffUtils` (formatting and mapping), `staffStyles` (CSS), `staffProgressBar` and `staffDonationTable`. Every component has Jest tests (`npm test`).

The app assigns the two record pages through its own View overrides, so other apps keep their pages. `Donations_Staff_Base` gives the three role groups the app and its two tabs.

## Deploy

```
sf project deploy start -d force-app/main/default/labels -d force-app/main/default/lwc
sf project deploy start -d force-app/main/default/objects/Campaign/listViews -d force-app/main/default/objects/Opportunity/listViews
sf project deploy start -d force-app/main/default/tabs -d force-app/main/default/flexipages -d force-app/main/default/applications -d force-app/main/default/permissionsets/Donations_Staff_Base.permissionset-meta.xml
```

## Manual steps after deploying

1. **Rename the Opportunity tab.** Setup → Rename Tabs and Labels → Opportunities: "Donación" / "Donaciones". Metadata can't rename a standard object without overwriting all its labels.
2. **Login branding (optional).** Setup → My Domain → Branding: background `#1E293B` and the logo, so the login looks like the design.
3. **Test users.** Create the three users (fictitious names, team email addresses) and assign one role group to each.
4. **Check the pages.** Open a campaign and a donation from the app. If Lightning shows the default page, open the record page in Lightning App Builder and choose Activation → App Default → Donaciones Mexico Dreamin.
