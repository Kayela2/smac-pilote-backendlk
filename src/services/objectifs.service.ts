import {prisma} from '../db/prisma.js'

export interface ObjectifData {
    id: string
    objectif: string
    tache: string | null
    createdAt: Date
}

export const objectifsService = {
    async getByChantier(chantierId: string): Promise<ObjectifData[]> {
        const rows = await prisma.chantierObjectif.findMany({
            where: {chantierId},
            orderBy: {createdAt: 'asc'},
        })
        return rows.map(r => ({id: r.id, objectif: r.objectif, tache: r.tache, createdAt: r.createdAt}))
    },

    async create(chantierId: string, objectif: string, tache?: string): Promise<ObjectifData> {
        const row = await prisma.chantierObjectif.create({
            data: {chantierId, objectif, tache: tache ?? null},
        })
        return {id: row.id, objectif: row.objectif, tache: row.tache, createdAt: row.createdAt}
    },

    async delete(id: string): Promise<boolean> {
        try {
            await prisma.chantierObjectif.delete({where: {id}})
            return true
        } catch {
            return false
        }
    },
}
