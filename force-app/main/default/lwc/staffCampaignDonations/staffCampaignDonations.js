import { LightningElement, api, wire } from 'lwc';
import { gql, graphql } from 'lightning/graphql';
import LABELS from 'c/staffLabels';
import { edgesOf, toDonationRow } from 'c/staffUtils';

/**
 * "Donaciones de la campaña" card on the campaign record page (US-08, US-09 AC1): the campaign's
 * donations with status, amount, type and date. Reads through GraphQL with the user's permissions.
 */
export default class StaffCampaignDonations extends LightningElement {
    @api recordId;

    labels = LABELS;
    result;

    @wire(graphql, {
        query: gql`
            query staffCampaignDonations($campaignId: ID) {
                uiapi {
                    query {
                        Opportunity(
                            first: 200
                            where: {
                                and: [
                                    { CampaignId: { eq: $campaignId } }
                                    { RecordType: { DeveloperName: { eq: "Donation" } } }
                                ]
                            }
                            orderBy: { CreatedDate: { order: DESC } }
                        ) {
                            edges {
                                node {
                                    Id
                                    Name {
                                        value
                                    }
                                    Donation_Reference__c: Donation_Reference__c {
                                        value
                                    }
                                    StageName {
                                        value
                                    }
                                    Amount {
                                        value
                                    }
                                    Donation_Type__c: Donation_Type__c {
                                        value
                                    }
                                    CreatedDate {
                                        value
                                    }
                                    Is_Anonymous__c: Is_Anonymous__c {
                                        value
                                    }
                                    Invoice_Requested__c: Invoice_Requested__c {
                                        value
                                    }
                                    Person_Type__c: Person_Type__c {
                                        value
                                        displayValue
                                    }
                                    Donor_First_Name__c: Donor_First_Name__c {
                                        value
                                    }
                                    Donor_Last_Name__c: Donor_Last_Name__c {
                                        value
                                    }
                                    Donor_Company__c: Donor_Company__c {
                                        value
                                    }
                                    RFC__c: RFC__c {
                                        value
                                    }
                                    Invoice_Consent__c: Invoice_Consent__c {
                                        value
                                    }
                                    Campaign {
                                        Name {
                                            value
                                        }
                                    }
                                }
                            }
                            pageInfo {
                                hasNextPage
                            }
                        }
                    }
                }
            }
        `,
        variables: '$variables'
    })
    wiredDonations(result) {
        this.result = result;
    }

    get variables() {
        return { campaignId: this.recordId };
    }

    get connection() {
        return this.result?.data?.uiapi?.query?.Opportunity;
    }

    get rows() {
        return edgesOf(this.connection).map(toDonationRow);
    }

    get count() {
        return this.rows.length;
    }

    get isLoading() {
        return !this.result || (!this.result.data && !this.result.errors);
    }

    get hasError() {
        return Boolean(this.result?.errors);
    }

    get hasMore() {
        return this.connection?.pageInfo?.hasNextPage === true;
    }
}
