/**
 * Formatting and mapping shared by the staff components. Pure functions: they read GraphQL nodes or
 * plain values and never call the server.
 */
import LABELS from 'c/staffLabels';

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

const MONEY = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 2 });

/** Donation statuses (Opportunity stages) as the design shows them. */
const STAGES = {
    Paid: { label: LABELS.stagePaid, pill: 'pill pill-success' },
    Pending: { label: LABELS.stagePending, pill: 'pill pill-warning' },
    Expired: { label: LABELS.stageExpired, pill: 'pill pill-neutral' }
};

/** Campaign situations, in the order of the campaign tabs. */
export const SITUATIONS = {
    active: { label: LABELS.situationActive, pill: 'pill pill-success' },
    upcoming: { label: LABELS.situationUpcoming, pill: 'pill pill-brand' },
    finished: { label: LABELS.situationFinished, pill: 'pill pill-neutral' },
    inactive: { label: LABELS.situationInactive, pill: 'pill pill-neutral' }
};

function pad(value) {
    return String(value).padStart(2, '0');
}

/** "$40,000 MXN", or a dash when there is no amount. */
export function formatMoney(value) {
    if (value === null || value === undefined || value === '') {
        return LABELS.noValue;
    }
    return `$${MONEY.format(Number(value))} MXN`;
}

/** "1 sep 2026" from a Salesforce date ("2026-09-01"), with no time zone shift. */
export function formatDate(isoDate) {
    if (!isoDate) {
        return LABELS.noValue;
    }
    const [year, month, day] = String(isoDate).slice(0, 10).split('-').map(Number);
    return `${day} ${MONTHS[month - 1]} ${year}`;
}

/** "8 nov 2026, 08:05" from a Salesforce date time, in the user's time zone. */
export function formatDateTime(isoDateTime) {
    if (!isoDateTime) {
        return LABELS.noValue;
    }
    const date = new Date(isoDateTime);
    if (Number.isNaN(date.getTime())) {
        return LABELS.noValue;
    }
    return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}, ${pad(date.getHours())}:${pad(
        date.getMinutes()
    )}`;
}

/** Today as "YYYY-MM-DD" in the user's time zone, comparable with Salesforce dates. */
export function todayIso(now = new Date()) {
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** Whole percentage of the goal; can be over 100 (US-08 AC5). */
export function percentOf(raised, goal) {
    const target = Number(goal);
    if (!target || target <= 0) {
        return 0;
    }
    return Math.round((Number(raised || 0) / target) * 100);
}

/**
 * Where a campaign stands today (US-08 refinement 1). A campaign whose end date passed is finished;
 * otherwise an inactive one is inactive, one that hasn't started is upcoming, and the rest are active.
 */
export function campaignSituation({ isActive, startDate, endDate }, today = todayIso()) {
    if (endDate && endDate < today) {
        return 'finished';
    }
    if (!isActive) {
        return 'inactive';
    }
    if (startDate && startDate > today) {
        return 'upcoming';
    }
    return 'active';
}

/** Label and pill class of a donation status. Unknown stages show their own name. */
export function stageInfo(stage) {
    return STAGES[stage] ?? { label: stage ?? LABELS.noValue, pill: 'pill pill-neutral' };
}

/** Value of a GraphQL field ({ value }), or null. */
export function valueOf(node, field) {
    return node?.[field]?.value ?? null;
}

/** Display value of a GraphQL field, falling back to its value. */
function displayOf(node, field) {
    return node?.[field]?.displayValue ?? valueOf(node, field);
}

/** A row of the campaign list from a GraphQL Campaign node. */
export function toCampaignRow(node, today = todayIso()) {
    const startDate = valueOf(node, 'StartDate');
    const endDate = valueOf(node, 'EndDate');
    const situation = campaignSituation({ isActive: valueOf(node, 'IsActive'), startDate, endDate }, today);
    const goal = valueOf(node, 'ExpectedRevenue');
    const raised = valueOf(node, 'AmountWonOpportunities');
    const percent = percentOf(raised, goal);
    return {
        id: node.Id,
        name: valueOf(node, 'Name'),
        situation,
        situationLabel: SITUATIONS[situation].label,
        pillClass: SITUATIONS[situation].pill,
        startLabel: formatDate(startDate),
        endLabel: formatDate(endDate),
        goalLabel: formatMoney(goal),
        raisedLabel: formatMoney(raised ?? 0),
        percent,
        percentLabel: `${percent}%`,
        muted: situation === 'finished' || situation === 'inactive'
    };
}

/** Name or company that goes on the invoice. */
function invoiceName(node) {
    const company = valueOf(node, 'Donor_Company__c');
    if (company) {
        return company;
    }
    const fullName = [valueOf(node, 'Donor_First_Name__c'), valueOf(node, 'Donor_Last_Name__c')]
        .filter(Boolean)
        .join(' ');
    return fullName || LABELS.noValue;
}

/** A row of the donation tables from a GraphQL Opportunity node. */
export function toDonationRow(node) {
    const stage = valueOf(node, 'StageName');
    const info = stageInfo(stage);
    return {
        id: node.Id,
        reference: valueOf(node, 'Donation_Reference__c') ?? valueOf(node, 'Name'),
        stage,
        stageLabel: info.label,
        pillClass: info.pill,
        amountLabel: formatMoney(valueOf(node, 'Amount')),
        type: valueOf(node, 'Donation_Type__c') ?? LABELS.noValue,
        campaign: node.Campaign?.Name?.value ?? LABELS.noValue,
        dateLabel: formatDateTime(valueOf(node, 'CreatedDate')),
        isAnonymous: valueOf(node, 'Is_Anonymous__c') === true,
        invoice: valueOf(node, 'Invoice_Requested__c') === true,
        personType: displayOf(node, 'Person_Type__c') ?? LABELS.noValue,
        invoiceName: invoiceName(node),
        rfc: valueOf(node, 'RFC__c') ?? LABELS.noValue,
        consentLabel: valueOf(node, 'Invoice_Consent__c') === true ? LABELS.yes : LABELS.no
    };
}

/** Rows of a GraphQL connection, or an empty list. */
export function edgesOf(connection) {
    return connection?.edges?.map((edge) => edge.node) ?? [];
}

/** Clear message from an LDS or GraphQL error, never a stack trace. */
export function errorMessage(error, fallback) {
    const body = error?.body;
    const fieldErrors = Object.values(body?.output?.fieldErrors ?? {}).flat();
    const pageErrors = body?.output?.errors ?? [];
    const first = [...fieldErrors, ...pageErrors][0];
    return first?.message ?? body?.message ?? fallback;
}
