import {prisma} from '../db/prisma.js'
import {buildPage} from '../utils/pagination.js'
import {TypeDocEnum, ProcessStatusEnum, ModeAffectationIntervention} from '../generated/prisma/enums.js'
import type {Prisma, TypeIntervenantEnum} from '../generated/prisma/client.js'
import type {CreateInterventionRequest, UpdateInterventionRequest} from '../types.js'
import {psToEnum, enumToPs} from '../utils/processStatus.js'

type RawIntervention = {
    id: string
    idIntervenant: string
    idDocumentation: string | null
    idChantier: string
    dateAssignation: Date
    description: string | null
    createdAt: Date
    updatedAt: Date
    intervenant?: {id: string; fullName: string; typeIntervenant: TypeIntervenantEnum} | null
    chantier?: {id: string; name: string | null} | null
    documentation?: {id: string; title: string | null; status: ProcessStatusEnum} | null
}

const interventionInclude = {
    intervenant: {select: {id: true, fullName: true, typeIntervenant: true}},
    chantier: {select: {id: true, name: true}},
    documentation: {select: {id: true, title: true, status: true}},
} satisfies Prisma.InterventionInclude

function mapIntervention(i: RawIntervention) {
    return {
        id: i.id,
        idIntervenant: i.idIntervenant,
        idDocumentation: i.idDocumentation,
        idChantier: i.idChantier,
        dateAssignation: i.dateAssignation,
        description: i.description,
        createdAt: i.createdAt,
        updatedAt: i.updatedAt,
        intervenant: i.intervenant ?? undefined,
        chantier: i.chantier ?? undefined,
        documentation: i.documentation
            ? {id: i.documentation.id, title: i.documentation.title ?? null, status: enumToPs(i.documentation.status)}
            : undefined,
    }
}

function ivOrderBy(field: string, dir: 'asc' | 'desc'): Prisma.InterventionOrderByWithRelationInput {
    switch (field) {
        case 'dateAssignation': return {dateAssignation: dir}
        case 'createdAt':       return {createdAt: dir}
        case 'id':              return {id: dir}
        default:                return {dateAssignation: 'desc'}
    }
}

async function paginatedInterventions(
    where: Prisma.InterventionWhereInput,
    page: number, size: number, offset: number,
    orderBy: Prisma.InterventionOrderByWithRelationInput = {dateAssignation: 'desc'},
) {
    const [total, items] = await prisma.$transaction([
        prisma.intervention.count({where}),
        prisma.intervention.findMany({where, orderBy, skip: offset, take: size, include: interventionInclude}),
    ])
    return buildPage(items.map(mapIntervention), total, page, size)
}

type TxClient = Prisma.TransactionClient

type DocCreator = (tx: TxClient, id: string) => Promise<unknown>

