import { LightningElement, wire } from 'lwc';
import { gql, graphql } from 'lightning/graphql';
import LABELS from 'c/staffLabels';
import { edgesOf, toDonationRow } from 'c/staffUtils';

const TABS = [
    { value: 'all', label: LABELS.tabAll, matches: () => true },
    { value: 'paid', label: LABELS.tabPaid, matches: (row) => row.stage === 'Paid' },
    { value: 'pending', label: LABELS.tabPending, matches: (row) => row.stage === 'Pending' },
    { value: 'expired', label: LABELS.tabExpired, matches: (row) => row.stage === 'Expired' },
    { value: 'invoice', label: LABELS.tabInvoice, matches: (row) => row.invoice },
    { value: 'anonymous', label: LABELS.tabAnonymous, matches: (row) => row.isAnonymous }
];

/**
 * "Donaciones" tab of the staff app: every donation with its status, amount, type and campaign
 * (US-09 AC1), and the "Solicitan factura" tab with name or company, RFC, person type, consent and
 * status, so a pending invoice request is easy to spot (US-07 AC1, AC2, AC4). Reads through GraphQL
 * with the user's own permissions; it never changes a donation.
 */
export default class StaffDonationList extends LightningElement {
    labels = LABELS;
    selectedTab = 'all';
    result;

    @wire(graphql, {
        query: gql`
            query staffDonations {
                uiapi {
                    query {
                        Opportunity(
                            first: 200
                            where: { RecordType: { DeveloperName: { eq: "Donation" } } }
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
        `
    })
    wiredDonations(result) {
        this.result = result;
    }

    get connection() {
        return this.result?.data?.uiapi?.query?.Opportunity;
    }

    get donations() {
        return edgesOf(this.connection).map(toDonationRow);
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

    get tabs() {
        const donations = this.donations;
        return TABS.map(({ value, label, matches }) => ({
            value,
            label,
            count: donations.filter(matches).length,
            ariaSelected: String(value === this.selectedTab)
        }));
    }

    get rows() {
        const tab = TABS.find((t) => t.value === this.selectedTab) ?? TABS[0];
        return this.donations.filter(tab.matches);
    }

    get variant() {
        return this.selectedTab === 'invoice' ? 'invoice' : 'all';
    }

    handleTab(event) {
        this.selectedTab = event.currentTarget.dataset.value;
    }

    handleRefresh() {
        return this.result?.refresh?.();
    }
}
