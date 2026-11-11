# Demo guide: switching between staff roles

For the demo video. One user, "Staff Demo" (alias `staff`, profile Minimum Access - Salesforce, Marketing User), plays the Campaign Manager and the Moderator by switching its permission set group. The System Admin is shown with the admin's own user. The org has one free Salesforce license, so there is no user per role.

## Before recording

1. Do a full dry run first. The permissions are covered by `StaffRolesTest`, but the interface was not checked: confirm Staff Demo sees the Campaigns and Opportunities tabs. If not, the permission set "Donaciones · Staff base" needs app access.
2. Enter as Staff Demo with Setup → Users → Staff Demo → Login. If the link is missing, enable it in Setup → Login Access Policies.
3. After each role switch, leave "Login As" and enter again so the change applies.
4. Data to use: the campaign "Donación general" and the donations `DON-80C4DE18` ($500, with invoice) and `DON-20B35173` ($250).

## Scene 1: Campaign Manager

Staff Demo starts with this group.

| Step | Action | Expected result |
|---|---|---|
| 1 | Open the **Campañas** tab | It is visible |
| 2 | Create a campaign with only a name and save | Error: "Para guardar la campaña captura fecha de inicio, fecha de fin, meta, descripción, URL de imagen y propósito" (US-08 AC3) |
| 3 | Fill in every field and save | Saved; "Acepta donaciones" is on (US-08 AC1) |
| 4 | Change the goal and save | Updated (US-08 AC2) |
| 5 | Clear "Activa" | "Acepta donaciones" turns off (US-08 AC7) |
| 6 | Open **Oportunidades** and a donation | The donor's email is visible (US-09 AC2) |
| 7 | Try to edit the public name or the amount | It can't: the fields are read-only (US-09 AC3, AC4) |

## Switch to Moderator

Leave "Login As" and run:

```bash
echo "delete [SELECT Id FROM PermissionSetAssignment WHERE Assignee.Alias='staff' AND PermissionSetGroup.DeveloperName LIKE 'Donations_%']; insert new PermissionSetAssignment(AssigneeId=[SELECT Id FROM User WHERE Alias='staff'].Id, PermissionSetGroupId=[SELECT Id FROM PermissionSetGroup WHERE DeveloperName='Donations_Moderator_Group'].Id);" | sf apex run --target-org playground
```

## Scene 2: Moderator

| Step | Action | Expected result |
|---|---|---|
| 1 | Open **Campañas** and a campaign | Read-only: no "Nueva" or "Editar" (US-08 AC6) |
| 2 | Open a donation | The email and the Stripe reference are visible, to compare with the payment (US-09 AC5) |
| 3 | Change the **Nombre público** and save | Saved (US-05 AC7) |
| 4 | Try to change the **Monto** | Error: "…solo los cambia la integración con Stripe" (US-09 AC3) |
| 5 | Mark the donation as **Anónima** and save | It leaves the recognition and joins the anonymous total (US-05 AC8) |

## Switch back to Campaign Manager

Only needed to repeat a scene:

```bash
echo "delete [SELECT Id FROM PermissionSetAssignment WHERE Assignee.Alias='staff' AND PermissionSetGroup.DeveloperName LIKE 'Donations_%']; insert new PermissionSetAssignment(AssigneeId=[SELECT Id FROM User WHERE Alias='staff'].Id, PermissionSetGroupId=[SELECT Id FROM PermissionSetGroup WHERE DeveloperName='Donations_Campaign_Manager_Group'].Id);" | sf apex run --target-org playground
```

## Scene 3: System Admin

Leave "Login As" and use the admin's own user.

- It sees every donation and its type (US-09 AC1).
- Changing a donation's amount also fails: nobody changes it by hand.
- It can create and edit campaigns.

## After recording

- If you marked a donation anonymous in scene 2, clear it so the recognition goes back to normal.
- The admin user still has the loose "Donaciones · System Admin" permission set instead of the "Rol · System Admin" group, and a temporary "Donaciones · Payment Integration" assignment. Fix both at the end of Delivery 1 (#18).
- For the evidence (#18), record each scene with the story ID and criterion on screen, so the instructor can mark it as met.
