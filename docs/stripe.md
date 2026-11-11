# Stripe in test mode

Everything here is public Stripe test data. **Never write a key in this repo**, in an issue, in Slack or in an AI prompt (see `docs/seguridad.md` section 3).

## Test cards

Test mode only. Use any future expiry date (for example `12/34`), any 3-digit CVC and any postal code.

| Card | Result |
|---|---|
| `4242 4242 4242 4242` | Visa: approved. The card for demos |
| `5555 5555 5555 4444` | Mastercard: approved |
| `4000 0048 4000 8001` | Mexican Visa: approved |
| `4000 0025 0000 3155` | Asks for 3D Secure authentication, then approves |
| `4000 0027 6000 3184` | Always asks for 3D Secure |
| `4000 0000 0000 0002` | Generic decline |
| `4000 0000 0000 9995` | Declined: insufficient funds |
| `4000 0000 0000 9987` | Declined: lost card |
| `4000 0000 0000 0069` | Declined: expired card |
| `4000 0000 0000 0127` | Declined: incorrect CVC |

The full list is in [Stripe's testing page](https://docs.stripe.com/testing).

## How the portal uses Stripe

- **Mode:** a sandbox only. The account is never activated and no bank or tax details are entered.
- **Checkout Session** (created by `StripeClient`): `mode=payment`, currency `mxn`, locale `es-419`, one line "Donación · <campaign>", our donation reference as `client_reference_id` and `Idempotency-Key`, and metadata with the reference, the campaign id and the anonymous and invoice flags. It expires in 60 minutes; after that an unpaid donation becomes `Expired`.
- **Return pages:** the labels `Stripe_Success_Url` (adds `?session_id=…`) and `Stripe_Cancel_Url`.
- **Payment methods:** cards only. OXXO and bank transfers are out of scope (US-18).
- **The key:** a restricted key (`rk_test_…`) that lives only in the `Stripe` External Credential in Salesforce Setup. Apex reaches Stripe through the `Stripe` Named Credential. Setup steps: README, "Set up the org", step 8.
- **Receipts:** Stripe sends no receipt emails for test payments. The receipt the donor gets is the one Salesforce sends when the donation becomes paid.

## Stripe CLI

```bash
brew install stripe/stripe-cli/stripe
stripe login
stripe payment_intents list --limit 3
stripe logs tail
```

`stripe login` stores its own key on your machine (`~/.config/stripe/`), outside the repo. Do not copy it anywhere. Choose the team's sandbox when it asks.

## Check a payment end to end

1. Create a donation from the site, or from Apex with `DonationCheckoutService.startCheckout`.
2. Pay with `4242 4242 4242 4242`.
3. The thank-you page calls `confirmCheckout`, and the donation becomes `Paid` with Stripe's amount. If the donor never returns, the scheduled check (`PendingDonationCheck`) does it.
4. In the Dashboard (Transactions → Payments) find the payment: its `client_reference_id` is the donation reference (`DON-…`).
