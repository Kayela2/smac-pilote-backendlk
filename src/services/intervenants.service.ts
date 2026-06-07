import {prisma} from '../db/prisma.js'
import {buildPage} from '../utils/pagination.js'
import type {Prisma, TypeIntervenantEnum} from '../generated/prisma/client.js'
import type {CreateIntervenantRequest, UpdateIntervenantRequest} from '../types.js'

type RawIntervenant = {
    id: string; typeIntervenant: TypeIntervenantEnum;
    nom: string; prenom: string; fullName: string;
    typePole: string; numSAP: number;
    matricule: string | null; phone: string | null; qualification: string | null;
    mail: string | null; address: string | null; idAgence: string;
    createdAt: Date; updatedAt: Date;
}

function mapIntervenant(s: RawIntervenant) {
    return {
        id: s.id, typeIntervenant: s.typeIntervenant,
        nom: s.nom, prenom: s.prenom, fullName: s.fullName,
        typePole: s.typePole, numSAP: s.numSAP,
        matricule: s.matricule, phone: s.phone, qualification: s.qualification,
        mail: s.mail, address: s.address, idAgence: s.idAgence,
        createdAt: s.createdAt, updatedAt: s.updatedAt,
    }
}

function shOrderBy(field: string, dir: 'asc' | 'desc'): Prisma.IntervenantOrderByWithRelationInput {
    switch (field) {
        case 'fullName': return {fullName: dir}
        case 'typePole': return {typePole: dir}
        case 'numSAP':   return {numSAP: dir}
        default:         return {fullName: 'asc'}
    }
}

export interface IntervenantFilters {
    numSAP?: number
    mail?: string
    phone?: string
    fullName?: string
    typePole?: string
    address?: string
}

function buildWhere(f: IntervenantFilters): Prisma.IntervenantWhereInput {
    const where: Prisma.IntervenantWhereInput = {}
    if (f.numSAP !== undefined) where.numSAP = f.numSAP
    if (f.mail) where.mail = {contains: f.mail, mode: 'insensitive'}
    if (f.phone) where.phone = {contains: f.phone, mode: 'insensitive'}
    if (f.fullName) where.fullName = {contains: f.fullName, mode: 'insensitive'}
    if (f.typePole) where.typePole = f.typePole
    if (f.address) where.address = {contains: f.address, mode: 'insensitive'}
    return where
}

async function paginatedIntervenants(
    where: Prisma.IntervenantWhereInput,
    page: number, size: number, offset: number,
    orderBy: Prisma.IntervenantOrderByWithRelationInput = {fullName: 'asc'},
) {
    const [total, items] = await prisma.$transaction([
        prisma.intervenant.count({where}),
        prisma.intervenant.findMany({where, orderBy, skip: offset, take: size}),
    ])
    return buildPage(items.map(mapIntervenant), total, page, size)
}

export const intervenantsService = {
    findAll: (filters: IntervenantFilters, page: number, size: number, offset: number, sort?: {field: string; dir: 'asc' | 'desc'}) =>
        paginatedIntervenants(buildWhere(filters), page, size, offset, sort ? shOrderBy(sort.field, sort.dir) : undefined),

    async findById(id: string) {
        const sh = await prisma.intervenant.findUnique({where: {id}})
        return sh ? mapIntervenant(sh) : null
    },

    async create(b: CreateIntervenantRequest) {
        const sh = await prisma.intervenant.create({
            data: {
                typeIntervenant: b.typeIntervenant,
                nom: b.nom,
                prenom: b.prenom,
                idAgence: b.idAgence,
                typePole: b.typePole ?? '',
                numSAP: b.numSAP ?? 0,
                fullName: b.fullName ?? `${b.prenom} ${b.nom}`.trim(),
                matricule: b.matricule ?? null,
                qualification: b.qualification ?? null,
                mail: b.mail ?? null,
                phone: b.phone ?? null,
                address: b.address ?? null,
            },
        })
        return mapIntervenant(sh)
    },

    async createMass(items: CreateIntervenantRequest[]) {
        const results = []
        for (const b of items) {
            if (!b.typeIntervenant || !b.nom || !b.prenom || !b.idAgence) { results.push(null); continue }
            try {
                results.push(await intervenantsService.create(b))
            } catch {
                results.push(null)
            }
        }
        return results
    },

    async update(id: string, b: UpdateIntervenantRequest): Promise<ReturnType<typeof mapIntervenant> | 'NOT_FOUND' | 'CONFLICT'> {
        try {
            const sh = await prisma.intervenant.update({
                where: {id},
                data: {
                    typeIntervenant: b.typeIntervenant ?? undefined,
                    nom: b.nom ?? undefined,
                    prenom: b.prenom ?? undefined,
                    typePole: b.typePole ?? undefined,
                    fullName: b.fullName ?? undefined,
                    matricule: b.matricule ?? undefined,
                    qualification: b.qualification ?? undefined,
                    mail: b.mail ?? undefined,
                    phone: b.phone ?? undefined,
                    address: b.address ?? undefined,
                    updatedAt: new Date(),
                },
            })
            return mapIntervenant(sh)
        } catch (e: unknown) {
            const code = (e as { code?: string })?.code
            if (code === 'P2025') return 'NOT_FOUND'
            return 'CONFLICT'
        }
    },

    async delete(id: string): Promise<boolean> {
        try {
            await prisma.intervenant.delete({where: {id}})
            return true
        } catch {
            return false
        }
    },
}