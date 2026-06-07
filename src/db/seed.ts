/*
 * Copyright (c) 2026, Bruno NDUWARUGIRA. | GitHub Name: nduwarugirabruno
 */

/**
 * Database seeder — recreates the schema and loads demo data.
 * Run with: npm run db:seed   (DESTRUCTIVE: drops all existing tables first)
 */
import bcrypt from 'bcryptjs'
import {pool} from './pool.js'
import {SCHEMA_SQL} from './schema.js'

const S = {
    PLANNED: 'Planifié',
    NOT_STARTED: 'Pas commencé',
    INITIALIZED: 'Initialisé',
    IN_PROGRESS: 'En cours',
    PENDING: 'En attente',
    COMPLETE: 'Terminé',
} as const

const USERS = [
    {matricule: 10001, password: 'pass01', role: 'ADMIN', firstName: 'Sudo', lastName: 'Admin'},
    {matricule: 10002, password: 'pass02', role: 'USER', firstName: 'John', lastName: 'User'},
    {matricule: 10003, password: 'pass03', role: 'USER', firstName: 'Jane', lastName: 'Doe'},
    {matricule: 10004, password: 'pass04', role: 'USER', firstName: 'Will', lastName: 'Smith'},
    {matricule: 10005, password: 'pass05', role: 'USER', firstName: 'Chris', lastName: 'Brown'},
]

