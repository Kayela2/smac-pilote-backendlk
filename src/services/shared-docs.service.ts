import {prisma} from '../db/prisma.js'

export const sharedDocsService = {
    /** The list of doc keys shared with collaborators for a chantier. */
    async getKeys(chantierId: string): Promise<string[]> {
        const rows = await prisma.chantierSharedDoc.findMany({
            where: {chantierId},
            select: {docKey: true},
            orderBy: {docKey: 'asc'},
        })
        return rows.map(r => r.docKey)
    },

    /** Replaces the whole shared selection for a chantier with the given keys. Returns the persisted keys. */
    async setKeys(chantierId: string, keys: string[]): Promise<string[]> {
        const unique = [...new Set(keys.filter(k => typeof k === 'string' && k.length > 0))]
        await prisma.$transaction([
            prisma.chantierSharedDoc.deleteMany({where: {chantierId}}),
            ...(unique.length > 0
                ? [prisma.chantierSharedDoc.createMany({data: unique.map(docKey => ({chantierId, docKey}))})]
                : []),
        ])
        return unique
    },
}
