import { LightningElement, wire } from 'lwc';
import { gql, graphql } from 'lightning/graphql';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import { NavigationMixin } from 'lightning/navigation';
import CAMPAIGN_OBJECT from '@salesforce/schema/Campaign';
import LABELS, { format } from 'c/staffLabels';
import { edgesOf, toCampaignRow, todayIso } from 'c/staffUtils';

const TABS = [
    { value: 'active', label: LABELS.tabActive },
    { value: 'upcoming', label: LABELS.tabUpcoming },
    { value: 'finished', label: LABELS.tabFinished },
    { value: 'all', label: LABELS.tabAll }
];

/**
 * "Campañas" tab of the staff app (US-08): campaigns split into Activas, Próximas, Finalizadas and
 * Todas, with goal, raised amount and progress. Reads through GraphQL, so the user's own sharing and
 * field permissions apply. "Nueva campaña" only shows to users who can create campaigns (US-08 AC6).
 */
export default class StaffCampaignList extends NavigationMixin(LightningElement) {
    labels = LABELS;
    selectedTab = 'active';
    today = todayIso();
    result;

    @wire(graphql, {
        query: gql`
            query staffCampaigns {
                uiapi {
                    query {
                        Campaign(first: 200, orderBy: { StartDate: { order: DESC } }) {
                            edges {
                                node {
                                    Id
                                    Name {
                                        value
                                    }
                                    IsActive {
                                        value
                                    }
                                    StartDate {
                                        value
                                    }
                                    EndDate {
                                        value
                                    }
                                    ExpectedRevenue {
                                        value
                                    }
                                    AmountWonOpportunities {
                                        value
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
    wiredCampaigns(result) {
        this.result = result;
    }

    @wire(getObjectInfo, { objectApiName: CAMPAIGN_OBJECT })
    objectInfo;

    get connection() {
        return this.result?.data?.uiapi?.query?.Campaign;
    }

    get campaigns() {
        return edgesOf(this.connection).map((node) => toCampaignRow(node, this.today));
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

    get canCreate() {
        return this.objectInfo?.data?.createable === true;
    }

    get tabs() {
        const campaigns = this.campaigns;
        return TABS.map((tab) => {
            const selected = tab.value === this.selectedTab;
            return {
                ...tab,
                count: tab.value === 'all' ? campaigns.length : campaigns.filter((c) => c.situation === tab.value).length,
                ariaSelected: String(selected)
            };
        });
    }

    get rows() {
        const campaigns = this.campaigns;
        const visible =
            this.selectedTab === 'all' ? campaigns : campaigns.filter((c) => c.situation === this.selectedTab);
        return visible.map((row) => ({ ...row, progressLabel: format(LABELS.progressOf, row.name) }));
    }

    get hasRows() {
        return this.rows.length > 0;
    }

    handleTab(event) {
        this.selectedTab = event.currentTarget.dataset.value;
    }

    handleRefresh() {
        return this.result?.refresh?.();
    }

    handleNew() {
        this[NavigationMixin.Navigate]({
            type: 'standard__objectPage',
            attributes: { objectApiName: 'Campaign', actionName: 'new' }
        });
    }

    handleOpen(event) {
        event.stopPropagation();
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: { recordId: event.currentTarget.dataset.id, objectApiName: 'Campaign', actionName: 'view' }
        });
    }
}