const PROJECTS = [
    {
        codeOtp: 101, name: 'Développement Portail RH', team: 'Team Alpha', client: 'Orange Cameroun',
        address: 'Rue Nachtigal, Yaoundé', progress: 30.75, status: S.IN_PROGRESS,
        details: {
            finalClient: 'Orange Cameroun SA', contact: 'Jean Dupont', responsible: 'Alice Martin',
            architecturalDesign: 'Bureau Archi-Plus', startDate: '2024-01-15', expectedEndDate: '2024-12-31',
            offerSubmissionDate: '2023-12-01', responseDeadline: null, targetDateSmacWork: '2024-02-01',
            marketType: 'Privé', chantierType: 'Neuf', siteVisit: true, clusterQuote: 'C1',
            needDelegatedAuthority: false, technicity: 'Moyenne', linkToAo: null,
            technicalDescription: 'Portail RH complet avec gestion des congés et paie.',
        },
    },
    {
        codeOtp: 102, name: 'Migration Infrastructure Cloud', team: 'Team Beta', client: 'MTN Cameroun',
        address: 'Avenue Kennedy, Douala', progress: 85.5, status: S.IN_PROGRESS,
        details: {
            finalClient: 'MTN Group', contact: 'Paul Biya Jr', responsible: 'Bruno NDUWARUGIRA',
            architecturalDesign: 'Cloud Architects Ltd', startDate: '2024-03-01', expectedEndDate: '2025-02-28',
            offerSubmissionDate: '2024-01-15', responseDeadline: null, targetDateSmacWork: '2024-03-15',
            marketType: 'Privé', chantierType: 'Refection', siteVisit: false, clusterQuote: 'C2',
            needDelegatedAuthority: true, technicity: 'Haute', linkToAo: null,
            technicalDescription: 'Migration complète des serveurs on-premise vers AWS.',
        },
    },
    {
        codeOtp: 103, name: 'Audit Système Comptable', team: 'Team Gamma', client: 'Société Générale',
        address: 'Boulevard de la Liberté, Douala', progress: 100, status: S.COMPLETE,
        details: {
            finalClient: 'Société Générale Cameroun', contact: 'Marie Curie', responsible: 'Pierre Dupont',
            architecturalDesign: 'Audit & Co', startDate: '2023-06-01', expectedEndDate: '2024-01-31',
            offerSubmissionDate: '2023-04-10', responseDeadline: null, targetDateSmacWork: '2023-06-15',
            marketType: 'Privé', chantierType: 'Refection', siteVisit: true, clusterQuote: 'C1',
            needDelegatedAuthority: false, technicity: 'Basse', linkToAo: null,
            technicalDescription: 'Audit complet du système SAP comptable.',
        },
    },
    {
        codeOtp: 104, name: 'Refonte Site E-commerce', team: 'Team Delta', client: 'CamAir-Co',
        address: 'Aéroport International, Yaoundé', progress: 0, status: S.NOT_STARTED,
        details: {
            finalClient: 'CamAir-Co SA', contact: 'Thomas Air', responsible: 'Léa Mignon',
            architecturalDesign: 'Web Design Studio', startDate: '2025-01-01', expectedEndDate: '2025-06-30',
            offerSubmissionDate: '2024-10-01', responseDeadline: null, targetDateSmacWork: '2025-01-15',
            marketType: 'Public', chantierType: 'Neuf', siteVisit: false, clusterQuote: 'C3',
            needDelegatedAuthority: false, technicity: 'Moyenne', linkToAo: null,
            technicalDescription: 'Refonte complète du site e-commerce avec intégration paiement mobile.',
        },
    },
    {
        codeOtp: 105, name: 'Déploiement ERP SAP', team: 'Team Alpha', client: 'CAMTEL',
        address: 'Rue Joseph Mballa, Yaoundé', progress: 62.3, status: S.IN_PROGRESS,
        details: {
            finalClient: 'CAMTEL', contact: 'Eric SAP', responsible: 'Jean LaFontaine',
            architecturalDesign: 'SAP Partners', startDate: '2024-04-01', expectedEndDate: '2025-03-31',
            offerSubmissionDate: '2024-02-01', responseDeadline: null, targetDateSmacWork: '2024-04-15',
            marketType: 'Public', chantierType: 'Neuf', siteVisit: true, clusterQuote: 'C2',
            needDelegatedAuthority: true, technicity: 'Haute', linkToAo: null,
            technicalDescription: 'Déploiement ERP SAP modules FI/CO/MM.',
        },
    },
    {
        codeOtp: 106, name: 'Application Mobile Banking', team: 'Team Epsilon', client: 'Afriland First Bank',
        address: 'Avenue Monseigneur Vogt, Yaoundé', progress: 47.0, status: S.IN_PROGRESS,
        details: {
            finalClient: 'Afriland First Bank', contact: 'Sylvie Bank', responsible: 'Alice Martin',
            architecturalDesign: 'Mobile Dev Studio', startDate: '2024-05-01', expectedEndDate: '2025-04-30',
            offerSubmissionDate: '2024-03-01', responseDeadline: null, targetDateSmacWork: '2024-05-15',
            marketType: 'Privé', chantierType: 'Neuf', siteVisit: false, clusterQuote: 'C1',
            needDelegatedAuthority: false, technicity: 'Haute', linkToAo: null,
            technicalDescription: 'App mobile iOS/Android avec virement, consultation solde et paiement.',
        },
    },
    {
        codeOtp: 107, name: 'Sécurisation Réseau Interne', team: 'Team Beta', client: 'BEAC',
        address: 'Avenue Mgr Vogt, Yaoundé', progress: 100, status: S.COMPLETE,
        details: {
            finalClient: "Banque des États de l'Afrique Centrale", contact: 'Henri Réseau',
            responsible: 'Bruno NDUWARUGIRA', architecturalDesign: 'SecureNet', startDate: '2023-09-01',
            expectedEndDate: '2024-03-31', offerSubmissionDate: '2023-07-01', responseDeadline: null,
            targetDateSmacWork: '2023-09-15', marketType: 'Public', chantierType: 'Refection', siteVisit: true,
            clusterQuote: 'C2', needDelegatedAuthority: true, technicity: 'Haute', linkToAo: null,
            technicalDescription: 'Mise en place firewall, IDS/IPS et VPN sécurisé.',
        },
    },
    {
        codeOtp: 108, name: 'Plateforme de Gestion des Stocks', team: 'Team Gamma', client: 'SCDP',
        address: 'Port de Douala, Douala', progress: 15.8, status: S.IN_PROGRESS,
        details: {
            finalClient: 'Société Camerounaise des Dépôts Pétroliers', contact: 'Marc Stock',
            responsible: 'Pierre Dupont', architecturalDesign: 'WMS Solutions', startDate: '2024-07-01',
            expectedEndDate: '2025-06-30', offerSubmissionDate: '2024-05-01', responseDeadline: null,
            targetDateSmacWork: '2024-07-15', marketType: 'Public', chantierType: 'Neuf', siteVisit: true,
            clusterQuote: 'C3', needDelegatedAuthority: false, technicity: 'Moyenne', linkToAo: null,
            technicalDescription: 'Plateforme WMS pour gestion stocks carburant.',
        },
    },
    {
        codeOtp: 109, name: 'Système de Supervision Électrique', team: 'Team Delta', client: 'ENEO Cameroun',
        address: 'Rue Drouot, Douala', progress: 0, status: S.PENDING,
        details: {
            finalClient: 'ENEO Cameroun SA', contact: 'Bernard Énergie', responsible: 'Léa Mignon',
            architecturalDesign: 'SCADA Systems', startDate: '2025-03-01', expectedEndDate: '2026-02-28',
            offerSubmissionDate: '2024-12-01', responseDeadline: null, targetDateSmacWork: '2025-03-15',
            marketType: 'Public', chantierType: 'Neuf', siteVisit: true, clusterQuote: 'C2',
            needDelegatedAuthority: true, technicity: 'Haute', linkToAo: null,
            technicalDescription: 'Supervision SCADA réseau électrique national.',
        },
    },
    {
        codeOtp: 110, name: 'Dashboard Analytics Marketing', team: 'Team Epsilon',
        client: 'Brasseries du Cameroun', address: 'Zone Industrielle, Bassa, Douala',
        progress: 91.2, status: S.IN_PROGRESS,
        details: {
            finalClient: 'SABC', contact: 'Claire Analytics', responsible: 'Jean LaFontaine',
            architecturalDesign: 'Data Studio', startDate: '2024-02-01', expectedEndDate: '2024-11-30',
            offerSubmissionDate: '2023-12-01', responseDeadline: null, targetDateSmacWork: '2024-02-15',
            marketType: 'Privé', chantierType: 'Neuf', siteVisit: false, clusterQuote: 'C1',
            needDelegatedAuthority: false, technicity: 'Moyenne', linkToAo: null,
            technicalDescription: 'Dashboard BI Power BI avec KPIs ventes et distribution.',
        },
    },
]