const docTypeCreators: Record<TypeDocEnum, DocCreator> = {
    [TypeDocEnum.FicheApri]:                               (tx, id) => tx.ficheApri.create({data: {id}}),
    [TypeDocEnum.Mmt]:                                     (tx, id) => tx.mmt.create({data: {id}}),
    [TypeDocEnum.Ppsps]:                                   (tx, id) => tx.ppsps.create({data: {id}}),
    [TypeDocEnum.EtatsLieux]:                              (tx, id) => tx.etatsLieux.create({data: {id}}),
    [TypeDocEnum.FeuilleEmargement]:                       (tx, id) => tx.feuilleEmargement.create({data: {id}}),
    [TypeDocEnum.FicheStarter]:                            (tx, id) => tx.ficheStarter.create({data: {id}}),
    [TypeDocEnum.FicheVerificationFourgon]:                (tx, id) => tx.ficheVerificationFourgon.create({data: {id}}),
    [TypeDocEnum.NoticeEPI]:                               (tx, id) => tx.noticeEpi.create({data: {id}}),
    [TypeDocEnum.PVMiseEau]:                               (tx, id) => tx.pvMiseEau.create({data: {id}}),
    [TypeDocEnum.PVReceptionBetonCharpenteCouverture]:     (tx, id) => tx.pvReceptionBetonCharpenteCouverture.create({data: {id}}),
    [TypeDocEnum.PVReceptionBetonCharpenteBardage]:        (tx, id) => tx.pvReceptionBetonCharpenteBardage.create({data: {id}}),
    [TypeDocEnum.PVReceptionBetonFacade]:                  (tx, id) => tx.pvReceptionBetonFacade.create({data: {id}}),
    [TypeDocEnum.PVReceptionCharpenteMetalBoisBardage]:    (tx, id) => tx.pvReceptionCharpenteMetalBoisBardage.create({data: {id}}),
    [TypeDocEnum.PVReceptionCharpenteMetalBoisCouverture]: (tx, id) => tx.pvReceptionCharpenteMetalBoisCouverture.create({data: {id}}),
    [TypeDocEnum.PVReceptionEtancheite]: (tx, id) => tx.pvReceptionEtancheite.create({data: {
        id,
        zoneBatiment: '', dateInspection: '', responsableChantier: '',
        planReperage: 'Non', natureTravaux: 'AutreSupport',
        regulariteSupport: 'SO', propreteSupport: 'SO', pente: 'SO',
        hauteurEngravure: 'SO', profondeurEngravure: 'SO', protectionTeteReleves: 'SO',
        propreteSupportReleves: 'SO', tremiesLanterneaux: 'SO', eauxPluviales: 'SO',
        ventilation: 'SO', tropPleins: 'SO', jointsDialatation: 'SO',
        nomSmac: '', signatureSmac: '', receptionAcceptee: false,
        miseEnConformiteLe: new Date(), envoyerEmail: false, emailDestinataire: '',
    }}),
    [TypeDocEnum.PVReceptionOuvrageArt]:                   (tx, id) => tx.pvReceptionOuvrageArt.create({data: {id}}),
    [TypeDocEnum.PVReceptionSupportsBetonVoirie]:          (tx, id) => tx.pvReceptionSupportsBetonVoirie.create({data: {id}}),
    [TypeDocEnum.PVReceptionOuvragesSousTraites]:          (tx, id) => tx.pvReceptionOuvragesSousTraites.create({data: {id}}),
    [TypeDocEnum.VisitePrevention]:                        (tx, id) => tx.visitePrevention.create({data: {id}}),
    [TypeDocEnum.FicheVerificationJournaliereEchafaudage]: (tx, id) => tx.ficheVerifJournaliereEchafaudage.create({data: {id}}),
    [TypeDocEnum.VerificationAvantMiseServiceEchafaudage]: (tx, id) => tx.verificationAvantMiseServiceEchafaudage.create({data: {id}}),
    [TypeDocEnum.PVReceptionBetonTerrasse]:                (tx, id) => tx.pVTerrasse.create({data: {id}}),
}

const PV_TYPES = Object.values(TypeDocEnum).filter(t => t.startsWith('PV')) as TypeDocEnum[]
const FICHE_TYPES = Object.values(TypeDocEnum).filter(t => !t.startsWith('PV')) as TypeDocEnum[]

export interface InterventionFilters {
    idChantier?: string
    idIntervenant?: string
    mode?: string
}

const modeMap: Record<string, ModeAffectationIntervention> = {
    pc: ModeAffectationIntervention.PC,
    mobile: ModeAffectationIntervention.MOBILE,
}

function buildWhere(f: InterventionFilters): Prisma.InterventionWhereInput {
    const where: Prisma.InterventionWhereInput = {}
    if (f.idChantier) where.idChantier = f.idChantier
    if (f.idIntervenant) where.idIntervenant = f.idIntervenant
    if (f.mode && modeMap[f.mode.toLowerCase()]) where.mode = modeMap[f.mode.toLowerCase()]
    return where
}

