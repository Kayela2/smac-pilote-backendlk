import {prisma} from '../db/prisma.js'

export interface OrganisationData {
    conditionsAcces: string[]
    conditionsStockage: string[]
}

const toArray = (v: unknown): string[] =>
    Array.isArray(v) ? (v as unknown[]).filter((x): x is string => typeof x === 'string') : []

export const organisationService = {
    async get(chantierId: string): Promise<OrganisationData> {
        const row = await prisma.chantierOrganisation.findUnique({where: {chantierId}})
        return {
            conditionsAcces: toArray(row?.conditionsAcces),
            conditionsStockage: toArray(row?.conditionsStockage),
        }
    },

    async set(chantierId: string, data: OrganisationData): Promise<OrganisationData> {
        const row = await prisma.chantierOrganisation.upsert({
            where: {chantierId},
            create: {chantierId, conditionsAcces: data.conditionsAcces, conditionsStockage: data.conditionsStockage},
            update: {conditionsAcces: data.conditionsAcces, conditionsStockage: data.conditionsStockage, updatedAt: new Date()},
        })
        return {
            conditionsAcces: toArray(row.conditionsAcces),
            conditionsStockage: toArray(row.conditionsStockage),
        }
    },
}
