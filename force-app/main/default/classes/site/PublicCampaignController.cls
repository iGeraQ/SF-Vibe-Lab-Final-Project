/**
 * Read-only data for the public site (US-01, US-05), called by the site's guest user from the LWC.
 * The guest has no access to Campaign or Opportunity, so this class runs without sharing and its queries run
 * in system mode. It only returns public fields of public campaigns: never emails, real names or RFCs (US-12).
 * The methods are not cacheable, so progress and recognition are current right after a payment (US-01 AC2):
 * the LWC calls them imperatively.
 */
public without sharing class PublicCampaignController {

    /**
     * @description Campaigns that accept donations today: active and within their dates (US-01 AC1, US-08).
     * @return the campaigns, the one that closes first on top
     */
    @AuraEnabled
    public static List<CampaignView> getActiveCampaigns() {
        List<CampaignView> views = new List<CampaignView>();
        for (Campaign record : publicCampaigns()) {
            if (record.Accepts_Donations__c) {
                views.add(new CampaignView(record));
            }
        }
        return views;
    }

    /**
     * @description Campaigns that ended while active, for the past campaigns view (US-01 AC6).
     * @return the campaigns, the most recently ended on top
     */
    @AuraEnabled
    public static List<CampaignView> getPastCampaigns() {
        List<CampaignView> views = new List<CampaignView>();
        List<Campaign> campaigns = publicCampaigns();
        for (Integer i = campaigns.size() - 1; i >= 0; i--) {
            if (!campaigns[i].Accepts_Donations__c) {
                views.add(new CampaignView(campaigns[i]));
            }
        }
        return views;
    }

    /**
     * @description A public campaign's donor recognition: paid credited donations and the anonymous total (US-05).
     * Any other campaign, or no campaign, returns an empty recognition.
     * @param campaignId the campaign to show
     * @return display names and amounts, newest first, plus the sum of paid anonymous donations
     */
    // ponytail: returns every paid donation (US-05 AC4 asks for all); add paging if a campaign nears 50,000.
    @AuraEnabled
    public static Recognition getRecognition(Id campaignId) {
        Recognition result = new Recognition();
        if (!new Map<Id, Campaign>(publicCampaigns()).containsKey(campaignId)) {
            return result;
        }
        for (Opportunity donation : [
            SELECT Public_Name__c, Amount, Is_Anonymous__c
            FROM Opportunity
            WHERE CampaignId = :campaignId AND IsWon = TRUE AND RecordType.DeveloperName = 'Donation'
            WITH SYSTEM_MODE
            ORDER BY CloseDate DESC, CreatedDate DESC
        ]) {
            if (donation.Is_Anonymous__c) {
                result.anonymousTotal += donation.Amount ?? 0;
            } else {
                result.donors.add(new Donor(donation.Public_Name__c, donation.Amount));
            }
        }
        return result;
    }

    // Donation campaigns only (Purpose__c is required for them), while open or after they ended while active.
    private static List<Campaign> publicCampaigns() {
        return [
            SELECT Id, Name, Description, Image_URL__c, Purpose__c, EndDate, ExpectedRevenue, AmountWonOpportunities, Accepts_Donations__c
            FROM Campaign
            WHERE Purpose__c != NULL AND IsActive = TRUE AND (Accepts_Donations__c = TRUE OR EndDate < TODAY)
            WITH SYSTEM_MODE
            ORDER BY EndDate
        ];
    }

    /**
     * @description Public fields of a campaign. Progress is a percentage from 0 to 100 or more, with one decimal.
     */
    public class CampaignView {
        @AuraEnabled public Id id;
        @AuraEnabled public String name;
        @AuraEnabled public String description;
        @AuraEnabled public String imageUrl;
        @AuraEnabled public String purpose;
        @AuraEnabled public Date endDate;
        @AuraEnabled public Decimal goal;
        @AuraEnabled public Decimal raised;
        @AuraEnabled public Decimal progress;

        CampaignView(Campaign record) {
            id = record.Id;
            name = record.Name;
            description = record.Description;
            imageUrl = record.Image_URL__c;
            purpose = record.Purpose__c;
            endDate = record.EndDate;
            goal = record.ExpectedRevenue;
            raised = record.AmountWonOpportunities ?? 0;
            progress = goal != null && goal > 0 ? (raised / goal * 100).setScale(1) : 0;
        }
    }

    /**
     * @description Donor recognition of one campaign.
     */
    public class Recognition {
        @AuraEnabled public List<Donor> donors = new List<Donor>();
        @AuraEnabled public Decimal anonymousTotal = 0;
    }

    /**
     * @description One credited donor: display name and amount only.
     */
    public class Donor {
        @AuraEnabled public String name;
        @AuraEnabled public Decimal amount;

        Donor(String name, Decimal amount) {
            this.name = name;
            this.amount = amount;
        }
    }
}
