/**
 * Fictitious data for the public site while the components are not connected to the backend.
 * Same shapes as PublicCampaignController (CampaignView, Recognition, Donor). Names and amounts are
 * invented; no real people (CLAUDE.md: fictitious data only).
 *
 * Each campaign's "raised" is the sum of its recognition (named donors plus the anonymous total), so the
 * progress and the recognition agree, as they will with real paid donations.
 */

const ACTIVE = [
    {
        id: 'mock-transporte',
        name: 'Transporte y hospedaje',
        description:
            'Para muchos de nuestros alumnos, este será su primer viaje a Mexico Dreamin. Con esta campaña cubrimos el traslado en autobús y el hospedaje compartido durante el evento, para que nadie se quede fuera por el costo del viaje.',
        imageUrl: null,
        purpose: 'Autobús redondo y dos noches de hospedaje para el grupo.',
        endDate: '2026-11-18',
        goal: 40000
    },
    {
        id: 'mock-boletos',
        name: 'Boletos de acceso al evento',
        description:
            'El pase completo da acceso a conferencias, talleres prácticos y a la zona de reclutamiento. Queremos que cada alumno aproveche todo el evento.',
        imageUrl: null,
        purpose: 'Pases para conferencias y talleres.',
        endDate: '2026-11-18',
        goal: 30000
    },
    {
        id: 'mock-comidas',
        name: 'Comidas durante el evento',
        description: 'Jornadas largas de conferencias requieren buena energía. Esta campaña cubre desayuno y comida para todo el grupo.',
        imageUrl: null,
        purpose: 'Desayuno y comida para cada alumno.',
        endDate: '2026-11-19',
        goal: 15000
    },
    {
        id: 'mock-general',
        name: 'Campaña general',
        description:
            'Esta campaña siempre está abierta. Lo que se reúne aquí se asigna a lo que más falte: imprevistos del viaje o apoyo completo para alumnos que no podrían ir de otra forma.',
        imageUrl: null,
        purpose: 'Se destina a la necesidad del viaje que más lo requiera.',
        endDate: '2099-12-31',
        goal: 20000
    }
];

const PAST = [
    {
        id: 'mock-pasada-laptops',
        name: 'Laptops de préstamo',
        description: 'Equipos para alumnos que no tenían computadora.',
        imageUrl: null,
        purpose: 'Cinco laptops para préstamo.',
        endDate: '2026-06-30',
        goal: 60000,
        raised: 52800
    },
    {
        id: 'mock-pasada-taller',
        name: 'Taller de certificación Salesforce',
        description: 'Preparación para la certificación de administrador.',
        imageUrl: null,
        purpose: 'Instructor y materiales del taller.',
        endDate: '2026-03-15',
        goal: 25000,
        raised: 27150
    }
];

const RECOGNITION = {
    'mock-transporte': {
        donors: [
            { name: 'Grupo Nodo Software', amount: 20000 },
            { name: 'Familia Ortega Lima', amount: 5000 },
            { name: 'Generación 2015 de Sistemas', amount: 10000 },
            { name: 'Rosa Elena Quintero', amount: 1000 },
            { name: 'Mtro. Arturo Salinas', amount: 2000 },
            { name: 'Comercializadora Ámbar', amount: 5000 },
            { name: 'Daniela Pérez', amount: 500 },
            { name: 'Luis Fernando Ríos', amount: 250 }
        ],
        anonymousTotal: 3500
    },
    'mock-boletos': {
        donors: [
            { name: 'Laboratorios Cumbre', amount: 10000 },
            { name: 'Dra. Teresa Villalobos', amount: 2000 },
            { name: 'Exalumnos 2018', amount: 5000 }
        ],
        anonymousTotal: 0
    },
    'mock-comidas': { donors: [], anonymousTotal: 0 },
    'mock-general': {
        donors: [
            { name: 'Familia Rangel', amount: 2000 },
            { name: 'Mariana Castillo', amount: 1000 }
        ],
        anonymousTotal: 1250
    }
};

function raisedOf(campaignId) {
    const recognition = RECOGNITION[campaignId] || { donors: [], anonymousTotal: 0 };
    return recognition.donors.reduce((sum, donor) => sum + donor.amount, recognition.anonymousTotal);
}

function withProgress(campaign) {
    const raised = campaign.raised !== undefined ? campaign.raised : raisedOf(campaign.id);
    return { ...campaign, raised, progress: campaign.goal > 0 ? Math.round((raised / campaign.goal) * 1000) / 10 : 0 };
}

const MOCK_ACTIVE_CAMPAIGNS = ACTIVE.map(withProgress);
const MOCK_PAST_CAMPAIGNS = PAST.map(withProgress);
const MOCK_RECOGNITION = RECOGNITION;

export { MOCK_ACTIVE_CAMPAIGNS, MOCK_PAST_CAMPAIGNS, MOCK_RECOGNITION };
