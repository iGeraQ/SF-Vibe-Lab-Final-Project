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
| _Pending_ | |

## 3. Gateway keys

- Where they are stored: _Pending_
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

## 6. Gateway notification (Delivery 2)

_Pending_