const STAKEHOLDERS = [
    {
        typePole: 'ECONOMISTE',
        numSap: 100001,
        fullName: 'Jean-Marc Lefebvre',
        mail: 'jm.lefebvre@ecobat-conseil.fr',
        phone: '+33142610011',
        address: '12 Rue de la Paix, 75002 Paris'
    },
    {
        typePole: 'BUREAU DE CONTRÔLE',
        numSap: 100002,
        fullName: 'SARL Bati-Contrôle',
        mail: 'contact@bati-controle.fr',
        phone: '+33472103040',
        address: '8 Avenue de la République, 69003 Lyon'
    },
    {
        typePole: 'OPX',
        numSap: 100003,
        fullName: 'Claire Vallet',
        mail: 'c.vallet@opx-ingenierie.com',
        phone: '+33556012233',
        address: '45 Rue de la Victoire, 33000 Bordeaux'
    },
    {
        typePole: 'COORDINATEUR',
        numSap: 100004,
        fullName: 'Cabinet Pierre Durand',
        mail: 'p.durand@coordination-securite.fr',
        phone: '+33153401515',
        address: '102 Boulevard Haussmann, 75008 Paris'
    },
    {
        typePole: 'ENTREPRISE GENERALE',
        numSap: 100007,
        fullName: 'Eiffage Construction',
        mail: 'contact@eiffage-construction.com',
        phone: '+33134650000',
        address: "11 Place de l'Europe, 78140 Vélizy-Villacoublay"
    },
    {
        typePole: 'MOE EXE',
        numSap: 100006,
        fullName: 'Architecture & Exécution',
        mail: 'etudes@archiexec.fr',
        phone: '+33240123456',
        address: '22 Rue des Capucins, 44000 Nantes'
    },
]

