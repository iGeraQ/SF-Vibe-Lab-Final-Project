import basePath from '@salesforce/community/basePath';
import CAMPAIGN_IMAGES from '@salesforce/resourceUrl/Donation_Campaign_Images';
import { LABELS, format } from 'c/donationLabels';

/**
 * Site pages. Each one is a page in Experience Builder with this URL; the README lists them.
 */
const PAGES = {
    home: '',
    campaign: 'campana',
    donate: 'donar',
    thanks: 'gracias',
    cancelled: 'pago-no-completado',
    past: 'campanas-pasadas',
    faq: 'preguntas-frecuentes'
};

// US-01 AC7. ponytail: could move to Suggested_Amount__mdt so staff can change them (US-01 refinement 6).
const SUGGESTED_AMOUNTS = [100, 250, 500, 1000, 2000, 5000, 10000, 20000];

// US-01 refinement 5: amounts from this value up are highlighted in the confirmation.
const HIGHLIGHT_AMOUNT = 1000;

// US-13 refinement 1: Stripe's minimum charge in MXN, the same minimum DonationCheckoutService checks.
const MINIMUM_AMOUNT = 10;

// US-13 refinement 2: Stripe takes at most 8 digits in centavos (99,999,999), so $999,999.99 MXN.
const MAXIMUM_AMOUNT = 999999.99;

// A typed amount: digits with optional thousands commas, and at most two decimals.
const AMOUNT_TEXT = /^(\d{1,3}(,\d{3})+|\d+)(\.\d{1,2})?$/;

// The general campaign is always open and uses a far end date (docs/architecture.md, e.g. 2099-12-31).
const ALWAYS_OPEN_YEAR = 2090;

const moneyFormat = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    currencyDisplay: 'narrowSymbol',
    maximumFractionDigits: 0
});

// For amounts with centavos, which a typed amount can have (US-13).
const centsFormat = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
});

const dateFormat = new Intl.DateTimeFormat('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC'
});

/**
 * @param {number} amount an amount in pesos
 * @returns {string} the amount as "$1,000 MXN", or "$10.50 MXN" when it has centavos
 */
function formatMoney(amount) {
    const value = Number(amount) || 0;
    const formatter = Number.isInteger(value) ? moneyFormat : centsFormat;
    return `${formatter.format(value)} MXN`;
}

/**
 * Reads an amount the donor typed (US-13).
 * @param {string} text what the donor typed, such as "1,500" or "250.50"
 * @returns {number|null} the amount in pesos, or null if the text is not a valid amount
 */
function parseAmount(text) {
    const value = (text || '').trim().replace(/^\$/, '').trim();
    if (!AMOUNT_TEXT.test(value)) {
        return null;
    }
    return Number(value.replace(/,/g, ''));
}

/**
 * Checks a typed amount (US-13 AC2, AC3, AC5).
 * @param {string} text what the donor typed
 * @returns {string|null} the error message, or null if the amount can be donated
 */
function validateAmount(text) {
    const amount = parseAmount(text);
    if (amount === null || amount <= 0) {
        return LABELS.errAmountInvalid;
    }
    if (amount < MINIMUM_AMOUNT) {
        return LABELS.errAmountMin;
    }
    return amount > MAXIMUM_AMOUNT ? LABELS.errAmountMax : null;
}

/**
 * @param {string} isoDate a date as Apex returns it, "2026-11-20"
 * @returns {string} the date as "20 de noviembre de 2026"
 */
function formatDate(isoDate) {
    return isoDate ? dateFormat.format(new Date(`${isoDate}T00:00:00Z`)) : '';
}

/**
 * @param {string} page a key of PAGES
 * @param {Object<string, string>} [params] query parameters
 * @returns {string} the page's address in the site
 */
function pageUrl(page, params) {
    const path = PAGES[page] ? `${basePath}/${PAGES[page]}` : `${basePath}/`;
    const query = params
        ? Object.entries(params)
              .filter(([, value]) => value)
              .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
              .join('&')
        : '';
    return query ? `${path}?${query}` : path;
}

/**
 * Reads a query parameter of the current address. Only ids and Stripe's session id travel this way;
 * never an email, a name or an RFC (US-12).
 * @param {string} name the parameter
 * @returns {string|null} its value
 */
function getParam(name) {
    try {
        return new URLSearchParams(window.location.search).get(name);
    } catch {
        return null;
    }
}

// A file in the Donation_Campaign_Images static resource, such as "becas.svg".
const IMAGE_FILE = /^[A-Za-z0-9_-]+\.(svg|png|jpe?g|webp)$/;

