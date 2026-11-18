import CampaignCard from 'c/campaignCard';
import { toCampaignView } from 'c/donationUtils';
import { CAMPAIGNS, cleanup, flushPromises, mount, $, $$ } from 'test-utils';

describe('c-campaign-card', () => {
    afterEach(cleanup);

    it('shows progress, figures and the donate and view links of an active campaign', async () => {
        const campaign = toCampaignView(CAMPAIGNS[0]);
        const element = mount('c-campaign-card', CampaignCard, { campaign });
        await flushPromises();

        expect($(element, 'h2').textContent).toBe(campaign.name);
        expect($(element, '.percent').textContent).toBe('125%');
        expect($(element, '.badge-exceeded')).not.toBeNull();
        const bar = $(element, 'c-progress-bar');
        expect(bar.percent).toBe(125);
        expect(bar.label).toBe(campaign.progressLabel);
        expect(bar.muted).toBe(false);
        expect(element.shadowRoot.textContent).toContain('$1,250 MXN');
        const links = $$(element, '.actions a');
        expect(links.map((link) => link.getAttribute('href'))).toEqual([campaign.donateUrl, campaign.pageUrl]);
        expect($(element, 'img')).toBeNull();
    });

    it('shows the campaign image when there is one', async () => {
        const element = mount('c-campaign-card', CampaignCard, { campaign: toCampaignView(CAMPAIGNS[1]) });
        await flushPromises();

        expect($(element, 'img').getAttribute('src')).toBe(CAMPAIGNS[1].imageUrl);
        expect($(element, '.badge-exceeded')).toBeNull();
    });

    it('shows the placeholder instead of a broken image when the image fails to load', async () => {
        const element = mount('c-campaign-card', CampaignCard, { campaign: toCampaignView(CAMPAIGNS[1]) });
        await flushPromises();

        $(element, 'img').dispatchEvent(new CustomEvent('error'));
        await flushPromises();

        expect($(element, 'img')).toBeNull();
        expect($(element, '.image svg')).not.toBeNull();
    });

    it('has no donate button for a past campaign (US-01 AC6)', async () => {
        const element = mount('c-campaign-card', CampaignCard, {
            campaign: toCampaignView(CAMPAIGNS[0], true),
            past: true
        });
        await flushPromises();

        expect($(element, '.actions')).toBeNull();
        expect($(element, 'c-progress-bar').muted).toBe(true);
        expect($(element, '.badge-finished')).not.toBeNull();
        expect($(element, '.badge-exceeded')).toBeNull();
        expect(element.shadowRoot.textContent).toContain('c.Donations_FinalAmount');
    });
});