const TASKS = [
    {
        site: 'Site A – Yaoundé',
        anomalyRef: 'ANO-2024-001',
        correctiveAction: 'Remplacement du câblage défectueux',
        responsible: 'Pierre Dupont',
        startDate: '2024-03-01',
        dueDate: '2024-03-15',
        progress: 100,
        status: S.COMPLETE
    },
    {
        site: 'Site B – Douala',
        anomalyRef: 'ANO-2024-002',
        correctiveAction: 'Mise à jour firmware équipements réseau',
        responsible: 'Bruno NDUWARUGIRA',
        startDate: '2024-04-01',
        dueDate: '2024-04-20',
        progress: 75,
        status: S.IN_PROGRESS
    },
    {
        site: 'Site C – Bafoussam',
        anomalyRef: 'ANO-2024-003',
        correctiveAction: 'Vérification conformité installation électrique',
        responsible: 'Léa Mignon',
        startDate: '2024-05-01',
        dueDate: '2024-05-31',
        progress: 40,
        status: S.IN_PROGRESS
    },
    {
        site: 'Site A – Yaoundé',
        anomalyRef: 'ANO-2024-004',
        correctiveAction: 'Contrôle étanchéité toiture',
        responsible: 'Alice Martin',
        startDate: '2024-06-01',
        dueDate: '2024-06-15',
        progress: 0,
        status: S.NOT_STARTED
    },
    {
        site: 'Site D – Garoua',
        anomalyRef: 'ANO-2024-005',
        correctiveAction: 'Réparation système de climatisation',
        responsible: 'Jean LaFontaine',
        startDate: '2024-06-10',
        dueDate: '2024-06-30',
        progress: 0,
        status: S.PENDING
    },
    {
        site: 'Site B – Douala',
        anomalyRef: 'ANO-2024-006',
        correctiveAction: 'Installation onduleurs salle serveur',
        responsible: 'Pierre Dupont',
        startDate: '2024-07-01',
        dueDate: '2024-07-20',
        progress: 60,
        status: S.IN_PROGRESS
    },
    {
        site: 'Site E – Limbe',
        anomalyRef: 'ANO-2024-007',
        correctiveAction: 'Remise aux normes sécurité incendie',
        responsible: 'Chris Brown',
        startDate: '2024-07-15',
        dueDate: '2024-08-15',
        progress: 20,
        status: S.IN_PROGRESS
    },
    {
        site: 'Site C – Bafoussam',
        anomalyRef: 'ANO-2024-008',
        correctiveAction: 'Remplacement luminaires LED',
        responsible: 'Léa Mignon',
        startDate: '2024-08-01',
        dueDate: '2024-08-31',
        progress: 100,
        status: S.COMPLETE
    },
]

// Référentiel des fiches & PV affectables aux compagnons.
// `type` is stored using the Prisma enum @map value ('fiche' | 'pv').
const FICHES = [
    {code: 'ACC', name: "Fiche Accueil", type: 'fiche'},
    {code: 'PTA', name: "Fiche Point d'Arrêt", type: 'fiche'},
    {code: 'AUTO', name: 'Fiche Autocontrôle', type: 'fiche'},
    {code: 'APR', name: 'Fiche APR', type: 'fiche'},
    {code: 'SUIVI', name: 'Fiche Suivi', type: 'fiche'},
    {code: 'PV-REC', name: 'PV de réception', type: 'pv'},
    {code: 'PV-EAU', name: 'PV de mise en eau', type: 'pv'},
    {code: 'PV-OPR', name: "PV d'OPR", type: 'pv'},
]