/**
 * Turns a campaign's Image_URL__c into an address the browser can load. A file name points into the
 * Donation_Campaign_Images static resource, on the same domain as the site, so no Trusted URL is needed
 * and it works for the guest user. A full https address is kept as is (its host must be a Trusted URL).
 * Anything else is ignored, so the placeholder shows.
 * @param {string} value the campaign's Image_URL__c
 * @returns {string|null} the image address, or null for the placeholder
 */
function campaignImageUrl(value) {
    const image = (value || '').trim();
    if (IMAGE_FILE.test(image)) {
        return `${CAMPAIGN_IMAGES}/${image}`;
    }
    return /^https:\/\//i.test(image) ? image : null;
}

/**
 * Adds the display values a card or a campaign page needs to a campaign from PublicCampaignController.
 * Progress is computed from raised and goal: only paid donations count (US-01 AC2), and over 100% the
 * real percentage shows with "Meta superada"; c-progress-bar keeps the bar full (US-08 AC5).
 * @param {Object} campaign a PublicCampaignController.CampaignView
 * @param {boolean} [past] whether it is a finished campaign
 * @returns {Object} the campaign with display fields
 */
function toCampaignView(campaign, past) {
    const goal = Number(campaign.goal) || 0;
    const raised = Number(campaign.raised) || 0;
    const percent = goal > 0 ? Math.floor((raised / goal) * 100) : 0;
    const endYear = campaign.endDate ? Number(campaign.endDate.substring(0, 4)) : 0;
    let closeLabel;
    if (past) {
        closeLabel = format(LABELS.closedOn, formatDate(campaign.endDate));
    } else if (!campaign.endDate || endYear >= ALWAYS_OPEN_YEAR) {
        closeLabel = LABELS.alwaysOpen;
    } else {
        closeLabel = format(LABELS.closesOn, formatDate(campaign.endDate));
    }
    return {
        ...campaign,
        percent,
        percentLabel: `${percent}%`,
        exceeded: !past && percent >= 100,
        raisedLabel: formatMoney(raised),
        goalLabel: formatMoney(goal),
        closeLabel,
        progressLabel: format(LABELS.progressOf, campaign.name),
        imageUrl: campaignImageUrl(campaign.imageUrl),
        hasImage: Boolean(campaignImageUrl(campaign.imageUrl)),
        pageUrl: pageUrl('campaign', { id: campaign.id }),
        donateUrl: pageUrl('donate', { campana: campaign.id })
    };
}

/**
 * @param {*} error an error from an Apex call
 * @returns {string|null} the message an AuraHandledException carries, if any
 */
function apexMessage(error) {
    const body = error && error.body;
    if (!body) {
        return null;
    }
    if (Array.isArray(body)) {
        return body.map((item) => item.message).filter(Boolean).join(' ') || null;
    }
    return body.message || null;
}

// Same rules as the RFC_Format validation rule: initial letters, date and homoclave (US-06 AC2).
const RFC_PATTERNS = {
    Company: /^[A-ZÑ&]{3}[0-9]{2}(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])[A-Z0-9]{2}[0-9A]$/,
    Individual: /^[A-ZÑ&]{4}[0-9]{2}(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])[A-Z0-9]{2}[0-9A]$/
};
const RFC_LENGTH = { Company: 12, Individual: 13 };
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * @param {string} email the email
 * @returns {string|null} the error message, or null when it is valid (US-03 AC6, US-02 AC6)
 */
function validateEmail(email) {
    if (!email) {
        return LABELS.errRequired;
    }
    return EMAIL_PATTERN.test(email) ? null : LABELS.errEmail;
}

/**
 * @param {string} rfc the RFC, in capitals
 * @param {string} personType Individual or Company
 * @returns {string|null} the error message, or null when it is valid (US-06 AC1, AC2, AC5)
 */
function validateRfc(rfc, personType) {
    if (!rfc) {
        return LABELS.errRequired;
    }
    if (!RFC_PATTERNS[personType]) {
        return null;
    }
    if (rfc.length !== RFC_LENGTH[personType]) {
        return personType === 'Company' ? LABELS.errRfcLengthCompany : LABELS.errRfcLengthIndividual;
    }
    return RFC_PATTERNS[personType].test(rfc) ? null : LABELS.errRfc;
}

export {
    PAGES,
    SUGGESTED_AMOUNTS,
    HIGHLIGHT_AMOUNT,
    MINIMUM_AMOUNT,
    MAXIMUM_AMOUNT,
    formatMoney,
    parseAmount,
    validateAmount,
    formatDate,
    pageUrl,
    getParam,
    campaignImageUrl,
    toCampaignView,
    apexMessage,
    validateEmail,
    validateRfc
};
