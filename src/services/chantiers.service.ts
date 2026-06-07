import {prisma} from '../db/prisma.js'
import {buildPage} from '../utils/pagination.js'
import {ProcessStatus} from '../enums.js'
import {TypeIntervenantEnum} from '../generated/prisma/enums.js'
import {psToEnum, enumToPs} from '../utils/processStatus.js'
import type {Prisma} from '../generated/prisma/client.js'
import type {CreateChantierRequest, CreateIntervenantRequest, CreateActionRequest, UpdateChantierDetailsRequest, UpdateChantierRequest} from '../types.js'

const chantierInclude = {chantierDetails: true} as const
type ChantierWithDetails = Prisma.ChantierGetPayload<{ include: typeof chantierInclude }>

function mapChantier(p: ChantierWithDetails) {
    return {
        id: p.id, codeOTP: p.codeOTP, name: p.name, team: p.team,
        client: p.client, address: p.address,
        progress: p.progress === null ? null : Number(p.progress),
        status: enumToPs(p.status), createdAt: p.createdAt, updatedAt: p.updatedAt,
        chantierDetails: p.chantierDetails ? {
            id: p.chantierDetails.id, client: p.chantierDetails.client,
            finalClient: p.chantierDetails.finalClient, address: p.chantierDetails.address,
            contact: p.chantierDetails.contact, responsible: p.chantierDetails.responsible,
            architecturalDesign: p.chantierDetails.architecturalDesign,
            startDate: p.chantierDetails.startDate, expectedEndDate: p.chantierDetails.expectedEndDate,
            offerSubmissionDate: p.chantierDetails.offerSubmissionDate,
            responseDeadline: p.chantierDetails.responseDeadline,
            targetDateSMACWork: p.chantierDetails.targetDateSMACWork,
            marketType: p.chantierDetails.marketType, chantierType: p.chantierDetails.chantierType,
            siteVisit: p.chantierDetails.siteVisit, clusterQuote: p.chantierDetails.clusterQuote,
            needDelegatedAuthority: p.chantierDetails.needDelegatedAuthority,
            technicity: p.chantierDetails.technicity, linkToAo: p.chantierDetails.linkToAo,
            technicalDescription: p.chantierDetails.technicalDescription,
        } : null,
    }
}

type RawIntervenant = {
    id: string; typePole: string; numSAP: number; fullName: string;
    mail: string | null; phone: string | null; address: string | null;
    createdAt: Date; updatedAt: Date;
}

function mapSH(s: RawIntervenant) {
    return {
        id: s.id, typePole: s.typePole, numSAP: s.numSAP, fullName: s.fullName,
        mail: s.mail, phone: s.phone, address: s.address,
        createdAt: s.createdAt, updatedAt: s.updatedAt,
    }
}

async function findChantier(id: string): Promise<ChantierWithDetails | null> {
    return prisma.chantier.findUnique({where: {id}, include: chantierInclude})
}

function chantierOrderBy(field: string, dir: 'asc' | 'desc'): Prisma.ChantierOrderByWithRelationInput {
    switch (field) {
        case 'otp':      return {codeOTP: dir}
        case 'name':     return {name: dir}
        case 'team':     return {team: dir}
        case 'progress': return {progress: dir}
        case 'end-date': return {chantierDetails: {expectedEndDate: dir}}
        case 'status':   return {status: dir}
        default:         return {codeOTP: 'asc'}
    }
}

export interface ChantierFilters {
    codeOTP?: number
    name?: string
    team?: string
    status?: string
    client?: string
    progress?: number
    progressFrom?: number
    progressTo?: number
}

