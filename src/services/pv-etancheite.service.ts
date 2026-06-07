import {prisma} from '../db/prisma.js'
import {TypeDocEnum, ConformiteValue, PlanReperage, NatureTravaux} from '../generated/prisma/enums.js'
import type {Prisma} from '../generated/prisma/client.js'
import type {CreatePvEtancheiteRequest, UpdatePvEtancheiteRequest} from '../types.js'

// ── Enum mappers ──────────────────────────────────────────────────────────────

function toConformite(v: string): ConformiteValue {
    if (v === 'conforme') return 'Conforme'
    if (v === 'non-conforme') return 'NonConforme'
    return 'SO'
}
function fromConformite(v: ConformiteValue): string {
    if (v === 'Conforme') return 'conforme'
    if (v === 'NonConforme') return 'non-conforme'
    return 'SO'
}

function toPlanReperage(v: string): PlanReperage {
    return v === 'oui' ? 'Oui' : 'Non'
}
function fromPlanReperage(v: PlanReperage): string {
    return v === 'Oui' ? 'oui' : 'non'
}

function toNatureTravaux(v: string): NatureTravaux {
    return v === 'etancheite-beton' ? 'EtancheiteBeton' : 'AutreSupport'
}
function fromNatureTravaux(v: NatureTravaux): string {
    return v === 'EtancheiteBeton' ? 'etancheite-beton' : 'autre-support'
}

// ── Include / mapper ──────────────────────────────────────────────────────────

const pvInclude = {
    pvReceptionEtancheite: true,
    participants: true,
    reserves: true,
    pvEtanchVersions: {orderBy: {versionNum: 'asc' as const}},
} satisfies Prisma.DocumentationInclude

type PvDoc = Prisma.DocumentationGetPayload<{include: typeof pvInclude}>

function mapPvBase(doc: PvDoc) {
    const pv = doc.pvReceptionEtancheite!
    return {
        id: doc.id,
        idChantier: doc.idChantier,
        zoneBatiment: pv.zoneBatiment,
        dateInspection: pv.dateInspection,
        responsableChantier: pv.responsableChantier,
        planReperage: fromPlanReperage(pv.planReperage),
        natureTravaux: fromNatureTravaux(pv.natureTravaux),
        regulariteSupport: fromConformite(pv.regulariteSupport),
        propreteSupport: fromConformite(pv.propreteSupport),
        pente: fromConformite(pv.pente),
        hauteurEngravure: fromConformite(pv.hauteurEngravure),
        profondeurEngravure: fromConformite(pv.profondeurEngravure),
        protectionTeteReleves: fromConformite(pv.protectionTeteReleves),
        propreteSupportReleves: fromConformite(pv.propreteSupportReleves),
        tremiesLanterneaux: fromConformite(pv.tremiesLanterneaux),
        eauxPluviales: fromConformite(pv.eauxPluviales),
        ventilation: fromConformite(pv.ventilation),
        tropPleins: fromConformite(pv.tropPleins),
        jointsDialatation: fromConformite(pv.jointsDialatation),
        autresEcartsObservations: pv.autresEcartsObservations ?? null,
        nomSmac: pv.nomSmac,
        signatureSmac: pv.signatureSmac,
        receptionAcceptee: pv.receptionAcceptee,
        miseEnConformiteLe: pv.miseEnConformiteLe.toISOString().slice(0, 10),
        envoyerEmail: pv.envoyerEmail,
        emailDestinataire: pv.emailDestinataire,
        participants: doc.participants.map(p => ({
            id: p.id,
            titre: p.titre,
            nom: p.nom,
            signature: p.signature,
        })),
        reserves: doc.reserves.map(r => ({
            id: r.id,
            localisation: r.localisation,
            details: r.details,
            images: r.images,
        })),
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
    }
}

function mapPv(doc: PvDoc) {
    return {
        ...mapPvBase(doc),
        versions: doc.pvEtanchVersions.map(v => ({
            versionId:  v.id,
            versionNum: v.versionNum,
            savedAt:    v.savedAt.toISOString(),
            snapshot:   v.snapshot,
        })),
    }
}

// ── Service ───────────────────────────────────────────────────────────────────

