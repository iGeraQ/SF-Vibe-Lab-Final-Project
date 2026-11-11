// Sends the receipt when a donation becomes paid (US-14, #44). Logic in DonationReceiptService.
trigger DonationTrigger on Opportunity (before update, after update) {
    DonationReceiptService.onUpdate(Trigger.operationType, Trigger.new, Trigger.oldMap);
}
