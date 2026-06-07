import {prisma} from '../db/prisma.js'

export interface OrganisationData {
    heureDepart: string | null
    heureFin: string | null
    cles: string | null
    badges: string | null
    papiersIdentite: string | null
    posteControle: string | null
    acces: string | null
    miseEnOeuvre: string | null
    manutention: string | null
    materielManutentionLevage: string | null
    precautionsParticulieres: string | null
    demarragePrevisionnelLe: string | null
    finPrevisionnelLe: string | null
    tacheExecutee: string | null
    quantite: string | null
    tempsPrevus: string | null
}

const str = (v: string | null | undefined): string | null => v || null

export const organisationService = {
    async get(chantierId: string): Promise<OrganisationData> {
        const row = await prisma.chantierOrganisation.findUnique({where: {chantierId}})
        return {
            heureDepart: row?.heureDepart ?? null,
            heureFin: row?.heureFin ?? null,
            cles: row?.cles ?? null,
            badges: row?.badges ?? null,
            papiersIdentite: row?.papiersIdentite ?? null,
            posteControle: row?.posteControle ?? null,
            acces: row?.acces ?? null,
            miseEnOeuvre: row?.miseEnOeuvre ?? null,
            manutention: row?.manutention ?? null,
            materielManutentionLevage: row?.materielManutentionLevage ?? null,
            precautionsParticulieres: row?.precautionsParticulieres ?? null,
            demarragePrevisionnelLe: row?.demarragePrevisionnelLe ?? null,
            finPrevisionnelLe: row?.finPrevisionnelLe ?? null,
            tacheExecutee: row?.tacheExecutee ?? null,
            quantite: row?.quantite ?? null,
            tempsPrevus: row?.tempsPrevus ?? null,
        }
    },

    async set(chantierId: string, data: OrganisationData): Promise<OrganisationData> {
        const fields = {
            heureDepart: str(data.heureDepart),
            heureFin: str(data.heureFin),
            cles: str(data.cles),
            badges: str(data.badges),
            papiersIdentite: str(data.papiersIdentite),
            posteControle: str(data.posteControle),
            acces: str(data.acces),
            miseEnOeuvre: str(data.miseEnOeuvre),
            manutention: str(data.manutention),
            materielManutentionLevage: str(data.materielManutentionLevage),
            precautionsParticulieres: str(data.precautionsParticulieres),
            demarragePrevisionnelLe: str(data.demarragePrevisionnelLe),
            finPrevisionnelLe: str(data.finPrevisionnelLe),
            tacheExecutee: str(data.tacheExecutee),
            quantite: str(data.quantite),
            tempsPrevus: str(data.tempsPrevus),
        }
        const row = await prisma.chantierOrganisation.upsert({
            where: {chantierId},
            create: {chantierId, ...fields},
            update: {...fields, updatedAt: new Date()},
        })
        return {
            heureDepart: row.heureDepart ?? null,
            heureFin: row.heureFin ?? null,
            cles: row.cles ?? null,
            badges: row.badges ?? null,
            papiersIdentite: row.papiersIdentite ?? null,
            posteControle: row.posteControle ?? null,
            acces: row.acces ?? null,
            miseEnOeuvre: row.miseEnOeuvre ?? null,
            manutention: row.manutention ?? null,
            materielManutentionLevage: row.materielManutentionLevage ?? null,
            precautionsParticulieres: row.precautionsParticulieres ?? null,
            demarragePrevisionnelLe: row.demarragePrevisionnelLe ?? null,
            finPrevisionnelLe: row.finPrevisionnelLe ?? null,
            tacheExecutee: row.tacheExecutee ?? null,
            quantite: row.quantite ?? null,
            tempsPrevus: row.tempsPrevus ?? null,
        }
    },
}