export const pvEtancheiteService = {
    async findAll(chantierId: string) {
        const docs = await prisma.documentation.findMany({
            where:   {idChantier: chantierId, typeDoc: TypeDocEnum.PVReceptionEtancheite},
            include: pvInclude,
            orderBy: {createdAt: 'desc'},
        })
        return docs.filter(d => d.pvReceptionEtancheite !== null).map(mapPv)
    },

    async findById(id: string) {
        const doc = await prisma.documentation.findUnique({
            where:   {id, typeDoc: TypeDocEnum.PVReceptionEtancheite},
            include: pvInclude,
        })
        if (!doc || !doc.pvReceptionEtancheite) return null
        return mapPv(doc)
    },

    async create(b: CreatePvEtancheiteRequest) {
        return prisma.$transaction(async (tx) => {
            const doc = await tx.documentation.create({
                data: {idChantier: b.idChantier, typeDoc: TypeDocEnum.PVReceptionEtancheite},
            })

            await tx.pvReceptionEtancheite.create({
                data: {
                    id: doc.id,
                    zoneBatiment: b.zoneBatiment,
                    dateInspection: b.dateInspection,
                    responsableChantier: b.responsableChantier,
                    planReperage: toPlanReperage(b.planReperage),
                    natureTravaux: toNatureTravaux(b.natureTravaux),
                    regulariteSupport: toConformite(b.regulariteSupport),
                    propreteSupport: toConformite(b.propreteSupport),
                    pente: toConformite(b.pente),
                    hauteurEngravure: toConformite(b.hauteurEngravure),
                    profondeurEngravure: toConformite(b.profondeurEngravure),
                    protectionTeteReleves: toConformite(b.protectionTeteReleves),
                    propreteSupportReleves: toConformite(b.propreteSupportReleves),
                    tremiesLanterneaux: toConformite(b.tremiesLanterneaux),
                    eauxPluviales: toConformite(b.eauxPluviales),
                    ventilation: toConformite(b.ventilation),
                    tropPleins: toConformite(b.tropPleins),
                    jointsDialatation: toConformite(b.jointsDialatation),
                    autresEcartsObservations: b.autresEcartsObservations ?? null,
                    nomSmac: b.nomSmac,
                    signatureSmac: b.signatureSmac as Prisma.InputJsonValue,
                    receptionAcceptee: b.receptionAcceptee,
                    miseEnConformiteLe: new Date(b.miseEnConformiteLe),
                    envoyerEmail: b.envoyerEmail,
                    emailDestinataire: b.emailDestinataire ?? '',
                },
            })

            if (b.participants?.length) {
                await tx.participant.createMany({
                    data: b.participants.map(p => ({
                        idDocumentation: doc.id,
                        titre: p.titre ?? '',
                        nom: p.nom,
                        signature: p.signature as Prisma.InputJsonValue,
                    })),
                })
            }

            if (b.reserves?.length) {
                await tx.reserve.createMany({
                    data: b.reserves.map(r => ({
                        idDocumentation: doc.id,
                        localisation: r.localisation ?? null,
                        details: r.details,
                        images: (r.images ?? []) as Prisma.InputJsonValue,
                    })),
                })
            }

            const created = await tx.documentation.findUniqueOrThrow({
                where: {id: doc.id},
                include: pvInclude,
            })
            return mapPv(created)
        })
    },

    async update(id: string, b: UpdatePvEtancheiteRequest): Promise<ReturnType<typeof mapPv> | 'NOT_FOUND'> {
        const existing = await prisma.documentation.findUnique({
            where:   {id, typeDoc: TypeDocEnum.PVReceptionEtancheite},
            include: pvInclude,
        })
        if (!existing || !existing.pvReceptionEtancheite) return 'NOT_FOUND'

        return prisma.$transaction(async (tx) => {
            await tx.pvReceptionEtancheite.update({
                where: {id},
                data: {
                    ...(b.zoneBatiment !== undefined && {zoneBatiment: b.zoneBatiment}),
                    ...(b.dateInspection !== undefined && {dateInspection: b.dateInspection}),
                    ...(b.responsableChantier !== undefined && {responsableChantier: b.responsableChantier}),
                    ...(b.planReperage !== undefined && {planReperage: toPlanReperage(b.planReperage)}),
                    ...(b.natureTravaux !== undefined && {natureTravaux: toNatureTravaux(b.natureTravaux)}),
                    ...(b.regulariteSupport !== undefined && {regulariteSupport: toConformite(b.regulariteSupport)}),
                    ...(b.propreteSupport !== undefined && {propreteSupport: toConformite(b.propreteSupport)}),
                    ...(b.pente !== undefined && {pente: toConformite(b.pente)}),
                    ...(b.hauteurEngravure !== undefined && {hauteurEngravure: toConformite(b.hauteurEngravure)}),
                    ...(b.profondeurEngravure !== undefined && {profondeurEngravure: toConformite(b.profondeurEngravure)}),
                    ...(b.protectionTeteReleves !== undefined && {protectionTeteReleves: toConformite(b.protectionTeteReleves)}),
                    ...(b.propreteSupportReleves !== undefined && {propreteSupportReleves: toConformite(b.propreteSupportReleves)}),
                    ...(b.tremiesLanterneaux !== undefined && {tremiesLanterneaux: toConformite(b.tremiesLanterneaux)}),
                    ...(b.eauxPluviales !== undefined && {eauxPluviales: toConformite(b.eauxPluviales)}),
                    ...(b.ventilation !== undefined && {ventilation: toConformite(b.ventilation)}),
                    ...(b.tropPleins !== undefined && {tropPleins: toConformite(b.tropPleins)}),
                    ...(b.jointsDialatation !== undefined && {jointsDialatation: toConformite(b.jointsDialatation)}),
                    ...(b.autresEcartsObservations !== undefined && {autresEcartsObservations: b.autresEcartsObservations ?? null}),
                    ...(b.nomSmac !== undefined && {nomSmac: b.nomSmac}),
                    ...(b.signatureSmac !== undefined && {signatureSmac: b.signatureSmac as Prisma.InputJsonValue}),
                    ...(b.receptionAcceptee !== undefined && {receptionAcceptee: b.receptionAcceptee}),
                    ...(b.miseEnConformiteLe !== undefined && {miseEnConformiteLe: new Date(b.miseEnConformiteLe)}),
                    ...(b.envoyerEmail !== undefined && {envoyerEmail: b.envoyerEmail}),
                    ...(b.emailDestinataire !== undefined && {emailDestinataire: b.emailDestinataire ?? ''}),
                    updatedAt: new Date(),
                },
            })

            if (b.participants !== undefined) {
                await tx.participant.deleteMany({where: {idDocumentation: id}})
                if (b.participants.length) {
                    await tx.participant.createMany({
                        data: b.participants.map(p => ({
                            idDocumentation: id,
                            titre: p.titre ?? '',
                            nom: p.nom,
                            signature: p.signature as Prisma.InputJsonValue,
                        })),
                    })
                }
            }

            if (b.reserves !== undefined) {
                await tx.reserve.deleteMany({where: {idDocumentation: id}})
                if (b.reserves.length) {
                    await tx.reserve.createMany({
                        data: b.reserves.map(r => ({
                            idDocumentation: id,
                            localisation: r.localisation ?? null,
                            details: r.details,
                            images: (r.images ?? []) as Prisma.InputJsonValue,
                        })),
                    })
                }
            }

            await tx.documentation.update({where: {id}, data: {updatedAt: new Date()}})

            const updated = await tx.documentation.findUniqueOrThrow({
                where: {id},
                include: pvInclude,
            })
            return mapPv(updated)
        })
    },

    async createVersion(pvId: string, snapshot: unknown): Promise<void> {
        const agg = await prisma.pvEtanchVersion.aggregate({
            where:  {idDocumentation: pvId},
            _max:   {versionNum: true},
        })
        const nextNum = (agg._max.versionNum ?? 0) + 1
        await prisma.pvEtanchVersion.create({
            data: {
                idDocumentation: pvId,
                versionNum:      nextNum,
                snapshot:        snapshot as Prisma.InputJsonValue,
            },
        })
    },

    async delete(id: string): Promise<boolean> {
        try {
            await prisma.documentation.delete({
                where: {id, typeDoc: TypeDocEnum.PVReceptionEtancheite},
            })
            return true
        } catch {
            return false
        }
    },
}