async function main(): Promise<void> {
    console.log('→ Applying schema (dropping existing tables)...')
    await pool.query(SCHEMA_SQL)

    console.log(`→ Seeding ${USERS.length} users...`)
    for (const u of USERS) {
        const hash = await bcrypt.hash(u.password, 10)
        const {rows} = await pool.query<{ id: string }>(
            'INSERT INTO user_table (matricule, password, role) VALUES ($1,$2,$3) RETURNING id',
            [u.matricule, hash, u.role],
        )
        await pool.query(
            'INSERT INTO person (id, last_name, first_name) VALUES ($1,$2,$3)',
            [rows[0].id, u.lastName, u.firstName],
        )
    }

    console.log(`→ Seeding ${PROJECTS.length} chantiers...`)
    let firstChantierId: string | null = null
    for (const p of PROJECTS) {
        const d = p.details
        const {rows: detailRows} = await pool.query<{ id: string }>(
            `INSERT INTO chantier_details (
         final_client, contact, responsible, architectural_design,
         start_date, expected_end_date, offer_submission_date, response_deadline,
         target_date_smac_work, market_type, chantier_type, site_visit,
         cluster_quote, need_delegated_authority, technicity, link_to_ao, technical_description)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING id`,
            [
                d.finalClient, d.contact, d.responsible, d.architecturalDesign,
                d.startDate, d.expectedEndDate, d.offerSubmissionDate, d.responseDeadline,
                d.targetDateSmacWork, d.marketType, d.chantierType, d.siteVisit,
                d.clusterQuote, d.needDelegatedAuthority, d.technicity, d.linkToAo, d.technicalDescription,
            ],
        )
        const {rows: projRows} = await pool.query<{ id: string }>(
            `INSERT INTO chantier (code_otp, name, team, client, address, progress, status, chantier_details_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
            [p.codeOtp, p.name, p.team, p.client, p.address, p.progress, p.status, detailRows[0].id],
        )
        if (!firstChantierId) firstChantierId = projRows[0].id
    }

    console.log(`→ Seeding ${STAKEHOLDERS.length} intervenants (linked to first chantier)...`)
    for (const s of STAKEHOLDERS) {
        const {rows} = await pool.query<{ id: string }>(
            `INSERT INTO intervenant (type_pole, num_sap, full_name, mail, phone, address)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
            [s.typePole, s.numSap, s.fullName, s.mail, s.phone, s.address],
        )
        await pool.query(
            'INSERT INTO chantier_intervenants (chantier_id, intervenants_id) VALUES ($1,$2)',
            [firstChantierId, rows[0].id],
        )
    }

    console.log(`→ Seeding ${TASKS.length} actions (linked to first chantier)...`)
    for (const t of TASKS) {
        const {rows} = await pool.query<{ id: string }>(
            `INSERT INTO action (site, anomaly_ref, corrective_action, responsible, start_date, due_date, progress, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
            [t.site, t.anomalyRef, t.correctiveAction, t.responsible, t.startDate, t.dueDate, t.progress, t.status],
        )
        await pool.query(
            'INSERT INTO chantier_actions (chantier_id, actions_id) VALUES ($1,$2)',
            [firstChantierId, rows[0].id],
        )
    }

    console.log(`→ Seeding ${FICHES.length} fiches...`)
    for (const f of FICHES) {
        await pool.query(
            'INSERT INTO fiches (code, name, type) VALUES ($1,$2,$3)',
            [f.code, f.name, f.type],
        )
    }

    console.log('✓ Seed complete.')
    console.log('  Login: matricule 10001 / pass01 (ADMIN) | 10002 / pass02 (USER)')
    await pool.end()
}

main().catch((err) => {
    console.error('Seed failed:', err)
    process.exit(1)
})
