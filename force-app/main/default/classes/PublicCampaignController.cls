/**
 * Read-only data for the public site (US-01, US-05), called by the site's guest user from the LWC.
 * The guest has no access to Campaign or Opportunity, so this class runs without sharing and in system
 * mode, and it returns public fields only: never emails, real names or RFCs (US-12).
 */
@SuppressWarnings('PMD.ApexCRUDViolation')
public without sharing class PublicCampaignController {

    /**
     * @description Campaigns that accept donations today: active and within their dates (US-01 AC1, US-08).
     * @return the campaigns, the one that closes first on top
     */
    @AuraEnabled(cacheable=true)
    public static List<CampaignView> getActiveCampaigns() {
        return toViews([
            SELECT Id, Name, Description, Image_URL__c, Purpose__c, EndDate, ExpectedRevenue, AmountWonOpportunities, Progress__c
            FROM Campaign
            WHERE Accepts_Donations__c = TRUE
            ORDER BY EndDate
        ]);
    }

    /**
     * @description Campaigns whose end date has passed, for the past campaigns view (US-01 AC6).
     * @return the campaigns, the most recently ended on top
     */
    @AuraEnabled(cacheable=true)
    public static List<CampaignView> getPastCampaigns() {
        return toViews([
            SELECT Id, Name, Description, Image_URL__c, Purpose__c, EndDate, ExpectedRevenue, AmountWonOpportunities, Progress__c
            FROM Campaign
            WHERE EndDate < TODAY
            ORDER BY EndDate DESC
        ]);
    }

    /**
     * @description A campaign's donor recognition: paid credited donations and the anonymous total (US-05).
     * @param campaignId the campaign to show
     * @return display names and amounts, newest first, plus the sum of paid anonymous donations
     */
    // ponytail: returns every credited donor (US-05 AC4); add a LIMIT if a campaign ever nears 50,000 donations.
    @AuraEnabled(cacheable=true)
    public static Recognition getRecognition(Id campaignId) {
        Recognition result = new Recognition();
        for (Opportunity donation : [
            SELECT Public_Name__c, Amount
            FROM Opportunity
            WHERE CampaignId = :campaignId AND IsWon = TRUE AND Is_Anonymous__c = FALSE
            ORDER BY CloseDate DESC, CreatedDate DESC
        ]) {
            result.donors.add(new Donor(donation.Public_Name__c, donation.Amount));
        }
        result.anonymousTotal = (Decimal) [
            SELECT SUM(Amount) total
            FROM Opportunity
            WHERE CampaignId = :campaignId AND IsWon = TRUE AND Is_Anonymous__c = TRUE
        ][0].get('total') ?? 0;
        return result;
    }

    private static List<CampaignView> toViews(List<Campaign> campaigns) {
        List<CampaignView> views = new List<CampaignView>();
        for (Campaign record : campaigns) {
            views.add(new CampaignView(record));
        }
        return views;
    }

    /**
     * @description Public fields of a campaign.
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
            raised = record.AmountWonOpportunities;
            progress = record.Progress__c;
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