function buildWhere(f: ChantierFilters): Prisma.ChantierWhereInput {
    const where: Prisma.ChantierWhereInput = {}
    if (f.codeOTP !== undefined) where.codeOTP = f.codeOTP
    if (f.name) where.name = {contains: f.name, mode: 'insensitive'}
    if (f.team) where.team = f.team
    if (f.status) where.status = psToEnum(f.status)
    if (f.client) where.client = {contains: f.client, mode: 'insensitive'}
    if (f.progressFrom !== undefined || f.progressTo !== undefined) {
        where.progress = {gte: f.progressFrom ?? 0, lte: f.progressTo ?? 100}
    } else if (f.progress !== undefined) {
        where.progress = {gte: f.progress, lte: f.progress}
    }
    return where
}

async function paginatedChantiers(
    where: Prisma.ChantierWhereInput,
    page: number, size: number,
    orderBy: Prisma.ChantierOrderByWithRelationInput = {codeOTP: 'asc'},
) {
    const [total, items] = await prisma.$transaction([
        prisma.chantier.count({where}),
        prisma.chantier.findMany({where, include: chantierInclude, orderBy, skip: page * size, take: size}),
    ])
    return buildPage(items.map(mapChantier), total, page, size)
}

/** Distinct ConducteurTravaux intervenants assigned to a chantier (via the `intervention` table). */
async function chantierConducteurTravaux(chantierId: string) {
    const records = await prisma.intervention.findMany({
        where: {idChantier: chantierId, intervenant: {typeIntervenant: TypeIntervenantEnum.ConducteurTravaux}},
        include: {intervenant: true},
        orderBy: {intervenant: {fullName: 'asc'}},
    })
    const seen = new Set<string>()
    const result = []
    for (const r of records) {
        if (seen.has(r.intervenant.id)) continue
        seen.add(r.intervenant.id)
        result.push(mapSH(r.intervenant))
    }
    return result
}

