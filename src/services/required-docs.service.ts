import {prisma} from '../db/prisma.js'

export const requiredDocsService = {
    /** The list of selected obligatoire-piece keys for a chantier. */
    async getKeys(chantierId: string): Promise<string[]> {
        const rows = await prisma.chantierRequiredDoc.findMany({
            where: {chantierId},
            select: {docKey: true},
            orderBy: {docKey: 'asc'},
        })
        return rows.map(r => r.docKey)
    },

    /** Replaces the whole selection for a chantier with the given keys. Returns the persisted keys. */
    async setKeys(chantierId: string, keys: string[]): Promise<string[]> {
        const unique = [...new Set(keys.filter(k => typeof k === 'string' && k.length > 0))]
        await prisma.$transaction([
            prisma.chantierRequiredDoc.deleteMany({where: {chantierId}}),
            ...(unique.length > 0
                ? [prisma.chantierRequiredDoc.createMany({data: unique.map(docKey => ({chantierId, docKey}))})]
                : []),
        ])
        return unique
    },
}