export const interventionsService = {
    findAll: (filters: InterventionFilters, page: number, size: number, offset: number, sort?: {field: string; dir: 'asc' | 'desc'}) =>
        paginatedInterventions(buildWhere(filters), page, size, offset, sort ? ivOrderBy(sort.field, sort.dir) : undefined),

    async findById(id: string) {
        const iv = await prisma.intervention.findUnique({where: {id}, include: interventionInclude})
        return iv ? mapIntervention(iv) : null
    },

    async create(b: CreateInterventionRequest) {
        const isPv = (b.typeDoc as string).startsWith('PV')
        const prefix = isPv ? 'PV' : 'FICHE'
        const count = await prisma.documentation.count({
            where: {typeDoc: {in: isPv ? PV_TYPES : FICHE_TYPES}},
        })
        const title = `${prefix}-${count + 1}`
        return prisma.$transaction(async (tx) => {
            const doc = await tx.documentation.create({
                data: {idChantier: b.idChantier, typeDoc: b.typeDoc, title}
            })
            await docTypeCreators[b.typeDoc](tx, doc.id)
            const iv = await tx.intervention.create({
                data: {
                    idIntervenant: b.idIntervenant,
                    idChantier: b.idChantier,
                    idDocumentation: doc.id,
                    dateAssignation: new Date(b.dateAssignation),
                    description: b.description ?? null,
                },
                include: interventionInclude,
            })
            return mapIntervention(iv)
        })
    },

    async update(id: string, b: UpdateInterventionRequest): Promise<ReturnType<typeof mapIntervention> | 'NOT_FOUND' | 'CONFLICT'> {
        try {
            if (b.status) {
                const cur = await prisma.intervention.findUnique({where: {id}, select: {idDocumentation: true}})
                if (!cur) return 'NOT_FOUND'
                if (cur.idDocumentation) {
                    await prisma.documentation.update({
                        where: {id: cur.idDocumentation},
                        data: {status: psToEnum(b.status)},
                    })
                }
            }
            const iv = await prisma.intervention.update({
                where: {id},
                data: {
                    idIntervenant: b.idIntervenant ?? undefined,
                    idChantier: b.idChantier ?? undefined,
                    dateAssignation: b.dateAssignation ? new Date(b.dateAssignation) : undefined,
                    description: b.description ?? undefined,
                    updatedAt: new Date(),
                },
                include: interventionInclude,
            })
            return mapIntervention(iv)
        } catch (e: unknown) {
            const code = (e as { code?: string })?.code
            if (code === 'P2025') return 'NOT_FOUND'
            return 'CONFLICT'
        }
    },

    async findDocuments(id: string) {
        const iv = await prisma.intervention.findUnique({
            where: {id},
            select: {idDocumentation: true},
        })
        if (!iv || !iv.idDocumentation) return null
        return prisma.document.findMany({
            where: {idDocumentation: iv.idDocumentation},
            select: {id: true, version: true, urlPdf: true, dateGeneration: true},
            orderBy: {version: 'desc'},
        })
    },

    async findDocumentById(ivId: string, docId: string): Promise<{urlPdf: string} | null> {
        const iv = await prisma.intervention.findUnique({where: {id: ivId}, select: {idDocumentation: true}})
        if (!iv || !iv.idDocumentation) return null
        return prisma.document.findFirst({
            where: {id: docId, idDocumentation: iv.idDocumentation},
            select: {urlPdf: true},
        })
    },

    async delete(id: string): Promise<boolean> {
        try {
            const iv = await prisma.intervention.findUnique({where: {id}, select: {idDocumentation: true}})
            if (!iv) return false
            if (iv.idDocumentation) {
                await prisma.$transaction([
                    prisma.intervention.delete({where: {id}}),
                    prisma.documentation.delete({where: {id: iv.idDocumentation}}),
                ])
            } else {
                await prisma.intervention.delete({where: {id}})
            }
            return true
        } catch (e) {
            console.error('[interventions.delete]', e)
            return false
        }
    },
}
