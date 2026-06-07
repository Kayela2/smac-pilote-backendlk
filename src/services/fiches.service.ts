import {prisma} from '../db/prisma.js'
import {buildPage} from '../utils/pagination.js'
import type {Prisma, TypeDocEnum, TypeFiche} from '../generated/prisma/client.js'
import type {CreateFicheRequest, UpdateFicheRequest} from '../types.js'

type RawFiche = {
    id: string
    code: string
    name: string
    type: TypeFiche
    createdAt: Date
    updatedAt: Date
}

function mapFiche(f: RawFiche) {
    return {
        id: f.id,
        code: f.code,
        name: f.name,
        type: f.type,
        createdAt: f.createdAt,
        updatedAt: f.updatedAt,
    }
}

function ficheOrderBy(field: string, dir: 'asc' | 'desc'): Prisma.FichesOrderByWithRelationInput {
    switch (field) {
        case 'code': return {code: dir}
        case 'name': return {name: dir}
        case 'type': return {type: dir}
        default:     return {name: 'asc'}
    }
}

async function paginatedFiches(
    where: Prisma.FichesWhereInput,
    page: number, size: number, offset: number,
    orderBy: Prisma.FichesOrderByWithRelationInput = {name: 'asc'},
) {
    const [total, items] = await prisma.$transaction([
        prisma.fiches.count({where}),
        prisma.fiches.findMany({where, orderBy, skip: offset, take: size}),
    ])
    return buildPage(items.map(mapFiche), total, page, size)
}

export interface FicheFilters {
    type?: TypeFiche
}

function buildWhere(f: FicheFilters): Prisma.FichesWhereInput {
    const where: Prisma.FichesWhereInput = {}
    if (f.type) where.type = f.type
    return where
}

export const fichesService = {
    findAll: (filters: FicheFilters, page: number, size: number, offset: number, sort?: {field: string; dir: 'asc' | 'desc'}) =>
        paginatedFiches(buildWhere(filters), page, size, offset, sort ? ficheOrderBy(sort.field, sort.dir) : undefined),

    async findById(id: string) {
        const f = await prisma.fiches.findUnique({where: {id}})
        return f ? mapFiche(f) : null
    },

    async create(b: CreateFicheRequest) {
        const f = await prisma.fiches.create({
            data: {code: b.code as TypeDocEnum, name: b.name, type: b.type},
        })
        return mapFiche(f)
    },

    async update(id: string, b: UpdateFicheRequest): Promise<ReturnType<typeof mapFiche> | 'NOT_FOUND' | 'CONFLICT'> {
        try {
            const f = await prisma.fiches.update({
                where: {id},
                data: {
                    code: b.code as TypeDocEnum ?? undefined,
                    name: b.name ?? undefined,
                    type: b.type ?? undefined,
                    updatedAt: new Date(),
                },
            })
            return mapFiche(f)
        } catch (e: unknown) {
            const code = (e as { code?: string })?.code
            if (code === 'P2025') return 'NOT_FOUND'
            return 'CONFLICT'
        }
    },

    async delete(id: string): Promise<boolean> {
        try {
            await prisma.fiches.delete({where: {id}})
            return true
        } catch {
            return false
        }
    },
}