export const chantiersService = {
    async create(b: CreateChantierRequest) {
        const chantier = await prisma.chantier.create({
            data: {
                codeOTP: b.codeOTP, name: b.name ?? null, team: b.team ?? null,
                client: b.client ?? null, address: b.address ?? null,
                progress: b.progress ?? 0, status: psToEnum(b.status ?? ProcessStatus.INITIALIZED),
            },
            include: chantierInclude,
        })
        return mapChantier(chantier)
    },

    async createMass(items: CreateChantierRequest[]) {
        const results = []
        for (const b of items) {
            if (!b.codeOTP) { results.push(null); continue }
            try {
                results.push(await chantiersService.create(b))
            } catch {
                results.push(null)
            }
        }
        return results
    },

    async findById(id: string) {
        const p = await findChantier(id)
        return p ? mapChantier(p) : null
    },

    findAll: (filters: ChantierFilters, page: number, size: number, sort?: {field: string; dir: 'asc' | 'desc'}) =>
        paginatedChantiers(buildWhere(filters), page, size, sort ? chantierOrderBy(sort.field, sort.dir) : undefined),

    async updateStatus(id: string, status: string) {
        try {
            const p = await prisma.chantier.update({
                where: {id}, data: {status: psToEnum(status), updatedAt: new Date()}, include: chantierInclude,
            })
            return mapChantier(p)
        } catch {
            return null
        }
    },

    async update(id: string, b: UpdateChantierRequest) {
        const p = await prisma.chantier.update({
            where: {id},
            data: {name: b.name ?? undefined, team: b.team ?? undefined, address: b.address ?? undefined, updatedAt: new Date()},
            include: chantierInclude,
        })
        return mapChantier(p)
    },

    async updateDetails(id: string, b: UpdateChantierDetailsRequest) {
        const chantier = await findChantier(id)
        if (!chantier) return null
        const detailsData = {
            client: b.client ?? undefined, finalClient: b.finalClient ?? undefined,
            address: b.address ?? undefined, contact: b.contact ?? undefined,
            responsible: b.responsible ?? undefined, architecturalDesign: b.architecturalDesign ?? undefined,
            startDate: b.startDate ? new Date(b.startDate) : undefined,
            expectedEndDate: b.expectedEndDate ? new Date(b.expectedEndDate) : undefined,
            offerSubmissionDate: b.offerSubmissionDate ? new Date(b.offerSubmissionDate) : undefined,
            targetDateSMACWork: b.targetDateSMACWork ? new Date(b.targetDateSMACWork) : undefined,
            marketType: b.marketType ?? undefined, chantierType: b.chantierType ?? undefined,
            siteVisit: b.siteVisit ?? undefined, clusterQuote: b.clusterQuote ?? undefined,
            needDelegatedAuthority: b.needDelegatedAuthority ?? undefined,
            technicity: b.technicity ?? undefined, linkToAo: b.linkToAo ?? undefined,
            technicalDescription: b.technicalDescription ?? undefined, updatedAt: new Date(),
        }
        const updated = await prisma.chantier.update({
            where: {id},
            data: {
                updatedAt: new Date(),
                chantierDetails: {
                    upsert: {
                        create: {...detailsData, siteVisit: b.siteVisit ?? false, needDelegatedAuthority: b.needDelegatedAuthority ?? false},
                        update: detailsData,
                    },
                },
            },
            include: chantierInclude,
        })
        return mapChantier(updated)
    },

    async delete(id: string): Promise<boolean> {
        try {
            await prisma.chantier.delete({where: {id}})
            return true
        } catch {
            return false
        }
    },

    async addActionsToChantier(chantierId: string, items: CreateActionRequest[]) {
        const chantier = await findChantier(chantierId)
        if (!chantier) return null
        let childIndex = 0
        for (const t of items) {
            if (!t.responsible) continue
            const action = await prisma.action.create({
                data: {
                    idChantier: chantierId, anomalyRef: t.anomalyRef ?? null,
                    correctiveAction: t.correctiveAction ?? null, idResponsible: t.responsible,
                    startDate: t.startDate ? new Date(t.startDate) : null,
                    dueDate: t.dueDate ? new Date(t.dueDate) : null,
                    status: psToEnum(t.status ?? ProcessStatus.INITIALIZED), childIndex: childIndex++,
                },
            })
            await prisma.chantierAction.create({data: {chantierId, actionId: action.id}})
        }
        return mapChantier((await findChantier(chantierId))!)
    },

    async getIntervenantsPaginated(chantierId: string, page: number, size: number, offset: number) {
        const all = await chantierConducteurTravaux(chantierId)
        const total = all.length
        return {total, page: buildPage(all.slice(offset, offset + size), total, page, size)}
    },

    async getIntervenantsAll(chantierId: string) {
        return chantierConducteurTravaux(chantierId)
    },

    async addIntervenantIds(chantierId: string, ids: string[]) {
        for (const intervenantId of ids) {
            await prisma.chantierIntervenant.upsert({
                where: {chantierId_intervenantId: {chantierId, intervenantId}},
                create: {chantierId, intervenantId}, update: {},
            })
        }
    },

    async createAndAddIntervenants(chantierId: string, items: CreateIntervenantRequest[]) {
        for (const s of items) {
            if (!s.typeIntervenant || !s.nom || !s.prenom || !s.idAgence) continue
            try {
                const sh = await prisma.intervenant.create({
                    data: {
                        typeIntervenant: s.typeIntervenant,
                        nom: s.nom, prenom: s.prenom, idAgence: s.idAgence,
                        typePole: s.typePole ?? '', numSAP: s.numSAP ?? 0,
                        fullName: s.fullName ?? `${s.prenom} ${s.nom}`,
                        matricule: s.matricule ?? null, qualification: s.qualification ?? null,
                        mail: s.mail ?? null, phone: s.phone ?? null, address: s.address ?? null,
                    },
                })
                await prisma.chantierIntervenant.upsert({
                    where: {chantierId_intervenantId: {chantierId, intervenantId: sh.id}},
                    create: {chantierId, intervenantId: sh.id}, update: {},
                })
            } catch { /* ignore duplicate */ }
        }
        return mapChantier((await findChantier(chantierId))!)
    },
}